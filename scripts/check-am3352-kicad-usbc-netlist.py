"""Verify numeric USB pads and actual KiCad copper connectivity by mode."""
from pathlib import Path
import hashlib
import json
import sys
import wx
wx.Log.SetLogLevel(wx.LOG_Error)
application = wx.App(False)
import pcbnew

board_path, circuit_path, report_path = map(Path, sys.argv[1:4])
mode = sys.argv[4] if len(sys.argv) > 4 else 'source-only'
assert mode in ['source-only', 'routed', 'routed-with-control']
routed = mode != 'source-only'
control = mode == 'routed-with-control'
circuit = json.loads(circuit_path.read_text())
board = pcbnew.LoadBoard(str(board_path.resolve()))
assert board.GetCopperLayerCount() == 4
footprints = {f.GetReference(): f for f in board.GetFootprints()}
expected = {
    'J_USB': {1: 'GND', 2: 'GND', 3: 'GND', 4: 'GND', 6: 'USB_CC1',
              7: 'USB0_DM', 8: 'USB0_DP', 9: 'USB0_DM', 10: 'USB0_DP',
              12: 'USB_CC2', 13: 'GND', 14: 'GND', 15: 'USB_5V', 16: 'USB_5V'},
    'U_USB_ESD': {1: 'USB0_DM', 2: 'GND', 3: 'USB0_DP', 4: 'USB0_DP', 5: 'USB_5V', 6: 'USB0_DM'},
    'R_USB_CC1': {1: 'USB_CC1', 2: 'GND'}, 'R_USB_CC2': {1: 'USB_CC2', 2: 'GND'},
    'C_USB_ESD': {1: 'USB_5V', 2: 'GND'},
    'R_USB_VBUS_SENSE': {1: 'USB_5V', 2: 'USB0_VBUS_SENSE'},
    'C_USB_VBUS_SENSE': {1: 'USB0_VBUS_SENSE', 2: 'GND'},
    'D_USB_VBUS_SENSE': {1: 'USB0_VBUS_SENSE', 2: 'GND'},
    'U_SOC': {301: 'USB0_DP', 319: 'USB0_DM', 266: 'USB0_VBUS_SENSE'},
    'U_PMIC': {12: 'USB_5V'},
}
if control:
    expected['C_PMIC_USB'] = {1: 'USB_5V', 2: 'GND'}
records = []
for name, pins in expected.items():
    component = next(e for e in circuit if e['type'] == 'source_component' and e['name'] == name)
    for pin, net in pins.items():
        pad = next(p for p in footprints[name].Pads() if p.GetNumber() == str(pin))
        assert pad.GetNetname() == net, f'{name}.{pin}: {pad.GetNetname()} != {net}'
        sp = next(e for e in circuit if e['type'] == 'source_port' and
                  e['source_component_id'] == component['source_component_id'] and e['pin_number'] == pin)
        pp = next(e for e in circuit if e['type'] == 'pcb_port' and e['source_port_id'] == sp['source_port_id'])
        pos = pad.GetPosition()
        assert abs(pcbnew.ToMM(pos.x) - 100 - pp['x']) < 1e-5
        assert abs(100 - pcbnew.ToMM(pos.y) - pp['y']) < 1e-5
        records.append({'component': name, 'pin': pin, 'net': net, 'sourcePositionVerified': True})
for name, pins in {'J_USB': [5, 11], 'U_SOC': [284, 264, 276, 302, 320, 258, 303, 321, 322]}.items():
    for pin in pins:
        pad = next(p for p in footprints[name].Pads() if p.GetNumber() == str(pin))
        assert not pad.GetNetname(), f'{name}.{pin}: unused USB terminal assigned a net'
