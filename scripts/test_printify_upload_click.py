#!/usr/bin/env python3
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
driver = webdriver.Chrome(options=opts)

# Check if there is an input[type='file'] created dynamically or if file dialog is triggered
print("Before click, inputs:", len(driver.find_elements(By.CSS_SELECTOR, "input[type='file']")))

# Click button
btn = driver.find_element(By.CSS_SELECTOR, "button[data-analyticsid='mockupLibraryNavigationUpload'], pfy-button[data-testid='emptyStateUploadMockup'] button")
driver.execute_script("arguments[0].click();", btn)
time.sleep(1)

print("After click, inputs:", len(driver.find_elements(By.CSS_SELECTOR, "input[type='file']")))
for inp in driver.find_elements(By.CSS_SELECTOR, "input[type='file']"):
    print("Found input:", inp.get_attribute("outerHTML"))
