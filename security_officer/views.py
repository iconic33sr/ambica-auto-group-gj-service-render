from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.contrib import messages
from core.models import Customer_Information_Report, Vehicle_Gate_Entry, Accounting_Year
from core.forms import MyProfileForm, Manual_Password_Change_Form
from django.http import JsonResponse
import base64
import uuid
from django.core.files.base import ContentFile
from django.utils import timezone
from core.decorators import login_active_user_required

########################################################################################################################################

def base64_to_image(base64_str, filename_prefix):
    format, imgstr = base64_str.split(';base64,')
    ext = format.split('/')[-1]
    return ContentFile(base64.b64decode(imgstr), name=f"{uuid.uuid4()}.{ext}")

################################################################################

@login_active_user_required
def vehicle_gate_entry(request):
    if request.user.user_profile.user_designation.designation == "security_officer":
        if request.method == "POST":
            data = request.POST

            selected_job_no = request.POST.get('job_no')

            if selected_job_no:
                if selected_job_no[0:2] == "JC":
 
                    cir_report = Customer_Information_Report.objects.filter(job_no = selected_job_no).first()
                    if cir_report:
                        if cir_report.branch.branch == request.user.user_profile.user_branch.branch:

                            entry = ""

                            try:
                                vehicle_gate_entry_report = cir_report.vehicle_gate_entry
                                entry = "exist"
                            except Vehicle_Gate_Entry.DoesNotExist:
                                vehicle_gate_entry_report = Vehicle_Gate_Entry(cir=cir_report)
                                entry = "donot exist"

                            if entry == "donot exist":
                                now = timezone.now()

                                if data.get('photo_0'):
                                    vehicle_gate_entry_report.gate_pass_image = base64_to_image(data['photo_0'], 'gate_pass_image')
                                if data.get('photo_1'):
                                    vehicle_gate_entry_report.gate_register_image = base64_to_image(data['photo_1'], 'gate_register_image')

                                if request.user.user_profile.gate_no:
                                    vehicle_gate_entry_report.gate_no = request.user.user_profile.gate_no
                                vehicle_gate_entry_report.gate_pass_no = data['gate_pass_no']
                                vehicle_gate_entry_report.security_officer_name = request.user.first_name + " " + request.user.last_name
                                vehicle_gate_entry_report.security_officer_id = request.user.username
                                vehicle_gate_entry_report.vehicle_gate_entry_image_date_time = now
                                vehicle_gate_entry_report.vehicle_gate_entry_image_date = now.date()
                                vehicle_gate_entry_report.vehicle_gate_entry_image_time = now.time()

                                vehicle_gate_entry_report.save()
                                messages.success(request, "Entry saved successfully")    

                            else:
                                messages.error(request, "Entry already exist !!")    

                        else:
                            logout(request)
                            messages.error(request, "Unauthorised Access !!")
                            return redirect('user_login')    

                    else:
                        messages.error(request, "Report doesn't exist !!")    

                else:        
                    messages.error(request, "Invalid Job No !!")

            else:
                messages.error(request, "Job No can't be empty !!")

            return redirect('vehicle_gate_entry')        

        else:
            ac_years = Accounting_Year.objects.all().order_by('-ac_year')
            return render(request, 'security_officer/vehicle_gate_entry.html', {'ac_years':ac_years})
    
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')
    
############################################

@login_active_user_required
def fetch_job_data(request):
    if request.user.user_profile.user_designation.designation == "security_officer":
        if request.method == "GET":
            full_job_no = "JC-ShrAmb-" + request.user.user_profile.user_branch.code.upper() + "-" + request.GET.get("job_no","")
            cir_report = Customer_Information_Report.objects.filter(job_no = full_job_no).first()
            if not cir_report:
                return JsonResponse({"error_msg": "CIR not found"})
            
            else:
                if cir_report.claim_manager_rejection == "rejected":
                    return JsonResponse({"error_msg": "Job Card is rejected by Claim Manager"})
                
                else:

                    try:
                        entry = cir_report.vehicle_gate_entry
                    except Vehicle_Gate_Entry.DoesNotExist:
                        entry = "not found"
                    
                    if entry != "not found":
                        data = {
                            "full_job_no": full_job_no,
                            "vehicle_no": cir_report.vehicle_no if cir_report.vehicle_no else "",
                            "entry":"generated",
                        }
                        
                    else:
                        data = {
                            "full_job_no": full_job_no,
                            "vehicle_no": cir_report.vehicle_no if cir_report.vehicle_no else "",
                            "entry":"not generated",
                        }
                    
                    return JsonResponse({"data": data})

    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    

########################################################################################################################################

@login_active_user_required
def my_profile(request):
    if request.user.user_profile.user_designation.designation == "security_officer":
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
                
            return redirect('vehicle_gate_entry')

        else:
            form = MyProfileForm(initial={
                'user_name': user.first_name,
                'mobile_no': user_profile.mobile_no
            })

            return render(request, 'security_officer/security_officer_my_profile.html', {'mform':form})
        
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    

########################################################################################################################################

@login_active_user_required
def change_password(request):
    if request.user.user_profile.user_designation.designation == "security_officer":
            
        if request.method == "POST":    
            pwd_form = Manual_Password_Change_Form(user=request.user, data=request.POST)
            if pwd_form.is_valid():
                pwd_form.save()
                logout(request)
                messages.success(request, "Password changed, Login again with the new Password")
                return redirect('user_login')    
            
            else:
                messages.error(request, "Old Password is incorrect !!")
                return redirect("security_officer_change_password")

        else:
            pwd_form = Manual_Password_Change_Form(user=request.user)
            return render(request, 'security_officer/security_officer_change_password.html', {'pwd_form':pwd_form})
    

    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')   