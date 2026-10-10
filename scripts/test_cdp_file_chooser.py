import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

test_file = os.path.abspath("CaseCraft_Master_30_Designs_Catalog.xlsx")
print(f"Testing CDP FileChooser on: {test_file}")

# 1. Enable Page domain and enable file chooser interception
try:
    driver.execute_cdp_cmd("Page.enable", {})
    driver.execute_cdp_cmd("Page.setInterceptFileChooserDialog", {"enabled": True})
    print("Successfully enabled Page.setInterceptFileChooserDialog!")
except Exception as e:
    print(f"CDP enable error: {e}")

# 2. Look for the 'File upload' item or 'New' button
# First ensure menu is open
try:
    file_upload_items = driver.find_elements(By.XPATH, "//li[@data-key='19' or contains(., 'File upload') or contains(., 'Importer un fichier')]")
    if not file_upload_items:
        print("Menu not open, clicking New button...")
        new_btn = driver.find_element(By.XPATH, "//button[contains(., 'New')]")
        driver.execute_script("arguments[0].click();", new_btn)
        time.sleep(1)
        file_upload_items = driver.find_elements(By.XPATH, "//li[@data-key='19' or contains(., 'File upload') or contains(., 'Importer un fichier')]")

    if file_upload_items:
        print(f"Found 'File upload' item: {file_upload_items[0].text.strip()}")
        # Click it via JS
        driver.execute_script("arguments[0].click();", file_upload_items[0])
        print("Clicked 'File upload' menu item!")
        time.sleep(1)

        # Handle file chooser with CDP
        driver.execute_cdp_cmd("Page.handleFileChooser", {
            "action": "accept",
            "files": [test_file]
        })
        print(f"CDP handleFileChooser sent with: {test_file}")

        # Wait to see if upload starts
        print("Waiting 10s for upload dialog...")
        time.sleep(10)
    else:
        print("Could not find 'File upload' menu item.")
except Exception as e:
    print(f"Error during file chooser test: {e}")
