import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ClaimManagerCIRConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.claimmanager_username = self.scope['url_route']['kwargs']['claimmanager_username']
        self.group_name = f'claimmanager_{self.claimmanager_username}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        print("connection made")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        # Not needed unless you want claimmanagers to send messages
        pass

    async def new_cir_report(self, event):
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