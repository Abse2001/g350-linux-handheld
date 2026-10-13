"""Build/verify a pinned, separate CLI copy; never edit the installed CLI."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat

PACKAGE_SHA = "6e3ff339d3666fdad140481a49119069763978a811ba86aea39bcbb49fb19162"
ENTRIES = {
    "dist/cli/main.js": ("2135bc7f5e27b72ddfaa9b65586c905897e4222f989328ebc0434b1d1961c19c",
                         "87829b4a91b15fee69d1b59c10f18fa6d808c4066894984ad863ede0aaddccce"),
    "dist/lib/index.js": ("f8e3a22d8ad16de08817404b6d6580e09b67cc7651c69c95f2b745aacb194066",
                         "7e4b8ae0a9e0f644fa334407dcef7752a0ff5fd82188ed2e158479898fe261b9"),
}
REL_PACKAGE = Path("@tscircuit/cli")
SOURCE_BOUND_VIA_STAGE = 'var AddViasStage = class extends ConverterStage {\n  viasProcessed = 0;\n  pcbVias = [];\n  constructor(input, ctx) {\n    super(input, ctx);\n    this.knownViaConnectivityKeys = this.collectKnownViaConnectivityKeys();\n    this.pcbVias = this.collectPcbVias();\n  }\n  collectPcbVias() {\n    const standaloneVias = this.ctx.db.pcb_via?.list() || [];\n    const seenViaKeys = new Set(standaloneVias.map((via) => this.getViaDedupeKey(via)));\n    const routeDefinedVias = (this.ctx.db.pcb_trace?.list() || []).flatMap((trace) => (trace.route || []).filter((point) => point.route_type === "via").map((point) => ({\n      x: point.x,\n      y: point.y,\n      outer_diameter: point.outer_diameter ?? point.via_diameter,\n      hole_diameter: point.hole_diameter ?? point.via_hole_diameter,\n      from_layer: point.from_layer,\n      to_layer: point.to_layer,\n      layers: point.layers,\n      pcb_trace_id: trace.pcb_trace_id,\n      subcircuit_connectivity_map_key: trace.subcircuit_connectivity_map_key,\n      connection_name: trace.connection_name\n    })).map((via) => {\n      via.layers = this.resolveRouteViaLayers(via, standaloneVias);\n      return via;\n    }).filter((via) => {\n      const viaKey = this.getViaDedupeKey(via);\n      if (seenViaKeys.has(viaKey)) {\n        return false;\n      }\n      seenViaKeys.add(viaKey);\n      return true;\n    }));\n    return [...standaloneVias, ...routeDefinedVias];\n  }\n  getViaDedupeKey(via) {\n    const owner = this.getViaConnectivityKey(via);\n    if (!this.knownViaConnectivityKeys.has(owner)) return Symbol("unowned-via");\n    const span = [...this.getKicadViaLayers(via)].sort().join(",");\n    return JSON.stringify([via.x, via.y, span, owner, via.outer_diameter ?? 0.8, via.hole_diameter ?? 0.4]);\n  }\n  getRawViaLayers(via) {\n    if (via.layers?.length) {\n      return [...via.layers];\n    }\n    return [via.from_layer, via.to_layer].filter((layer) => Boolean(layer));\n  }\n  getKicadViaLayers(via) {\n    const rawLayers = this.getRawViaLayers(via);\n    const numLayers = this.ctx.numLayers ?? 2;\n    const kicadLayers = rawLayers.length > 0 ? rawLayers.map((layer) => getKicadLayer(layer)) : getViaLayers(numLayers);\n    return getViaLayerSpan(kicadLayers, numLayers);\n  }\n  collectKnownViaConnectivityKeys() {\n    const keys = new Set;\n    for (const sourceNet of this.ctx.db.source_net?.list() ?? []) {\n      const key = sourceNet.subcircuit_connectivity_map_key || sourceNet.source_net_id;\n      if (typeof key === "string" && key.length > 0) keys.add(key);\n    }\n    for (const sourceTrace of this.ctx.db.source_trace?.list() ?? []) {\n      let key = sourceTrace.subcircuit_connectivity_map_key;\n      if (!key && sourceTrace.connected_source_net_ids?.length) {\n        for (const sourceNetId of sourceTrace.connected_source_net_ids) {\n          const connectedNet = this.ctx.db.source_net?.get(sourceNetId);\n          if (connectedNet?.subcircuit_connectivity_map_key && connectedNet.subcircuit_connectivity_map_key.length > 0) {\n            key = connectedNet.subcircuit_connectivity_map_key;\n            break;\n          }\n        }\n      }\n      if (typeof key === "string" && key.length > 0) keys.add(key);\n    }\n    return keys;\n  }\n  resolveRouteViaLayers(via, standaloneVias) {\n    if (via.layers?.length) return via.layers;\n    const owner = this.getViaConnectivityKey(via);\n    if (!this.knownViaConnectivityKeys.has(owner)) return via.layers;\n    if (![via.x, via.y, via.outer_diameter, via.hole_diameter].every(Number.isFinite) || via.outer_diameter <= 0 || via.hole_diameter <= 0) return via.layers;\n    const count = this.ctx.db.pcb_board?.list()?.[0]?.num_layers ?? this.ctx.numLayers ?? 2;\n    if (!Number.isInteger(count) || count < 2 || count > 32) return via.layers;\n    const stack = ["top", ...Array.from({ length: count - 2 }, (_, i) => `inner${i + 1}`), "bottom"];\n    const first = stack.indexOf(via.from_layer);\n    const second = stack.indexOf(via.to_layer);\n    if (first < 0 || second < 0 || first === second) return via.layers;\n    const matches = standaloneVias.filter((nativeVia) => {\n      if (nativeVia.x !== via.x || nativeVia.y !== via.y || this.getViaConnectivityKey(nativeVia) !== owner) return false;\n      const size = nativeVia.outer_diameter ?? 0.8;\n      const drill = nativeVia.hole_diameter ?? 0.4;\n      if (![size, drill].every(Number.isFinite) || size <= 0 || drill <= 0 || size !== via.outer_diameter || drill !== via.hole_diameter) return false;\n      const rawLayers = this.getRawViaLayers(nativeVia);\n      const indexes = rawLayers.map((layer) => stack.indexOf(layer));\n      if (indexes.length < 2 || indexes.some((index) => index < 0)) return false;\n      const low = Math.min(...indexes);\n      const high = Math.max(...indexes);\n      return low <= Math.min(first, second) && high >= Math.max(first, second);\n    });\n    if (matches.length > 1) throw new Error("Ambiguous physical pcb_via ownership for route-defined via");\n    return matches.length === 1 ? this.getRawViaLayers(matches[0]) : via.layers;\n  }\n  getViaConnectivityKey(via) {\n    let connectivityKey = via.subcircuit_connectivity_map_key;\n    if (!connectivityKey && via.source_net_id) {\n      const sourceNet = this.ctx.db.source_net?.get(via.source_net_id);\n      if (sourceNet) {\n        connectivityKey = sourceNet.subcircuit_connectivity_map_key || sourceNet.source_net_id;\n      }\n    }\n    if (!connectivityKey && via.pcb_trace_id) {\n      const pcbTrace = this.ctx.db.pcb_trace?.get(via.pcb_trace_id);\n      if (pcbTrace) {\n        if ("subcircuit_connectivity_map_key" in pcbTrace) {\n          connectivityKey = pcbTrace.subcircuit_connectivity_map_key;\n        }\n        if (!connectivityKey && pcbTrace.source_trace_id) {\n          const sourceTrace = this.ctx.db.source_trace?.get(pcbTrace.source_trace_id);\n          if (sourceTrace) {\n            if ("subcircuit_connectivity_map_key" in sourceTrace) {\n              connectivityKey = sourceTrace.subcircuit_connectivity_map_key;\n            }\n            if (!connectivityKey && sourceTrace.connected_source_net_ids?.length) {\n              for (const sourceNetId of sourceTrace.connected_source_net_ids) {\n                const sourceNet = this.ctx.db.source_net?.get(sourceNetId);\n                if (sourceNet) {\n                  connectivityKey = sourceNet.subcircuit_connectivity_map_key || sourceNet.source_net_id;\n                  break;\n                }\n              }\n            }\n          }\n          if (!connectivityKey) {\n            const sourceNet = this.ctx.db.source_net?.get(pcbTrace.source_trace_id);\n            if (sourceNet) {\n              connectivityKey = sourceNet.subcircuit_connectivity_map_key || sourceNet.source_net_id;\n            }\n          }\n        }\n      }\n    }\n    if (!connectivityKey && via.connection_name) {\n      const sourceNet = this.ctx.db.source_net?.get(via.connection_name);\n      if (sourceNet) {\n        connectivityKey = sourceNet.subcircuit_connectivity_map_key || sourceNet.source_net_id;\n      }\n    }\n    return connectivityKey;\n  }\n  _step() {\n    const { kicadPcb, c2kMatPcb, pcbNetMap } = this.ctx;\n    if (!kicadPcb) {\n      throw new Error("KicadPcb instance not initialized in context");\n    }\n    if (!c2kMatPcb) {\n      throw new Error("PCB transformation matrix not initialized in context");\n    }\n    if (this.viasProcessed >= this.pcbVias.length) {\n      this.finished = true;\n      return;\n    }\n    const via = this.pcbVias[this.viasProcessed];\n    if (!via) {\n      this.finished = true;\n      return;\n    }\n    const transformedPos = applyToPoint25(c2kMatPcb, {\n      x: via.x,\n      y: via.y\n    });\n    let netInfo;\n    if (pcbNetMap) {\n      let connectivityKey = via.subcircuit_connectivity_map_key;\n      if (!connectivityKey && via.source_net_id) {\n        const sourceNet = this.ctx.db.source_net?.get(via.source_net_id);\n        if (sourceNet) {\n          connectivityKey = sourceNet.subcircuit_connectivity_map_key || sourceNet.source_net_id;\n        }\n      }\n      if (!connectivityKey && via.pcb_trace_id) {\n        const pcbTrace = this.ctx.db.pcb_trace?.get(via.pcb_trace_id);\n        if (pcbTrace) {\n          if ("subcircuit_connectivity_map_key" in pcbTrace) {\n            connectivityKey = pcbTrace.subcircuit_connectivity_map_key;\n          }\n          if (!connectivityKey && pcbTrace.source_trace_id) {\n            const sourceTrace = this.ctx.db.source_trace?.get(pcbTrace.source_trace_id);\n            if (sourceTrace) {\n              if ("subcircuit_connectivity_map_key" in sourceTrace) {\n                connectivityKey = sourceTrace.subcircuit_connectivity_map_key;\n              }\n              if (!connectivityKey && sourceTrace.connected_source_net_ids?.length) {\n                for (const sourceNetId of sourceTrace.connected_source_net_ids) {\n                  const sourceNet = this.ctx.db.source_net?.get(sourceNetId);\n                  if (sourceNet) {\n                    connectivityKey = sourceNet.subcircuit_connectivity_map_key || sourceNet.source_net_id;\n                    break;\n                  }\n                }\n              }\n            }\n            if (!connectivityKey) {\n              const sourceNet = this.ctx.db.source_net?.get(pcbTrace.source_trace_id);\n              if (sourceNet) {\n                connectivityKey = sourceNet.subcircuit_connectivity_map_key || sourceNet.source_net_id;\n              }\n            }\n          }\n        }\n      }\n      if (!connectivityKey && via.connection_name) {\n        const sourceNet = this.ctx.db.source_net?.get(via.connection_name);\n        if (sourceNet) {\n          connectivityKey = sourceNet.subcircuit_connectivity_map_key || sourceNet.source_net_id;\n        }\n      }\n      if (connectivityKey) {\n        netInfo = pcbNetMap.get(connectivityKey);\n      }\n    }\n    const viaLayers = this.getKicadViaLayers(via);\n    const viaSize = via.outer_diameter ?? 0.8;\n    const viaDrill = via.hole_diameter ?? 0.4;\n    const viaData = `via:${transformedPos.x},${transformedPos.y}:${viaSize}:${viaDrill}:${netInfo?.id ?? 0}`;\n    const kicadVia = new Via({\n      at: [transformedPos.x, transformedPos.y],\n      size: viaSize,\n      drill: viaDrill,\n      layers: viaLayers,\n      net: new ViaNet(netInfo?.id ?? 0),\n      uuid: generateDeterministicUuid(viaData)\n    });\n    const vias = kicadPcb.vias;\n    vias.push(kicadVia);\n    kicadPcb.vias = vias;\n    this.viasProcessed++;\n  }\n  getOutput() {\n    return this.ctx.kicadPcb;\n  }\n};\n'


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def present(path):
    return path.exists() or path.is_symlink()


def inspect_installed(installed):
    installed = Path(installed).resolve(strict=True)
    if installed.name != "cli" or installed.parent.name != "@tscircuit" or installed.parent.parent.name != "node_modules":
        raise ValueError("Expected local node_modules/@tscircuit/cli package layout")
    package = installed / "package.json"
    if package.is_symlink() or not package.is_file() or sha(package) != PACKAGE_SHA:
        raise ValueError("Unknown CLI package.json; refuse without output writes")
    identity = json.loads(package.read_bytes())
    if identity.get("name") != "@tscircuit/cli" or identity.get("version") != "0.1.2258":
        raise ValueError("Only the reviewed CLI0.1.2258 package is supported")
    rows = []
    for rel, (original, _) in ENTRIES.items():
        path = installed / rel
        if path.is_symlink() or not path.is_file() or sha(path) != original:
            raise ValueError("Unknown installed CLI bundle: " + rel)
        rows.append({"path": rel, "sha256": original,
                     "bytes": path.stat().st_size, "mode": stat.S_IMODE(path.stat().st_mode)})
    rows.append({"path": "package.json", "sha256": PACKAGE_SHA,
                 "bytes": package.stat().st_size, "mode": stat.S_IMODE(package.stat().st_mode)})
    # Preserve the original bare-module lookup tiers, not just a new global
    # resolver. These are read-only links to already-installed dependencies.
    modules = installed.parent.parent
    tiers = [("node_modules", modules),
             ("@tscircuit/node_modules", installed.parent / "node_modules"),
             ("@tscircuit/cli/node_modules", installed / "node_modules")]
    links, absent = [], []
    for rel, target in tiers:
        if present(target):
            if not target.is_dir():
                raise ValueError("Installed resolver tier is not a directory")
            links.append({"path": rel, "target": str(target.resolve(strict=True))})
        else:
            absent.append({"copyPath": rel, "installedPath": str(target)})
    # These nearer bundle-location tiers are absent in the reviewed installation.
    # A future local dependency here would outrank our preserved outer resolver
    # links; refuse it before creating a copied package rather than guessing.
    for rel in ["dist/node_modules", "dist/cli/node_modules", "dist/lib/node_modules"]:
        target = installed / rel
        if present(target):
            raise ValueError("Unsupported nearer installed resolver tier: " + rel)
        absent.append({"copyPath": str(REL_PACKAGE / rel), "installedPath": str(target)})
    return {"installedDirectory": str(installed), "packageName": identity["name"],
            "packageVersion": identity["version"], "files": rows,
            "dependencyLinks": links, "absentDependencyTiers": absent}


def patched(raw, expected_sha):
    text = raw.decode("utf-8")
    start = text.index("var AddViasStage = class")
    end = text.index("var AddStandalonePcbElements", start)
    fragment = SOURCE_BOUND_VIA_STAGE
    result = (text[:start] + fragment + text[end:]).encode("utf-8")
    if hashlib.sha256(result).hexdigest() != expected_sha:
        raise ValueError("Native-record resolver result differs from the source-bound bundle hash")
    return result


def verify_copy(installed_state, output):
    manifest_path = output / "isolated-cli.json"
    if manifest_path.is_symlink() or not manifest_path.is_file():
        raise ValueError("Existing output has no trusted isolated CLI manifest")
    manifest = json.loads(manifest_path.read_bytes())
    if manifest.get("installedState") != installed_state or manifest.get("outputDirectory") != str(output):
        raise ValueError("Existing copied CLI source/resolver identity differs")
    expected_files = {str(REL_PACKAGE / rel): expected for rel, (_, expected) in ENTRIES.items()}
    expected_files[str(REL_PACKAGE / "package.json")] = PACKAGE_SHA
    expected_rows = {str(REL_PACKAGE / row["path"]): row for row in installed_state["files"]}
    for rel, expected in expected_files.items():
        file = output / rel
        if file.is_symlink() or not file.is_file() or sha(file) != expected or stat.S_IMODE(file.stat().st_mode) != expected_rows[rel]["mode"]:
            raise ValueError("Existing copied CLI bundle/mode differs: " + rel)
    expected_links = {row["path"]: row["target"] for row in installed_state["dependencyLinks"]}
    for rel, target in expected_links.items():
        link = output / rel
        if not link.is_symlink() or os.readlink(link) != target or link.resolve(strict=True) != Path(target):
            raise ValueError("Existing copied CLI resolver differs")
    directories = {"@tscircuit", "@tscircuit/cli", "@tscircuit/cli/dist",
                   "@tscircuit/cli/dist/cli", "@tscircuit/cli/dist/lib"}
    for path in output.rglob("*"):
        rel = path.relative_to(output).as_posix()
        if path.is_symlink():
            if rel not in expected_links:
                raise ValueError("Unexpected copied CLI link")
        elif path.is_file():
            if rel not in expected_files and rel != "isolated-cli.json":
                raise ValueError("Unexpected copied CLI file")
        elif path.is_dir():
            if rel not in directories:
                raise ValueError("Unexpected copied CLI directory")
        else:
            raise ValueError("Unexpected copied CLI special entry")
    for row in installed_state["absentDependencyTiers"]:
        if present(output / row["copyPath"]) or present(Path(row["installedPath"])):
            raise ValueError("Previously absent resolver tier changed")
    return manifest


def prepare(installed, output, verify_only=False):
    state = inspect_installed(installed)  # All installed pins checked before writes.
    output = Path(output).absolute()
    if output.is_symlink() or any(parent.is_symlink() for parent in output.parents):
        raise ValueError("Copied CLI output ancestry must not contain symlinks")
    output = output.resolve()
    modules = Path(state["installedDirectory"]).parent.parent
    if output == modules or output.is_relative_to(modules):
        raise ValueError("Never create a copied CLI inside installed node_modules")
    if present(output):
        if not output.is_dir():
            raise ValueError("Existing output is not a private copied CLI directory")
        manifest = verify_copy(state, output)
        return {"mode": "verified", "cliEntry": str(output / REL_PACKAGE / "dist/cli/main.js"),
                "manifest": str(output / "isolated-cli.json"), "manifestSha256": sha(output / "isolated-cli.json")}
    if verify_only:
        raise ValueError("Verify-only requires an existing copied CLI")
    prepared = {}
    source = Path(state["installedDirectory"])
    for rel, (_, expected) in ENTRIES.items():
        prepared[rel] = patched((source / rel).read_bytes(), expected)
    # Refuse a source race before creating any copied output.
    if inspect_installed(source) != state:
        raise ValueError("Installed CLI changed during preparation")
    output.mkdir()
    target = output / REL_PACKAGE
    (target / "dist/cli").mkdir(parents=True)
    (target / "dist/lib").mkdir()
    for row in state["files"]:
        rel = row["path"]
        destination = target / rel
        shutil.copy2(source / rel, destination)
        if rel in prepared:
            destination.write_bytes(prepared[rel])
    for row in state["dependencyLinks"]:
        (output / row["path"]).symlink_to(row["target"], target_is_directory=True)
    manifest = {"scope": "ISOLATED_SOURCE_ONLY_NATIVE_VIA_RESOLVER_COPY_NO_INSTALLED_EDITS",
                "createdUtc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "outputDirectory": str(output), "installedState": state,
                "change": "Preserve explicit layers; inherit only unique authoritative native via span; net/dimension-aware deduplication", "canonicalEdited": False}
    (output / "isolated-cli.json").write_text(json.dumps(manifest, indent=2) + "\n")
    if inspect_installed(source) != state:
        raise ValueError("Installed CLI changed during copied preparation; do not use output")
    verify_copy(state, output)
    return {"mode": "created", "cliEntry": str(target / "dist/cli/main.js"),
            "manifest": str(output / "isolated-cli.json"), "manifestSha256": sha(output / "isolated-cli.json")}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cli-package-directory", required=True, type=Path)
    parser.add_argument("--output-directory", required=True, type=Path)
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    print(json.dumps(prepare(args.cli_package_directory, args.output_directory, args.verify_only), sort_keys=True))
