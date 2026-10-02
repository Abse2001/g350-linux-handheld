# Integrated Linux host requirement — 2026-10-02

The handheld must contain the Linux computer directly on its main PCB. The existing Revision B source and Gerbers use an external Raspberry Pi Zero 2 W through J_PI and a data pigtail; they do not meet this requirement. Their successful fabrication checks are not evidence that an integrated host has been designed or checked.

The requested redesign retains top-only component assembly, eleven front buttons, no analog sticks or rear buttons, a display with a flexible-cable connector, a microSD holder on the main PCB, and one USB-C port for charging and data/provisioning. It must be authored in tscircuit with verified component footprints, phased autorouting and manual critical routes. New routing, shorts, independent manufacturing/connectivity checks and matching fabrication exports are required after the architecture changes.

## Exact Pi Zero 2 W silicon

[Raspberry Pi's processor documentation](https://www.raspberrypi.com/documentation/computers/processors.html) identifies RP3A0 as a system-in-package containing BCM2710A1 silicon and 512 MB LPDDR2. The [published Zero 2 W schematic](https://datasheets.raspberrypi.com/rpizero2/raspberry-pi-zero-2-w-reduced-schematics.pdf) is reduced, rather than a complete design package. It does not supply the complete processor power/ground ball map, SD/USB host circuitry, RF design or all implementation constraints needed for a verified clone.

No standard bare-RP3A0 JLCPCB/LCSC part number or complete manufacturer implementation package has been verified in this investigation. This is an unresolved sourcing/documentation condition, not a claim that such a chip could never be used.

The primary author of the [RP3A0 reverse-engineering project](https://github.com/jonny12375/rp3a0) reports a booting bare-chip proof of concept and supplies reconstructed design information. Its documented assembly method harvests and reballs an RP3A0 from a donor Zero 2 W. That is an experimental donor-chip assembly path; it does not establish standard JLCPCB sourcing, equivalent Wi-Fi integration or fabrication readiness for this handheld. The author notes that their prototype has no Wi-Fi.

## Architecture decision

Before creating processor symbols, BGA footprints or new production copper, resolve whether the exact bare RP3A0 is mandatory or a purchasable Linux/GPU processor directly on the main PCB is acceptable. A donor-chip design needs an explicit sourcing and qualified assembly plan, verified pin mapping, power sequencing and a hardware bring-up plan. A different processor needs its own verified datasheet, package drawing, RAM/PMIC selection, boot support and display/USB mapping; the existing Pi software and flashing instructions cannot automatically be reused.

[Compute Module Zero](https://www.raspberrypi.com/products/compute-module-zero/) is a documented RP3A0 option that solders directly onto a PCB using castellated pads. It remains a prebuilt module, so it must not be silently substituted for the requested chip-level integration. Its Lite variant exposes SDIO for a carrier microSD holder.

No integrated-host footprint or pinout has been invented, and no integrated-host order bundle is being represented as complete.
