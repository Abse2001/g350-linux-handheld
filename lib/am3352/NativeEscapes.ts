import type {FanoutTracePath} from "@tscircuit/props"
import paths from "./native-coordinated-dogbones.json"

// Local dogbones prepared together by the installed native DDR solver.
// Only the local escape geometry is replayed; bus_lanes routes the channel.
// Provenance: checks/integrated/am3352-native-dogbone-bootstrap.json.
export const nativeEscapes=(chip:"U_SOC"|"U_RAM"):FanoutTracePath[]=>
  paths[chip] as FanoutTracePath[]
