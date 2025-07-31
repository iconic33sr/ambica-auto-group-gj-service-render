from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib import messages
from core.models import Customer_Information_Report, Accounting_Year, Claim_Status, Scrap_List, Packing_Slip, Scrap_List_Verification
from core.forms import MyProfileForm, Manual_Password_Change_Form
from core.utils import compress_pdf_file, compress_pptx_images
from back_office_operator.forms import Scrap_List_Form, Scrap_List_Verification_Form, Packing_Slip_Form, Packing_Slip_Pod_Form
from datetime import datetime
from core.decorators import login_active_user_required
from django.http import JsonResponse
import json
import os

########################################################################################################################################

@login_active_user_required
def scrap_list_entry(request):
    if request.user.user_profile.user_designation.designation == "back_office_operator":
        if request.method == 'POST':
            sform = Scrap_List_Form(request.POST, request.FILES)
            if sform.is_valid():
                # Here first we will check if the Scrap_list instance is present with the same doc no. if it is then delete it and store the new one row with the doc no.
                Scrap_List.objects.filter(doc_no = sform.cleaned_data['doc_no'].lower()).delete()
                
                prowacs_json = request.POST.get('prowacs_json', '')
                if prowacs_json:
                    prowacs_list = json.loads(prowacs_json) 
                    scrap_list_pdf_file = sform.cleaned_data["scrap_list_pdf"]

                    if scrap_list_pdf_file and scrap_list_pdf_file.name.endswith(".pdf"):
                        compressed_pdf_file = compress_pdf_file(scrap_list_pdf_file)

                        scrap_list_report = sform.save(commit=False)
                        scrap_list_report.doc_no = sform.cleaned_data["doc_no"].lower()
                        scrap_list_report.plant = sform.cleaned_data["plant"].lower()
                        scrap_list_report.scrap_list_pdf = compressed_pdf_file
                        scrap_list_report.back_office_operator_name = request.user.first_name+ " " + request.user.last_name
                        scrap_list_report.back_office_operator_id = request.user.username
                        scrap_list_report.scrap_list_date_time = datetime.now()
                        scrap_list_report.save()

                        claim_objs = Claim_Status.objects.filter(pk__in=prowacs_list)
                        if claim_objs:
                            scrap_list_report.claim_status.set(claim_objs)

                        messages.success(request, "Data Saved Successfully")
                        return redirect('backo_scrap_list')
    
                    else:
                        messages.error(request, "Attach a valid PDF File !!")
                        return redirect('backo_scrap_list')

                else:
                    messages.error(request, "Prowac Details are missing !!")
                    return redirect('backo_scrap_list')


            else:
                messages.error(request, "Invalid Data !!")
                return redirect('backo_scrap_list')            

        else:
            sform = Scrap_List_Form()
            return render(request, 'back_office_operator/scrap_list_entry.html', {'sform':sform})
        
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    
    
    
########################################################################################################################################

@login_active_user_required
def check_prowac_exists(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            prowacs = data.get("prowacs", [])

            results = []

            exists_ids = []

            for item in prowacs:
                prowac_no = item.get("prowac_no").lstrip('0')
                prowac_year = item.get("prowac_year")

                prowac_full_year = f'{prowac_year}-{str(int(prowac_year)+1)[2:]}'

                try:
                    accounting_year = Accounting_Year.objects.get(ac_year=prowac_full_year)
                except Accounting_Year.DoesNotExist:
                    results.append({
                        "prowac_no": item.get("prowac_no"),
                        "prowac_year": prowac_year,
                        "exists": False
                    })
                    continue

                exists = Customer_Information_Report.objects.filter(claim_status__claim_no=prowac_no, claim_status__claim_status__in=['pending','settled'], cir_ac_year=accounting_year).first()

                if not exists:
                    results.append({
                        "prowac_no": item.get("prowac_no"),
                        "prowac_year": item.get("prowac_year"),
                        "exists": False
                    })

                else:
                    if hasattr(exists, 'claim_status'):
                        exists_ids.append(exists.claim_status.pk)

            return JsonResponse({"status": "success", "result": results, "exists_ids": exists_ids})

        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)})

    return JsonResponse({"status": "error", "message": "Invalid request"})


