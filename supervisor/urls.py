from django.urls import path
from . import views 

urlpatterns = [

    path('customer_information_report/', views.supervisor_cir_form, name = "supervisor_cir_form"),
    path('check_job_card_no/', views.check_job_card_no, name = "check_job_card_no"),
    path('my_profile/', views.my_profile, name = "supervisor_my_profile"),
    path('change_password/', views.change_password, name = "supervisor_change_password"),

]