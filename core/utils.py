import fitz  # PyMuPDF
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile

import zipfile
import io
import os
from PIL import Image
from django.core.files.base import ContentFile

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