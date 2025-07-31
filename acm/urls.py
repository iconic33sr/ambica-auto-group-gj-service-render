from django.urls import path
from . import views 

urlpatterns = [

    path('parts_dispatch_image/', views.parts_dispatch_image, name = "parts_dispatch_image"),
    path('fetch_claim_status_data/', views.fetch_claim_status_data, name = "fetch_claim_status_data"),
    path('my_profile/', views.my_profile, name = "acm_my_profile"),
    path('change_password/', views.change_password, name = "acm_change_password"),

]