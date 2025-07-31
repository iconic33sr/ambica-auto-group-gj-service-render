from django.urls import path
from . import views 

urlpatterns = [

    path('claim_status/', views.claim_status, name = "claim_manager_claim_status"),
    path('fetch_claim_status_data/', views.fetch_claim_status_data, name = "claim_manager_fetch_claim_status_data"),
    path('check_claim_no_exist/', views.check_claim_no_exist, name = "claim_manager_check_claim_no_exist"),

    path('pending_customer_information_report/', views.claim_manager_pending_cir_list, name = "claim_manager_cir_list"),
    path('completed_customer_information_report/', views.claim_manager_completed_cir_list, name = "claim_manager_completed_cir_list"),
    path('rejected_customer_information_report/', views.claim_manager_rejected_cir_list, name = "claim_manager_rejected_cir_list"),

    path('preview_cir/<str:cir_uid>/', views.claim_manager_preview_cir, name = "claim_manager_preview_cir"),
    path('generate_ppt/<str:cir_uid>/', views.claim_manager_generate_ppt, name = "claim_manager_generate_ppt"),
    path('download_presentation/<str:cir_uid>/', views.presentation_download, name='presentation_download'),

    path('preview_completed_cir/<str:cir_uid>/', views.claim_manager_preview_completed_cir, name = "claim_manager_preview_completed_cir"),
    path('preview_rejected_cir/<str:cir_uid>/', views.claim_manager_preview_rejected_cir, name = "claim_manager_preview_rejected_cir"),

    path('my_profile/', views.my_profile, name = "cm_my_profile"),
    path('change_password/', views.change_password, name = "cm_change_password"),

]





