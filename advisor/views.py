from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.contrib import messages
import base64
import uuid
import json
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.contrib.auth.models import User
from core.models import Customer_Information_Report, Service_Advisor_Report, User_Profile, Designation
from datetime import date
from django.utils import timezone
from supervisor.forms import Complaint_Information_Report_Form
from .forms import Service_Advisor_Report_Form
from core.forms import MyProfileForm, Manual_Password_Change_Form
from django.contrib.auth import update_session_auth_hash
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.paginator import Paginator
from core.decorators import login_active_user_required
from django.http import JsonResponse


########################################################################################################################################

def notify_workshopmanager_new_cir(selected_workshop_manager, cir_data):
    channel_layer = get_channel_layer()
    group_name = f"workshopmanager_{selected_workshop_manager}"
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "new_cir_report",
            "data": cir_data,
        }
    )

########################################################################################################################################

@login_active_user_required
def advisor_cir_list(request):
    if request.user.user_profile.user_designation.designation == "advisor":
        no_of_revision_report = 0
        cir_reports = Customer_Information_Report.objects.filter(sar_status__in=["pending", "drafted"], selected_advisor=request.user.username, report_type="new").values('cir_uid', 'advisor_preview', 'job_no', 'vehicle_no', 'supervisor_name', 'cir_date_time', 'sar_status').order_by('cir_date_time')
        paginator = Paginator(cir_reports, 30)
        page_no = request.GET.get('page')
        page_obj = paginator.get_page(page_no)
        no_of_revision_report = Customer_Information_Report.objects.filter(sar_status="pending", report_type="revision", selected_advisor=request.user.username).count()
        return render(request, 'advisor/advisor_cir_list.html', {'cir_reports':page_obj, 'no_of_revision_report':no_of_revision_report})
    else:
        logout(request)
        messages.success(request, "Logged Out")
        return redirect('user_login')
    
########################################################################################################################################

@login_active_user_required
def advisor_preview_cir(request, cir_uid):
    if request.user.user_profile.user_designation.designation == "advisor":
    
        cir_report = Customer_Information_Report.objects.filter(cir_uid = cir_uid).first()

        if cir_report:
            if cir_report.selected_advisor == request.user.username:
                if cir_report.advisor_preview == "pending":
                    cir_report.advisor_preview = "previewed"
                    cir_report.save(update_fields=['advisor_preview'])
                no_of_revision_report = Customer_Information_Report.objects.filter(sar_status="pending", report_type="revision", selected_advisor=request.user.username).count()
                return render(request, 'advisor/preview_cir.html', {'cir_report':cir_report, 'no_of_revision_report':no_of_revision_report})
                
            else:
                logout(request)
                messages.error(request, "Unauthorised Access")
                return redirect('user_login')      

        else:
            messages.success(request, "CIR doesnot exist")
            return redirect('advisor_cir_list')

    else:
        logout(request)
        messages.error(request, "Unauthorised Access")
        return redirect('user_login')
    
########################################################################################################################################

