#!/bin/sh
# Run on the target Pi after enabling dwc2 peripheral mode. This is a
# prototype serial gadget; its descriptor advertises a maximum 500 mA draw.
set -eu
[ "$(id -u)" = 0 ] || { echo "Run as root on the target Pi." >&2; exit 1; }
case "$(cat /proc/device-tree/model 2>/dev/null)" in
  *"Raspberry Pi Zero 2 W"*) ;;
  *) echo "This script is for the G350 Pi Zero 2 W target." >&2; exit 1 ;;
esac
modprobe libcomposite
mountpoint -q /sys/kernel/config || mount -t configfs none /sys/kernel/config
g350_gadget=/sys/kernel/config/usb_gadget/g350
mkdir -p "$g350_gadget"
cd "$g350_gadget"
# Do not replace a different live gadget or alter its charging permission.
if [ -n "$(cat UDC 2>/dev/null)" ]; then exit 0; fi
echo 0x1d6b > idVendor
echo 0x0104 > idProduct
echo 0x0100 > bcdDevice
echo 0x0200 > bcdUSB
mkdir -p strings/0x409
tr -d '\000' < /proc/device-tree/serial-number > strings/0x409/serialnumber
echo "G350 prototype" > strings/0x409/manufacturer
echo "G350 USB serial" > strings/0x409/product
mkdir -p configs/c.1/strings/0x409
echo "USB serial" > configs/c.1/strings/0x409/configuration
echo 0xC0 > configs/c.1/bmAttributes
echo 500 > configs/c.1/MaxPower
mkdir -p functions/acm.usb0
[ -L configs/c.1/acm.usb0 ] || ln -s ../../functions/acm.usb0 configs/c.1/acm.usb0
# usb_power.py binds/unbinds this gadget using the charger's USB_GOOD_N.
# Pi USB VBUS is isolated, so the powered Pi cannot sense that rail itself.