########################################################################################################################################

@login_active_user_required
def scrap_list_verification(request):
    if request.user.user_profile.user_designation.designation == "back_office_operator":
        if request.method == 'POST':
            selected_doc_nos = json.loads(request.POST.get("doc_nos_json", "[]"))

            if request.POST['slv_no'] == "":
                sform = Scrap_List_Verification_Form(request.POST, request.FILES)
                if sform.is_valid():

                    ppt_file = sform.cleaned_data["scrap_verification_ppt_file"]
                    if ppt_file and selected_doc_nos:
                            
                        ext = os.path.splitext(ppt_file.name)[1].lower()
                        if ext in ['.ppt', '.pptx']:
                            # Try compressing pptx
                            compressed_ppt = compress_pptx_images(ppt_file)

                            # Use compressed file if available, else fallback
                            final_ppt = compressed_ppt if compressed_ppt else ppt_file

                            scrap_verification_report = sform.save(commit=False)
                            scrap_verification_report.scrap_verification_ppt_file = final_ppt
                            scrap_verification_report.back_office_operator_name = request.user.first_name+ " " + request.user.last_name
                            scrap_verification_report.back_office_operator_id = request.user.username
                            scrap_verification_report.scrap_verification_ppt_date_time = datetime.now()
                            scrap_verification_report.save()

                            for doc_no in selected_doc_nos:
                                try:
                                    scrap = Scrap_List.objects.get(doc_no=doc_no)
                                    scrap.list_verification_status = 'scrapped'
                                    scrap.linked_scrap_list_verification=scrap_verification_report
                                    scrap.save()
                                except Scrap_List.DoesNotExist:
                                    continue
                            
                            messages.success(request, f"Data Saved Successfully. SLV No. generated is {scrap_verification_report.id}")
                            return redirect('backo_scrap_list_verification')
        
                        else:
                            messages.error(request, "Only .ppt or .pptx files are allowed.")
                            return redirect('backo_scrap_list_verification')

                    else:
                        messages.error(request, "Missing file or selected scrap list.")
                        return redirect('backo_scrap_list_verification')
                                     

                else:
                    messages.error(request, "Invalid Data !!")
                    return redirect('backo_scrap_list_verification')    

            else:
                scrap_verification_report = Scrap_List_Verification.objects.filter(id=request.POST['slv_no']).first()

                if scrap_verification_report:
                    # Detach previously linked scrap_lists
                    old_scraps = Scrap_List.objects.filter(linked_scrap_list_verification=scrap_verification_report)

                    if old_scraps:

                        for scrap in old_scraps:
                            scrap.linked_scrap_list_verification = None
                            scrap.list_verification_status = "pending"

                        Scrap_List.objects.bulk_update(old_scraps, ['linked_scrap_list_verification', 'list_verification_status'])

                    # Attach newly selected scrap_lists
                    if selected_doc_nos:
                        for doc_no in selected_doc_nos:
                            try:
                                scrap = Scrap_List.objects.get(doc_no=doc_no)
                                scrap.linked_scrap_list_verification = scrap_verification_report
                                scrap.list_verification_status = "scrapped"
                                scrap.save()
                            except Scrap_List.DoesNotExist:
                                continue

                        messages.success(request, "Scrap List reassigned successfully.")
                    else:
                        messages.error(request, "No scrap list selected.")
                        
                    return redirect('backo_scrap_list_verification')

                else:
                    messages.error(request, "Invalid Data !!")
                    return redirect('backo_scrap_list_verification')                            

        else:
            sform = Scrap_List_Verification_Form()
            return render(request, 'back_office_operator/scrap_list_verification.html', {'sform':sform})
        
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    
    
