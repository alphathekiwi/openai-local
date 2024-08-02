import json
from channels.generic.websocket import WebsocketConsumer
from openai import OpenAI


class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.client = OpenAI()
        self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        json_data = json.loads(text_data)
        msg_id = json_data['msg_id']
        message = json_data['message']
        stream = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": message}],
            stream=True,
        )
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                self.send(text_data=json.dumps({
                    'msg_id': msg_id,
                    'message': chunk.choices[0].delta.content,
                    'completed': False
                }))
        self.send(text_data=json.dumps({
                    'msg_id': msg_id,
                    'completed': True
                }))