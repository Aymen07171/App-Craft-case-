import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

trash_btn = driver.find_element(By.XPATH, "//div[@aria-label='Move to trash Delete' or contains(@data-tooltip, 'Move to trash')]")
print("Clicking Move to Trash button...")
driver.execute_script("arguments[0].click();", trash_btn)
time.sleep(2)
print("Clicked!")

toasts = driver.find_elements(By.XPATH, "//*[contains(text(), 'Moved to trash') or contains(text(), 'trash')]")
for t in toasts:
    print("Toast:", t.text.strip())