############################################################################
@login_active_user_required
def get_pending_scrap_doc_nos(request):
    if request.user.user_profile.user_designation.designation == "back_office_operator" and request.method == 'GET':
        if request.GET.get('file_name',''):

            file_name = request.GET.get('file_name', '').strip().replace(" ", "_")
            file_name_exists = Scrap_List_Verification.objects.filter(scrap_verification_ppt_file__iendswith=file_name).exists()

            if file_name_exists:
                return JsonResponse({'status': 'error', 'error_msg': "PPT File with this file name already exists. Please use SLV No. to make updation for this file."})

            else:    
                data = []
                pending_docs = Scrap_List.objects.filter(list_verification_status='pending').values_list('doc_no', flat=True)
                if pending_docs:
                    data = list(pending_docs)
                return JsonResponse({'status': 'success', 'doc_nos': data})
        
        else:
            return JsonResponse({'status': 'error', 'error_msg': "Error !!"})
    
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    
    
############################################################################
@login_active_user_required
def check_slv_no_exist(request):
    if request.user.user_profile.user_designation.designation == "back_office_operator":
        if request.method == "GET":

            try:
                if request.GET.get('slv_no'):
                    slv_no_exists = Scrap_List_Verification.objects.filter(id=request.GET.get('slv_no')).first()
                else:
                    return JsonResponse({"error_msg":"Error in fetching SLV No. data !!"})
                

                if slv_no_exists:
                    
                    attached_docs_list = []
                    attached_docs = slv_no_exists.linked_scrap_lists.values_list('doc_no', flat=True)
                    if attached_docs:
                        attached_docs_list = list(attached_docs)

                    pending_docs_list = []
                    pending_docs = Scrap_List.objects.filter(list_verification_status='pending').values_list('doc_no', flat=True)
                    if pending_docs:
                        pending_docs_list = list(pending_docs)

                    return JsonResponse({"slv_no_exist":"yes", "pending_docs_list": pending_docs_list, "attached_docs_list":attached_docs_list})
                else:
                    return JsonResponse({"slv_no_exist":"no"})
                
            except:
                return JsonResponse({"error_msg":"Error in fetching SLV No. data !!"})
                
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')




########################################################################################################################################

@login_active_user_required
def packing_slip_entry(request):
    if request.user.user_profile.user_designation.designation == "back_office_operator":
        if request.method == 'POST':
            pform = Packing_Slip_Form(request.POST, request.FILES)
            if pform.is_valid():
                # Here first we will check if the Packing_Slip instance is present with the same packing slip no. if it is then delete it and store the new one row with the packing slip no.
                Packing_Slip.objects.filter(packing_slip_no = pform.cleaned_data['packing_slip_no'].lower()).delete()
                
                prowacs_json = request.POST.get('prowacs_json', '')
                if prowacs_json:
                    prowacs_list = json.loads(prowacs_json) 
                    packing_slip_pdf_file = pform.cleaned_data["delivery_challan_pdf"]

                    if packing_slip_pdf_file and packing_slip_pdf_file.name.endswith(".pdf"):
                        compressed_pdf_file = compress_pdf_file(packing_slip_pdf_file)

                        packing_slip_report = pform.save(commit=False)
                        packing_slip_report.packing_slip_no = pform.cleaned_data["packing_slip_no"].lower()
                        packing_slip_report.place_of_supply = pform.cleaned_data["place_of_supply"].lower()
                        packing_slip_report.transport_name = pform.cleaned_data["transport_name"].lower()
                        packing_slip_report.docket_no = pform.cleaned_data["docket_no"].lower()
                        packing_slip_report.delivery_challan_pdf = compressed_pdf_file
                        packing_slip_report.back_office_operator_name = request.user.first_name+ " " + request.user.last_name
                        packing_slip_report.back_office_operator_id = request.user.username
                        packing_slip_report.packing_slip_date_time = datetime.now()
                        packing_slip_report.save()

                        claim_objs = Claim_Status.objects.filter(pk__in=prowacs_list)
                        if claim_objs:
                            packing_slip_report.ps_claim_status.set(claim_objs)

                        messages.success(request, "Data Saved Successfully")
                        return redirect('backo_packing_slip')
    
                    else:
                        messages.error(request, "Attach a valid PDF File")
                        return redirect('backo_packing_slip')

                else:
                    messages.error(request, "Prowac Details are missing")
                    return redirect('backo_packing_slip')


            else:
                messages.error(request, "Invalid Data !!")
                return redirect('backo_packing_slip')            

        else:
            pform = Packing_Slip_Form()
            return render(request, 'back_office_operator/packing_slip_entry.html', {'pform':pform})
        
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    
    

