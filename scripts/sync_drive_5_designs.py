#!/usr/bin/env python3
"""
Google Drive Publisher & Folder Cleaner for the 5-Theme Master Catalog
Uploads the 5 newly generated 1344x2389 @ 300 DPI artworks and CaseCraft_Master_5_Designs_Catalog.xlsx,
then cleans the Google Drive folder so ONLY the 5 theme designs and the new Excel catalog remain.
"""

import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
except Exception:
    pass

DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO"

TARGET_SKUS = [
    "CASE-FOREST-001",
    "CASE-SACRED-001",
    "CASE-NINETA-001",
    "CASE-ROOTCO-001",
    "CASE-BEARNO-001"
]

KEEP_FILENAMES = {f"{sku}_9x16_Artwork.png" for sku in TARGET_SKUS} | {
    "CaseCraft_Master_5_Designs_Catalog.xlsx"
}


def get_visible_drive_filenames(driver):
    """Returns a list of (element, filename_text) for items visible in the Google Drive folder."""
    items = []
    seen = set()
    # Look for elements containing CASE- or CaseCraft_Master or .png or .xlsx
    xpath = (
        "//*[contains(text(), 'CASE-') or contains(text(), 'CaseCraft_Master') "
        "or contains(text(), '_9x16_Artwork.png') or contains(text(), '.xlsx')]"
    )
    elements = driver.find_elements(By.XPATH, xpath)
    for el in elements:
        try:
            txt = el.text.strip()
            if not txt or "\n" in txt:
                continue
            if (txt.startswith("CASE-") or txt.startswith("CaseCraft_Master")) and txt not in seen:
                seen.add(txt)
                items.append((el, txt))
        except Exception:
            continue
    return items


def clean_unwanted_drive_files(driver):
    """Moves all files in the Drive folder NOT in KEEP_FILENAMES to trash."""
    print("\n[*] Cleaning Google Drive folder so only the 5 new theme designs + new Excel catalog remain...")
    driver.get(DRIVE_FOLDER_URL)
    time.sleep(4)

    deleted_total = 0
    max_passes = 35

    for p in range(max_passes):
        if p > 0 and p % 6 == 0:
            driver.get(DRIVE_FOLDER_URL)
            time.sleep(3.5)

        visible_items = get_visible_drive_filenames(driver)
        target_el = None
        target_name = ""

        for el, fname in visible_items:
            if fname not in KEEP_FILENAMES:
                target_el = el
                target_name = fname
                break

        if not target_el:
            print(f"[*] Folder cleanup complete after {p} removal cycles.")
            break

        print(f"    [{deleted_total + 1}] Removing old file from Drive: {target_name}...")
        try:
            row = target_el.find_element(
                By.XPATH,
                "./ancestor-or-self::div[@role='row' or @data-target='doc' or @data-target='item' or @data-id or contains(@class, 'c-P-p') or contains(@class, 'i92Sbe')][1]"
            )
            ActionChains(driver).move_to_element(row).click().perform()
            time.sleep(0.6)

            trash_btns = driver.find_elements(
                By.XPATH,
                "//div[@aria-label='Move to trash Delete' or contains(@data-tooltip, 'Move to trash') or contains(@aria-label, 'Move to trash')]"
            )
            clicked = False
            for tb in trash_btns:
                if tb.is_displayed():
                    ActionChains(driver).move_to_element(tb).click().perform()
                    clicked = True
                    break
            if not clicked and trash_btns:
                driver.execute_script("arguments[0].click();", trash_btns[0])
                clicked = True

            if clicked:
                deleted_total += 1
                time.sleep(1.2)
            else:
                print(f"    [!] Could not find trash toolbar button for {target_name}, refreshing...")
                driver.get(DRIVE_FOLDER_URL)
                time.sleep(3)
        except Exception as e:
            print(f"    [!] Notice removing {target_name}: {e}")
            time.sleep(1)

    print(f"[*] Total old files moved to trash: {deleted_total}")


