# test_email.py
import os
import imaplib
from dotenv import load_dotenv

load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

try:
    mail = imaplib.IMAP4_SSL(EMAIL_HOST, EMAIL_PORT)
    mail.login(EMAIL_USER, EMAIL_PASSWORD)
    mail.select("INBOX")
    status, messages = mail.search(None, "ALL")
    print("Email connection successful. Total messages:", len(messages[0].split()))
    mail.logout()
except Exception as e:
    print("Error connecting to email:", e)