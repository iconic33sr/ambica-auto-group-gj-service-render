from django import forms
from core.models import Scrap_List, Scrap_List_Verification, Packing_Slip

class Scrap_List_Form(forms.ModelForm):

    scrap_list_pdf = forms.FileField(required=True, widget=forms.ClearableFileInput(attrs={'id': 'scrap_file', 'name':'scrap_list_pdf', 'class': 'form-control', 'accept': 'application/pdf','autocomplete': 'off'}))

    class Meta:

        model = Scrap_List

        fields = ['doc_no', 'plant', 'total_prowacs_no', 'req_sub_date', 'list_gen_date', 'total_parts', 'scrap_list_pdf']

        error_messages = {'doc_no' : {'required' : '!'},
                          'plant' : {'required' : '!'},
                          'total_prowacs_no' : {'required' : '!'},
                          'req_sub_date' : {'required' : '!'},
                          'list_gen_date' : {'required' : '!'},
                          'total_parts' : {'required' : '!'},
                          'scrap_list_pdf' : {'required' : '!'},}
        
        widgets = {
                    'doc_no' : forms.TextInput(attrs={'name':"doc_no", 'id':"doc_no", 'class':"form-control" , 'autocomplete':"off", 'required':"True"}),
                    'plant' : forms.TextInput(attrs={'name':"plant", 'id':"plant", 'class':"form-control" , 'autocomplete':"off", 'required':"True"}),
                    'total_prowacs_no': forms.NumberInput(attrs={'name':"total_prowacs_no", 'id':"total_prowacs", 'class':"form-control", 'autocomplete':"off", 'required':"True"}),
                    'req_sub_date': forms.DateInput(attrs={'name':"req_sub_date", 'id':"req_sub_date", 'class':"form-control custom-date", 'autocomplete':"off", 'type':"date", 'required':"True"}),
                    'list_gen_date': forms.DateInput(attrs={'name':"list_gen_date", 'id':"list_generation_date", 'class':"form-control custom-date", 'autocomplete':"off", 'type':"date", 'required':"True"}),
                    'total_parts' : forms.NumberInput(attrs={'name':"total_parts", 'id':"total_parts", 'class':"form-control" , 'autocomplete':"off", 'required':"True"}),
        }

    def __init__(self, *args, **kwargs):
        super(Scrap_List_Form, self).__init__(*args, **kwargs)
        self.label_suffix = ''

##################################################################################################

class Scrap_List_Verification_Form(forms.ModelForm):

    scrap_verification_ppt_file = forms.FileField(required=True, widget=forms.ClearableFileInput(attrs={'id': 'scrap_verification_file', 'name':'scrap_verification_ppt_file', 'class': 'form-control', 'accept': 'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation', 'autocomplete': 'off'}))

    class Meta:

        model = Scrap_List_Verification

        fields = ['scrap_verification_ppt_file']

        error_messages = {'scrap_verification_ppt_file' : {'required' : '!'},}

    def __init__(self, *args, **kwargs):
        super(Scrap_List_Verification_Form, self).__init__(*args, **kwargs)
        self.label_suffix = ''

##################################################################################################

class Packing_Slip_Form(forms.ModelForm):

    delivery_challan_pdf = forms.FileField(required=True, widget=forms.ClearableFileInput(attrs={'id': 'delivery_challan_pdf', 'name':'delivery_challan_pdf', 'class': 'form-control', 'accept': 'application/pdf','autocomplete': 'off'}))

    class Meta:

        model = Packing_Slip

        fields = ['packing_slip_no', 'place_of_supply', 'total_prowacs_no', 'packing_slip_date', 'total_parts', 'transport_name', 'docket_no', 'docket_date', 'delivery_challan_pdf']

        error_messages = {'packing_slip_no' : {'required' : '!'},
                          'place_of_supply' : {'required' : '!'},
                          'total_prowacs_no' : {'required' : '!'},
                          'packing_slip_date' : {'required' : '!'},
                          'total_parts' : {'required' : '!'},
                          'transport_name' : {'required' : '!'},
                          'docket_no' : {'required' : '!'},
                          'docket_date' : {'required' : '!'},
                          'delivery_challan_pdf' : {'required' : '!'},
                          }
        
        widgets = {
                    'packing_slip_no' : forms.TextInput(attrs={'name':"packing_slip_no", 'id':"packing_slip_no", 'class':"form-control" , 'autocomplete':"off", 'required':"True"}),
                    'place_of_supply' : forms.TextInput(attrs={'name':"place_of_supply", 'id':"place_of_supply", 'class':"form-control" , 'autocomplete':"off", 'required':"True"}),
                    'total_prowacs_no': forms.NumberInput(attrs={'name':"total_prowacs_no", 'id':"total_prowacs_no", 'class':"form-control", 'autocomplete':"off", 'required':"True"}),
                    'packing_slip_date': forms.DateInput(attrs={'name':"packing_slip_date", 'id':"packing_slip_date", 'class':"form-control custom-date", 'autocomplete':"off", 'type':"date", 'required':"True"}),
                    'total_parts' : forms.NumberInput(attrs={'name':"total_parts", 'id':"total_parts", 'class':"form-control" , 'autocomplete':"off", 'required':"True"}),
                    'transport_name' : forms.TextInput(attrs={'name':"transport_name", 'id':"transport_name", 'class':"form-control" , 'autocomplete':"off", 'required':"True"}),
                    'docket_no' : forms.TextInput(attrs={'name':"docket_no", 'id':"docket_no", 'class':"form-control" , 'autocomplete':"off", 'required':"True"}),
                    'docket_date': forms.DateInput(attrs={'name':"docket_date", 'id':"docket_date", 'class':"form-control custom-date", 'autocomplete':"off", 'type':"date", 'required':"True"}),
        }

    def __init__(self, *args, **kwargs):
        super(Packing_Slip_Form, self).__init__(*args, **kwargs)
        self.label_suffix = ''

##################################################################################################

class Packing_Slip_Pod_Form(forms.ModelForm):

    pod_pdf = forms.FileField(required=True, widget=forms.ClearableFileInput(attrs={'id': 'pod_pdf', 'name':'pod_pdf', 'class': 'form-control', 'accept': 'application/pdf','autocomplete': 'off'}))

    class Meta:

        model = Packing_Slip

        fields = ['received_date', 'pod_pdf']

        error_messages = {'pod_pdf' : {'required' : '!'},
                          'received_date' : {'required' : '!'},
                          }
        
        widgets = {
                    'received_date': forms.DateInput(attrs={'name':"received_date", 'id':"received_date", 'class':"form-control custom-date", 'autocomplete':"off", 'type':"date", 'required':"True"}),
        }

    def __init__(self, *args, **kwargs):
        super(Packing_Slip_Pod_Form, self).__init__(*args, **kwargs)
        self.label_suffix = ''