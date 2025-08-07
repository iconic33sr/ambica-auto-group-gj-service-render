from django.db import models
from django.contrib.auth.models import User
import uuid


########################################################################################################################################

class Branch(models.Model):
    id = models.AutoField(primary_key = True, unique = True, editable=False)
    branch = models.CharField(max_length = 500, null = True)
    code = models.CharField(max_length = 50, null = True, blank = True)

    def __str__(self):
        return self.branch
    
    class Meta:
        ordering = ('branch', )

########################################################################################################################################

class Designation(models.Model):
    designation = models.CharField(max_length = 300, null = True)

    def __str__(self):
        return self.designation

########################################################################################################################################


class User_Profile(models.Model):
    user = models.OneToOneField(User, on_delete = models.CASCADE, primary_key = True)
    mobile_no = models.BigIntegerField(blank = True, null = True)
    mobile_no_2 = models.BigIntegerField(blank =  True, null = True)
    address = models.CharField(max_length = 500, blank = True)
    city = models.CharField(max_length = 200, blank = True)
    state = models.CharField(max_length = 200, blank = True)
    alloted_advisor = models.CharField(max_length = 500, blank = True)
    alloted_workshop_manager = models.CharField(max_length = 500, blank = True)
    alloted_claim_manager = models.CharField(max_length = 500, blank = True)
    gate_no = models.CharField(max_length = 10, blank = True)
    user_designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null= True, db_index=True)
    user_branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null = True, db_index=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"
    
    class Meta:
        ordering = ('user', )

########################################################################################################################################

class PushSubscription(models.Model):   
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subscription_info = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)  # Updated each time subscription is saved
    
    def __str__(self):
        return f"{self.user.username} - {self.subscription_info.get('endpoint', 'Unknown')}"
########################################################################################################################################

class Claim_Category(models.Model):
    claim = models.CharField(max_length = 300, null = True)
    def __str__(self):
        return self.claim

########################################################################################################################################

class Accounting_Year(models.Model):
    ac_year = models.CharField(max_length = 100, db_index=True)
    def __str__(self):
        return self.ac_year

########################################################################################################################################

