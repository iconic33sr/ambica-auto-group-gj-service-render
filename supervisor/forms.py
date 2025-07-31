from django import forms 
from django.forms import ModelChoiceField, ModelMultipleChoiceField
from core.models import Customer_Information_Report, Claim_Category


class Complaint_Information_Report_Form(forms.ModelForm):

    claim_category = forms.MultipleChoiceField(
        label='Claim Category',
        choices=[],  # initially empty
        widget=forms.SelectMultiple(attrs={
            'name': "claim_category",
            'id': 'claim_category',
            'class': 'form-select',
            'required': True,
        })
    )

    complaint_1 = forms.CharField( required=True, widget=forms.Textarea(attrs={'id': 'complaint_1', 'class': 'form-control multi_line_ta complaint', 'name': 'complaint_1', 'placeholder': 'REMARK', 'maxlength': '50', 'required': True, 'rows': '', 'cols': ''}))

    complaint_2 = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'complaint_2', 'class': 'form-control multi_line_ta complaint', 'name': 'complaint_2', 'placeholder': 'REMARK', 'maxlength': '50', 'required': False, 'rows': '', 'cols': ''}))

    complaint_3 = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'complaint_3', 'class': 'form-control multi_line_ta complaint', 'name': 'complaint_3', 'placeholder': 'REMARK', 'maxlength': '50', 'required': False, 'rows': '', 'cols': ''}))

    complaint_4 = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'complaint_4', 'class': 'form-control multi_line_ta complaint', 'name': 'complaint_4', 'placeholder': 'REMARK', 'maxlength': '50', 'required': False, 'rows': '', 'cols': ''}))

    complaint_5 = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'complaint_5', 'class': 'form-control multi_line_ta complaint', 'name': 'complaint_5', 'placeholder': 'REMARK', 'maxlength': '50', 'required': False, 'rows': '', 'cols': ''}))

    complaint_6 = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'complaint_6', 'class': 'form-control multi_line_ta complaint', 'name': 'complaint_6', 'placeholder': 'REMARK', 'maxlength': '50', 'required': False, 'rows': '', 'cols': ''}))

    complaint_7 = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'complaint_7', 'class': 'form-control multi_line_ta complaint', 'name': 'complaint_7', 'placeholder': 'REMARK', 'maxlength': '50', 'required': False, 'rows': '', 'cols': ''}))


    class Meta:

        model = Customer_Information_Report

        fields = ['job_no', 'vehicle_no', 'kilometer', 'complaint_1', 'complaint_2', 'complaint_3', 'complaint_4', 'complaint_5', 'complaint_6', 'complaint_7']

        error_messages = {'job_no' : {'required' : '!'},
                          'vehicle_no' : {'required' : '!'},
                          'kilometer' : {'required' : '!'},
        }

        labels = {  
                    'job_no':'job no.',
                    'vehicle_no':'vehicle no.',
        }
        
        widgets = {
                   'job_no' : forms.NumberInput(attrs={'name':"job_no", 'id':"job_no", 'class':"form-control" , 'autocomplete':"off", 'required':"True", 'autofocus':"True"}),
                   'vehicle_no' : forms.TextInput(attrs={'name':"vehicle_no", 'id':"vehicle_no", 'class':"form-control" , 'maxlength':"15", 'placeholder':"GJ05SR1234", 'autocomplete':"off", 'required':"True"}),
                   'kilometer' : forms.NumberInput(attrs={'name':"kilometer", 'id':"kilometer", 'class':"form-control" , 'autocomplete':"off", 'required':"True"}),
        }

    def __init__(self, *args, **kwargs):
        super(Complaint_Information_Report_Form, self).__init__(*args, **kwargs)
        self.label_suffix = ''

        # ✅ Dynamically load choices here (safe, after DB is ready)
        self.fields['claim_category'].choices = [
            (obj.claim, obj.claim) for obj in Claim_Category.objects.all()
        ]