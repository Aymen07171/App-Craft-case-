import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

print("1. Looking for 'New' button...")
new_btn = driver.find_element(By.XPATH, "//button[contains(., 'New')]")
print(f"Found New button: {new_btn.text.strip()}, aria-expanded={new_btn.get_attribute('aria-expanded')}")

if new_btn.get_attribute('aria-expanded') != 'true':
    print("Clicking New button...")
    driver.execute_script("arguments[0].click();", new_btn)
    time.sleep(1)

# Look for File upload item
print("2. Looking for 'File upload' menu item...")
file_upload_item = driver.find_element(By.XPATH, "//li[@data-key='19' or contains(., 'File upload')]")
print(f"Found File upload item: {file_upload_item.text.strip()}")

print("3. Clicking 'File upload' item...")
driver.execute_script("arguments[0].click();", file_upload_item)
time.sleep(1)

print("4. Checking for input[type='file']...")
inputs = driver.find_elements(By.XPATH, "//input[@type='file']")
print(f"Found {len(inputs)} file inputs:")
for inp in inputs:
    print(f"  Input: {inp.get_attribute('outerHTML')}")
