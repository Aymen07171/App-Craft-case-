#!/usr/bin/env python3
import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
driver = webdriver.Chrome(options=opts)

pid = "6acce0b68b0d8773c80012e6"
driver.get(f"https://printify.com/app/mockup-library/shops/29067558/products/{pid}")
time.sleep(5)

print("Current URL:", driver.current_url)

file_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='file']")
print("File inputs found:", len(file_inputs))
for idx, fi in enumerate(file_inputs):
    print(f"  FileInput #{idx}: id={fi.get_attribute('id')} accept={fi.get_attribute('accept')}")

btns = driver.find_elements(By.XPATH, "//button[contains(., 'Upload') or contains(., 'Clear all') or contains(., 'Save')]")
for idx, b in enumerate(btns):
    print(f"  Btn #{idx}: text={b.text!r} class={b.get_attribute('class')[:40]}")
