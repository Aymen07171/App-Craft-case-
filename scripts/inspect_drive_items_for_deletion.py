import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

print("Refreshing Google Drive page to get updated view...")
driver.get("https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO")
time.sleep(4)

# Find all file rows
rows = driver.find_elements(By.XPATH, "//div[@role='row' or @data-target='item' or contains(@class, 'c-P-p') or @data-id]")
print(f"Total row elements found: {len(rows)}")

for i, r in enumerate(rows[:10]):
    print(f"Row {i}: text='{r.text.strip().replace(chr(10), ' | ')}' aria-label='{r.get_attribute('aria-label')}'")
