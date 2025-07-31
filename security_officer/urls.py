from django.urls import path
from . import views 

urlpatterns = [

    path('vehicle_gate_entry/', views.vehicle_gate_entry, name = "vehicle_gate_entry"),
    path('fetch_job_data/', views.fetch_job_data, name = "fetch_job_data"),
    path('my_profile/', views.my_profile, name = "security_officer_my_profile"),
    path('change_password/', views.change_password, name = "security_officer_change_password"),

]