usb_nets = {'USB_CC1', 'USB_CC2', 'USB0_DP', 'USB0_DM', 'USB0_VBUS_SENSE', 'USB_5V'}
usb_tracks = [t for t in board.GetTracks() if t.GetNetname() in usb_nets]
connectivity_records = []
if routed:
    assert usb_tracks
    connectivity = board.GetConnectivity()
    def pad(name, pin):
        return next(p for p in footprints[name].Pads() if p.GetNumber() == str(pin))
    def group(net, terminals):
        first = pad(*terminals[0])
        connected = {i.m_Uuid.AsString() for i in connectivity.GetConnectedItems(first)}
        for name, pin in terminals:
            target = pad(name, pin)
            assert target.GetNetname() == net
            assert target == first or target.m_Uuid.AsString() in connected, f'{net}: disconnected {name}.{pin}'
            connectivity_records.append({'net': net, 'component': name, 'pin': pin, 'connected': True})
    group('USB0_DP', [('U_SOC', 301), ('U_USB_ESD', 3), ('U_USB_ESD', 4), ('J_USB', 8), ('J_USB', 10)])
    group('USB0_DM', [('U_SOC', 319), ('U_USB_ESD', 1), ('U_USB_ESD', 6), ('J_USB', 7), ('J_USB', 9)])
    group('USB_CC1', [('J_USB', 6), ('R_USB_CC1', 1)])
    group('USB_CC2', [('J_USB', 12), ('R_USB_CC2', 1)])
    group('USB_5V', [('J_USB', 15), ('J_USB', 16), ('U_USB_ESD', 5), ('C_USB_ESD', 1)])
    if control:
        group('USB_5V', [('J_USB', 15), ('J_USB', 16), ('U_PMIC', 12),
                         ('C_PMIC_USB', 1), ('R_USB_VBUS_SENSE', 1)])
        group('USB0_VBUS_SENSE', [('U_SOC', 266), ('R_USB_VBUS_SENSE', 2),
                                  ('C_USB_VBUS_SENSE', 1), ('D_USB_VBUS_SENSE', 1)])
    ground = next(z for z in board.Zones() if z.GetNetname() == 'GND')
    assert ground.GetLayer() == pcbnew.In1_Cu and ground.IsFilled()
    ground_pads = [('J_USB', 1), ('J_USB', 2), ('J_USB', 3), ('J_USB', 4), ('J_USB', 13), ('J_USB', 14),
                   ('U_USB_ESD', 2), ('C_USB_ESD', 2), ('R_USB_CC1', 2), ('R_USB_CC2', 2)]
    if control:
        ground_pads += [('C_USB_VBUS_SENSE', 2), ('D_USB_VBUS_SENSE', 2), ('C_PMIC_USB', 2)]
    for name, pin in ground_pads:
        connected = {i.m_Uuid.AsString() for i in connectivity.GetConnectedItems(pad(name, pin))}
        assert ground.m_Uuid.AsString() in connected, f'{name}.{pin}: USB ground return disconnected'
        connectivity_records.append({'net': 'GND', 'component': name, 'pin': pin, 'connectedToFilledPlane': True})
    if not control:
        vbus_connected = {i.m_Uuid.AsString() for i in connectivity.GetConnectedItems(pad('J_USB', 16))}
        assert pad('U_PMIC', 12).m_Uuid.AsString() not in vbus_connected, 'PMIC feed remains an explicit unfinished phase'
        assert not any(t.GetNetname() == 'USB0_VBUS_SENSE' for t in board.GetTracks()), 'VBUS sense remains unfinished'
else:
    assert not usb_tracks, 'This source-only draft must not imply completed USB routing'
report = {'status': 'KICAD_USBC_DATA_CC_PMIC_VBUS_SENSE_AND_GROUND_CONNECTED_HOST_INCOMPLETE' if control else
                   'KICAD_USBC_DATA_CC_LOCAL_VBUS_AND_GROUND_CONNECTED_HOST_INCOMPLETE' if routed else
                   'KICAD_USBC_NUMERIC_PAD_NETLIST_PASS_USB_COPPER_UNROUTED',
          'board': {'path': str(board_path), 'sha256': hashlib.sha256(board_path.read_bytes()).hexdigest()},
          'circuit': {'path': str(circuit_path), 'sha256': hashlib.sha256(circuit_path.read_bytes()).hexdigest()},
          'numericPadNetAssignmentsVerified': len(records), 'results': records,
          'usbCopperTrackCount': len(usb_tracks), 'connectivityRecords': connectivity_records,
          'bothCableOrientationsDataConnected': routed, 'ccRdReturnsConnected': routed,
          'localVbusAndEsdBypassConnected': routed, 'vbusPmicFeedConnected': control,
          'vbusSenseRouted': control, 'pmicInputBypassConnected': control,
          'senseFilterClampAndGroundConnected': control,
          'usbElectricalQualification': False, 'fabricationReady': False}
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['status', 'numericPadNetAssignmentsVerified', 'usbCopperTrackCount']}))
