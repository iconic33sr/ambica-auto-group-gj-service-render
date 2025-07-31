from django import forms 
from core.models import Service_Advisor_Report


class Service_Advisor_Report_Form(forms.ModelForm):

    SERVICE_CHOICES = (
        (True, "\u2705"),    # ✔️
        (False, "\u274C"),   # ❌
    )

    first_service = forms.TypedChoiceField(choices=SERVICE_CHOICES, widget=forms.RadioSelect(attrs={'id':'first_service'}), label="1st Service", coerce=lambda x: x == 'True', required=False)

    second_service = forms.TypedChoiceField(choices=SERVICE_CHOICES, widget=forms.RadioSelect(attrs={'id':'second_service'}), label="2nd Service", coerce=lambda x: x == 'True', required=False)

    third_service = forms.TypedChoiceField(choices=SERVICE_CHOICES, widget=forms.RadioSelect(attrs={'id':'third_service'}), label="3rd Service", coerce=lambda x: x == 'True', required=False)

    fourth_service = forms.TypedChoiceField(choices=SERVICE_CHOICES, widget=forms.RadioSelect(attrs={'id':'fourth_service'}), label="4th Service", coerce=lambda x: x == 'True', required=False)

    fifth_service = forms.TypedChoiceField(choices=SERVICE_CHOICES, widget=forms.RadioSelect(attrs={'id':'fifth_service'}), label="5th Service", coerce=lambda x: x == 'True', required=False)

    sixth_service = forms.TypedChoiceField(choices=SERVICE_CHOICES, widget=forms.RadioSelect(attrs={'id':'sixth_service'}), label="6th Service", coerce=lambda x: x == 'True', required=False)


    first_service_remark = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'first_service_remark', 'name': 'first_service_remark', 'class': 'form-control multi_line_ta input_field', 'placeholder':"REMARK",'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    second_service_remark = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'second_service_remark', 'name': 'second_service_remark', 'class': 'form-control multi_line_ta input_field', 'placeholder':"REMARK",'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    third_service_remark = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'third_service_remark', 'name': 'third_service_remark', 'class': 'form-control multi_line_ta input_field', 'placeholder':"REMARK",'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    fourth_service_remark = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'fourth_service_remark', 'name': 'fourth_service_remark', 'class': 'form-control multi_line_ta input_field', 'placeholder':"REMARK",'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    fifth_service_remark = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'fifth_service_remark', 'name': 'fifth_service_remark', 'class': 'form-control multi_line_ta input_field', 'placeholder':"REMARK",'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    sixth_service_remark = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'sixth_service_remark', 'name': 'sixth_service_remark', 'class': 'form-control multi_line_ta input_field', 'placeholder':"REMARK",'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    service_remark = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'service_remark', 'name': 'service_remark', 'placeholder':"REMARK", 'class': 'form-control multi_line_ta input_field','maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty1_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty1_description', 'name': 'faulty1_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty2_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty2_description', 'name': 'faulty2_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty3_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty3_description', 'name': 'faulty3_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty4_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty4_description', 'name': 'faulty4_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty5_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty5_description', 'name': 'faulty5_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty6_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty6_description', 'name': 'faulty6_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty7_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty7_description', 'name': 'faulty7_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty8_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty8_description', 'name': 'faulty8_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty9_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty9_description', 'name': 'first_service_remark', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty10_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty10_description', 'name': 'faulty10_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty11_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty11_description', 'name': 'faulty11_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty12_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty12_description', 'name': 'faulty12_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty13_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty13_description', 'name': 'faulty13_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty14_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty14_description', 'name': 'faulty14_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    faulty15_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'faulty15_description', 'name': 'faulty15_description', 'class': 'form-control multi_line_ta input_field faulty_description', 'placeholder':"REMARK", 'maxlength': '200', 'required': False, 'rows': '', 'cols': ''}))
    action_remark = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'action_remark', 'name': 'action_remark', 'class': 'form-control multi_line_ta input_field', 'placeholder':"REMARK", 'maxlength': '1000', 'required': False, 'rows': '', 'cols': ''}))
    advisor_description = forms.CharField( required=False, widget=forms.Textarea(attrs={'id': 'advisor_description', 'name': 'advisor_description', 'class': 'form-control multi_line_ta input_field', 'placeholder':"REMARK", 'maxlength': '1000', 'required': False, 'rows': '', 'cols': ''}))


    class Meta:

        model = Service_Advisor_Report

        exclude = ['cir', 'faulty_image_1', 'faulty_image_2', 'faulty_image_3', 'faulty_image_4', 'faulty_image_5', 'faulty_image_6', 'faulty_image_7', 'faulty_image_8', 'faulty_image_9', 'faulty_image_10', 'faulty_image_11', 'faulty_image_12', 'faulty_image_13', 'faulty_image_14', 'faulty_image_15','sar_date_time', 'sar_date', 'sar_time', 'advisor_name', 'advisor_id']

    def __init__(self, *args, **kwargs):
        super(Service_Advisor_Report_Form, self).__init__(*args, **kwargs)
        self.label_suffix = ''