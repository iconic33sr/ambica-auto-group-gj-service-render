from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.forms import PasswordChangeForm


class ManualAuthenticationForm(AuthenticationForm):

    username = forms.CharField(widget = forms.TextInput(attrs={'autocomplete':'off', 'id':'id_username', 'placeholder':'Enter your username', 'autofocus':'true', 'required': 'True'}), error_messages={'required':'!'})

    password = forms.CharField(widget = forms.PasswordInput(attrs={'autocomplete':'off', 'id':'id_password', 'placeholder':'••••••••', 'required': 'True'}), error_messages={'required':'!'})

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('label_suffix', '')
        super(ManualAuthenticationForm, self).__init__(*args, **kwargs)


class MyProfileForm(forms.Form):
    user_name = forms.CharField(max_length=150, label="First Name", widget=forms.TextInput(attrs={'id': 'user_name', 'class': 'form-control', 'name': 'user_name', 'maxlength': '150', 'required': 'True',}))
    mobile_no = forms.RegexField(regex=r'^\d+$', max_length=11, label="Mobile Number", error_messages={'invalid': 'Enter a valid mobile number (digits only).'}, widget=forms.TextInput(attrs={'inputmode': 'numeric', 'pattern': '[0-9]*', 'id': 'mobile_no', 'class': 'form-control', 'name': 'mobile_no', 'required': 'True',}))


class Manual_Password_Change_Form(PasswordChangeForm):
    old_password = forms.CharField(widget=forms.PasswordInput(attrs={'name':"old_password", 'id':"old_password", 'class':"form-control", 'autocomplete':"off", 'autofocus':'True', 'required': 'True'}), error_messages={'required' : '!'})
    new_password1 = forms.CharField(label='New Password', widget=forms.PasswordInput(attrs={'name':"new_password1", 'id':"new_password1", 'class':"form-control", 'autocomplete':"off", 'required': 'True' }), error_messages={'required' : '!'})
    new_password2 = forms.CharField(label='Confirm New Password', widget=forms.PasswordInput(attrs={'name':"new_password2", 'id':"new_password2", 'class':"form-control", 'autocomplete':"off", 'required': 'True' }), error_messages={'required' : '!'})


