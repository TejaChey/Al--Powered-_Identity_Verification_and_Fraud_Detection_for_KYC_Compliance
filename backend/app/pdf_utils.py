
import io
try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

def convert_pdf_to_image(file_bytes: bytes) -> bytes:
    """
    Convert first page of PDF to PNG image bytes.
    Returns:
        bytes: PNG image bytes of the first page
        None: If conversion fails or not a PDF
    """
    if not fitz:
        print("⚠️ PyMuPDF (fitz) not installed. PDF support disabled.")
        return None

    try:
        # Check if it's a PDF signature
        if not file_bytes.startswith(b'%PDF-'):
            return None

        # Open PDF from bytes
        doc = fitz.open("pdf", file_bytes)
        if doc.page_count < 1:
            return None
        
        # Get first page
        page = doc.load_page(0)
        
        # Render to image (zoom=2 for better quality OCR)
        mat = fitz.Matrix(2, 2)
        pix = page.get_pixmap(matrix=mat)
        
        # Convert to PNG bytes
        img_bytes = pix.tobytes("png")
        return img_bytes
        
    except Exception as e:
        print(f"❌ PDF Conversion Error: {e}")
        return None
