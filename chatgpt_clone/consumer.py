import json, time
from channels.generic.websocket import WebsocketConsumer
from django.contrib.auth.models import User
from openai import OpenAI
from chatgpt_clone.models import Conversation, Message


class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.client = OpenAI()
        self.conversation = Conversation.from_query_str(str(self.scope['query_string']))
        self.accept()
        chat_data = {'convo_id': self.conversation.id, 'title': self.conversation.title}
        self.send(text_data=json.dumps(chat_data))
        if self.conversation.current_message > 0: self.send_history()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        # Setup variables
        response, json_data = '', json.loads(text_data)
        msg_id, prompt = json_data['msg_id'], json_data['message']
        
        # Add the user message to the conversation
        streamed_response = self.get_stream(prompt)
        self.conversation.add_msg(msg_id-1, self.scope['user'], prompt)
        
        # Stream the response to the user
        for chunk in streamed_response:
            msg = chunk.choices[0].delta.content
            if msg is not None:
                self.send(text_data=json.dumps({'msg_id': msg_id,'message': msg}))
                response += msg # collect response parts to save to the conversation
        
        # Inform the client that the message is completed and save the response
        self.send(text_data=json.dumps({'msg_id': msg_id, 'completed': True}))
        self.conversation.add_msg(msg_id, None, response)

    def get_stream(self, prompt: str, model="gpt-4o-mini"):
        return self.client.chat.completions.create(
            model=model, stream=True,
            messages=[{"role": "user", "content": prompt}]
        )

    def send_history(self):
        messages: list[Message] = self.conversation.message_set.all()
        for message in messages:
            self.send(text_data=json.dumps({
                'msg_id': message.chat_order,
                'completed': True,
                'message': message.text_content
            }))