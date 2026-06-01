"""Test pypdf layout extraction for problem pages 13 and 17."""
from pypdf import PdfReader

reader = PdfReader("F:/Projekte/DiatoneLibrary/data/import/tabheft.pdf")

for page_idx, label in [(12, "Hes_a_Pirate_p13"), (16, "Tabaluga_p17")]:
    page = reader.pages[page_idx]
    text = page.extract_text(extraction_mode="layout")
    print(f"\n{'='*60}")
    print(f"{label}")
    print(text)
