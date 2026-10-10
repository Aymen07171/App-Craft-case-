import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

buttons = driver.find_elements(By.XPATH, "//button[contains(., 'Upload') or contains(., 'Replace') or contains(., 'Keep')]")
print(f"Found {len(buttons)} modal buttons:")
for b in buttons:
    print(f"Button: text='{b.text.strip()}' class='{b.get_attribute('class')}'")

upload_btns = [b for b in buttons if b.text.strip().lower() == 'upload' or 'upload' in b.text.strip().lower()]
if upload_btns:
    print(f"Clicking modal confirm button: '{upload_btns[-1].text.strip()}'...")
    driver.execute_script("arguments[0].click();", upload_btns[-1])
    time.sleep(2)
    print("Clicked confirm button!")
else:
    print("No upload button found.")
