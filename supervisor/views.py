from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
import base64
import uuid
from datetime import date
from django.core.files.base import ContentFile
from django.contrib.auth.models import User
from core.models import User_Profile, Customer_Information_Report, Designation, Accounting_Year
from core.forms import MyProfileForm, Manual_Password_Change_Form
from .forms import Complaint_Information_Report_Form
from django.contrib.auth import logout
from django.http import JsonResponse
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from core.decorators import login_active_user_required
from django.core.files.storage import storages

########################################################################################################################################

def base64_to_image(base64_str, filename_prefix):
    format, imgstr = base64_str.split(';base64,')
    ext = format.split('/')[-1]
    return ContentFile(base64.b64decode(imgstr), name=f"{uuid.uuid4()}.{ext}")

########################################################################################################################################

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

################################################################

@login_active_user_required
def supervisor_cir_form(request):
    if request.user.user_profile.user_designation.designation == "supervisor":
        if request.method == "POST":
            cform = Complaint_Information_Report_Form(request.POST)
            data = request.POST

            #  Finding Accounting Year
            current_date = date.today()
            current_year = current_date.year
            april_first = date(current_year, 4, 1)

            if current_date < april_first:
                full_accounting_year = f"{str(current_year - 1)}-{str(current_year)[-2:]}"
                accounting_year = f"{str(current_year - 1)[-2:]}{str(current_year)[-2:]}"
            else:
                full_accounting_year = f"{str(current_year)}-{str(current_year + 1)[-2:]}"
                accounting_year = f"{str(current_year)[-2:]}{str(current_year + 1)[-2:]}"

            if cform.is_valid():
                if Accounting_Year.objects.filter(ac_year = full_accounting_year):
                    pass
                else:
                    Accounting_Year.objects.create(ac_year = full_accounting_year)
                    
                cir_ac_year = Accounting_Year.objects.filter(ac_year = full_accounting_year).first()
                short_job_no = str(cform.cleaned_data['job_no'])
                full_job_no = "JC-ShrAmb-" + request.user.user_profile.user_branch.code.upper() + "-" + accounting_year + "-" + str(cform.cleaned_data['job_no'])

                report = Customer_Information_Report(
                    cir_ac_year = cir_ac_year,
                    short_job_no = short_job_no,
                    job_no=full_job_no,
                    vehicle_no=cform.cleaned_data['vehicle_no'].lower(),
                    kilometer=cform.cleaned_data['kilometer'],
                    claim_category=data.getlist('claim_category'),
                    complaint_1=(cform.cleaned_data.get('complaint_1') or '').lower(),
                    complaint_2=(cform.cleaned_data.get('complaint_2') or '').lower(),
                    complaint_3=(cform.cleaned_data.get('complaint_3') or '').lower(),
                    complaint_4=(cform.cleaned_data.get('complaint_4') or '').lower(),
                    complaint_5=(cform.cleaned_data.get('complaint_5') or '').lower(),
                    complaint_6=(cform.cleaned_data.get('complaint_6') or '').lower(),
                    complaint_7=(cform.cleaned_data.get('complaint_7') or '').lower(),
                    supervisor_name=request.user.first_name+ " " + request.user.last_name,
                    supervisor_id=request.user.username,
                    selected_advisor=request.user.user_profile.alloted_advisor if request.user.user_profile.alloted_advisor else data.get('selected_advisor', '').lower(),
                    branch=request.user.user_profile.user_branch
                )

                # Convert and assign images from base64
                if data.get('photo_0'):
                    # report.vehicle_front_image = base64_to_image(data['photo_0'], 'vehicle_front_image')
                    image_file = base64_to_image(data['photo_0'], 'vehicle_front_image')
                    report.vehicle_front_image.save(image_file.name, image_file, save=False)
                if data.get('photo_1'):
                    image_file = base64_to_image(data['photo_1'], 'vehicle_number_plate')
                    report.vehicle_with_number_plate.save(image_file.name, image_file, save=False)
                if data.get('photo_2'):
                    image_file = base64_to_image(data['photo_2'], 'chasis')
                    report.chasis.save(image_file.name, image_file, save=False)
                if data.get('photo_3'):
                    image_file = base64_to_image(data['photo_3'], 'odometer')
                    report.odometer.save(image_file.name, image_file, save=False)
                if data.get('photo_4'):
                    image_file = base64_to_image(data['photo_4'], 'complaint_1')
                    report.complaint_1_image.save(image_file.name, image_file, save=False)
                if data.get('photo_5'):
                    image_file = base64_to_image(data['photo_5'], 'complaint_2')
                    report.complaint_2_image.save(image_file.name, image_file, save=False)
                if data.get('photo_6'):
                    image_file = base64_to_image(data['photo_6'], 'complaint_3')
                    report.complaint_3_image.save(image_file.name, image_file, save=False)
                if data.get('photo_7'):
                    image_file = base64_to_image(data['photo_7'], 'complaint_4')
                    report.complaint_4_image.save(image_file.name, image_file, save=False)
                if data.get('photo_8'):
                    image_file = base64_to_image(data['photo_8'], 'complaint_5')
                    report.complaint_5_image.save(image_file.name, image_file, save=False)
                if data.get('photo_9'):
                    image_file = base64_to_image(data['photo_9'], 'complaint_6')
                    report.complaint_6_image.save(image_file.name, image_file, save=False)
                if data.get('photo_10'):
                    image_file = base64_to_image(data['photo_10'], 'complaint_7')
                    report.complaint_7_image.save(image_file.name, image_file, save=False)

                report.save()

                cir_data = {
                "cir_uid": str(report.cir_uid),
                "vehicle_no": report.vehicle_no,
                "job_no": report.job_no,
                "supervisor_name": report.supervisor_name,
                "cir_date_time": str(report.cir_date_time),
                "sar_status": report.sar_status,
                "advisor_preview": "pending",
                "report_type":"new",
                }
                notify_advisor_new_cir(report.selected_advisor, cir_data)

                messages.success(request, "CIR submitted successfully")

            else:
                messages.error(request, "Error occured !!")

        complaint_information_report_form = Complaint_Information_Report_Form()
        advisor_list = User_Profile.objects.filter(user_designation=Designation.objects.get(designation='advisor'), user_branch=request.user.user_profile.user_branch).values('user__first_name','user__last_name','user__username')
        alloted_advisor = request.user.user_profile.alloted_advisor
        context = {'cform':complaint_information_report_form, 'advisor_list':advisor_list, 'alloted_advisor':alloted_advisor}        
        return render(request, 'supervisor/supervisor_cir_form.html', context)
    
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')
    

