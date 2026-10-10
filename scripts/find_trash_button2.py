import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

# Inspect all elements with role='button'
role_buttons = driver.find_elements(By.XPATH, "//*[@role='button']")
print(f"Found {len(role_buttons)} elements with role='button':")
for b in role_buttons:
    aria = b.get_attribute("aria-label") or ""
    tooltip = b.get_attribute("data-tooltip") or ""
    txt = b.text.strip()
    full = (aria + " " + tooltip + " " + txt).lower()
    if any(kw in full for kw in ['trash', 'delete', 'remove', 'corbeille', 'supprimer']):
        print(f"  TRASH TARGET: tag={b.tag_name} aria='{aria}' tooltip='{tooltip}' class='{b.get_attribute('class')}'")
