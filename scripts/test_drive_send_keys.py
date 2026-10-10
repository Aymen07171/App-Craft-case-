import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

test_file = os.path.abspath("CaseCraft_Master_30_Designs_Catalog.xlsx")
print(f"Target file: {test_file}")

# Find Google Drive's dynamic input
drive_inputs = driver.find_elements(By.XPATH, "//input[@type='file' and not(@id='py_test_upload_input')]")
print(f"Found {len(drive_inputs)} drive file input(s)!")

if drive_inputs:
    target_inp = drive_inputs[0]
    print("Sending file to Google Drive's native file input...")
    target_inp.send_keys(test_file)
    print("send_keys completed!")
    
    # Wait and check for upload progress/dialog
    for i in range(15):
        time.sleep(1)
        dialogs = driver.find_elements(By.XPATH, "//*[contains(text(), 'Uploading') or contains(text(), 'uploaded') or contains(text(), 'Importation') or contains(text(), '1 of 1')]")
        if dialogs:
            print(f"[{i+1}s] Upload dialog found: {[d.text.strip() for d in dialogs if d.text.strip()]}")
            break
        print(f"[{i+1}s] Waiting for upload dialog...")
else:
    print("Could not find drive input.")
