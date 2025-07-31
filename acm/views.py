from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.contrib import messages
from core.models import Customer_Information_Report, Claim_Status, Accounting_Year
from core.forms import MyProfileForm, Manual_Password_Change_Form
from django.http import JsonResponse
import base64
import uuid
from django.core.files.base import ContentFile
from django.utils import timezone
from core.decorators import login_active_user_required

########################################################################################################################################

def base64_to_image(base64_str, filename_prefix):
    """
    Converts base64 string to Django ContentFile for use in ImageField
    """
    format, imgstr = base64_str.split(';base64,')  # format ~= data:image/jpeg
    ext = format.split('/')[-1]
    file_name = f"{filename_prefix}_{uuid.uuid4()}.{ext}"
    return ContentFile(base64.b64decode(imgstr), name=file_name)

################################################################################

@login_active_user_required
def parts_dispatch_image(request):
    if request.user.user_profile.user_designation.designation == "acm":
        if request.method == "POST":
            data = request.POST

            selected_job_no = request.POST.get('job_no')

            if selected_job_no:
                if selected_job_no[0:2] == "JC":
 
                    cir_report = Customer_Information_Report.objects.filter(job_no = selected_job_no).first()
                    if cir_report:
                        if cir_report.branch.branch == request.user.user_profile.user_branch.branch:
                            try:
                                claim_status_report = cir_report.claim_status
                            except Claim_Status.DoesNotExist:
                                claim_status_report = None

                            if claim_status_report:
                                now = timezone.now()

                                if data.get('photo_0'):
                                    claim_status_report.part_dispatch_image1 = base64_to_image(data['photo_0'], 'part_dispatch_image1')
                                if data.get('photo_1'):
                                    claim_status_report.part_dispatch_image2 = base64_to_image(data['photo_1'], 'part_dispatch_image2')
                                if data.get('photo_2'):
                                    claim_status_report.part_dispatch_image3 = base64_to_image(data['photo_2'], 'part_dispatch_image3')
                                if data.get('photo_3'):
                                    claim_status_report.part_dispatch_image4 = base64_to_image(data['photo_3'], 'part_dispatch_image4')
                                if data.get('photo_4'):
                                    claim_status_report.part_dispatch_image5 = base64_to_image(data['photo_4'], 'part_dispatch_image5')

                                claim_status_report.acm_name = request.user.first_name + " " + request.user.last_name
                                claim_status_report.acm_id = request.user.username
                                claim_status_report.part_dispatch_image_date_time = now
                                claim_status_report.part_dispatch_image_date = now.date()
                                claim_status_report.part_dispatch_image_time = now.time()

                                claim_status_report.save()
                                messages.success(request, "Data saved successfully")    

                            else:
                                messages.error(request, "Claim does not generated")

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

            return redirect('parts_dispatch_image')        

        else:
            ac_years = Accounting_Year.objects.all().order_by('-ac_year')
            return render(request, 'acm/parts_dispatch_image.html', {'ac_years':ac_years})
    
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')
    
############################################

@login_active_user_required
def fetch_claim_status_data(request):
    if request.user.user_profile.user_designation.designation == "acm":
        if request.method == "GET":
            ac_year = Accounting_Year.objects.filter(ac_year = request.GET.get("ac_year","")).first()
            claim_status = Claim_Status.objects.filter(cir__cir_ac_year = ac_year ,claim_no = request.GET.get("claim_no","")).first()
        
            if not claim_status:
                return JsonResponse({"error_msg": "Claim No. not found !!"})
            if claim_status.claim_status == "rejected":
                return JsonResponse({"error_msg": "Claim No. is rejected !!"})
            else:
                image_capture = "pending"

                if claim_status.part_dispatch_image1:
                    image_capture = "captured"
                elif claim_status.part_dispatch_image2:
                    image_capture = "captured"
                elif claim_status.part_dispatch_image3:
                    image_capture = "captured"
                elif claim_status.part_dispatch_image4:
                    image_capture = "captured"
                elif claim_status.part_dispatch_image5:
                    image_capture = "captured"

                data = {
                    "chassis_no": claim_status.cir.chassis_no,
                    "full_job_no": claim_status.cir.job_no,
                    "vehicle_no": claim_status.cir.vehicle_no if claim_status.cir.vehicle_no else "",
                    "image_capture":image_capture,
                }
            
                return JsonResponse({"data": data})

    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    

########################################################################################################################################

@login_active_user_required
def my_profile(request):
    if request.user.user_profile.user_designation.designation == "acm":
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
                
            return redirect('parts_dispatch_image')

        else:
            form = MyProfileForm(initial={
                'user_name': user.first_name,
                'mobile_no': user_profile.mobile_no
            })

            return render(request, 'acm/acm_my_profile.html', {'mform':form})
        
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    

########################################################################################################################################

@login_active_user_required
def change_password(request):
    if request.user.user_profile.user_designation.designation == "acm":
            
        if request.method == "POST":    
            pwd_form = Manual_Password_Change_Form(user=request.user, data=request.POST)
            if pwd_form.is_valid():
                pwd_form.save()
                logout(request)
                messages.success(request, "Password changed, Login again with the new Password")
                return redirect('user_login')    
            
            else:
                messages.error(request, "Old Password is incorrect !!")
                return redirect("acm_change_password")

        else:
            pwd_form = Manual_Password_Change_Form(user=request.user)
            return render(request, 'acm/acm_change_password.html', {'pwd_form':pwd_form})
    

    else:
        logout(request)
        messages.error(request, "Unauthorised Access")
        return redirect('user_login')   