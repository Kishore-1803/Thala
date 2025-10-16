# test_slack.py
import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from dotenv import load_dotenv

load_dotenv()

SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")
SLACK_CHANNEL_ID = os.getenv("SLACK_CHANNEL_ID")

client = WebClient(token=SLACK_BOT_TOKEN)

try:
    response = client.chat_postMessage(
        channel=SLACK_CHANNEL_ID,
        text="Hello from Thala! Slack integration is working. 🚀"
    )
    print("Message sent successfully:", response["ts"])
except SlackApiError as e:
    print("Error sending message:", e.response["error"])