class Customer_Information_Report(models.Model):
    cir_uid = models.UUIDField(default=uuid.uuid4, unique=True,primary_key=True, editable=False)
    cir_ac_year = models.ForeignKey(Accounting_Year, on_delete=models.CASCADE, null = True)
    short_job_no = models.CharField(max_length = 20)

    # For Supervisor ###########################################################################
    job_no = models.CharField(max_length = 30, null = True, db_index=True)
    vehicle_no = models.CharField(max_length = 20, null = True, db_index=True)
    chassis_no = models.CharField(max_length = 50, blank = True)
    model = models.CharField(max_length = 50, blank = True)
    kilometer = models.PositiveIntegerField(blank = True, null = True)
    hours = models.PositiveIntegerField(blank = True, null = True)
    sale_date = models.DateField(null = True, blank = True)
    claim_category = models.JSONField(default=list)  # Stores as a list of strings
    vehicle_front_image = models.ImageField(upload_to='vehicle_images/', blank = True)
    vehicle_with_number_plate = models.ImageField(upload_to='vehicle_images/', blank = True)
    chasis = models.ImageField(upload_to='vehicle_images/', blank = True)
    odometer = models.ImageField(upload_to='vehicle_images/', blank = True)
    complaint_1 = models.CharField(max_length = 500, null = True)
    complaint_1_image = models.ImageField(upload_to='complaint_images/', null = True, blank = True)
    complaint_2 = models.CharField(max_length = 500, blank = True)
    complaint_2_image = models.ImageField(upload_to='complaint_images/', null = True, blank = True)
    complaint_3 = models.CharField(max_length = 500, blank = True)
    complaint_3_image = models.ImageField(upload_to='complaint_images/', null = True, blank = True)
    complaint_4 = models.CharField(max_length = 500, blank = True)
    complaint_4_image = models.ImageField(upload_to='complaint_images/', null = True, blank = True)
    complaint_5 = models.CharField(max_length = 500, blank = True)
    complaint_5_image = models.ImageField(upload_to='complaint_images/', null = True, blank = True)
    complaint_6 = models.CharField(max_length = 500, blank = True)
    complaint_6_image = models.ImageField(upload_to='complaint_images/', null = True, blank = True)
    complaint_7 = models.CharField(max_length = 500, blank = True)
    complaint_7_image = models.ImageField(upload_to='complaint_images/', null = True, blank = True)
    cir_date_time = models.DateTimeField(null = True, auto_now_add = True, db_index=True)
    cir_date = models.DateField(auto_now_add = True)
    cir_time = models.TimeField(auto_now_add = True)
    supervisor_name = models.CharField(max_length = 500, blank = True)
    supervisor_id = models.CharField(max_length = 200, blank = True)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null = True, db_index=True)
    report_type = models.CharField(max_length = 50, blank = True, default="new", db_index=True)

    # For Advisor ###########################################################################
    selected_advisor = models.CharField(max_length = 500, blank = True, db_index=True)
    sar_status = models.CharField(max_length = 100, blank = True, default = "pending", db_index=True)
    advisor_preview = models.CharField(max_length = 100, blank = True, default="pending")

    # For Workshop Manager ###########################################################################
    selected_workshop_manager = models.CharField(max_length = 500, blank = True, db_index=True)
    workshop_manager_preview = models.CharField(max_length = 100, blank = True, default="pending")
    workshop_manager_verification = models.CharField(max_length = 100, blank = True, default = "pending", db_index=True)
    workshop_manager_remark = models.CharField(max_length = 500, blank = True)
    workshop_manager_revision_remark = models.CharField(max_length = 500, blank = True)
    workshop_manager_name = models.CharField(max_length = 200, blank = True)
    workshop_manager_userid = models.CharField(max_length = 100, blank = True)
    workshop_manager_verification_date_time = models.DateTimeField(null=True, blank=True)
    workshop_manager_verification_date = models.DateField(null=True, blank=True)
    workshop_manager_verification_time = models.TimeField(null=True, blank=True)

    # For Claim Manager ###########################################################################
    selected_claim_manager = models.CharField(max_length = 500, blank = True, db_index=True)
    claim_manager_preview = models.CharField(max_length = 100, blank = True, default="pending")
    claim_manager_name = models.CharField(max_length = 500, blank = True)
    claim_manager_id = models.CharField(max_length = 200, blank = True)
    claim_manager_investigation = models.CharField(max_length = 1000, blank = True)
    claim_manager_action_taken = models.CharField(max_length = 1000, blank = True)
    claim_manager_last_save_date_time = models.DateTimeField(null=True, blank=True)
    claim_manager_rejection = models.CharField(max_length = 20, blank = True)     #If yes make it rejected otherwise leave it blank
    claim_manager_rejection_reason = models.CharField(max_length = 1000, blank = True)
    presentation_date_time = models.DateTimeField(null=True, blank=True)
    presentation_date = models.DateField(null=True, blank=True)
    presentation_time = models.TimeField(null=True, blank=True)
    presentation_report = models.FileField(upload_to='cir_presentations/', blank=True, null=True)
    presentation_report_status = models.CharField(max_length = 100, blank = True, default = "pending")

    def __str__(self):
        return self.job_no
    
    class Meta:
        ordering = ('cir_date_time', )

        indexes = [
            models.Index(fields=['job_no']),
            models.Index(fields=['vehicle_no']),
            models.Index(fields=['selected_advisor']),
            models.Index(fields=['selected_workshop_manager']),
            models.Index(fields=['selected_claim_manager']),
            models.Index(fields=['sar_status', 'report_type']),  # Often used together
            models.Index(fields=['branch']),
            models.Index(fields=['cir_date_time']),
            # Add any composite indexes if you filter on multiple fields together often
        ]

########################################################################################################################################

