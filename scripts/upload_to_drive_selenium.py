#!/usr/bin/env python3
"""
Upload batch 30 assets to Google Drive using Chrome Selenium session
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gemini_web_selenium import GeminiWebAutomationEngine
from drive_sync import DEFAULT_DRIVE_FOLDER_ID

def main():
    designs_dir = os.path.abspath("public/designs")
    files = []
    if os.path.isdir(designs_dir):
        for f in os.listdir(designs_dir):
            if f.endswith(".png") and f.startswith("CASE-"):
                files.append(os.path.join(designs_dir, f))

    excel_file = os.path.abspath("CaseCraft_Master_30_Designs_Catalog.xlsx")
    if os.path.isfile(excel_file):
        files.append(excel_file)

    print(f"Total files to upload to Google Drive: {len(files)}")
    if not files:
        print("No files found.")
        return

    engine = GeminiWebAutomationEngine(headless=False)
    try:
        engine.start_browser()
        driver = engine.driver
        drive_url = f"https://drive.google.com/drive/folders/{DEFAULT_DRIVE_FOLDER_ID}"
        print(f"Opening Google Drive folder: {drive_url}")
        driver.get(drive_url)
        time.sleep(5)

        # Look for upload input
        inputs = driver.find_elements("xpath", "//input[@type='file']")
        if not inputs:
            print("File input not directly found in DOM, clicking New...")
            new_btns = driver.find_elements("xpath", "//button[contains(., 'New') or contains(., 'Nouveau')]")
            if new_btns:
                new_btns[0].click()
                time.sleep(2)
            inputs = driver.find_elements("xpath", "//input[@type='file']")

        if inputs:
            joined = "\n".join(files)
            inputs[0].send_keys(joined)
            print(f"Sent {len(files)} files to Google Drive upload input!")
            print("Waiting for uploads to register...")
            time.sleep(10)
        else:
            print("Notice: Could not locate upload input element.")
    except Exception as e:
        print(f"Drive upload notice: {e}")
    finally:
        engine.close()

if __name__ == "__main__":
    main()
