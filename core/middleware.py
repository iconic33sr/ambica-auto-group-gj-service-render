from user_agents import parse
from django.shortcuts import redirect
from django.contrib import messages

# To detect the user device
class DeviceDetectionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        ua_string = request.META.get('HTTP_USER_AGENT', '')
        user_agent = parse(ua_string)
        if user_agent.is_mobile:
            request.device_type = 'mobile'
        elif user_agent.is_tablet:
            request.device_type = 'tablet'
        elif user_agent.is_pc:
            request.device_type = 'desktop'
        else:
            request.device_type = 'unknown'  # Could not detect
        return self.get_response(request)
    
    
# For auto logout after 8 hours of inactivity
class AutoLogoutMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip if user middleware hasn't attached `user` yet
        if hasattr(request, 'user') and request.user.is_authenticated:
            session_key_exists = request.session.session_key and request.session.exists(request.session.session_key)
            if not session_key_exists:
                request.session.flush()
                request.session['expired'] = True
                return redirect('login')  # Update with your login URL name

        return self.get_response(request)
