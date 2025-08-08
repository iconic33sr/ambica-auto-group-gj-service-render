import fitz  # PyMuPDF
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile

import zipfile
import io
from PIL import Image
from django.core.files.base import ContentFile

from datetime import datetime, time
from typing import Tuple, Union
from zoneinfo import ZoneInfo
from django.conf import settings
from django.utils import timezone

from pywebpush import webpush, WebPushException
from .models import PushSubscription
import json

from django.utils.timezone import now, timedelta
from django.core.cache import cache

import logging

logger = logging.getLogger(__name__)


#######################################################################
# Compressing PDF File
def compress_pdf_file(original_file):
    try:
        # Read and open original file
        doc = fitz.open(stream=original_file.read(), filetype="pdf")

        # Clean each page (removes unreferenced images, fonts, etc.)
        for page in doc:
            page.clean_contents()

        # Write cleaned version to memory
        compressed_data = doc.write()
        compressed_buffer = BytesIO(compressed_data)

        # If compressed version is actually smaller
        if len(compressed_data) < original_file.size:
            return InMemoryUploadedFile(
                file=compressed_buffer,
                field_name='scrap_file',
                name=original_file.name,
                content_type='application/pdf',
                size=len(compressed_data),
                charset=None
            )
        else:
            # Rewind original file pointer and return as-is
            original_file.seek(0)
            return original_file

    except Exception as e:
        # On any failure, fallback to original file
        print(f"PDF compression failed: {e}")
        original_file.seek(0)
        return original_file


