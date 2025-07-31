from django.contrib.auth.views import redirect_to_login
from functools import wraps

# To check for both if the user is active and logged in
def login_active_user_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user = request.user
        if user:
            if not user.is_authenticated or not user.is_active:
                return redirect_to_login(request.get_full_path())
            return view_func(request, *args, **kwargs)
        else:
            return redirect_to_login(request.get_full_path())
    return _wrapped_view
