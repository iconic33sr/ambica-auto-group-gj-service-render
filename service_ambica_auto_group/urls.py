"""
URL configuration for ambica_motors project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from core.views import save_subscription, delete_subscription
from core import views as core_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('aag_admin/', admin.site.urls),

    path('', core_views.user_login, name='user_login'),

    path('ping/', core_views.ping, name='ping'),

    path('install_app/', core_views.install_app, name="install_app"),

    path('service_worker.js', core_views.service_worker, name='service_worker'),
    
    # path("save-subscription/", save_subscription, name="save_subscription"),
    
    # path("delete-subscription/", delete_subscription, name="delete_subscription"),

    path('reverse-geocode/', core_views.reverse_geocode, name='reverse_geocode'),

    path('supervisor/', include("supervisor.urls")),

    path('advisor/', include("advisor.urls")),

    path('workshop_manager/', include("workshop_manager.urls")),

    path('claim_manager/', include("claim_manager.urls")),

    path('acm/', include("acm.urls")),

    path('security_officer/', include("security_officer.urls")),

    path('back_office_operator/', include("back_office_operator.urls")),

    path('developer/', include("developer.urls")),

    path('logout/', core_views.user_logout, name = "user_logout"),

    path('', include('pwa.urls')),
]

# ✅ Add media URL pattern only in debug mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)