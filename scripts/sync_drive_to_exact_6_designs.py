import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains

def main():
    opts = Options()
    opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
    driver = webdriver.Chrome(options=opts)

    print(f"Connecting to Google Drive tab: '{driver.title}'...")
    driver.get("https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO")
    time.sleep(4)

    # 1. Upload CaseCraft_Master_6_Designs_Catalog.xlsx
    excel_6_path = os.path.abspath("CaseCraft_Master_6_Designs_Catalog.xlsx")
    print(f"\n[*] Uploading 6-design catalog: {excel_6_path}")

    # Check for upload input or click New -> File upload
    inputs = driver.find_elements(By.XPATH, "//input[@type='file' and not(@id='py_test_upload_input')]")
    if not inputs:
        new_btn = driver.find_element(By.XPATH, "//button[contains(., 'New')]")
        ActionChains(driver).move_to_element(new_btn).click().perform()
        time.sleep(1.5)
        file_upload_item = driver.find_element(By.XPATH, "//li[@data-key='19' or contains(., 'File upload')]")
        ActionChains(driver).move_to_element(file_upload_item).click().perform()
        time.sleep(1.5)
        inputs = driver.find_elements(By.XPATH, "//input[@type='file' and not(@id='py_test_upload_input')]")

    if inputs:
        inputs[0].send_keys(excel_6_path)
        print("    Dispatched 6-design catalog to Google Drive upload input!")
        time.sleep(5)
        # Check if modal appeared to confirm upload
        upload_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Upload') or contains(., 'Keep') or contains(., 'Replace')]")
        for ub in upload_btns:
            if ub.text.strip().lower() == 'upload' or 'upload' in ub.text.strip().lower():
                driver.execute_script("arguments[0].click();", ub)
                time.sleep(2)
                break
    else:
        print("    [!] Could not locate upload input for 6-design catalog.")

    # 2. Delete unwanted files from Google Drive
    # Files to keep: 001 for each theme
    keep_stems = [
        "CASE-LOTUSS-001",
        "CASE-VOLCAN-001",
        "CASE-MOONBU-001",
        "CASE-PHOENI-001",
        "CASE-RONINS-001",
        "CASE-SEADRA-001",
        "CaseCraft_Master_6_Designs_Catalog"
    ]

    print("\n[*] Cleaning up Google Drive folder so only 1 design per category remains...")
    # Refresh to see all files
    driver.get("https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO")
    time.sleep(4)

    # Find all file rows/elements to remove
    deleted_count = 0
    max_rounds = 40
    for round_idx in range(max_rounds):
        # Look for text matching CASE- or CaseCraft_Master_30
        candidates = driver.find_elements(By.XPATH, "//*[contains(text(), 'CASE-') or contains(text(), 'CaseCraft_Master_30')]")
        target_el = None
        target_text = ""
        for cand in candidates:
            txt = cand.text.strip()
            if not txt:
                continue
            should_keep = any(k in txt for k in keep_stems)
            if not should_keep and (txt.startswith("CASE-") or txt.startswith("CaseCraft_Master_30")):
                target_el = cand
                target_text = txt
                break

        if not target_el:
            print(f"[*] No more unwanted items found after {round_idx} cycles.")
            break

        print(f"    Deleting [{round_idx+1}]: {target_text}...")
        try:
            ActionChains(driver).move_to_element(target_el).click().perform()
            time.sleep(0.5)
            # Send DELETE key
            driver.find_element(By.TAG_NAME, "body").send_keys(Keys.DELETE)
            deleted_count += 1
            time.sleep(1)
        except Exception as e:
            print(f"    Error deleting {target_text}: {e}")
            time.sleep(1)

    print(f"\n[*] Total unwanted items removed from Google Drive: {deleted_count}")

    # 3. Final verification of Google Drive contents
    time.sleep(3)
    driver.get("https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO")
    time.sleep(4)

    verified_files = []
    text_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'CASE-') or contains(text(), 'CaseCraft_Master')]")
    for te in text_elements:
        txt = te.text.strip()
        if txt and txt not in verified_files:
            verified_files.append(txt)

    print("\n" + "=" * 70)
    print(f"[*] FINAL VERIFIED GOOGLE DRIVE CONTENTS ({len(verified_files)} items):")
    print("=" * 70)
    for i, vf in enumerate(sorted(verified_files)):
        print(f"    {i+1}. {vf}")
    print("=" * 70)

if __name__ == "__main__":
    main()
