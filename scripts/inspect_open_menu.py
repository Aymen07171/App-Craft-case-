import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

menu_items = driver.find_elements(By.XPATH, "//li[@role='menuitem'] | //div[@role='menuitem']")
print(f"Found {len(menu_items)} menu items:")
for i, m in enumerate(menu_items):
    print(f"Item {i}: text='{m.text.strip().replace(chr(10), ' ')}' data-key='{m.get_attribute('data-key')}' html={m.get_attribute('outerHTML')[:120]}")

inputs = driver.find_elements(By.XPATH, "//input[@type='file']")
print(f"File inputs: {len(inputs)}")
for i, inp in enumerate(inputs):
    print(f"Input {i}: outerHTML={inp.get_attribute('outerHTML')}")
