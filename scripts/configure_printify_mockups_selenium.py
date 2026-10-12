#!/usr/bin/env python3
"""
1. Captures a verification screenshot of 6acca8512fe24e63d7081433 on Printify showing 8/20 mockups selected
   (2 custom lifestyle mockups first with Primary badge + 6 designated Printify mockups).
2. Also configures 6aca3ec764139bf30d00f20f (Ancient Root Colossus) so it has ONLY the 6 designated mockups instead of 20.
"""

import json
import time
import urllib.request
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def main():
    opts = Options()
    opts.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
    driver = webdriver.Chrome(options=opts)
    driver.set_window_size(1440, 960)

    # 1. Open 6acca8512fe24e63d7081433 product details and take verification screenshot
    driver.get("https://printify.com/app/product-details/6acca8512fe24e63d7081433")
    time.sleep(5)
    driver.execute_script("""
        document.querySelectorAll('[data-amplitude-engagement-modal-overlay], .rc-dialog-root, .rc-dialog-mask, .rc-dialog-wrap').forEach(el => el.remove());
    """)
    time.sleep(1)
    screenshot_path = r"C:\Users\jacka\.gemini\antigravity\brain\93b4ac09-5823-4126-86c4-fc067944487c\printify_frog_8_mockups_verified.png"
    driver.save_screenshot(screenshot_path)
    print("Saved verification screenshot ->", screenshot_path)

    # 2. Also fix 6aca3ec764139bf30d00f20f (Ancient Root Colossus) which had 20 mockups selected
    pid = "6aca3ec764139bf30d00f20f"
    driver.get(f"https://printify.com/app/mockup-library/shops/29067558/products/{pid}")
    time.sleep(5)

    clear_btns = driver.find_elements(By.CSS_SELECTOR, "button.controls-clear")
    if clear_btns:
        driver.execute_script("arguments[0].click();", clear_btns[0])
        time.sleep(1.5)

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

    save_sel_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Save selection')]")
    if save_sel_btns:
        driver.execute_script("arguments[0].click();", save_sel_btns[0])
        time.sleep(4.5)

    save_draft_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Save as draft')]")
    for b in save_draft_btns:
        if b.is_displayed() and b.is_enabled():
            driver.execute_script("arguments[0].click();", b)
            time.sleep(5.0)
            break

    # Leave browser open on the Frog product details page for the user
    driver.get("https://printify.com/app/product-details/6acca8512fe24e63d7081433")
    time.sleep(3)
    print("Done! Browser is on 6acca8512fe24e63d7081433.")

if __name__ == "__main__":
    main()