# For Advisor ###########################################################################
class Service_Advisor_Report(models.Model):

    cir = models.OneToOneField(Customer_Information_Report, on_delete = models.CASCADE, primary_key = True)
    first_service = models.BooleanField("First Service", null=True, blank=True)
    first_service_remark = models.CharField(max_length = 200, blank = True)
    second_service = models.BooleanField("Second Service", null=True, blank=True)
    second_service_remark = models.CharField(max_length = 200, blank = True)
    third_service = models.BooleanField("Third Service", null=True, blank=True)
    third_service_remark = models.CharField(max_length = 200, blank = True)
    fourth_service = models.BooleanField("Fourth Service", null=True, blank=True)
    fourth_service_remark = models.CharField(max_length = 200, blank = True)
    fifth_service = models.BooleanField("Fifth Service", null=True, blank=True)
    fifth_service_remark = models.CharField(max_length = 200, blank = True)
    sixth_service = models.BooleanField("Sixth Service", null=True, blank=True)
    sixth_service_remark = models.CharField(max_length = 200, blank = True)
    service_remark = models.CharField(max_length = 200, null=True, blank=True)

    faulty1_description = models.CharField(max_length = 200, blank = True)
    faulty_image_1 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)
    faulty2_description = models.CharField(max_length = 200, blank = True)
    faulty_image_2 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)
    faulty3_description = models.CharField(max_length = 200, blank = True)
    faulty_image_3 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)
    faulty4_description = models.CharField(max_length = 200, blank = True)
    faulty_image_4 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)
    faulty5_description = models.CharField(max_length = 200, blank = True)
    faulty_image_5 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)
    faulty6_description = models.CharField(max_length = 200, blank = True)
    faulty_image_6 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)
    faulty7_description = models.CharField(max_length = 200, blank = True)
    faulty_image_7 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)
    faulty8_description = models.CharField(max_length = 200, blank = True)
    faulty_image_8 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)
    faulty9_description = models.CharField(max_length = 200, blank = True)
    faulty_image_9 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)
    faulty10_description = models.CharField(max_length = 200, blank = True)
    faulty_image_10 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)
    faulty11_description = models.CharField(max_length = 200, blank = True)
    faulty_image_11 = models.ImageField(upload_to='faulty_images/', null = True, blank = True) 
    faulty12_description = models.CharField(max_length = 200, blank = True)
    faulty_image_12 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)
    faulty13_description = models.CharField(max_length = 200, blank = True)
    faulty_image_13 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)
    faulty14_description = models.CharField(max_length = 200, blank = True)
    faulty_image_14 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)
    faulty15_description = models.CharField(max_length = 200, blank = True)
    faulty_image_15 = models.ImageField(upload_to='faulty_images/', null = True, blank = True)

    action_remark = models.CharField(max_length = 1000, null = True, blank = True)
    advisor_description = models.CharField(max_length = 1000, blank = True)
    advisor_name = models.CharField(max_length = 200, blank = True)
    advisor_id = models.CharField(max_length = 100, blank = True, db_index=True)

    sar_date_time = models.DateTimeField(null=True, blank=True)
    sar_date = models.DateField(null=True, blank=True)
    sar_time = models.TimeField(null=True, blank=True)

    def __str__(self):
        return self.cir.job_no
    
    class Meta:
        ordering = ('sar_date_time', )

########################################################################################################################################

# For Claim_manager ###########################################################################
class Claim_Status(models.Model):
    cir = models.OneToOneField(Customer_Information_Report, on_delete = models.CASCADE, primary_key = True)
    claim_no = models.CharField(max_length = 50, blank = False, db_index=True)
    claim_amount = models.CharField(max_length = 50, blank = True)
    claim_date = models.DateField(null=True, blank=True)
    submission_date = models.DateField(null=True, blank=True)
    claim_settled_date = models.DateField(null=True, blank=True)
    claim_status = models.CharField(max_length = 50, blank = True, db_index=True)
    crm_rejection_reason = models.CharField(max_length = 1000, blank = True)
    part_dispatch_image1 = models.ImageField(upload_to='parts_dispatch_images/', null = True, blank = True)
    part_dispatch_image2 = models.ImageField(upload_to='parts_dispatch_images/', null = True, blank = True)
    part_dispatch_image3 = models.ImageField(upload_to='parts_dispatch_images/', null = True, blank = True)
    part_dispatch_image4 = models.ImageField(upload_to='parts_dispatch_images/', null = True, blank = True)
    part_dispatch_image5 = models.ImageField(upload_to='parts_dispatch_images/', null = True, blank = True)

    acm_name = models.CharField(max_length = 200, blank = True)
    acm_id = models.CharField(max_length = 100, blank = True)
    part_dispatch_image_date_time = models.DateTimeField(null=True, blank=True)
    part_dispatch_image_date = models.DateField(null=True, blank=True)
    part_dispatch_image_time = models.TimeField(null=True, blank=True)


    def __str__(self):
        return self.claim_no
    
    class Meta:
        ordering = ('cir__cir_date_time', )

