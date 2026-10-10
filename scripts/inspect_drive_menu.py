import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

new_btn = driver.find_element(By.XPATH, "//button[contains(., 'New')]")
print("Clicking 'New' button...")
new_btn.click()
time.sleep(2)

# Inspect all menu items or newly appeared elements
menu_items = driver.find_elements(By.XPATH, "//*[@role='menuitem' or contains(@class, 'menuitem') or contains(text(), 'File upload') or contains(text(), 'Importer un fichier')]")
print(f"Found {len(menu_items)} menu items:")
for i, m in enumerate(menu_items):
    print(f"  Item {i}: text='{m.text.strip()}' tag={m.tag_name} class='{m.get_attribute('class')}'")

inputs = driver.find_elements(By.XPATH, "//input[@type='file']")
print(f"Found {len(inputs)} file inputs after clicking New.")
for i, inp in enumerate(inputs):
    print(f"  Input {i}: id={inp.get_attribute('id')}, name={inp.get_attribute('name')}, outerHTML={inp.get_attribute('outerHTML')[:100]}")
