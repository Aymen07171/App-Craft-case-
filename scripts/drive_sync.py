#!/usr/bin/env python3
"""
Google Drive Automated Synchronization Engine
Module: scripts/drive_sync.py

Synchronizes generated phone case design artwork and master Excel workbooks
to Google Drive, generating public links compatible with Printify automatic import.

Supports:
1. Direct Google Drive API (v3) upload via OAuth/bearer access token.
2. Native Chrome Selenium browser upload using the authenticated Google session
   (zero-configuration fallback when no API token is available).
"""

import os
import sys
import time
import json
import mimetypes
from typing import Dict, Any, List, Optional
import urllib.request
import urllib.error

# Default Google Drive Folder: "CaseCraft Designs"
DEFAULT_DRIVE_FOLDER_ID = "108aZnUBJ64BJdeaF6DTou9U5tyrthksO"
DEFAULT_DRIVE_FOLDER_URL = f"https://drive.google.com/drive/folders/{DEFAULT_DRIVE_FOLDER_ID}"


def get_stored_drive_token() -> Optional[str]:
    """Finds Google OAuth access token from environment or local configs."""
    candidates = [
        "GOOGLE_ACCESS_TOKEN",
        "GOOGLE_DRIVE_TOKEN",
        "DRIVE_ACCESS_TOKEN",
        "GOOGLE_OAUTH_TOKEN"
    ]
    for c in candidates:
        v = os.environ.get(c)
        if v and not v.startswith("your_"):
            return v.strip()

    # Check .env file
    env_paths = [
        os.path.join(os.path.dirname(__file__), "..", ".env"),
        os.path.join(os.getcwd(), ".env"),
    ]
    for p in env_paths:
        if os.path.isfile(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("#") or "=" not in line:
                            continue
                        k, v = line.split("=", 1)
                        k, v = k.strip(), v.strip().strip("'\"")
                        if k in candidates and v and not v.startswith("your_"):
                            return v
            except Exception:
                pass
    return None


def upload_file_drive_api(
    filepath: str,
    folder_id: str = DEFAULT_DRIVE_FOLDER_ID,
    token: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Uploads a file to Google Drive using the Drive API v3 multipart protocol.
    Sets permissions to 'anyone with link' so Printify can download it.
    """
    token = token or get_stored_drive_token()
    if not token:
        return None

    if not os.path.isfile(filepath):
        print(f"[DRIVE SYNC] Error: File not found: {filepath}")
        return None

    filename = os.path.basename(filepath)
    mime_type, _ = mimetypes.guess_type(filepath)
    if not mime_type:
        mime_type = "application/octet-stream"

    with open(filepath, "rb") as f:
        file_bytes = f.read()

    boundary = "-------CaseCraftMultipartBoundary" + str(int(time.time()))
    metadata = {
        "name": filename,
        "parents": [folder_id]
    }

    # Multipart body
    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(b"Content-Type: application/json; charset=UTF-8\r\n\r\n")
    body.extend(json.dumps(metadata).encode("utf-8"))
    body.extend(b"\r\n")

    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f"Content-Type: {mime_type}\r\n\r\n".encode("utf-8"))
    body.extend(file_bytes)
    body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))

    upload_url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink"
    req = urllib.request.Request(
        upload_url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/related; boundary={boundary}",
            "Content-Length": str(len(body))
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            file_id = data.get("id")

            # Make file publicly readable for Printify importer
            if file_id:
                try:
                    perm_url = f"https://www.googleapis.com/drive/v3/files/{file_id}/permissions"
                    perm_req = urllib.request.Request(
                        perm_url,
                        data=json.dumps({"role": "reader", "type": "anyone"}).encode("utf-8"),
                        headers={
                            "Authorization": f"Bearer {token}",
                            "Content-Type": "application/json"
                        },
                        method="POST"
                    )
                    urllib.request.urlopen(perm_req, timeout=10)
                except Exception:
                    pass

            direct_link = f"https://drive.google.com/uc?export=view&id={file_id}" if file_id else data.get("webContentLink")
            print(f"[DRIVE SYNC] Uploaded '{filename}' to Google Drive (ID: {file_id})")
            return {
                "file_id": file_id,
                "name": filename,
                "webViewLink": data.get("webViewLink", f"https://drive.google.com/file/d/{file_id}/view"),
                "webContentLink": direct_link,
                "direct_url": direct_link
            }
    except Exception as e:
        print(f"[DRIVE SYNC] API upload notice for '{filename}': {e}")
        return None


def upload_files_via_selenium(
    driver,
    filepaths: List[str],
    folder_id: str = DEFAULT_DRIVE_FOLDER_ID
) -> bool:
    """
    Automates Google Drive web interface upload via the existing authenticated Chrome session.
    Zero API credentials required!
    """
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    valid_files = [os.path.abspath(f) for f in filepaths if os.path.isfile(f)]
    if not valid_files:
        return False

    drive_folder_url = f"https://drive.google.com/drive/folders/{folder_id}"
    print(f"\n[DRIVE SYNC] Navigating to Google Drive folder:")
    print(f"             {drive_folder_url}")

    try:
        driver.get(drive_folder_url)
        time.sleep(4)

        # Look for the hidden file upload input element in Google Drive
        # Google Drive standard upload input selector
        inputs = driver.find_elements(By.XPATH, "//input[@type='file']")
        target_input = None
        for inp in inputs:
            target_input = inp
            break

        if not target_input:
            # Click "+ New" button to reveal or trigger file upload input
            new_btn_selectors = [
                "//button[contains(., 'New') or contains(., 'Nouveau')]",
                "//div[contains(@aria-label, 'New') or contains(@aria-label, 'Nouveau')]",
                "//button[contains(@aria-label, 'New')]"
            ]
            for sel in new_btn_selectors:
                btns = driver.find_elements(By.XPATH, sel)
                if btns and btns[0].is_displayed():
                    try:
                        btns[0].click()
                        time.sleep(1.5)
                        break
                    except Exception:
                        pass
            inputs = driver.find_elements(By.XPATH, "//input[@type='file']")
            if inputs:
                target_input = inputs[0]

        if target_input:
            # Send file paths to input (newline separated or sequential)
            joined_paths = "\n".join(valid_files)
            target_input.send_keys(joined_paths)
            print(f"[DRIVE SYNC] Upload triggered for {len(valid_files)} files into Google Drive!")
            print("[DRIVE SYNC] Waiting for uploads to complete in Google Drive...")
            time.sleep(8)
            return True
        else:
            print("[DRIVE SYNC] Notice: Could not locate file upload input in Google Drive web interface.")
            return False
    except Exception as e:
        print(f"[DRIVE SYNC] Selenium Google Drive upload notice: {e}")
        return False


def sync_project_to_google_drive(
    project_dir: str,
    folder_id: str = DEFAULT_DRIVE_FOLDER_ID,
    token: Optional[str] = None,
    selenium_driver = None
) -> Dict[str, Any]:
    """
    Master project synchronization function:
    Uploads all design images and the master Excel spreadsheet into Google Drive.
    """
    designs_dir = os.path.join(project_dir, "designs")
    files_to_upload = []

    # 1. Collect all design image files
    if os.path.isdir(designs_dir):
        for fname in os.listdir(designs_dir):
            if fname.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                files_to_upload.append(os.path.join(designs_dir, fname))

    # 2. Collect Master Excel Catalog
    for fname in os.listdir(project_dir):
        if fname.lower().endswith(".xlsx"):
            files_to_upload.append(os.path.join(project_dir, fname))

    if not files_to_upload:
        print(f"[DRIVE SYNC] No assets found to upload in {project_dir}")
        return {"uploaded": 0, "drive_folder": DEFAULT_DRIVE_FOLDER_URL}

    print("\n" + "=" * 75)
    print("[*] SYNCHRONIZING ASSETS TO GOOGLE DRIVE")
    print("=" * 75)
    print(f"  * Destination Folder: {folder_id}")
    print(f"  * Folder URL:         {DEFAULT_DRIVE_FOLDER_URL}")
    print(f"  * Files to Upload:    {len(files_to_upload)}")
    for f in files_to_upload:
        print(f"    - {os.path.basename(f)}")
    print("-" * 75)

    uploaded_records = []

    # Attempt API upload first if token is available
    drive_token = token or get_stored_drive_token()
    if drive_token:
        print("[DRIVE SYNC] Executing official Google Drive API v3 upload...")
        for fpath in files_to_upload:
            res = upload_file_drive_api(fpath, folder_id=folder_id, token=drive_token)
            if res:
                uploaded_records.append(res)

    # If API upload was not possible or returned 0, use Chrome Selenium session
    if not uploaded_records and selenium_driver:
        print("[DRIVE SYNC] Initiating Chrome Selenium authenticated browser upload...")
        success = upload_files_via_selenium(selenium_driver, files_to_upload, folder_id=folder_id)
        if success:
            for fpath in files_to_upload:
                uploaded_records.append({
                    "name": os.path.basename(fpath),
                    "webViewLink": DEFAULT_DRIVE_FOLDER_URL,
                    "direct_url": DEFAULT_DRIVE_FOLDER_URL
                })

    print(f"[DRIVE SYNC] Synchronization completed ({len(uploaded_records)}/{len(files_to_upload)} files processed).")
    print("=" * 75 + "\n")

    return {
        "success": True,
        "uploaded_count": len(uploaded_records),
        "folder_url": DEFAULT_DRIVE_FOLDER_URL,
        "folder_id": folder_id,
        "files": uploaded_records
    }
