from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib import messages
from django.contrib.auth.models import User
from core.models import Customer_Information_Report, User_Profile, Designation
from core.forms import MyProfileForm, Manual_Password_Change_Form
from datetime import date, datetime
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.paginator import Paginator
from core.decorators import login_active_user_required
from django.http import JsonResponse

########################################################################################################################

@login_active_user_required
def works_cir_list(request):
    if request.user.user_profile.user_designation.designation == "workshop_manager":
        cir_reports = Customer_Information_Report.objects.filter(sar_status="completed", workshop_manager_verification="pending", selected_workshop_manager=request.user.username, branch=request.user.user_profile.user_branch).values('cir_uid', 'job_no', 'vehicle_no', 'supervisor_name', 'cir_date_time', 'report_type', 'service_advisor_report__advisor_name', 'service_advisor_report__sar_date_time', 'workshop_manager_preview', 'workshop_manager_verification').order_by('cir_date_time')
        paginator = Paginator(cir_reports, 30)
        page_no = request.GET.get('page')
        page_obj = paginator.get_page(page_no)
        return render(request, 'workshop_manager/cir_list.html', {'cir_reports':page_obj})
    
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')

########################################################################################################################

def notify_advisor_new_cir(selected_advisor, cir_data):
    channel_layer = get_channel_layer()
    group_name = f"advisor_{selected_advisor}"
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "new_cir_report",
            "data": cir_data,
        }
    )

#######################################################################


def notify_claim_manager_new_cir(selected_claim_manager, cir_data):
    channel_layer = get_channel_layer()
    group_name = f"claimmanager_{selected_claim_manager}"
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "new_cir_report",
            "data": cir_data,
        }
    )

#######################################################################

@login_active_user_required
def works_preview_cir(request, cir_uid):
    if request.user.user_profile.user_designation.designation == "workshop_manager":
        if request.method == "POST":
            data = request.POST

            report = Customer_Information_Report.objects.filter(cir_uid = data.get('cir_uid')).first()

            if report.selected_workshop_manager == request.user.username:

                if data.get('task') == "submission":

                    report.workshop_manager_verification="verified"
                    report.workshop_manager_verification_date_time=datetime.now()
                    report.workshop_manager_verification_date=date.today()
                    report.workshop_manager_verification_time=timezone.now()
                    report.workshop_manager_name=request.user.first_name+ " " + request.user.last_name
                    report.workshop_manager_userid=request.user.username
                    report.workshop_manager_remark=(data.get('workshop_manager_remark') or '').lower()
                    report.selected_claim_manager=data.get('selected_cm')

                    report.save()

                    cir_data = {
                        "cir_uid": str(report.cir_uid),
                        "vehicle_no": report.vehicle_no,
                        "job_no": report.job_no,
                        "supervisor_name": report.supervisor_name,
                        "cir_date_time": str(report.cir_date_time),
                        "advisor_name": getattr(report.service_advisor_report, 'advisor_name', None),  ## First check if SAR exists or not, if yes then only fetch advisor_name otherwise None
                        "sar_date_time": str(getattr(report.service_advisor_report, 'sar_date_time', None)),
                        "wm_name": report.workshop_manager_name,
                        "wm_date_time": str(report.workshop_manager_verification_date_time)
                        
                        # add other fields you want to display
                    }
                    notify_claim_manager_new_cir(report.selected_claim_manager, cir_data)

                    messages.success(request, "Report verified successfully")

                else:

                    report.workshop_manager_revision_remark=(data.get('revision_remark') or '').lower()
                    report.report_type="revision"
                    report.sar_status="pending"
                    report.workshop_manager_preview="pending"
                    report.advisor_preview="pending"
                    report.save()

                    cir_data = {
                        "cir_uid": str(report.cir_uid),
                        "vehicle_no": report.vehicle_no,
                        "job_no": report.job_no,
                        "supervisor_name": report.supervisor_name,
                        "cir_date_time": str(report.cir_date_time),
                        "sar_status": report.sar_status,
                        "advisor_preview": "pending",
                        "report_type":"revision",
                        # add other fields you want to display
                    }
                    notify_advisor_new_cir(report.selected_advisor, cir_data)

                    messages.success(request, "Report sent for Revision")

                return redirect('cir_list')
            
            else:
                messages.error(request, "Unauthorised Access !!")
                return redirect('cir_list')

        else:
            cir_report = Customer_Information_Report.objects.get(cir_uid = cir_uid)
            if cir_report.selected_workshop_manager == request.user.username:
                try:
                    if cir_report.workshop_manager_preview == "pending":
                        cir_report.workshop_manager_preview = "previewed"
                        cir_report.save(update_fields=['workshop_manager_preview'])
                except:
                    pass
                cm_list = User_Profile.objects.filter(user_designation=Designation.objects.get(designation='claim_manager'), user_branch=request.user.user_profile.user_branch, user__is_active=True).values('user__first_name','user__last_name','user__username')
                alloted_cm = request.user.user_profile.alloted_claim_manager
                return render(request, 'workshop_manager/preview_cir.html', {'cir_report':cir_report, 'cm_list':cm_list, 'alloted_cm':alloted_cm})

            else:
                logout(request)
                messages.error(request, "Unauthorised Access !!")
                return redirect('user_login')        
        
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')
    

########################################################################################################################################

@login_active_user_required
def check_claim_manager(request):
    if request.user.user_profile.user_designation.designation == "workshop_manager":
        if request.method == "GET":

            alloted_cm = request.user.user_profile.alloted_claim_manager 

            if alloted_cm:
                alloted_cm = User.objects.filter(username = request.user.user_profile.alloted_claim_manager).first()

            if alloted_cm and alloted_cm.is_active:

                return JsonResponse({"exists":"yes"})
                
            else:
                return JsonResponse({"error_msg":"Alloted Workshop Manager does not exists!!"})
            
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')

########################################################################################################################################

@login_active_user_required
def my_profile(request):
    if request.user.user_profile.user_designation.designation == "workshop_manager":
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
                
            return redirect('wm_my_profile')


        else:
            # Initial data population
            form = MyProfileForm(initial={
                'user_name': user.first_name,
                'mobile_no': user_profile.mobile_no
            })

            return render(request, 'workshop_manager/wm_my_profile.html', {'mform':form})
        
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    


########################################################################################################################################

@login_active_user_required
def change_password(request):
    if request.user.user_profile.user_designation.designation == "workshop_manager":
            
        if request.method == "POST":    
            pwd_form = Manual_Password_Change_Form(user=request.user, data=request.POST)
            if pwd_form.is_valid():
                pwd_form.save()
                logout(request)
                messages.success(request, "Password changed, Login again with the new Password")
                return redirect('user_login')    
            
            else:
                messages.error(request, "Old Password is incorrect !!")
                return redirect('wm_change_password')

        else:
            pwd_form = Manual_Password_Change_Form(user=request.user)
            return render(request, 'workshop_manager/wm_change_pwd.html', {'pwd_form':pwd_form})
    

    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    