########################################################################################################################################

@login_active_user_required
def check_job_card_no(request):
    if request.user.user_profile.user_designation.designation == "supervisor":
        if request.method == "GET":

            alloted_advisor = request.user.user_profile.alloted_advisor

            if alloted_advisor:
                alloted_advisor = User.objects.filter(username = request.user.user_profile.alloted_advisor).first()

            if alloted_advisor and alloted_advisor.is_active:

                current_date = date.today()
                current_year = current_date.year
                april_first = date(current_year, 4, 1)

                if current_date < april_first:
                    accounting_year = f"{str(current_year - 1)[-2:]}{str(current_year)[-2:]}"
                else:
                    accounting_year = f"{str(current_year)[-2:]}{str(current_year + 1)[-2:]}"

                full_job_no = "JC-ShrAmb-" + request.user.user_profile.user_branch.code.upper() + "-" + accounting_year + "-" + str(request.GET.get("job_no",""))

                job_card_no_exists = Customer_Information_Report.objects.filter(job_no=full_job_no).exists()

                if job_card_no_exists:
                    return JsonResponse({"job_no_exists":"yes"})
                else:
                    return JsonResponse({"job_no_exists":"no"})
                
            else:
                return JsonResponse({"error_msg":"Alloted Advisor does not exists!!"})
            
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')
        

########################################################################################################################################

@login_active_user_required
def my_profile(request):
    if request.user.user_profile.user_designation.designation == "supervisor":
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
                
            return redirect('supervisor_my_profile')

        else:
            form = MyProfileForm(initial={
                'user_name': user.first_name,
                'mobile_no': user_profile.mobile_no
            })

            return render(request, 'supervisor/supervisor_my_profile.html', {'mform':form})
        
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    


########################################################################################################################################

@login_active_user_required
def change_password(request):
    if request.user.user_profile.user_designation.designation == "supervisor":
            
        if request.method == "POST":    
            pwd_form = Manual_Password_Change_Form(user=request.user, data=request.POST)
            if pwd_form.is_valid():
                pwd_form.save()
                logout(request)
                messages.success(request, "Password changed, Login again with the new Password")
                return redirect('user_login')    
            
            else:
                messages.error(request, "Old Password is incorrect !!")
                return redirect('supervisor_change_password')

        else:
            pwd_form = Manual_Password_Change_Form(user=request.user)
            return render(request, 'supervisor/supervisor_change_pwd.html', {'pwd_form':pwd_form})
    

    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    
