from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib import messages
from core.forms import MyProfileForm, Manual_Password_Change_Form
from core.decorators import login_active_user_required

from django.contrib.sessions.models import Session
from django.contrib.auth.models import User
from core.models import User_Profile
from django.shortcuts import render
from collections import defaultdict
from django.contrib.sessions.models import Session
from datetime import datetime, timedelta
from django.utils import timezone 


@login_active_user_required
def developer_dashboard(request):
    if request.user.user_profile.user_designation.designation == "developer":
        
        return render(request, 'developer/developer_dashboard.html')
    
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')
    

########################################################################################
@login_active_user_required
def user_dashboard(request):
    # Only allow developer designation to access
    if request.user.user_profile.user_designation.designation == "developer":

        now_time = datetime.now()  # naive, localtime (Asia/Kolkata)
        one_hour_ago = now_time - timedelta(hours=1)

        # Map user ID to active sessions
        sessions = Session.objects.filter(expire_date__gte=now_time)
        user_session_map = defaultdict(list)
        active_usernames = set()

        for session in sessions:
            data = session.get_decoded()
            user_id = data.get('_auth_user_id')
            last_activity_str = data.get('last_activity')

            if user_id:
                user_session_map[int(user_id)].append(session)

            if user_id and last_activity_str:
                try:
                    last_activity = datetime.fromisoformat(last_activity_str)
                    # For USE_TZ = False, this is always naive, no tzinfo needed
                    if last_activity >= one_hour_ago:
                        user = User.objects.filter(id=user_id).first()
                        if user:
                            active_usernames.add(user.username)
                except Exception as e:
                    continue

        users = User.objects.order_by('user_profile__user_branch__branch', 'user_profile__user_designation__designation', 'first_name', 'last_name')
        user_data = []

        for user in users:
            try:
                profile = user.user_profile
            except User_Profile.DoesNotExist:
                profile = None

            user_data.append({
                'name': f"{user.first_name} {user.last_name}".strip() or "N/A",
                'user_id': user.username or "N/A",
                'designation': (profile.user_designation.designation if profile and profile.user_designation else 'N/A').title(),
                'branch': (profile.user_branch.branch if profile and profile.user_branch else 'N/A').title(),
                'login_status': 'online' if user.id in user_session_map else 'offline',
                'active_status': 'active' if user.username in active_usernames else 'idle',
                'device_count': len(user_session_map.get(user.id, [])),
                'is_active': 'active' if user.is_active else 'deactive',
            })

        return render(request, 'developer/user_dashboard.html', {'user_data': user_data})

    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')


########################################################################################################################################

@login_active_user_required
def my_profile(request):
    if request.user.user_profile.user_designation.designation == "developer":
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

            return redirect('dev_my_profile')
    
            
        else:
            # Initial data population
            form = MyProfileForm(initial={
                'user_name': user.first_name,
                'mobile_no': user_profile.mobile_no
            })

            return render(request, 'developer/dev_my_profile.html', {'mform':form})
        
    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    


########################################################################################################################################

@login_active_user_required
def change_password(request):
    if request.user.user_profile.user_designation.designation == "developer":
            
        if request.method == "POST":    
            pwd_form = Manual_Password_Change_Form(user=request.user, data=request.POST)
            if pwd_form.is_valid():
                pwd_form.save()
                logout(request)
                messages.success(request, "Password changed, Login again with the new Password")
                return redirect('user_login')    

            else:
                messages.error(request, "Old Password is incorrect !!")
                return redirect('dev_change_password')    

        else:
            pwd_form = Manual_Password_Change_Form(user=request.user)
            return render(request, 'developer/dev_change_pwd.html', {'pwd_form':pwd_form})
    

    else:
        logout(request)
        messages.error(request, "Unauthorised Access !!")
        return redirect('user_login')    
