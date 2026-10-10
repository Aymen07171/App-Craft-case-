import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

# Find row for CASE-SEADRA-005
target_elems = driver.find_elements(By.XPATH, "//*[text()='CASE-SEADRA-005_9x16_Artwork.png']")
print(f"Found target elements: {len(target_elems)}")
if target_elems:
    el = target_elems[0]
    print(f"Clicking on {el.text}...")
    ActionChains(driver).move_to_element(el).click().perform()
    time.sleep(1)
    
    # Check if delete button appeared or send DELETE key
    trash_btns = driver.find_elements(By.XPATH, "//button[contains(@aria-label, 'trash') or contains(@aria-label, 'Trash') or contains(@aria-label, 'Delete') or contains(@aria-label, 'Remove') or contains(@data-tooltip, 'trash') or contains(@data-tooltip, 'Delete')]")
    print(f"Found trash/delete buttons: {len(trash_btns)}")
    for b in trash_btns:
        print(f"  Btn: aria='{b.get_attribute('aria-label')}' tooltip='{b.get_attribute('data-tooltip')}'")
    
    if trash_btns:
        print("Clicking trash button...")
        ActionChains(driver).move_to_element(trash_btns[0]).click().perform()
    else:
        print("Sending DELETE key to body...")
        driver.find_element(By.TAG_NAME, "body").send_keys(Keys.DELETE)
        
    time.sleep(2)
    # Check for toast notification (e.g. "Moved to trash")
    toasts = driver.find_elements(By.XPATH, "//*[contains(text(), 'trash') or contains(text(), 'Trash') or contains(text(), 'deleted') or contains(text(), 'supprimé')]")
    for t in toasts:
        print("Toast:", t.text.strip())