@login_active_user_required
def advisor_edit_cir(request, cir_uid):
    if request.user.user_profile.user_designation.designation == "advisor":
    
        if request.method == "POST":

            cform = Complaint_Information_Report_Form(request.POST)
            data = request.POST
            report = Customer_Information_Report.objects.filter(cir_uid=data.get('cir_report_uid')).first()

            if cform.is_valid():
                if report:

                    if report.selected_advisor == request.user.username:

                        #  Finding Accounting Year
                        current_date = report.cir_date
                        current_year = current_date.year
                        april_first = date(current_year, 4, 1)

                        if current_date < april_first:
                            accounting_year = f"{str(current_year - 1)[-2:]}{str(current_year)[-2:]}"
                        else:
                            accounting_year = f"{str(current_year)[-2:]}{str(current_year + 1)[-2:]}"

                        full_job_no = "JC-ShrAmb-" + request.user.user_profile.user_branch.code.upper() + "-" + accounting_year + "-" + str(data.get('job_no', ''))

                        report.cir_id=int(accounting_year + str(data.get('job_no', '')))
                        report.job_no=full_job_no
                        report.vehicle_no=cform.cleaned_data['vehicle_no'].lower()
                        report.kilometer=cform.cleaned_data['kilometer']
                        report.claim_category=data.getlist('claim_category')
                        report.complaint_1=(cform.cleaned_data.get('complaint_1') or '').lower()
                        report.complaint_2=(cform.cleaned_data.get('complaint_2') or '').lower()
                        report.complaint_3=(cform.cleaned_data.get('complaint_3') or '').lower()
                        report.complaint_4=(cform.cleaned_data.get('complaint_4') or '').lower()
                        report.complaint_5=(cform.cleaned_data.get('complaint_5') or '').lower()
                        report.complaint_6=(cform.cleaned_data.get('complaint_6') or '').lower()
                        report.complaint_7=(cform.cleaned_data.get('complaint_7') or '').lower()

                        dataset_urls = json.loads(request.POST.get("imageUrlsJSONPassed", "{}"))

                        # Convert and assign images from base64 if updated, else retain, else clear
                        def update_image(field_name, image_field_name):
                            new_data = data.get(field_name)
                            image_url_present = dataset_urls.get(field_name, "").strip() != ""

                            if new_data:
                                setattr(report, image_field_name, base64_to_image(new_data, image_field_name))
                            elif image_url_present:
                                # User did not retake; retain the existing image
                                pass
                            else:
                                # No base64 and no URL; user removed image
                                if getattr(report, image_field_name):
                                    setattr(report, image_field_name, None)


                        update_image('photo_0', 'vehicle_front_image')
                        update_image('photo_1', 'vehicle_with_number_plate')
                        update_image('photo_2', 'chasis')
                        update_image('photo_3', 'odometer')
                        update_image('photo_4', 'complaint_1_image')
                        update_image('photo_5', 'complaint_2_image')
                        update_image('photo_6', 'complaint_3_image')
                        update_image('photo_7', 'complaint_4_image')
                        update_image('photo_8', 'complaint_5_image')
                        update_image('photo_9', 'complaint_6_image')
                        update_image('photo_10', 'complaint_7_image')


                        report.save()

                        if data.get('task') == "save":
                            messages.success(request, "CIR edited successfully")
                            return redirect('advisor_preview_cir', cir_uid=report.cir_uid)
                        
                        elif data.get('task') == "wm_redirect":
                            messages.success(request, "CIR edited successfully")
                            return redirect('wm_returned_report')
                        
                        else:
                            messages.success(request, "CIR saved successfully")
                            return redirect('advisor_revise_report', cir_uid=report.cir_uid)
                        
                    else:
                        messages.error(request, "Unauthorised Access !!")
                        return redirect('advisor_cir_list')  

                else:
                    messages.error(request, "Error occured !!")
                    return redirect('advisor_preview_cir', cir_uid=report.cir_uid)    

            else:
                messages.error(request, "Error occured !!")
                return redirect('advisor_preview_cir', cir_uid=report.cir_uid)

        
        # For Get Method
        else:

            cir_report = Customer_Information_Report.objects.filter(cir_uid = cir_uid).first()

            if cir_report:
                if cir_report.selected_advisor == request.user.username:
                    cform =  Complaint_Information_Report_Form(instance = cir_report, initial={'claim_category': cir_report.claim_category})    

                    image_urls = {}

                    if cir_report.vehicle_front_image:
                        image_urls['vehicle_front_image'] = cir_report.vehicle_front_image.url
                    if cir_report.vehicle_with_number_plate:
                        image_urls['vehicle_with_number_plate'] = cir_report.vehicle_with_number_plate.url
                    if cir_report.chasis:
                        image_urls['chasis'] = cir_report.chasis.url
                    if cir_report.odometer:
                        image_urls['odometer'] = cir_report.odometer.url

                    for i in range(1, 8):
                        img_field = getattr(cir_report, f'complaint_{i}_image')
                        if img_field:
                            image_urls[f'photo_{i+3}'] = img_field.url  # since 0–3 used above

                    no_of_revision_report = Customer_Information_Report.objects.filter(sar_status="pending", report_type="revision", selected_advisor=request.user.username).count()

                    if cir_report.workshop_manager_revision_remark:
                        return render(request, 'advisor/edit_cir.html', {'cir_uid':cir_report.cir_uid, 'revision_remark':cir_report.workshop_manager_revision_remark, 'cform':cform, 'image_urls': image_urls, 'no_of_revision_report':no_of_revision_report})
                    else:
                        return render(request, 'advisor/edit_cir.html', {'cir_uid':cir_report.cir_uid, 'revision_remark':"no_remark", 'cform':cform, 'image_urls': image_urls, 'no_of_revision_report':no_of_revision_report})
                    
                else:
                    logout(request)
                    messages.error(request, "Unauthorised Access !!")
                    return redirect('user_login')
            else:
                messages.success(request, "CIR doesnot exist !!")
                return redirect('advisor_cir_list')

    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')

