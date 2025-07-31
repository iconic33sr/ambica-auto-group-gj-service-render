import json
from channels.generic.websocket import AsyncWebsocketConsumer

class AdvisorCIRConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.advisor_username = self.scope['url_route']['kwargs']['advisor_username']
        self.group_name = f'advisor_{self.advisor_username}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        print("connection made")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        # Not needed unless you want advisors to send messages
        pass

    async def new_cir_report(self, event):  # The Type you send will be used here to call the function if type:'new_cir_report' sent from views.py then this function will run
        # Send new CIR data to frontend
        await self.send(text_data=json.dumps({
            "action": "add",
            "data": event["data"]
        }))

    async def remove_cir_report(self, event):
        await self.send(text_data=json.dumps({
            "action": "remove",
            "data": event["data"]
        }))