def upload_new_files_to_drive(driver):
    """Uploads any missing files from KEEP_FILENAMES to the Google Drive folder."""
    driver.get(DRIVE_FOLDER_URL)
    time.sleep(4)

    existing_names = {fname for _, fname in get_visible_drive_filenames(driver)}
    print(f"[*] Currently present in Drive among target files: {sorted(existing_names & KEEP_FILENAMES)}")

    designs_dir = os.path.abspath("public/designs")
    files_to_upload = []

    for sku in TARGET_SKUS:
        fname = f"{sku}_9x16_Artwork.png"
        fpath = os.path.join(designs_dir, fname)
        if not os.path.isfile(fpath):
            raise FileNotFoundError(f"Missing generated artwork file: {fpath}")
        if fname not in existing_names:
            files_to_upload.append(fpath)

    excel_fname = "CaseCraft_Master_5_Designs_Catalog.xlsx"
    excel_fpath = os.path.abspath(excel_fname)
    if not os.path.isfile(excel_fpath):
        raise FileNotFoundError(f"Missing Excel catalog: {excel_fpath}")
    if excel_fname not in existing_names:
        files_to_upload.append(excel_fpath)

    if not files_to_upload:
        print("[*] All 5 designs and the Excel catalog are already present in Google Drive!")
        return

    print(f"\n[*] Uploading {len(files_to_upload)} file(s) to Google Drive:")
    for f in files_to_upload:
        print(f"    + {os.path.basename(f)} ({os.path.getsize(f) / 1024:.1f} KB)")

    inputs = driver.find_elements(By.XPATH, "//input[@type='file' and not(@id='py_test_upload_input')]")
    if not inputs:
        print("[*] Opening 'New -> File upload' menu to initialize Drive file input...")
        new_btn = driver.find_element(By.XPATH, "//button[contains(., 'New')]")
        ActionChains(driver).move_to_element(new_btn).click().perform()
        time.sleep(1.5)

        file_upload_item = driver.find_element(By.XPATH, "//li[@data-key='19' or contains(., 'File upload')]")
        ActionChains(driver).move_to_element(file_upload_item).click().perform()
        time.sleep(1.5)

        inputs = driver.find_elements(By.XPATH, "//input[@type='file' and not(@id='py_test_upload_input')]")

    if not inputs:
        raise RuntimeError("Could not locate Google Drive file upload <input type='file'> element.")

    joined_paths = "\n".join(files_to_upload)
    inputs[0].send_keys(joined_paths)
    print("[*] Dispatched all files to Google Drive upload queue!")

    # Wait for uploads to complete
    start_wait = time.time()
    max_wait = 120
    last_status = ""

    while time.time() - start_wait < max_wait:
        time.sleep(4)
        # Check if duplicate upload modal appeared ("Update existing" / "Keep both" / "Upload")
        modal_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Upload') or contains(., 'Update') or contains(., 'Replace')]")
        for mb in modal_btns:
            try:
                t = mb.text.strip().lower()
                if t in ("upload", "replace", "update existing", "keep both") and mb.is_displayed():
                    driver.execute_script("arguments[0].click();", mb)
                    time.sleep(1)
            except Exception:
                pass

        elements = driver.find_elements(
            By.XPATH,
            "//*[contains(text(), 'Upload') or contains(text(), 'upload') or contains(text(), 'complete') or contains(text(), 'left')]"
        )
        texts = [e.text.strip().replace("\n", " ") for e in elements if e.text.strip()]
        unique_texts = [t for t in dict.fromkeys(texts) if any(k in t.lower() for k in ["upload", "complete", "left"])]

        current_status = " | ".join(unique_texts[:3])
        if current_status and current_status != last_status:
            print(f"    [{int(time.time() - start_wait)}s] Drive Upload Status: {current_status}")
            last_status = current_status

        if any("uploads complete" in t.lower() or "upload complete" in t.lower() for t in unique_texts):
            if not any("left" in t.lower() or "uploading" in t.lower() for t in unique_texts):
                print("[+] Google Drive upload completed!")
                break


def main():
    opts = Options()
    opts.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
    driver = webdriver.Chrome(options=opts)

    # 1. Clean old files first so the folder is clutter-free
    clean_unwanted_drive_files(driver)

    # 2. Upload the 5 new designs and the new Excel catalog
    upload_new_files_to_drive(driver)

    # 3. Run a second pass of cleanup just in case any old files were scrolled out of view
    clean_unwanted_drive_files(driver)

    # 4. Final verification
    driver.get(DRIVE_FOLDER_URL)
    time.sleep(4)
    final_items = sorted({fname for _, fname in get_visible_drive_filenames(driver)})

    print("\n" + "=" * 75)
    print(f"[*] FINAL VERIFIED GOOGLE DRIVE FOLDER CONTENTS ({len(final_items)} items):")
    print("=" * 75)
    for i, item in enumerate(final_items, 1):
        print(f"    {i:02d}. {item}")
    print("=" * 75)


if __name__ == "__main__":
    main()