########################################################################################################################################

def base64_to_image(base64_str, filename_prefix):
    """
    Converts base64 string to Django ContentFile for use in ImageField
    """
    format, imgstr = base64_str.split(';base64,')  # format ~= data:image/jpeg
    ext = format.split('/')[-1]
    file_name = f"{filename_prefix}_{uuid.uuid4()}.{ext}"
    return ContentFile(base64.b64decode(imgstr), name=file_name)

####################################################################################

def image_to_base64(image_field):
    if image_field and hasattr(image_field, 'path') and image_field.path:
        with open(image_field.path, 'rb') as img_file:
            return base64.b64encode(img_file.read()).decode('utf-8')
    return None

####################################################################################

def delete_previous_image(field):
    if field and getattr(field, 'name', None) and default_storage.exists(field.name):
        field.delete(save=False)

####################################################################################

@login_active_user_required
def advisor_service_report(request, cir_uid):
    if request.user.user_profile.user_designation.designation == "advisor":
        if request.method == "POST":

            data = request.POST
            sar_form = Service_Advisor_Report_Form(request.POST)
            cir_report = Customer_Information_Report.objects.filter(cir_uid=data.get('cir_report_uid')).first()

            if cir_report.selected_advisor == request.user.username:

                if sar_form.is_valid():
                    if cir_report:

                        now = timezone.now()
                        # Try fetching existing draft for update
                        report = Service_Advisor_Report.objects.filter(cir=cir_report).first()

                        creating_new = report is None

                        if creating_new:
                            report = Service_Advisor_Report(cir=cir_report)

                        report.first_service = sar_form.cleaned_data['first_service']
                        report.second_service = sar_form.cleaned_data['second_service']
                        report.third_service = sar_form.cleaned_data['third_service']
                        report.fourth_service = sar_form.cleaned_data['fourth_service']
                        report.fifth_service = sar_form.cleaned_data['fifth_service']
                        report.sixth_service = sar_form.cleaned_data['sixth_service']

                        report.first_service_remark = (sar_form.cleaned_data.get('first_service_remark') or '').lower()
                        report.second_service_remark = (sar_form.cleaned_data.get('second_service_remark') or '').lower()
                        report.third_service_remark = (sar_form.cleaned_data.get('third_service_remark') or '').lower()
                        report.fourth_service_remark = (sar_form.cleaned_data.get('fourth_service_remark') or '').lower()
                        report.fifth_service_remark = (sar_form.cleaned_data.get('fifth_service_remark') or '').lower()
                        report.sixth_service_remark = (sar_form.cleaned_data.get('sixth_service_remark') or '').lower()

                        report.service_remark = (sar_form.cleaned_data.get('service_remark') or '').lower()

                        report.faulty1_description = (sar_form.cleaned_data.get('faulty1_description') or '').lower()
                        report.faulty2_description = (sar_form.cleaned_data.get('faulty2_description') or '').lower()
                        report.faulty3_description = (sar_form.cleaned_data.get('faulty3_description') or '').lower()
                        report.faulty4_description = (sar_form.cleaned_data.get('faulty4_description') or '').lower()
                        report.faulty5_description = (sar_form.cleaned_data.get('faulty5_description') or '').lower()
                        report.faulty6_description = (sar_form.cleaned_data.get('faulty6_description') or '').lower()
                        report.faulty7_description = (sar_form.cleaned_data.get('faulty7_description') or '').lower()
                        report.faulty8_description = (sar_form.cleaned_data.get('faulty8_description') or '').lower()
                        report.faulty9_description = (sar_form.cleaned_data.get('faulty9_description') or '').lower()
                        report.faulty10_description = (sar_form.cleaned_data.get('faulty10_description') or '').lower()
                        report.faulty11_description = (sar_form.cleaned_data.get('faulty11_description') or '').lower()
                        report.faulty12_description = (sar_form.cleaned_data.get('faulty12_description') or '').lower()
                        report.faulty13_description = (sar_form.cleaned_data.get('faulty13_description') or '').lower()
                        report.faulty14_description = (sar_form.cleaned_data.get('faulty14_description') or '').lower()
                        report.faulty15_description = (sar_form.cleaned_data.get('faulty15_description') or '').lower()

                        report.action_remark = (sar_form.cleaned_data.get('action_remark') or '').lower()
                        report.advisor_description = (sar_form.cleaned_data.get('advisor_description') or '').lower()
                        report.advisor_name = request.user.first_name + " " + request.user.last_name
                        report.advisor_id = request.user.username
                        report.sar_date_time = now
                        report.sar_date = now.date()
                        report.sar_time = now.time()

                        dataset_urls = json.loads(request.POST.get("imageUrlsJSONPassed", "{}"))

                        def update_image(field_name, image_field_name):
                            new_data = data.get(field_name)
                            image_url_present = dataset_urls.get(field_name, "").strip() != ""

                            if new_data:
                                setattr(report, image_field_name, base64_to_image(new_data, image_field_name))
                            elif image_url_present:
                                pass  # retain old image
                            else:
                                if getattr(report, image_field_name):
                                    setattr(report, image_field_name, None)

                        update_image('photo_0', 'faulty_image_1')
                        update_image('photo_1', 'faulty_image_2')
                        update_image('photo_2', 'faulty_image_3')
                        update_image('photo_3', 'faulty_image_4')
                        update_image('photo_4', 'faulty_image_5')
                        update_image('photo_5', 'faulty_image_6')
                        update_image('photo_6', 'faulty_image_7')
                        update_image('photo_7', 'faulty_image_8')
                        update_image('photo_8', 'faulty_image_9')
                        update_image('photo_9', 'faulty_image_10')
                        update_image('photo_10', 'faulty_image_11')
                        update_image('photo_11', 'faulty_image_12')
                        update_image('photo_12', 'faulty_image_13')
                        update_image('photo_13', 'faulty_image_14')
                        update_image('photo_14', 'faulty_image_15')


                        report.save()

                        # For making the Draft
                        if request.POST.get('action') == 'draft':
                            cir_report.sar_status = "drafted"
                            cir_report.save(update_fields=['sar_status'])

                        # For saving
                        elif request.POST.get('action') == 'save':
                            pass

                        # For submitting
                        elif request.POST.get('action') == 'submit':
                            cir_report.selected_workshop_manager = request.POST.get('selected_wm')
                            cir_report.sar_status = "completed"
                            cir_report.save(update_fields=['sar_status', 'selected_workshop_manager'])

                            cir_data = {
                                "cir_uid": str(cir_report.cir_uid),
                                "vehicle_no": cir_report.vehicle_no,
                                "job_no": cir_report.job_no,
                                "supervisor_name": cir_report.supervisor_name,
                                "cir_date_time": str(cir_report.cir_date_time),
                                "advisor_name": getattr(cir_report.service_advisor_report, 'advisor_name', None),  ## First check if SAR exists or not, if yes then only fetch advisor_name otherwise None
                                "sar_date_time": str(getattr(cir_report.service_advisor_report, 'sar_date_time', None)),
                                "sar_status": cir_report.sar_status,
                                "report_type":"new",
                                # add other fields you want to display
                            }
                            notify_workshopmanager_new_cir(cir_report.selected_workshop_manager, cir_data)

                        else:
                            logout(request)
                            messages.error(request, "Unauthorised Access !!")
                            return redirect('user_login')

                        if data.get('task') == 'draft':
                            if cir_report.workshop_manager_revision_remark == "":
                                messages.success(request, "Draft saved successfully")
                                return redirect('advisor_cir_list')
                            else:
                                messages.success(request, "SAR saved successfully")
                                return redirect('advisor_revise_report', cir_uid=cir_report.cir_uid)
                            
                        elif data.get('task') == 'submit':
                            messages.success(request, "Service report submitted successfully")
                            return redirect('advisor_cir_list')
                            
                        else:
                            messages.success(request, "Draft saved successfully")
                            return redirect('wm_returned_report')

                    else:
                        messages.error(request, "Report not found !!")
                        return redirect('advisor_cir_list')

                else:
                    messages.error(request, "Error occured !!")
                    return redirect('advisor_cir_list')
                
            else:
                messages.error(request, "Unauthorised Access !!")
                return redirect('advisor_cir_list')


        # For Get Method
        else:

            cir_report = Customer_Information_Report.objects.filter(cir_uid = cir_uid).first()

            if cir_report:
                if cir_report.selected_advisor == request.user.username:
                    drafted_sar = Service_Advisor_Report.objects.filter(cir = cir_report).first()

                    if drafted_sar:
                        sar_form = Service_Advisor_Report_Form(instance = drafted_sar)

                        last_faulty_description_index = 0
                        for i in range(1, 16):  # You have 15 faulty_description fields
                            value = getattr(drafted_sar, f'faulty{i}_description', '')
                            if value:  # If non-empty
                                last_faulty_description_index = i

                        image_urls = {}
                        for i in range(1, 16):
                            img_field = getattr(drafted_sar, f'faulty_image_{i}')
                            if img_field:
                                image_urls[f'photo_{i-1}'] = img_field.url


                        wm_list = User_Profile.objects.filter(user_designation=Designation.objects.get(designation='workshop_manager'), user_branch=request.user.user_profile.user_branch).values('user__first_name','user__last_name','user__username')
                        alloted_wm = request.user.user_profile.alloted_workshop_manager

                        no_of_revision_report = Customer_Information_Report.objects.filter(sar_status="pending", report_type="revision", selected_advisor=request.user.username).count()

                        if cir_report.workshop_manager_revision_remark:
                            return render(request, 'advisor/service_report.html', {'cir_uid':cir_report.cir_uid, 'job_no':cir_report.job_no, 'vehicle_no':cir_report.vehicle_no, 'revision_remark':cir_report.workshop_manager_revision_remark, 'sar_form':sar_form, 'image_urls': image_urls, 'last_faulty_description_index':last_faulty_description_index, 'no_of_revision_report':no_of_revision_report})
                        else:
                            return render(request, 'advisor/service_report.html', {'cir_uid':cir_report.cir_uid, 'job_no':cir_report.job_no, 'vehicle_no':cir_report.vehicle_no, 'revision_remark':"no_remark", 'sar_form':sar_form, 'image_urls': image_urls, 'last_faulty_description_index':last_faulty_description_index, 'wm_list':wm_list, 'alloted_wm':alloted_wm, 'no_of_revision_report':no_of_revision_report})
                    else:    
                        wm_list = User_Profile.objects.filter(user_designation=Designation.objects.get(designation='workshop_manager'), user_branch=request.user.user_profile.user_branch, user__is_active=True).values('user__first_name','user__last_name','user__username')
                        alloted_wm = request.user.user_profile.alloted_workshop_manager
                        sar_form = Service_Advisor_Report_Form()
                        no_of_revision_report = Customer_Information_Report.objects.filter(sar_status="pending", report_type="revision", selected_advisor=request.user.username).count()
                        return render(request, 'advisor/service_report.html', {'cir_uid':cir_report.cir_uid, 'job_no':cir_report.job_no, 'vehicle_no':cir_report.vehicle_no, 'revision_remark':"no_remark", 'sar_form':sar_form, 'wm_list':wm_list, 'alloted_wm':alloted_wm, 'no_of_revision_report':no_of_revision_report})
                    
                else:
                    logout(request)
                    messages.error(request, "Unauthorised Access !!")
                    return redirect('user_login')
            else:
                messages.success(request, "CIR doesnot exist !!")
                return redirect('advisor_cir_list')
        
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')

