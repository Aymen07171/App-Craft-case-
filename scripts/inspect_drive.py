import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)
print('Current URL:', driver.current_url)
print('Current Title:', driver.title)

inputs = driver.find_elements(By.XPATH, "//input[@type='file']")
print(f"Found {len(inputs)} file inputs directly.")
for i, inp in enumerate(inputs):
    print(f"  Input {i}: id={inp.get_attribute('id')}, name={inp.get_attribute('name')}, multiple={inp.get_attribute('multiple')}")

# Check for New button
new_buttons = driver.find_elements(By.XPATH, "//button[contains(., 'New') or contains(., 'Nouveau') or contains(@aria-label, 'New') or contains(@aria-label, 'Nouveau')]")
print(f"Found {len(new_buttons)} 'New' buttons.")
for i, btn in enumerate(new_buttons):
    print(f"  Btn {i}: text='{btn.text.strip()}', aria='{btn.get_attribute('aria-label')}'")

# Check what items currently exist in this folder
items = driver.find_elements(By.XPATH, "//div[@role='row' or @data-target='item' or contains(@class, 'grid-item')]")
print(f"Items in folder: {len(items)}")
