#!/usr/bin/env python3
"""G350 carrier input daemon. Target hardware only; does not configure display."""
import logging
import time

from evdev import UInput, ecodes as e
from gpiozero import DigitalOutputDevice, DigitalInputDevice
from smbus2 import SMBus

BUTTONS = [e.BTN_DPAD_UP, e.BTN_DPAD_DOWN, e.BTN_DPAD_LEFT, e.BTN_DPAD_RIGHT,
           e.BTN_EAST, e.BTN_SOUTH, e.BTN_NORTH, e.BTN_WEST,
           e.BTN_SELECT, e.BTN_START, e.BTN_MODE]
MASK = (1 << len(BUTTONS)) - 1
# Logical button order follows the PCB; GPA7 and GPB7 are output-only.
BUTTON_PORT_BITS = (0, 1, 2, 3, 4, 5, 6, 11, 8, 9, 10)


def pressed_from_ports(a, b):
    active = (~(a | (b << 8))) & 0xFFFF
    return sum(((active >> bit) & 1) << i
               for i, bit in enumerate(BUTTON_PORT_BITS)) & MASK


def voltage(bus):
    high, low = bus.read_i2c_block_data(0x36, 0x02, 2)
    return ((high << 8) | low) * 0.000078125


def main():
    logging.basicConfig(level=logging.INFO)
    # Physical J8 37 = BCM26. GPIO default low suppresses boot noise.
    with DigitalOutputDevice(26, initial_value=False) as amplifier, \
         DigitalInputDevice(5, pull_up=None, active_state=False) as charging, \
         SMBus(1) as bus, \
         UInput({e.EV_KEY: BUTTONS}, name="G350 front controls") as gamepad:
        # Reset power-on BANK=0 configuration; internal pullups yield active-low keys.
        bus.write_byte_data(0x20, 0x0A, 0x00)
        # Keep the unused output-only bit 7 low on both ports.
        bus.write_byte_data(0x20, 0x14, 0x00)
        bus.write_byte_data(0x20, 0x15, 0x00)
        bus.write_byte_data(0x20, 0x00, 0x7F)
        bus.write_byte_data(0x20, 0x01, 0x7F)
        bus.write_byte_data(0x20, 0x0C, 0x7F)
        bus.write_byte_data(0x20, 0x0D, 0x7F)
        stable = candidate = 0
        changed_at = last_battery = time.monotonic()
        amplifier.on()
        try:
            while True:
                now = time.monotonic()
                a, b = bus.read_i2c_block_data(0x20, 0x12, 2)
                pressed = pressed_from_ports(a, b)
                if pressed != candidate:
                    candidate, changed_at = pressed, now
                if candidate != stable and now - changed_at >= 0.008:
                    changes = stable ^ candidate
                    for i, key in enumerate(BUTTONS):
                        if changes & (1 << i):
                            gamepad.write(e.EV_KEY, key, int(bool(candidate & (1 << i))))
                    gamepad.syn()
                    stable = candidate
                if now - last_battery >= 30:
                    v = voltage(bus)
                    logging.info("Battery %.3f V; charging=%s", v, charging.value)
                    if v < 3.2:
                        logging.warning("Low battery: exit your game and shut Linux down.")
                    last_battery = now
                time.sleep(1 / 150)
        finally:
            amplifier.off()
            for key in BUTTONS:
                gamepad.write(e.EV_KEY, key, 0)
            gamepad.syn()


if __name__ == "__main__":
    main()
