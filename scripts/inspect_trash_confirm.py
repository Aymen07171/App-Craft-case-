import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

target_name = "CASE-LOTUSS-002_9x16_Artwork.png"
print(f"Finding: {target_name}")

elems = driver.find_elements(By.XPATH, f"//*[contains(text(), '{target_name}')]")
if elems:
    el = elems[0]
    row = el.find_element(By.XPATH, "./ancestor-or-self::div[@role='row' or @data-target='item' or @data-id or contains(@class, 'c-P-p') or contains(@class, 'i92Sbe')][1]")
    ActionChains(driver).move_to_element(row).click().perform()
    time.sleep(1)
    
    trash_btns = driver.find_elements(By.XPATH, "//div[@aria-label='Move to trash Delete' or contains(@data-tooltip, 'Move to trash')]")
    if trash_btns:
        print("Clicking trash button...")
        ActionChains(driver).move_to_element(trash_btns[0]).click().perform()
        time.sleep(2)
        
        # Check for dialog or confirm button
        dialogs = driver.find_elements(By.XPATH, "//*[@role='dialog'] | //div[contains(@class, 'modal')]")
        print(f"Dialogs found: {len(dialogs)}")
        for d in dialogs:
            print("Dialog text:", d.text.strip().replace('\n', ' '))
            
        confirm_btns = driver.find_elements(By.XPATH, "//button[contains(., 'trash') or contains(., 'Trash') or contains(., 'Move') or contains(., 'Delete')]")
        print(f"Confirm buttons: {len(confirm_btns)}")
        for cb in confirm_btns:
            print("  Confirm btn:", cb.text.strip())
            
        toasts = driver.find_elements(By.XPATH, "//*[contains(text(), 'trash') or contains(text(), 'Trash')]")
        for t in toasts:
            if t.text.strip():
                print("  Toast:", t.text.strip())