########################################################################################################################################

# For Back_Office_Operator ###########################################################################

class Scrap_List_Verification(models.Model):
    id = models.BigAutoField(primary_key=True, unique=True)
    
    scrap_verification_ppt_file = models.FileField(upload_to='scrap_verification_ppt_files/', null=True)

    back_office_operator_name = models.CharField(max_length=200, blank=True)
    back_office_operator_id = models.CharField(max_length=100, blank=True)
    scrap_verification_ppt_date_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Scrap List Verification: {self.id}"

    class Meta:
        ordering = ('scrap_verification_ppt_date_time',)

###########################################################################

class Scrap_List(models.Model):
    id = models.BigAutoField(primary_key=True, unique=True)
    claim_status = models.ManyToManyField(Claim_Status, related_name='scrap_list', blank=True)
    
    doc_no = models.CharField(max_length=50, blank=False, db_index=True)
    plant = models.CharField(max_length=100, blank=False)
    total_prowacs_no = models.PositiveIntegerField(null=True, blank=False)
    req_sub_date = models.DateField(null=True)
    list_gen_date = models.DateField(null=True)
    total_parts = models.PositiveIntegerField(null=True, blank=False)
    scrap_list_pdf = models.FileField(upload_to='scrap_lists/', null=True)
    list_verification_status = models.CharField(max_length=30, default="pending")  # If done scrapped
    linked_scrap_list_verification = models.ForeignKey(Scrap_List_Verification, on_delete=models.SET_NULL, null = True, blank = True, related_name='linked_scrap_lists')

    back_office_operator_name = models.CharField(max_length=200, blank=True)
    back_office_operator_id = models.CharField(max_length=100, blank=True)
    scrap_list_date_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Scrap List: {self.doc_no}"

    class Meta:
        ordering = ('scrap_list_date_time',)

# We are not storing the scrap_details in database as it is already present in the PDF file so we can access it directly from there

###########################################################################

class Packing_Slip(models.Model):
    id = models.BigAutoField(primary_key=True, unique=True)
    ps_claim_status = models.ManyToManyField(Claim_Status, related_name='packing_slip', blank=True)
    
    delivery_challan_pdf = models.FileField(upload_to='delivery_challans/', null=True)
    packing_slip_no = models.CharField(max_length=50, blank=False, db_index=True)
    place_of_supply = models.CharField(max_length=100, blank=False)
    total_prowacs_no = models.PositiveIntegerField(null=True, blank=False)
    packing_slip_date = models.DateField(null=True)
    total_parts = models.PositiveIntegerField(null=True, blank=False)
    transport_name = models.CharField(max_length = 500, blank = False)
    docket_no = models.CharField(max_length = 50, blank = False)
    docket_date = models.DateField(null=True, blank=False)
    received_date = models.DateField(null=True, blank=True)
    pod_pdf = models.FileField(upload_to='pod_pdfs/', null=True, blank=True)

    back_office_operator_name = models.CharField(max_length=200, blank=True)
    back_office_operator_id = models.CharField(max_length=100, blank=True)
    packing_slip_date_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Scrap List: {self.packing_slip_no}"

    class Meta:
        ordering = ('packing_slip_date_time',)


########################################################################################################################################

# For Security_officer ###########################################################################
class Vehicle_Gate_Entry(models.Model):
    cir = models.OneToOneField(Customer_Information_Report, on_delete = models.CASCADE, primary_key = True)
    gate_no = models.CharField(max_length = 10, blank = True)
    gate_pass_no = models.CharField(max_length = 10, blank = True)
    gate_pass_image = models.ImageField(upload_to='vehicle_gate_entry_images/', null = True, blank = True)
    gate_register_image = models.ImageField(upload_to='vehicle_gate_entry_images/', null = True, blank = True)

    security_officer_name = models.CharField(max_length = 200, blank = True)
    security_officer_id = models.CharField(max_length = 100, blank = True)
    vehicle_gate_entry_image_date_time = models.DateTimeField(null=True, blank=True)
    vehicle_gate_entry_image_date = models.DateField(null=True, blank=True)
    vehicle_gate_entry_image_time = models.TimeField(null=True, blank=True)

    def __str__(self):
        return self.cir.job_no
    
    class Meta:
        ordering = ('cir__cir_date_time', )
