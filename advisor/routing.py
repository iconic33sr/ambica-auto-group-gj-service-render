from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/advisor_cir/(?P<advisor_username>\w+)/$', consumers.AdvisorCIRConsumer.as_asgi()),
]
