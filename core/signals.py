import os
from django.db.models.signals import post_delete, pre_delete, pre_save, post_save
from django.dispatch import receiver
from .models import Customer_Information_Report, Service_Advisor_Report, Claim_Status, Vehicle_Gate_Entry, Scrap_List, Scrap_List_Verification, Packing_Slip

from django.contrib.auth.models import User
from django.contrib.sessions.models import Session

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.db import transaction


#########################################################################

def delete_file_if_exists(file_field):
    if file_field and file_field.name:
        file_field.delete(save=False)

######################################################

# List of image field names in CIR ###########################
CIR_IMAGE_FIELD_NAMES = [
    'vehicle_front_image',
    'vehicle_with_number_plate',
    'chasis',
    'odometer',
    'complaint_1_image',
    'complaint_2_image',
    'complaint_3_image',
    'complaint_4_image',
    'complaint_5_image',
    'complaint_6_image',
    'complaint_7_image',
    'presentation_report',
]

# Delete files on instance delete
@receiver(post_delete, sender=Customer_Information_Report)
def delete_associated_files(sender, instance, **kwargs):
    for field_name in CIR_IMAGE_FIELD_NAMES:
        file_field = getattr(instance, field_name)
        delete_file_if_exists(file_field)

# Delete old files when updating an image
@receiver(pre_save, sender=Customer_Information_Report)
def delete_old_files_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return  # Skip if this is a new instance (no update happening)

    try:
        old_instance = Customer_Information_Report.objects.get(pk=instance.pk)
    except Customer_Information_Report.DoesNotExist:
        return

    for field_name in CIR_IMAGE_FIELD_NAMES:
        old_file = getattr(old_instance, field_name)
        new_file = getattr(instance, field_name)

        if old_file and old_file != new_file:
            delete_file_if_exists(old_file)

################################################################

# List of image field names in SAR ###########################
SAR_IMAGE_FIELD_NAMES = [
    'faulty_image_1',
    'faulty_image_2',
    'faulty_image_3',
    'faulty_image_4',
    'faulty_image_5',
    'faulty_image_6',
    'faulty_image_7',
    'faulty_image_8',
    'faulty_image_9',
    'faulty_image_10',
    'faulty_image_11',
    'faulty_image_12',
    'faulty_image_13',
    'faulty_image_14',
    'faulty_image_15',
]

# Delete files on instance delete
@receiver(post_delete, sender=Service_Advisor_Report)
def delete_sar_associated_files(sender, instance, **kwargs):
    for field_name in SAR_IMAGE_FIELD_NAMES:
        file_field = getattr(instance, field_name)
        delete_file_if_exists(file_field)

# Delete old files when updating an image
@receiver(pre_save, sender=Service_Advisor_Report)
def delete_sar_old_files_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return  # Skip if this is a new instance (no update happening)

    try:
        old_instance = Service_Advisor_Report.objects.get(pk=instance.pk)
    except Service_Advisor_Report.DoesNotExist:
        return

    for field_name in SAR_IMAGE_FIELD_NAMES:
        old_file = getattr(old_instance, field_name)
        new_file = getattr(instance, field_name)

        if old_file and old_file != new_file:
            delete_file_if_exists(old_file)

########################################################################

# List of image field names in Claim_Status ###########################
CLAIM_STATUS_IMAGE_FIELD_NAMES = [
    'part_dispatch_image1',
    'part_dispatch_image2',
    'part_dispatch_image3',
    'part_dispatch_image4',
    'part_dispatch_image5',
]

# Delete files on instance delete
@receiver(post_delete, sender=Claim_Status)
def delete_claim_status_associated_files(sender, instance, **kwargs):
    for field_name in CLAIM_STATUS_IMAGE_FIELD_NAMES:
        file_field = getattr(instance, field_name)
        # setattr(instance, field_name, None) # If required in future
        delete_file_if_exists(file_field)


# Cache to track relations before deletion
_cleanup_registry = {}

@receiver(pre_delete, sender=Claim_Status)
def handle_scrap_and_packing_deletion(sender, instance, **kwargs):
    instance_id = instance.pk

    # Cache linked Scrap_List and Packing_Slip before deletion
    scrap_ids = list(instance.scrap_list.values_list("id", flat=True))
    packing_ids = list(instance.packing_slip.values_list("id", flat=True))

    _cleanup_registry[instance_id] = {
        "scrap_ids": scrap_ids,
        "packing_ids": packing_ids
    }

    def delete_if_last_link():
        cleanup_data = _cleanup_registry.pop(instance_id, None)
        if not cleanup_data:
            return

        # Scrap_List
        for scrap_id in cleanup_data["scrap_ids"]:
            scrap = Scrap_List.objects.filter(id=scrap_id).first()
            if scrap and scrap.claim_status.count() == 0:
                scrap.delete()

        # Packing_Slip
        for packing_id in cleanup_data["packing_ids"]:
            pack = Packing_Slip.objects.filter(id=packing_id).first()
            if pack and pack.ps_claim_status.count() == 0:
                pack.delete()

    # Run after all M2M updates and instance deletion
    transaction.on_commit(delete_if_last_link)

