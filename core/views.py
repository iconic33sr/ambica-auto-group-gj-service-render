from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import ManualAuthenticationForm
import requests
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import json
import logging
from core.decorators import login_active_user_required
from django.conf import settings


############################################################################

def install_app(request):
    return render(request, 'core/install_app.html')

############################################################################

def user_login(request):

    if request.user.is_authenticated:
            if request.user.user_profile.user_designation.designation == "supervisor":
                return redirect('supervisor_cir_form')
            elif request.user.user_profile.user_designation.designation == "advisor":
                return redirect('advisor_cir_list')
            elif request.user.user_profile.user_designation.designation == "workshop_manager":
                return redirect('cir_list')
            elif request.user.user_profile.user_designation.designation == "claim_manager":
                return redirect('claim_manager_cir_list')
            elif request.user.user_profile.user_designation.designation == "acm":
                return redirect('parts_dispatch_image')
            elif request.user.user_profile.user_designation.designation == "security_officer":
                return redirect('vehicle_gate_entry')
            elif request.user.user_profile.user_designation.designation == "back_office_operator":
                return redirect('backo_scrap_list')
            elif request.user.user_profile.user_designation.designation == "developer":
                return redirect('developer_dashboard')
            else:
                return redirect(f'{request.user.user_profile.user_designation.designation}_dashboard')
        
    else:

        if request.method == "POST":
            login_form = ManualAuthenticationForm(request = request, data = request.POST)

            if login_form.is_valid():
                uname = login_form.cleaned_data['username']
                upass = login_form.cleaned_data['password']

                try:

                    user_auth = authenticate(request=request, username=uname, password=upass)

                    if user_auth is not None:
                        logger = logging.getLogger(__name__)  

                        designation = user_auth.user_profile.user_designation.designation

                        device_type = getattr(request, 'device_type', 'unknown')

                                    #  UNCOMMENT THIS
                        # If device is not clearly mobile or desktop, block login
                        if device_type not in ['mobile', 'desktop']:
                            logger.warning(f"Login blocked for {uname} from suspicious device type: {device_type}, UA: {request.META.get('HTTP_USER_AGENT', '')}")
                            messages.error(request, "Login from this device is not allowed. Please use a supported device.")
                            return redirect('user_login')
                        
                        # Designation-based restriction
                        if designation in ["supervisor", "advisor", "acm", "security_officer"] and device_type != "mobile":
                            messages.error(request, "Unauthorized Device!")
                            return redirect('user_login')
                        elif designation in ["works_manager", "claim_manager", "back_office_operator"] and device_type != "desktop":
                            messages.error(request, "Unauthorized Device!")
                            return redirect('user_login')

                        login(request, user_auth)

                        messages.success(request, "WELCOME, "+request.user.first_name.upper()+ " " + request.user.last_name.upper())

                        if designation == "supervisor":
                            return redirect('supervisor_cir_form')
                            
                        elif designation == "advisor":
                            return redirect('advisor_cir_list')
                            
                        elif designation == "workshop_manager":
                            return redirect('cir_list')
                            
                        elif designation == "claim_manager":
                            return redirect('claim_manager_cir_list')
                            
                        elif designation == "acm":
                            return redirect('parts_dispatch_image')
                        
                        elif designation == "security_officer":
                            return redirect('vehicle_gate_entry')
                        
                        elif designation == "back_office_operator":
                            return redirect('backo_scrap_list')
                        
                        elif designation == "developer":
                            return redirect('developer_dashboard')
                        
                        else:
                            pass
                            
                except:

                    messages.error(request, "An error occured while logging in!")
                    return redirect('user_login')
                            
                
            else:
                if request.POST['username'] == "" and request.POST['password'] == "":
                    messages.error(request, "Please enter both Username and Password!")
                elif request.POST['username'] == "":
                    messages.error(request, "Please enter your Username!")
                elif request.POST['password'] == "":
                    messages.error(request, "Please enter your Password!")
                else:
                    pass

        else:

            login_form = ManualAuthenticationForm()

        return render(request, 'core/user_login.html', {'login_form':login_form})
######################################################################################################################################################################################


#### LOGOUT FUNCTION
@login_required(login_url='user_login')
def user_logout(request):
    if request.method == "POST":
        logout(request)
        messages.success(request, "Logged Out")
        return redirect('user_login')
    
######################################################################################################################################################################################

#### PING FUNCTION
@login_active_user_required
def ping(request):
    return HttpResponse(status=200)


######################################################################################################################################################################################

#### FOR FETCHING LOCATION
@csrf_exempt
def reverse_geocode(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests allowed'}, status=405)

    try:
        data = json.loads(request.body)
        lat = data.get('lat')
        lng = data.get('lng')
        if lat is None or lng is None:
            return JsonResponse({'error': 'Missing coordinates'}, status=400)

        api_key = settings.GOOGLE_GEOCODE_API
        url = f'https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={api_key}'

        response = requests.get(url)
        response.raise_for_status()

        return JsonResponse(response.json(), safe=False)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


