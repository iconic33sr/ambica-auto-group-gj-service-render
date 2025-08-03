from django.urls import path
from . import views 

urlpatterns = [

    path('dashboard/', views.developer_dashboard, name = "developer_dashboard"),

    path('user_dashboard/', views.user_dashboard, name = "dev_user_dashboard"),

    path('my_profile/', views.my_profile, name = "dev_my_profile"),

    path('change_password/', views.change_password, name = "dev_change_password"),


]





