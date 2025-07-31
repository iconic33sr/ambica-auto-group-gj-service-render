from django import forms
from core.models import Claim_Status

class Claim_Status_Form(forms.ModelForm):
    CLAIM_CHOICES = (
        ('pending', "PENDING"),    
        ('settled', "SETTLED"),   
        ('rejected', "REJECTED"),   
    )

    claim_status = forms.TypedChoiceField(choices=CLAIM_CHOICES, widget=forms.RadioSelect(attrs={'id':'claim_status', 'name':"claim_status"}), label="claim status", required=True, initial='pending',)
    crm_rejection_reason = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'crm_rejection_reason', 'name': 'crm_rejection_reason', 'class': 'form-control multi_line_ta input_field', 'maxlength': '1000', 'required': False, 'rows': '', 'cols': ''}))

    class Meta:

        model = Claim_Status

        fields = ['claim_no', 'claim_amount', 'claim_status', 'claim_date', 'submission_date', 'claim_settled_date', 'part_dispatch_image1', 'part_dispatch_image2', 'part_dispatch_image3', 'part_dispatch_image4', 'part_dispatch_image5']

        error_messages = {'claim_no' : {'required' : '!'}}
        
        widgets = {
                   'claim_no' : forms.TextInput(attrs={'name':"claim_no", 'id':"claim_no", 'class':"form-control" , 'autocomplete':"off", 'required':"True"}),
                   'claim_amount' : forms.TextInput(attrs={'name':"claim_amount", 'id':"claim_amount", 'class':"form-control comma_format" , 'autocomplete':"off", 'required':"True"}),
                   'claim_date': forms.DateInput(attrs={'name':"claim_date", 'id':"claim_date", 'class':"form-control custom-date", 'autocomplete':"off", 'type':"date", 'required':"True"}),
                   'submission_date': forms.DateInput(attrs={'name':"submission_date", 'id':"submission_date", 'class':"form-control custom-date", 'autocomplete':"off", 'type':"date"}),
                   'claim_settled_date': forms.DateInput(attrs={'name':"claim_settled_date", 'id':"claim_settled_date", 'class':"form-control custom-date", 'autocomplete':"off", 'type':"date"}),
        }

    def __init__(self, *args, **kwargs):
        super(Claim_Status_Form, self).__init__(*args, **kwargs)
        self.label_suffix = ''