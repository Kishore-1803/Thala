import os
import json
from kafka import KafkaConsumer

output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'jira_messages.jsonl'))

# Load existing IDs
existing_ids = set()
if os.path.exists(output_path):
    with open(output_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if "id" in data:
                    existing_ids.add(data["id"])
            except Exception:
                continue

consumer = KafkaConsumer(
    'thala-jira-events',
    bootstrap_servers='localhost:9092',
    auto_offset_reset='earliest',
    enable_auto_commit=True,
    group_id='thala-jira-save-group',
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

with open(output_path, 'a', encoding='utf-8') as f:
    for message in consumer:
        issue_id = message.value.get("id")
        if issue_id and issue_id not in existing_ids:
            structured = {
                "id": issue_id,
                "summary": message.value.get("summary"),
                "description": message.value.get("description"),
                "status": message.value.get("status"),
                "created": message.value.get("created"),
                "reporter": message.value.get("reporter"),
                "source_system": message.value.get("source_system"),
            }
            json.dump(structured, f)
            f.write('\n')
            f.flush()
            existing_ids.add(issue_id)
            print("Saved structured Jira message:", structured)