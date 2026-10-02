#!/usr/bin/env python3
"""Select BQ24074 USB100/USB500/suspend for this carrier's own gadget."""
import logging
from pathlib import Path
import signal
import time

GADGET = Path("/sys/kernel/config/usb_gadget/g350")


def charger_mode(state, declared_ma, own_gadget):
    # GPIO24 -> EN1, GPIO16 -> EN2. BQ24074 table 7-2.
    # Never infer a 500 mA allowance just from VBUS or a random UDC.
    if state == "suspended":
        return True, True
    if own_gadget and state == "configured" and declared_ma == 500:
        return True, False
    return False, False


def usb_status():
    try:
        udc = (GADGET / "UDC").read_text().strip()
        if not udc or "/" in udc:
            return "not attached", 0, False
        state = (Path("/sys/class/udc") / udc / "state").read_text().strip()
        ma = int((GADGET / "configs/c.1/MaxPower").read_text().strip())
        return state, ma, True
    except (OSError, ValueError):
        return "not attached", 0, False


def set_charger_mode(en1, en2, mode):
    # Keep EN2 low unless EN1 is already high. This avoids the
    # EN1=0/EN2=1 resistor-limit mode during sequential GPIO writes.
    if mode == (True, True):
        en1.on()
        en2.on()
    elif mode == (True, False):
        en2.off()
        en1.on()
    else:
        en2.off()
        en1.off()


def sync_gadget_connection(has_usb_power):
    """Bind only this gadget, using the charger's real VBUS status on GPIO12."""
    try:
        binding = GADGET / "UDC"
        udc = binding.read_text().strip()
        if not has_usb_power:
            if udc:
                binding.write_text("\n")
            return False
        if not udc:
            controllers = list(Path("/sys/class/udc").iterdir())
            if len(controllers) != 1:
                return False
            binding.write_text(controllers[0].name + "\n")
        return True
    except OSError:
        return False


def main():
    from gpiozero import DigitalOutputDevice, DigitalInputDevice
    def stop_service(signum, frame):
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, stop_service)
    logging.basicConfig(level=logging.INFO)
    with DigitalOutputDevice(16, initial_value=False) as en2, \
         DigitalOutputDevice(24, initial_value=False) as en1, \
         DigitalInputDevice(12, pull_up=None, active_state=False) as usb_good:
        previous = None
        try:
            while True:
                connected = sync_gadget_connection(bool(usb_good.value))
                state, ma, own = usb_status()
                mode = charger_mode(state, ma, own) if connected else (False, False)
                set_charger_mode(en1, en2, mode)
                if mode != previous:
                    logging.info("USB state %s; charger EN1=%s EN2=%s", state, *mode)
                    previous = mode
                time.sleep(0.005)
        except KeyboardInterrupt:
            pass
        finally:
            sync_gadget_connection(False)
            set_charger_mode(en1, en2, (False, False))


if __name__ == "__main__":
    main()