########################################################################################################################################

@login_active_user_required
def check_works_manager(request):
    if request.user.user_profile.user_designation.designation == "advisor":
        if request.method == "GET":

            alloted_wm = request.user.user_profile.alloted_workshop_manager 

            if alloted_wm:
                alloted_wm = User.objects.filter(username = request.user.user_profile.alloted_workshop_manager).first()

            if alloted_wm and alloted_wm.is_active:

                return JsonResponse({"exists":"yes"})
                
            else:
                return JsonResponse({"error_msg":"Alloted Workshop Manager does not exists !!"})
            
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')

########################################################################################################################################

@login_active_user_required
def wm_returned_report(request):
    if request.user.user_profile.user_designation.designation == "advisor":
        cir_reports = Customer_Information_Report.objects.filter(sar_status="pending", selected_advisor=request.user.username, report_type="revision").values('cir_uid', 'advisor_preview', 'job_no', 'vehicle_no', 'supervisor_name', 'cir_date_time').order_by('cir_date_time')
        paginator = Paginator(cir_reports, 30)
        page_no = request.GET.get('page')
        page_obj = paginator.get_page(page_no)
        return render(request, 'advisor/advisor_wm_returned_report.html', {'cir_reports':page_obj})
    else:
        logout(request)
        messages.success(request, "Logged Out")
        return redirect('user_login')
    