########################################################################################################################################

@login_active_user_required
def packing_slip_pod_entry(request):
    if request.user.user_profile.user_designation.designation == "back_office_operator":
        if request.method == 'POST':
            pform = Packing_Slip_Pod_Form(request.POST, request.FILES)
            if pform.is_valid():
                
                pod_pdf_file = pform.cleaned_data["pod_pdf"]

                if pod_pdf_file and pod_pdf_file.name.endswith(".pdf"):
                    compressed_pdf_file = compress_pdf_file(pod_pdf_file)

                    packing_slip_pod_report = Packing_Slip.objects.filter(docket_no = request.POST['docket_no'].lower()).first()

                    packing_slip_pod_report.received_date = pform.cleaned_data["received_date"]
                    packing_slip_pod_report.pod_pdf = compressed_pdf_file
                    packing_slip_pod_report.save()

                    messages.success(request, "Data Saved Successfully")
                    return redirect('backo_packing_slip_pod')

                else:
                    messages.error(request, "Attach a valid PDF File")
                    return redirect('backo_packing_slip_pod')

            else:
                messages.error(request, "Invalid Data")
                return redirect('backo_packing_slip_pod')            

        else:
            pform = Packing_Slip_Pod_Form()
            return render(request, 'back_office_operator/packing_slip_pod_entry.html', {'pform':pform})
        
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    


########################################################################################################################################

@login_active_user_required
def check_docket_no_exist(request):
    if request.user.user_profile.user_designation.designation == "back_office_operator":
        if request.method == "GET":

            try:
                if request.GET.get('docket_no'):
                    docket_no_exists = Packing_Slip.objects.filter(docket_no=request.GET.get('docket_no').lower()).first()
                else:
                    return JsonResponse({"error_msg":"Error in fetching docket no data !!"})
                

                if docket_no_exists:
                    if docket_no_exists.received_date != "" and docket_no_exists.pod_pdf != "":
                        return JsonResponse({"docket_no_exist":"yes", "already_entry_exist":"yes", "packing_slip_no":docket_no_exists.packing_slip_no})
                    else:
                        return JsonResponse({"docket_no_exist":"yes", "already_entry_exist":"no", "packing_slip_no":docket_no_exists.packing_slip_no})
                else:
                    return JsonResponse({"docket_no_exist":"no"})
                
            except:
                return JsonResponse({"error_msg":"Error in fetching docket no data !!"})
                
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')


########################################################################################################################################

@login_active_user_required
def my_profile(request):
    if request.user.user_profile.user_designation.designation == "back_office_operator":
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
                
            return redirect('backo_my_profile')


        else:
            # Initial data population
            form = MyProfileForm(initial={
                'user_name': user.first_name,
                'mobile_no': user_profile.mobile_no
            })

            return render(request, 'back_office_operator/backo_my_profile.html', {'mform':form})
        
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    


########################################################################################################################################

@login_active_user_required
def change_password(request):
    if request.user.user_profile.user_designation.designation == "back_office_operator":
            
        if request.method == "POST":    
            pwd_form = Manual_Password_Change_Form(user=request.user, data=request.POST)
            if pwd_form.is_valid():
                pwd_form.save()
                logout(request)
                messages.success(request, "Password changed, Login again with the new Password")
                return redirect('user_login')    
            
            else:
                messages.error(request, "Old Password is incorrect !!")
                return redirect('backo_change_password')

        else:
            pwd_form = Manual_Password_Change_Form(user=request.user)
            return render(request, 'back_office_operator/backo_change_pwd.html', {'pwd_form':pwd_form})
    

    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    

