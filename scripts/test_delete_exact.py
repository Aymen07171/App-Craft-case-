import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

target_name = "CASE-LOTUSS-005_9x16_Artwork.png"
print(f"Looking for: {target_name}")

elems = driver.find_elements(By.XPATH, f"//*[contains(text(), '{target_name}')]")
print(f"Found elements: {len(elems)}")

if elems:
    el = elems[0]
    # Find closest row or clickable container
    row = el.find_element(By.XPATH, "./ancestor-or-self::div[@role='row' or @data-target='item' or @data-id or contains(@class, 'c-P-p')][1]")
    print(f"Found row container: tag={row.tag_name} class={row.get_attribute('class')}")
    
    # Click row to select
    ActionChains(driver).move_to_element(row).click().perform()
    time.sleep(1)
    
    # Check trash button
    trash_btns = driver.find_elements(By.XPATH, "//div[@aria-label='Move to trash Delete' or contains(@data-tooltip, 'Move to trash')]")
    print(f"Found trash buttons: {len(trash_btns)}")
    if trash_btns:
        print("Clicking trash button...")
        driver.execute_script("arguments[0].click();", trash_btns[0])
        time.sleep(2)
        print("Successfully trashed!")
