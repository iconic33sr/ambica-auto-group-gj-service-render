from django.urls import path
from . import views 

urlpatterns = [

    path('scrap_list_entry/', views.scrap_list_entry, name = "backo_scrap_list"),
    path('check_prowac_exists/', views.check_prowac_exists, name='check_prowac_exists'),

    path('scrap_list_verification/', views.scrap_list_verification, name = "backo_scrap_list_verification"),
    path("get_pending_scrap_doc_nos/", views.get_pending_scrap_doc_nos, name="get_pending_scrap_doc_nos"),
    path('check_slv_no_exist/', views.check_slv_no_exist, name='check_slv_no_exist'),

    path("packing_slip/", views.packing_slip_entry, name="backo_packing_slip"),
    path("packing_slip_pod/", views.packing_slip_pod_entry, name="backo_packing_slip_pod"),
    path('check_docket_no_exist/', views.check_docket_no_exist, name='check_docket_no_exist'),

    path('my_profile/', views.my_profile, name = "backo_my_profile"),
    path('change_password/', views.change_password, name = "backo_change_password"),

]