########################################################################################################################################

@login_active_user_required
def advisor_revise_report(request, cir_uid):

    if request.user.user_profile.user_designation.designation == "advisor":
        
        if request.method == "POST":
            cir_report = Customer_Information_Report.objects.filter(cir_uid = cir_uid).first()

            if cir_report:
                if cir_report.selected_advisor == request.user.username:
                    if cir_report.sar_status == "pending":
                        cir_report.sar_status = "completed"
                        cir_report.save(update_fields=['sar_status'])

                    cir_data = {
                        "cir_uid": str(cir_report.cir_uid),
                        "vehicle_no": cir_report.vehicle_no,
                        "job_no": cir_report.job_no,
                        "supervisor_name": cir_report.supervisor_name,
                        "cir_date_time": str(cir_report.cir_date_time),
                        "advisor_name": getattr(cir_report.service_advisor_report, 'advisor_name', None),  ## First check if SAR exists or not, if yes then only fetch advisor_name otherwise None
                        "sar_date_time": str(getattr(cir_report.service_advisor_report, 'sar_date_time', None)),
                        "sar_status": cir_report.sar_status,
                        "report_type":"revision",
                        # add other fields you want to display
                    }
                    notify_workshopmanager_new_cir(cir_report.selected_workshop_manager, cir_data)

                    messages.success(request, "Report submitted successfully")
                    return redirect('wm_returned_report')      

                else:
                    messages.error(request, "Unauthorised Access !!")
                    return redirect('wm_returned_report')  

            else:
                messages.success(request, "Error !!")
                return redirect('wm_returned_report')      
        

        else:
    
            cir_report = Customer_Information_Report.objects.filter(cir_uid = cir_uid).first()

            if cir_report:
                if cir_report.selected_advisor == request.user.username:
                    if cir_report.advisor_preview == "pending":
                        cir_report.advisor_preview = "previewed"
                        cir_report.save(update_fields=['advisor_preview'])
                    no_of_revision_report = Customer_Information_Report.objects.filter(sar_status="pending", report_type="revision", selected_advisor=request.user.username).count()
                    return render(request, 'advisor/advisor_revise_report.html', {'cir_uid':cir_report.cir_uid, 'job_no':cir_report.job_no, 'vehicle_no':cir_report.vehicle_no, 'revision_remark':cir_report.workshop_manager_revision_remark, 'no_of_revision_report':no_of_revision_report})
                    
                else:
                    logout(request)
                    messages.error(request, "Unauthorised Access !!")
                    return redirect('user_login')      

            else:
                messages.success(request, "CIR doesnot exist !!")
                return redirect('advisor_cir_list')

    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')
    

