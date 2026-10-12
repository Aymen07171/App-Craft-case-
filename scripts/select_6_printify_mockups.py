#!/usr/bin/env python3
import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
driver = webdriver.Chrome(options=opts)

# 1. Click "Printify mockups" tab
tab = driver.find_element(By.XPATH, "//*[contains(@class, 'tab-label') and contains(text(), 'Printify mockups')]")
print("Clicking 'Printify mockups' tab...")
driver.execute_script("arguments[0].click();", tab)
time.sleep(2)

targets = [
    ("iPhone 18 Pro Max", "camera_label=front"),
    ("iPhone 16 Pro Max", "camera_label=close-up"),
    ("iPhone 16 Pro Max", "camera_label=layers"),
    ("iPhone 11", "camera_label=context-1"),
    ("Samsung Galaxy S24", "camera_label=close-up-2"),
    ("Samsung Galaxy S26", "camera_label=front"),
]

for model_name, cam_query in targets:
    cards = driver.find_elements(By.XPATH, f"//button[contains(@class, 'view-type-card') and normalize-space(.)='{model_name}']")
    if cards:
        driver.execute_script("arguments[0].scrollIntoView({block: 'nearest', inline: 'center'}); arguments[0].click();", cards[0])
        time.sleep(1.2)
        driver.execute_script("""
            const camQuery = arguments[0];
            const buttons = Array.from(document.querySelectorAll('button.mockup-container:not(.draggable)'));
            for (const btn of buttons) {
                const img = btn.querySelector('img');
                if (img && img.src.includes(camQuery)) {
                    const cbWrapper = btn.querySelector('[data-testid="checkboxWrapper"]');
                    const cbInput = btn.querySelector('input[data-testid="checkboxInput"]');
                    if (cbWrapper && cbWrapper.getAttribute('aria-checked') !== 'true') {
                        if (cbInput) cbInput.click();
                        else cbWrapper.click();
                    }
                    break;
                }
            }
        """, cam_query)
        time.sleep(0.6)

# Check count
count_text = driver.execute_script("""
    return (document.body.innerText.match(/\\d+\\s*\\/\\s*20\\s*selected/i) || [''])[0];
""")
print(f"Selection count: {count_text}")

# Click Save selection
save_sel_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Save selection')]")
if save_sel_btns:
    print("Clicking 'Save selection'...")
    driver.execute_script("arguments[0].click();", save_sel_btns[0])
    time.sleep(5.0)

# Click Save as draft
save_draft_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Save as draft')]")
for b in save_draft_btns:
    if b.is_displayed() and b.is_enabled():
        print("Clicking 'Save as draft'...")
        driver.execute_script("arguments[0].click();", b)
        time.sleep(5.0)
        break

driver.save_screenshot(r"C:\Users\jacka\.gemini\antigravity\brain\93b4ac09-5823-4126-86c4-fc067944487c\verified_8_selected.png")
print("Saved verified_8_selected.png!")
