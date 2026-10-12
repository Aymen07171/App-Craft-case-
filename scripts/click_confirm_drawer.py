#!/usr/bin/env python3
import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
driver = webdriver.Chrome(options=opts)

# Click Confirm button
confirm_btn = driver.find_element(By.XPATH, "//button[normalize-space(.)='Confirm']")
print("Clicking Confirm button...")
driver.execute_script("arguments[0].click();", confirm_btn)
time.sleep(4)

driver.save_screenshot(r"C:\Users\jacka\.gemini\antigravity\brain\93b4ac09-5823-4126-86c4-fc067944487c\after_confirm_screen.png")
print("Saved after_confirm_screen.png!")
