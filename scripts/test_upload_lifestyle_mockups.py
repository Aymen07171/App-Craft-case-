#!/usr/bin/env python3
import os
import time
import json
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
driver = webdriver.Chrome(options=opts)

ip_path = os.path.abspath("public/mockups/CASE-FROGLV-002_iPhone_18_Pro_Max_Lifestyle.png")
sg_path = os.path.abspath("public/mockups/CASE-FROGLV-002_Samsung_Galaxy_S26_Lifestyle.png")

print(f"Uploading files: \n  1. {ip_path}\n  2. {sg_path}")

# Click upload button to reveal file input if not present
file_inputs = driver.find_elements(By.CSS_SELECTOR, "input[data-testid='fileInput']")
if not file_inputs:
    btn = driver.find_element(By.CSS_SELECTOR, "button[data-analyticsid='mockupLibraryNavigationUpload'], pfy-button[data-testid='emptyStateUploadMockup'] button")
    driver.execute_script("arguments[0].click();", btn)
    time.sleep(1)
    file_inputs = driver.find_elements(By.CSS_SELECTOR, "input[data-testid='fileInput']")

file_input = file_inputs[0]

# On Windows Selenium, multiple files are sent joined by \n
file_input.send_keys(f"{ip_path}\n{sg_path}")
print("Sent keys to file input! Waiting for upload to complete...")
time.sleep(6)

# Check mockups under My Uploads
my_uploads = driver.execute_script("""
    return Array.from(document.querySelectorAll('button.mockup-container')).map(m => {
        const img = m.querySelector('img');
        const cb = m.querySelector('[data-testid="checkboxWrapper"]');
        return {
            alt: img ? img.alt : '',
            src: img ? img.src : '',
            checked: cb ? cb.getAttribute('aria-checked') : null
        };
    });
""")
print("MOCKUPS IN VIEW:", json.dumps(my_uploads[:6], indent=2))
