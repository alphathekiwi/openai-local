import re
from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Conversation(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    current_message = models.IntegerField()
    date_updated = models.DateTimeField(auto_now=True)
    date_created = models.DateTimeField(auto_now_add=True)
    
    def add_msg(self, msg_id: int, sender: User|None, text_content: str) -> None:
        sender_id = None if sender is None else sender.id
        Message.objects.create(chat_order=msg_id, sender=sender_id, conversation=self, text_content=text_content)
        if msg_id == 0: self.title = text_content
        self.current_message = msg_id
        self.save()
    
    @staticmethod
    def from_query_str(query_str: str):
        if 'id' in query_str:
            try:
                matches = re.search(r'id=(\d+)', query_str).groups()
                return Conversation.objects.get(id=int(matches[0]))
            except Exception as e: pass
        return Conversation.objects.create(title="New Conversation", current_message=0)

class Message(models.Model):
    id = models.AutoField(primary_key=True)
    chat_order = models.IntegerField()
    sender = models.IntegerField(null=True)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    text_content = models.TextField()