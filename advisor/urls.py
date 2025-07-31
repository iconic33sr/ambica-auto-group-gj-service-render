from django.urls import path
from . import views

urlpatterns = [

    path('complaint_information_report_list/', views.advisor_cir_list, name = "advisor_cir_list"),
    path('preview_cir/<str:cir_uid>/', views.advisor_preview_cir, name = "advisor_preview_cir"),
    path('edit_cir/<str:cir_uid>/', views.advisor_edit_cir, name = "advisor_edit_cir"),
    path('service_report/<str:cir_uid>/', views.advisor_service_report, name = "advisor_service_report"),
    path('check_works_manager/', views.check_works_manager, name = "check_works_manager"),

    path('wm_returned_report/', views.wm_returned_report, name = "wm_returned_report"),
    path('revise_detail/<str:cir_uid>/', views.advisor_revise_report, name = "advisor_revise_report"),
    path("get_revision_report_nos/", views.get_revision_report_nos, name="get_revision_report_nos"),

    path('my_profile/', views.my_profile, name = "advisor_my_profile"),
    path('change_password/', views.change_password, name = "advisor_change_password"),
]