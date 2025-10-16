import os
import json
import logging
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from kafka_producer import KafkaMessageProducer
from dotenv import load_dotenv
import time

load_dotenv()

class SlackConnector:
    def __init__(self):
        self.client = WebClient(token=os.getenv('SLACK_BOT_TOKEN'))
        self.kafka_producer = KafkaMessageProducer()
        self.topic = os.getenv('KAFKA_TOPIC_SLACK', 'thala-slack-events')
        self.logger = logging.getLogger(__name__)
        self.last_timestamp = 0

    def fetch_messages(self, channel_id=None):
        try:
            channel_id = channel_id or os.getenv('SLACK_CHANNEL_ID')
            
            # Fetch messages newer than last timestamp
            result = self.client.conversations_history(
                channel=channel_id,
                oldest=str(self.last_timestamp),
                limit=100
            )
            
            messages = result['messages']
            self.logger.info(f"Fetched {len(messages)} new messages from Slack")
            
            for message in reversed(messages):  # Process in chronological order
                self.process_message(message, channel_id)
                
            if messages:
                self.last_timestamp = float(messages[0]['ts'])
            print("Raw Slack API response:", result)
                
        except SlackApiError as e:
            self.logger.error(f"Slack API error: {e.response['error']}")
        except Exception as e:
            self.logger.error(f"Error fetching Slack messages: {e}")

    def process_message(self, message, channel_id):
        # Transform Slack message to standardized format
        transformed_message = {
            'id': f"slack_{message.get('ts', '')}",
            'type': 'slack_message',
            'channel_id': channel_id,
            'user_id': message.get('user', 'unknown'),
            'text': message.get('text', ''),
            'thread_ts': message.get('thread_ts'),
            'original_timestamp': message.get('ts'),
            'message_type': message.get('subtype', 'message'),
            'metadata': {
                'has_files': 'files' in message,
                'has_attachments': 'attachments' in message,
                'is_thread': 'thread_ts' in message
            }
        }
        
        # Send to Kafka
        key = f"slack_{channel_id}_{message.get('ts', '')}"
        self.kafka_producer.send_message(self.topic, transformed_message, key)

    def start_monitoring(self, interval=30):
        """Start continuous monitoring of Slack messages"""
        self.logger.info("Starting Slack message monitoring...")
        
        while True:
            try:
                self.fetch_messages()
                time.sleep(interval)
            except KeyboardInterrupt:
                self.logger.info("Stopping Slack monitoring...")
                break
            except Exception as e:
                self.logger.error(f"Error in Slack monitoring loop: {e}")
                time.sleep(interval)

    def close(self):
        self.kafka_producer.close()