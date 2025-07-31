from django.urls import path
from . import views 

urlpatterns = [

    path('customer_information_report_list/', views.works_cir_list, name = "cir_list"),
    path('preview_cir/<str:cir_uid>/', views.works_preview_cir, name = "workshop_manager_preview_cir"),
    path('check_claim_manager/', views.check_claim_manager, name = "check_claim_manager"),

    path('my_profile/', views.my_profile, name = "wm_my_profile"),
    path('change_password/', views.change_password, name = "wm_change_password"),

]