##################################################################################################################################

@login_active_user_required
def get_revision_report_nos(request):
    if request.user.user_profile.user_designation.designation == "advisor" and request.method == 'GET':
            
        try:
            revision_report_nos = Customer_Information_Report.objects.filter(sar_status="pending", report_type="revision", selected_advisor=request.user.username).count()

            if revision_report_nos:
                return JsonResponse({'status': 'success', 'revision_report_nos': revision_report_nos})

            else:    
                return JsonResponse({'status': 'success', 'revision_report_nos': 0})
        except:
            return JsonResponse({'status': 'error', 'revision_report_nos': 0})
    
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    
    

########################################################################################################################################

@login_active_user_required
def my_profile(request):
    if request.user.user_profile.user_designation.designation == "advisor":
        user = request.user
        user_profile = user.user_profile  # Or however you access the profile

        if request.method == 'POST':
            form = MyProfileForm(request.POST)
            if form.is_valid():
                # Save logic below!
                user.first_name = form.cleaned_data['user_name'].lower()
                user.save()
                user_profile.mobile_no = form.cleaned_data['mobile_no']
                user_profile.save()
                messages.success(request, "Profile saved successfully")
            
            else:
                messages.error(request, "Error !!")
                
            return redirect('advisor_my_profile')
            
        
        else:
            # Initial data population
            form = MyProfileForm(initial={
                'user_name': user.first_name,
                'mobile_no': user_profile.mobile_no
            })

            no_of_revision_report = Customer_Information_Report.objects.filter(sar_status="pending", report_type="revision", selected_advisor=request.user.username).count()
            return render(request, 'advisor/advisor_my_profile.html', {'mform':form, 'no_of_revision_report':no_of_revision_report})
        
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    


########################################################################################################################################

@login_active_user_required
def change_password(request):
    if request.user.user_profile.user_designation.designation == "advisor":
            
        if request.method == "POST":    
            pwd_form = Manual_Password_Change_Form(user=request.user, data=request.POST)
            if pwd_form.is_valid():
                pwd_form.save()
                logout(request)
                messages.success(request, "Password changed, Login again with the new Password")
                return redirect('user_login')    
            
            else:
                messages.error(request, "Old Password is incorrect !!")
                return redirect('advisor_change_password')    

        else:

            pwd_form = Manual_Password_Change_Form(user=request.user)
            no_of_revision_report = Customer_Information_Report.objects.filter(sar_status="pending", report_type="revision", selected_advisor=request.user.username).count()
            return render(request, 'advisor/advisor_change_pwd.html', {'pwd_form':pwd_form, 'no_of_revision_report':no_of_revision_report})
    

    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    