########################################################################

# Delete pdf files on Scrap List instance delete ###########################
@receiver(post_delete, sender=Scrap_List)
def delete_scrap_list_associated_files(sender, instance, **kwargs):
    file_field = getattr(instance, 'scrap_list_pdf')
    # setattr(instance, field_name, None) # If required in future
    delete_file_if_exists(file_field)


# Delete the Scrap_List_Verification instance when all its linked Scrap_List are deleted
@receiver(post_delete, sender=Scrap_List)
def delete_verification_if_no_scrap_lists_remaining(sender, instance, **kwargs):
    verification = instance.linked_scrap_list_verification
    if verification:
        # Check if any other Scrap_List instances are linked to this verification
        remaining = Scrap_List.objects.filter(linked_scrap_list_verification=verification)
        if not remaining.exists():
            verification.delete()


########################################################################

# Delete ppt file on Scrap List Verification instance delete ###########################
@receiver(post_delete, sender=Scrap_List_Verification)
def delete_scrap_list_verification_associated_files(sender, instance, **kwargs):
    file_field = getattr(instance, 'scrap_verification_ppt_file')
    # setattr(instance, field_name, None) # If required in future
    delete_file_if_exists(file_field)


########################################################################

# Delete pdf files on Packing Slip instance delete ###########################
# List of image field names in Claim_Status ###########################
PACKING_SLIP_PDF_FIELD_NAMES = [
    'delivery_challan_pdf',
    'pod_pdf',
]

# Delete files on instance delete
@receiver(post_delete, sender=Packing_Slip)
def delete_packing_slip_associated_files(sender, instance, **kwargs):
    for field_name in PACKING_SLIP_PDF_FIELD_NAMES:
        file_field = getattr(instance, field_name)
        # setattr(instance, field_name, None) # If required in future
        delete_file_if_exists(file_field)


########################################################################

# List of image field names in Vehicle_Gate_Entry ###########################
VEHICLE_GATE_ENTRY_IMAGE_FIELD_NAMES = [
    'gate_pass_image',
    'gate_register_image',
]

# Delete files on instance delete
@receiver(post_delete, sender=Vehicle_Gate_Entry)
def delete_vehicle_gate_entry_associated_files(sender, instance, **kwargs):
    for field_name in VEHICLE_GATE_ENTRY_IMAGE_FIELD_NAMES:
        file_field = getattr(instance, field_name)
        # setattr(instance, field_name, None) # If required in future
        delete_file_if_exists(file_field)


################################################################################################################################
# To loggout the deactivated user immediately ###########################
@receiver(post_save, sender=User)
def logout_deactivated_user(sender, instance, **kwargs):
    if not instance.is_active:
        # Find all sessions for this user and delete them
        sessions = Session.objects.all()
        for session in sessions:
            data = session.get_decoded()
            if data.get('_auth_user_id') == str(instance.id):
                session.delete()


################################################################################################################################
# To delete the cir_list from the previous selected_designation and adding it to the new selected_designation
# This code will only handle the reassignment, if thereport is send to any post for the first time it will be send to the group(consumers.py) from views.py file 
# ---- 1. PRE-SAVE: Store the previous values for the tracked fields ----
@receiver(pre_save, sender=Customer_Information_Report)
def detect_field_changes(sender, instance, **kwargs):
    try:
        prev = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        prev = None

    # Track the previous values of the fields we care about
    tracked_fields = [
        'selected_advisor',
        'selected_workshop_manager',
        'selected_claim_manager'
    ]
    for field in tracked_fields:
        setattr(
            instance, f'_prev_{field}', 
            getattr(prev, field) if prev else None
        )

