import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import advisor.routing  
import workshop_manager.routing
import claim_manager.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'service_ambica_auto_group.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            advisor.routing.websocket_urlpatterns +
            workshop_manager.routing.websocket_urlpatterns +
            claim_manager.routing.websocket_urlpatterns
        )
    ),
})
