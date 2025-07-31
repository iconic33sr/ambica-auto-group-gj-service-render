from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/workshopmanager_cir/(?P<workshopmanager_username>\w+)/$', consumers.WorkShopManagerCIRConsumer.as_asgi()),
]