# ---- 2. POST-SAVE: Compare and broadcast changes ----
@receiver(post_save, sender=Customer_Information_Report)
def broadcast_field_changes(sender, instance, created, **kwargs):

    if created:
        return  # Do not notify on creation

    channel_layer = get_channel_layer()

    field_to_group_prefix = {
        'selected_advisor': 'advisor',
        'selected_workshop_manager': 'workshopmanager',
        'selected_claim_manager': 'claimmanager'
    }

    for field, group_prefix in field_to_group_prefix.items():
        prev_value = getattr(instance, f'_prev_{field}', None)
        curr_value = getattr(instance, field)
        if prev_value != curr_value:
            # Remove from old
            if prev_value:

                if group_prefix == "advisor":
                    advisor_cir_data = {
                        "cir_uid": str(instance.cir_uid),
                        "vehicle_no": instance.vehicle_no,
                        "job_no": instance.job_no,
                        "supervisor_name": instance.supervisor_name,
                        "cir_date_time": str(instance.cir_date_time),
                        "sar_status": instance.sar_status,
                        "advisor_preview": "pending",
                        "report_type":instance.report_type,
                        # Add more fields as needed
                    }
                    cir_data = advisor_cir_data

                elif group_prefix == "workshopmanager":
                    workshopmanager_cir_data = {
                            "cir_uid": str(instance.cir_uid),
                            "job_no": instance.job_no,
                            "vehicle_no": instance.vehicle_no,
                            "supervisor_name": instance.supervisor_name,
                            "cir_date_time": str(instance.cir_date_time),
                            "advisor_name": getattr(instance.service_advisor_report, 'advisor_name', None),  ## First check if SAR exists or not, if yes then only fetch advisor_name otherwise None
                            "sar_date_time": str(getattr(instance.service_advisor_report, 'sar_date_time', None)),
                            "sar_status": instance.sar_status,
                            "report_type":instance.report_type,
                            # Add more fields as needed
                        }
                    cir_data = workshopmanager_cir_data

                elif group_prefix == "claimmanager":
                    claimmanager_cir_data = {
                        "cir_uid": str(instance.cir_uid),
                        "job_no": instance.job_no,
                        "vehicle_no": instance.vehicle_no,
                        "supervisor_name": instance.supervisor_name,
                        "cir_date_time": str(instance.cir_date_time),
                        "advisor_name": getattr(instance.service_advisor_report, 'advisor_name', None),  ## First check if SAR exists or not, if yes then only fetch advisor_name otherwise None
                        "sar_date_time": str(getattr(instance.service_advisor_report, 'sar_date_time', None)),
                        "wm_name": instance.workshop_manager_name,
                        "wm_date_time": str(instance.workshop_manager_verification_date_time)
                        # Add more fields as needed
                    }
                    cir_data = claimmanager_cir_data
                        
                async_to_sync(channel_layer.group_send)(
                    f"{group_prefix}_{prev_value}",
                    {
                        "type": "remove_cir_report",
                        "data": cir_data,
                    }
                )

                # Add to new
                if curr_value:

                    if group_prefix == "advisor":
                        cir_data = {
                            "cir_uid": str(instance.cir_uid),
                            "vehicle_no": instance.vehicle_no,
                            "job_no": instance.job_no,
                            "supervisor_name": instance.supervisor_name,
                            "cir_date_time": str(instance.cir_date_time),
                            "sar_status": instance.sar_status,
                            "advisor_preview": "pending",
                            "report_type": instance.report_type,
                        }
                    elif group_prefix == "workshopmanager":
                        cir_data = {
                            "cir_uid": str(instance.cir_uid),
                            "job_no": instance.job_no,
                            "vehicle_no": instance.vehicle_no,
                            "supervisor_name": instance.supervisor_name,
                            "cir_date_time": str(instance.cir_date_time),
                            "advisor_name": getattr(instance.service_advisor_report, 'advisor_name', None),
                            "sar_date_time": str(getattr(instance.service_advisor_report, 'sar_date_time', None)),
                            "sar_status": instance.sar_status,
                            "report_type": instance.report_type,
                        }
                    elif group_prefix == "claimmanager":
                        cir_data = {
                            "cir_uid": str(instance.cir_uid),
                            "job_no": instance.job_no,
                            "vehicle_no": instance.vehicle_no,
                            "supervisor_name": instance.supervisor_name,
                            "cir_date_time": str(instance.cir_date_time),
                            "advisor_name": getattr(instance.service_advisor_report, 'advisor_name', None),
                            "sar_date_time": str(getattr(instance.service_advisor_report, 'sar_date_time', None)),
                            "wm_name": instance.workshop_manager_name,
                            "wm_date_time": str(instance.workshop_manager_verification_date_time)
                        }

                    async_to_sync(channel_layer.group_send)(
                        f"{group_prefix}_{curr_value}",
                        {
                            "type": "new_cir_report",
                            "data": cir_data,
                        }
                    )