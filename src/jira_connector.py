import logging
from jira import JIRA
import os
from kafka_producer import KafkaMessageProducer
from dotenv import load_dotenv
import time

load_dotenv()

class JiraConnector:
    def __init__(self):
        self.server = os.getenv('JIRA_URL')
        self.email = os.getenv('JIRA_EMAIL')
        self.api_token = os.getenv('JIRA_API_TOKEN')
        self.kafka_producer = KafkaMessageProducer()
        self.topic = os.getenv('KAFKA_TOPIC_JIRA', 'thala-jira-events')
        self.jira = JIRA(
            server=self.server,
            basic_auth=(self.email, self.api_token)
        )
        self.logger = logging.getLogger(__name__)

    def fetch_new_issues(self,jql = 'project = KAN ORDER BY created DESC', max_results=10):
        issues = self.jira.search_issues(jql, maxResults=max_results)
        for issue in issues:
            data = {
                "id": issue.key,
                "summary": issue.fields.summary,
                "description": issue.fields.description,
                "status": issue.fields.status.name,
                "created": issue.fields.created,
                "reporter": issue.fields.reporter.displayName,
                "source_system": "thala-ingestion"
            }
            self.logger.info("Fetched Jira issue:", data)
            self.kafka_producer.send_message(self.topic, data, key=issue.key)
    
    def start_monitoring(self, interval=60):
        self.logger.info("Starting Jira issue monitoring...")
        while True:
            try:
                self.fetch_new_issues()
                time.sleep(interval)
                self.logger.info("Waiting for next Jira check...")
            except KeyboardInterrupt:
                break
            except Exception as e:
                self.logger.error(f"Error in Jira monitoring: {e}")