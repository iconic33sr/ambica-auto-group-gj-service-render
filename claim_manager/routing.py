from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/claimmanager_cir/(?P<claimmanager_username>\w+)/$', consumers.ClaimManagerCIRConsumer.as_asgi()),
]
