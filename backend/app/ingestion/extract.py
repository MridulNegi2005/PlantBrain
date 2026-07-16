"""Text extraction for the ingestion pipeline.

PDF text + tables via PyMuPDF (per page), CSV/XLSX via pandas, plain text direct.
PyMuPDF handles both text and table detection, so we avoid pdfplumber/pdfminer.six
(which carries a PDF-pickle RCE) on the untrusted-upload path. OCR is an optional
fallback for pages/images with no text layer — it activates only if pytesseract +
Pillow + the tesseract binary are present, otherwise it returns "" (the demo corpus
is text-based, so OCR isn't needed).
"""

from __future__ import annotations

import io
import shutil
from pathlib import Path


def extract_pages(path: str) -> list[str]:
    """Return a list of page texts (non-paginated formats return a single entry)."""
    p = Path(path)
    suffix = p.suffix.lower()
    if suffix == ".pdf":
        return _extract_pdf(p)
    if suffix == ".csv":
        return [_extract_csv(p)]
    if suffix in {".xlsx", ".xls"}:
        return [_extract_xlsx(p)]
    if suffix in {".png", ".jpg", ".jpeg"}:
        return [_ocr_image(p)]
    return [p.read_text(encoding="utf-8", errors="ignore")]


def _extract_pdf(p: Path) -> list[str]:
    import fitz  # PyMuPDF

    pages: list[str] = []
    with fitz.open(p) as doc:
        for page in doc:
            text = page.get_text("text").strip()
            if not text:  # scanned page — try OCR
                text = _ocr_pdf_page(page)
            table = _tables_from_page(page)
            if table:
                text = (text + "\n\n" + table).strip()
            pages.append(text)
    return pages


def _tables_from_page(page) -> str:
    """Best-effort table extraction via PyMuPDF's native table finder."""
    try:
        rows = []
        for table in page.find_tables().tables:
            for row in table.extract():
                rows.append(" | ".join("" if c is None else str(c) for c in row))
        return "\n".join(rows)
    except Exception:
        return ""


def _extract_csv(p: Path) -> str:
    import pandas as pd

    return pd.read_csv(p).to_csv(index=False)


def _extract_xlsx(p: Path) -> str:
    import pandas as pd

    frames = pd.read_excel(p, sheet_name=None)
    return "\n\n".join(f"# {name}\n{df.to_csv(index=False)}" for name, df in frames.items())


def _ocr_available() -> bool:
    if shutil.which("tesseract") is None:
        return False
    try:
        import pytesseract  # noqa: F401
        from PIL import Image  # noqa: F401
    except ImportError:
        return False
    return True


def _ocr_pdf_page(page) -> str:
    if not _ocr_available():
        return ""
    import pytesseract
    from PIL import Image

    pix = page.get_pixmap(dpi=200)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    return pytesseract.image_to_string(img).strip()


def _ocr_image(p: Path) -> str:
    if not _ocr_available():
        return ""
    import pytesseract
    from PIL import Image

    return pytesseract.image_to_string(Image.open(p)).strip()
