import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

def main():
    designs_dir = os.path.abspath("public/designs")
    all_files = []
    for f in sorted(os.listdir(designs_dir)):
        if f.startswith("CASE-") and f.endswith(".png"):
            all_files.append(os.path.join(designs_dir, f))

    excel_file = os.path.abspath("CaseCraft_Master_30_Designs_Catalog.xlsx")
    if os.path.isfile(excel_file):
        all_files.append(excel_file)

    print(f"[*] Total files to upload to Google Drive: {len(all_files)}")
    if not all_files:
        print("[!] No files found.")
        return

    opts = Options()
    opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
    driver = webdriver.Chrome(options=opts)

    print(f"[*] Google Drive Tab: '{driver.title}'")
    print(f"[*] Google Drive URL: {driver.current_url}")

    # Check for existing input or create it via ActionChains
    inputs = driver.find_elements(By.XPATH, "//input[@type='file' and not(@id='py_test_upload_input')]")
    if not inputs:
        print("[*] Triggering File upload via New button...")
        new_btn = driver.find_element(By.XPATH, "//button[contains(., 'New')]")
        ActionChains(driver).move_to_element(new_btn).click().perform()
        time.sleep(1.5)

        file_upload_item = driver.find_element(By.XPATH, "//li[@data-key='19' or contains(., 'File upload')]")
        ActionChains(driver).move_to_element(file_upload_item).click().perform()
        time.sleep(1.5)

        inputs = driver.find_elements(By.XPATH, "//input[@type='file' and not(@id='py_test_upload_input')]")

    if not inputs:
        print("[!] Error: Could not reveal file input element.")
        return

    target_input = inputs[0]
    print(f"[*] Found upload input element: {target_input.get_attribute('outerHTML')}")

    # Send all files
    joined_paths = "\n".join(all_files)
    print(f"[*] Sending all {len(all_files)} files to Google Drive upload input...")
    target_input.send_keys(joined_paths)
    print("[*] send_keys executed successfully!")

    # Monitor upload progress
    print("[*] Monitoring Google Drive upload progress...")
    start_time = time.time()
    max_wait = 240  # up to 4 minutes for all 30 images + excel (~160MB total)

    last_status = ""
    while time.time() - start_time < max_wait:
        time.sleep(5)
        # Find upload status elements
        elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Upload') or contains(text(), 'upload') or contains(text(), 'complete') or contains(text(), 'item') or contains(text(), 'left')]")
        texts = [e.text.strip().replace('\n', ' ') for e in elements if e.text.strip()]
        unique_texts = [t for t in dict.fromkeys(texts) if any(kw in t.lower() for kw in ['upload', 'complete', 'item', 'left'])]
        
        current_status = " | ".join(unique_texts[:3])
        if current_status and current_status != last_status:
            print(f"    [{int(time.time() - start_time)}s] Drive Status: {current_status}")
            last_status = current_status

        # Check for completion
        if any("uploads complete" in t.lower() for t in unique_texts):
            print(f"\n[+] SUCCESS! All {len(all_files)} files successfully uploaded to Google Drive!")
            break
        elif any("upload complete" in t.lower() and f"{len(all_files)}" in t.lower() for t in unique_texts):
            print(f"\n[+] SUCCESS! Upload complete for all items!")
            break

    print(f"\n[*] Upload process finished. Duration: {int(time.time() - start_time)}s")

if __name__ == "__main__":
    main()
