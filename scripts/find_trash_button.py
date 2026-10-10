import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

# Find an item to select
item = driver.find_element(By.XPATH, "//*[text()='CASE-VOLCAN-005_9x16_Artwork.png']")
print(f"Clicking on {item.text}...")
ActionChains(driver).move_to_element(item).click().perform()
time.sleep(1)

# Inspect all buttons in the document
buttons = driver.find_elements(By.XPATH, "//button")
print(f"Found {len(buttons)} buttons.")
for b in buttons:
    aria = b.get_attribute("aria-label") or ""
    tooltip = b.get_attribute("data-tooltip") or ""
    txt = b.text.strip()
    if any(kw in (aria + tooltip + txt).lower() for kw in ['trash', 'delete', 'remove', 'corbeille', 'supprimer']):
        print(f"  TRASH BUTTON: aria='{aria}' tooltip='{tooltip}' txt='{txt}' class='{b.get_attribute('class')}'")
