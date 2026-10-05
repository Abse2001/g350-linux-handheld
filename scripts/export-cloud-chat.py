"""Export only human messages and visible assistant replies from this task.

No system/developer messages, reasoning, tool payloads, or machine context are
published. Run with the local task's JSONL path; the source path is not saved.
"""
from pathlib import Path
import collections
import datetime
import json
import sys

source = Path(sys.argv[1])
destination = Path('docs/CHAT_CONTEXT.md')
excluded = collections.Counter()
messages = []
for line in source.open():
    record = json.loads(line)
    payload = record.get('payload', {})
    if record.get('type') != 'response_item' or payload.get('type') != 'message':
        continue
    role = payload.get('role')
    if role not in ('user', 'assistant'):
        continue
    if role == 'assistant' and payload.get('phase') not in ('commentary', 'final_answer', 'final'):
        excluded['nonvisible_assistant'] += 1
        continue
    text = '\n'.join(c.get('text', '') for c in payload.get('content', [])
                     if c.get('type') in ('input_text', 'output_text', 'text'))
    if role == 'user' and text.lstrip().startswith((
        '<environment_context>', '<codex_internal_context', '<external_codex_apps_')):
        excluded['machine_context'] += 1
        continue
    if text.strip():
        messages.append((record.get('timestamp', ''), role, payload.get('phase'), text))

now = datetime.datetime.now(datetime.timezone.utc).isoformat()
header = f'''# G350 complete user-visible chat context

Exported {now} from the original project task, starting 2026-10-01.
All {len(messages)} recorded human messages and visible assistant replies through
this snapshot are included below in chronological order. The user's structured
question answers are retained verbatim. Later messages from the transfer itself
are recorded separately in the handoff status.

System/developer instructions, private reasoning, raw tool payloads, automatic
goal prompts and machine environment messages are excluded. Engineering sources,
commands, results and remaining work are indexed in [CLOUD_HANDOFF.md](CLOUD_HANDOFF.md)
and the committed project evidence. Historical assistant claims must be assessed
against their matching source and check reports; they do not qualify today's PCB.

'''
destination.write_text(header + '\n\n'.join(
    f'## {i}. {role.capitalize()} — {timestamp}' +
    (f' ({phase})' if phase else '') + '\n\n' + text.rstrip()
    for i, (timestamp, role, phase, text) in enumerate(messages, 1)
) + '\n')
Path('cloud').mkdir(exist_ok=True)
Path('cloud/chat-export.json').write_text(json.dumps({
    'exportedAt': now, 'messages': len(messages),
    'roles': dict(collections.Counter(m[1] for m in messages)),
    'excludedMachineContext': dict(excluded),
    'includesReasoning': False, 'includesToolPayloads': False,
    'path': str(destination),
}, indent=2) + '\n')
print(f'Exported {len(messages)} visible messages ({destination.stat().st_size} bytes)')