#######################################################################
# Compressing PPT File
def compress_pptx_images(pptx_file):
    # Read original file
    pptx_bytes = pptx_file.read()
    pptx_io = io.BytesIO(pptx_bytes)

    # Check if it's a pptx file
    if not pptx_file.name.endswith(".pptx"):
        return None  # Can't compress non-pptx formats

    # Extract pptx as zip
    with zipfile.ZipFile(pptx_io, 'r') as zin:
        out_io = io.BytesIO()
        with zipfile.ZipFile(out_io, 'w', zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename.startswith("ppt/media/image") and item.filename.endswith((".jpg", ".jpeg", ".png")):
                    try:
                        img = Image.open(io.BytesIO(data))
                        img_format = img.format

                        # Resize/compress image (change quality/size as needed)
                        img_io = io.BytesIO()
                        img.save(img_io, format=img_format, optimize=True, quality=65)
                        data = img_io.getvalue()
                    except:
                        pass  # skip if image can't be processed

                zout.writestr(item, data)

    filename = pptx_file.name
    compressed_content = ContentFile(out_io.getvalue(), name=filename)
    return compressed_content


##############################################################################################

# def send_push_notification(user, title, body, url="/"):
#     subs = PushSubscription.objects.filter(user=user)
#     for sub in subs:
#         try:
#             webpush(
#                 subscription_info=sub.subscription_info,
#                 data=json.dumps({
#                     "title": title,
#                     "body": body,
#                     "url": url
#                 }),
#                 vapid_private_key=settings.VAPID_PRIVATE_KEY,
#                 vapid_claims={"sub": settings.VAPID_EMAIL}
#             )
#         except WebPushException as e:
#             if e.response and e.response.status_code in [404, 410]:
#                 sub.delete()


# def send_push_notification(user, payload_dict):
#     payload = json.dumps(payload_dict)
#     vapid_private_key = settings.VAPID_PRIVATE_KEY
#     vapid_claims = {
#         "sub": "mailto:admin@example.com"
#     }

#     subscriptions = PushSubscription.objects.filter(user=user)

#     for sub in subscriptions:
#         try:
#             webpush(
#                 subscription_info=sub.subscription_info,
#                 data=payload,
#                 vapid_private_key=vapid_private_key,
#                 vapid_claims=vapid_claims
#             )
#         except WebPushException as ex:
#             if ex.response and ex.response.status_code == 410:
#                 # Remove invalid subscription
#                 sub.delete()
#             else:
#                 logger.warning(f"Failed to send push to {sub.id}: {ex}")


def send_push_notification(user, payload_dict):
    payload = json.dumps(payload_dict)
    vapid_private_key = settings.VAPID_PRIVATE_KEY
    vapid_claims = {
        "sub": "mailto:admin@example.com"
    }

    subscriptions = PushSubscription.objects.filter(user=user)
    success_count = 0
    failure_count = 0

    for sub in subscriptions:
        try:
            webpush(
                subscription_info=sub.subscription_info,
                data=payload,
                vapid_private_key=vapid_private_key,
                vapid_claims=vapid_claims
            )
            logger.info(f"[PUSH SENT] User: {user.username}, Endpoint: {sub.subscription_info.get('endpoint')}")
            print(f"[PUSH SENT] User: {user.username}, Endpoint: {sub.subscription_info.get('endpoint')}")
            success_count += 1
        except WebPushException as ex:
            failure_count += 1
            if ex.response and ex.response.status_code in [404, 410]:
                logger.warning(f"[PUSH EXPIRED] User: {user.username}, Endpoint: {sub.subscription_info.get('endpoint')} - Deleting")
                sub.delete()
            else:
                logger.error(f"[PUSH FAILED] User: {user.username}, Endpoint: {sub.subscription_info.get('endpoint')}, Error: {str(ex)}")

    logger.info(f"[PUSH SUMMARY] User: {user.username}, Success: {success_count}, Failed: {failure_count}")


##############################################################################################

def cleanup_stale_subscriptions_once_per_day():
    """
    Deletes push subscriptions not used in the last 8 hours.
    Updates the same Redis key each day after successful cleanup.
    """
    cache_key = 'subscriptions_cleanup_last_run'

    # Check if already cleaned today
    last_run_str = cache.get(cache_key)
    today_str = now().strftime('%Y-%m-%d')

    if last_run_str == today_str:
        return  # Already cleaned today

    # Run cleanup
    threshold = now() - timedelta(hours=8)
    deleted_count, _ = PushSubscription.objects.filter(last_seen__lt=threshold).delete()

    # Update Redis key with today's date (does not create new keys every day)
    cache.set(cache_key, today_str, timeout=86400)  # expires after 1 day

    print(f"[CLEANUP] Deleted {deleted_count} stale subscriptions at {now()}")


#################################################################################################

# Resolve project timezone, defaulting to IST
def _get_project_tz() -> ZoneInfo:
    tzname = getattr(settings, "TIME_ZONE", "Asia/Kolkata") or "Asia/Kolkata"
    try:
        return ZoneInfo(tzname)
    except Exception:
        # Fallback to IST if TIME_ZONE is invalid
        return ZoneInfo("Asia/Kolkata")

PROJECT_TZ = _get_project_tz()

def _naive_time(t: time) -> time:
    """Ensure 'time' is naive (tzinfo=None) for Django TimeField."""
    return t.replace(tzinfo=None) if t.tzinfo is not None else t

def get_zone_date_time(
    need_datetime: bool = True,
    need_date: bool = True,
    need_time: bool = True
) -> Union[
    Tuple[datetime, datetime.date, time],
    Tuple[datetime, datetime.date],
    Tuple[datetime, time],
    datetime,
    datetime.date,
    time
]:
    """
    Flexible helper to get IST-aware/naive DateTime, Date, and Time
    for populating report fields.

    Params:
        need_datetime: return DateTime value
        need_date:     return Date value
        need_time:     return Time value

    Returns:
        - If all three True: (datetime_value, date_value, time_value)
        - If two True: tuple of two values in the order of params
        - If only one True: the single value directly

    Behavior:
        - USE_TZ=True:
            * DateTime = aware UTC (timezone.now())
            * Date/Time = from IST-localized instant
            * Time always naive
        - USE_TZ=False:
            * All values naive IST
    """
    if getattr(settings, "USE_TZ", False):
        # Aware UTC for DB DateTimeField
        now_utc = timezone.now()
        # Convert that to IST for date/time snapshot
        now_local = timezone.localtime(now_utc, PROJECT_TZ)
        dt_val = now_utc if need_datetime else None
        date_val = now_local.date() if need_date else None
        time_val = _naive_time(now_local.time()) if need_time else None
    else:
        # Naive IST everywhere
        now_local = datetime.now(PROJECT_TZ).replace(tzinfo=None)
        dt_val = now_local if need_datetime else None
        date_val = now_local.date() if need_date else None
        time_val = now_local.time() if need_time else None

    # Return based on how many were requested
    results = [v for v in (dt_val, date_val, time_val) if v is not None]
    if len(results) == 1:
        return results[0]
    return tuple(results)