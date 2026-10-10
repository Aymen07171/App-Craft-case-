import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

new_btn = driver.find_element(By.XPATH, "//button[contains(., 'New')]")
print("Using ActionChains to click New button...")
ActionChains(driver).move_to_element(new_btn).click().perform()
time.sleep(1.5)

menu_items = driver.find_elements(By.XPATH, "//li[@data-key='19' or contains(., 'File upload')]")
print(f"Found {len(menu_items)} 'File upload' menu items!")
if menu_items:
    print(f"Text: '{menu_items[0].text.strip()}'")
    ActionChains(driver).move_to_element(menu_items[0]).click().perform()
    time.sleep(1)
    
    inputs = driver.find_elements(By.XPATH, "//input[@type='file']")
    print(f"Found {len(inputs)} file inputs after click!")
    for inp in inputs:
        print("Input:", inp.get_attribute("outerHTML"))
