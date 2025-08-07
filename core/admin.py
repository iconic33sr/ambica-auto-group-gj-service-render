from django.contrib import admin
from .models import Branch, Designation, User_Profile, PushSubscription, Claim_Category, Accounting_Year, Customer_Information_Report, Service_Advisor_Report, Claim_Status, Scrap_List, Scrap_List_Verification, Packing_Slip, Vehicle_Gate_Entry


@admin.register(Branch)
class Branch_Admin(admin.ModelAdmin):
    list_display = ['branch', 'code']


@admin.register(Designation)
class designation_Admin(admin.ModelAdmin):
    list_display = ['designation']


@admin.register(User_Profile)
class User_Profile_Admin(admin.ModelAdmin):
    list_display = ['user', 'alloted_advisor', 'alloted_workshop_manager', 'alloted_claim_manager', 'user_designation', 'user_branch']


@admin.register(PushSubscription)
class PushSubscription_Admin(admin.ModelAdmin):
    list_display = ['user', 'created_at']


@admin.register(Claim_Category)
class Claim_Category_Admin(admin.ModelAdmin):
    list_display = ['claim']


@admin.register(Accounting_Year)
class Accounting_Year_Admin(admin.ModelAdmin):
    list_display = ['ac_year']


@admin.register(Customer_Information_Report)
class Customer_Information_Report_Admin(admin.ModelAdmin):
    list_display = ['cir_uid', 'job_no', 'vehicle_no', 'cir_date_time', 'supervisor_name', 'workshop_manager_verification', 'workshop_manager_name', 'workshop_manager_verification_date']


@admin.register(Service_Advisor_Report)
class Service_Advisor_Report_Admin(admin.ModelAdmin):
    list_display = ['cir', 'get_vehicle_no', 'sar_date_time', 'advisor_name']

    def get_vehicle_no(self, obj):
        return obj.cir.vehicle_no
    get_vehicle_no.short_description = 'Vehicle No'


@admin.register(Claim_Status)
class Claim_Status_Admin(admin.ModelAdmin):
    list_display = ['cir', 'claim_no', 'claim_amount', 'claim_status', 'part_dispatch_image1', 'part_dispatch_image2', 'part_dispatch_image3', 'part_dispatch_image4', 'part_dispatch_image5']


@admin.register(Scrap_List)
class Scrap_List_Admin(admin.ModelAdmin):
    list_display = ['doc_no', 'plant', 'total_prowacs_no', 'req_sub_date', 'list_gen_date', 'total_parts', 'scrap_list_pdf', 'back_office_operator_name', 'back_office_operator_id', 'scrap_list_date_time']


@admin.register(Scrap_List_Verification)
class Scrap_List_Verification_Admin(admin.ModelAdmin):
    list_display = ['id', 'scrap_verification_ppt_file', 'back_office_operator_name', 'back_office_operator_id', 'scrap_verification_ppt_date_time']


@admin.register(Packing_Slip)
class Packing_Slip_Admin(admin.ModelAdmin):
    list_display = ['id', 'delivery_challan_pdf', 'packing_slip_no', 'place_of_supply', 'total_prowacs_no', 'packing_slip_date', 'total_parts', 'transport_name', 'back_office_operator_name', 'back_office_operator_id', 'packing_slip_date_time']


@admin.register(Vehicle_Gate_Entry)
class Vehicle_Gate_Entry_Admin(admin.ModelAdmin):
    list_display = ['cir', 'gate_no', 'gate_pass_no', 'gate_pass_image', 'gate_register_image', 'security_officer_name', 'security_officer_id', 'vehicle_gate_entry_image_date_time']
