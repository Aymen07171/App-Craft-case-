#!/usr/bin/env python3
import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
driver = webdriver.Chrome(options=opts)

# Inspect what happens when clicking My Uploads
my_uploads_tabs = driver.find_elements(By.XPATH, "//*[contains(@class, 'tab-label') and contains(text(), 'My Uploads')]")
if my_uploads_tabs:
    print("Clicking 'My Uploads' tab...")
    driver.execute_script("arguments[0].click();", my_uploads_tabs[0])
    time.sleep(2)

# Check elements in My Uploads tab
info = driver.execute_script("""
    const uploadBtn = document.querySelector('button.button:has(svg), button:has([data-icon="upload"])');
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, id: i.id, accept: i.accept, class: i.className }));
    const mockups = Array.from(document.querySelectorAll('button.mockup-container')).map(m => {
        const img = m.querySelector('img');
        return { alt: img ? img.alt : '', src: img ? img.src : '' };
    });
    return { inputs, mockups: mockups.slice(0, 10) };
""")
print("MY UPLOADS TAB INFO:", json.dumps(info, indent=2))
