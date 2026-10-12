#!/usr/bin/env python3
"""
scripts/configure_all_frog_mockups.py
Configures the strict 8/20 mockup gallery across all frog products in Printify:
- Uploads the 2 custom lifestyle mockups (iPhone 18 Pro Max & Samsung Galaxy S26)
- Confirms them to appear first with iPhone 18 Pro Max as Primary
- Selects ONLY the 6 approved Printify mockups:
  1. Front view — iPhone 18 Pro Max
  2. Close-up view — iPhone 16 Pro Max
  3. Standard view — iPhone 16 Pro Max
  4. Context view 1 — iPhone 11
  5. Samsung Galaxy S24
  6. Front view — Samsung Galaxy S26
- Saves selection and saves draft.
- Verifies exact 8 mockups via Printify REST API.
"""

import os
import sys
import time
import json
import urllib.request
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

# Load API token
env = Path(".env").read_text(encoding="utf-8")
token = [l.split("=", 1)[1].strip() for l in env.splitlines() if l.startswith("PRINTIFY_API_TOKEN=")][0]

SHOP_ID = "29067558"

PRODUCTS_TO_CONFIGURE = [
    {
        "sku": "CASE-FROGLV-003",
        "pid": "6acce0bbc73d3718f10562f1",
        "ip_mockup": "public/mockups/CASE-FROGLV-003_iPhone_18_Pro_Max_Lifestyle.png",
        "sg_mockup": "public/mockups/CASE-FROGLV-003_Samsung_Galaxy_S26_Lifestyle.png",
    },
    {
        "sku": "CASE-FROGLV-004",
        "pid": "6acce0bfd84251369c0ac373",
        "ip_mockup": "public/mockups/CASE-FROGLV-004_iPhone_18_Pro_Max_Lifestyle.png",
        "sg_mockup": "public/mockups/CASE-FROGLV-004_Samsung_Galaxy_S26_Lifestyle.png",
    },
    {
        "sku": "CASE-FROGLV-005",
        "pid": "6acce0c48b0d8773c80012eb",
        "ip_mockup": "public/mockups/CASE-FROGLV-005_iPhone_18_Pro_Max_Lifestyle.png",
        "sg_mockup": "public/mockups/CASE-FROGLV-005_Samsung_Galaxy_S26_Lifestyle.png",
    },
    {
        "sku": "CASE-FROGLV-006",
        "pid": "6acce0c8997ccda18c0325ef",
        "ip_mockup": "public/mockups/CASE-FROGLV-006_iPhone_18_Pro_Max_Lifestyle.png",
        "sg_mockup": "public/mockups/CASE-FROGLV-006_Samsung_Galaxy_S26_Lifestyle.png",
    },
    {
        "sku": "CASE-FROGLV-007",
        "pid": "6acce0cdd84251369c0ac382",
        "ip_mockup": "public/mockups/CASE-FROGLV-007_iPhone_18_Pro_Max_Lifestyle.png",
        "sg_mockup": "public/mockups/CASE-FROGLV-007_Samsung_Galaxy_S26_Lifestyle.png",
    },
]

TARGET_PRINTIFY_MOCKUPS = [
    ("iPhone 18 Pro Max", "camera_label=front"),
    ("iPhone 16 Pro Max", "camera_label=close-up"),
    ("iPhone 16 Pro Max", "camera_label=layers"),
    ("iPhone 11", "camera_label=context-1"),
    ("Samsung Galaxy S24", "camera_label=close-up-2"),
    ("Samsung Galaxy S26", "camera_label=front"),
]

def verify_api_product(pid):
    req = urllib.request.Request(
        f"https://api.printify.com/v1/shops/{SHOP_ID}/products/{pid}.json",
        headers={"Authorization": f"Bearer {token}", "User-Agent": "CraftCase/1.0"}
    )
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read().decode())
        imgs = data.get("images", [])
        return len(imgs), imgs

def configure_product(driver, item):
    sku = item["sku"]
    pid = item["pid"]
    print(f"\n==================================================")
    print(f"CONFIGURING [{sku}] PID: {pid}")
    print(f"==================================================")

    url = f"https://printify.com/app/mockup-library/shops/{SHOP_ID}/products/{pid}"
    driver.get(url)
    time.sleep(5)

    # Remove modals/overlays
    driver.execute_script("""
        document.querySelectorAll('[data-amplitude-engagement-modal-overlay], .rc-dialog-root, .rc-dialog-mask, .rc-dialog-wrap').forEach(el => el.remove());
        const popups = Array.from(document.querySelectorAll('div')).filter(d => d.innerText.includes('MULTI-USER ACCESS') || d.innerText.includes('Sharing is caring'));
        popups.forEach(p => p.remove());
    """)
    time.sleep(1)

    # Clear all default selections first
    clear_btns = driver.find_elements(By.CSS_SELECTOR, "button.controls-clear")
    if clear_btns:
        print("Clearing default selections...")
        driver.execute_script("arguments[0].click();", clear_btns[0])
        time.sleep(1.5)

    # Click Upload button to reveal file input
    upload_nav_btns = driver.find_elements(By.CSS_SELECTOR, "button[data-analyticsid='mockupLibraryNavigationUpload'], pfy-button[data-testid='emptyStateUploadMockup'] button")
    if upload_nav_btns:
        driver.execute_script("arguments[0].click();", upload_nav_btns[0])
        time.sleep(1.5)

    # Remove popups again if any appeared
    driver.execute_script("""
        document.querySelectorAll('[data-amplitude-engagement-modal-overlay], .rc-dialog-root, .rc-dialog-mask, .rc-dialog-wrap').forEach(el => el.remove());
        const popups = Array.from(document.querySelectorAll('div')).filter(d => d.innerText.includes('MULTI-USER ACCESS') || d.innerText.includes('Sharing is caring'));
        popups.forEach(p => p.remove());
    """)
    time.sleep(1)

    file_inputs = driver.find_elements(By.CSS_SELECTOR, "input[data-testid='fileInput']")
    if not file_inputs:
        print("[ERROR] File input not found!")
        return False

    ip_abs = os.path.abspath(item["ip_mockup"])
    sg_abs = os.path.abspath(item["sg_mockup"])
    print(f"Sending custom mockups:\n  {ip_abs}\n  {sg_abs}")
    file_inputs[0].send_keys(f"{ip_abs}\n{sg_abs}")
    time.sleep(5)

    # Click Confirm button
    confirm_btns = driver.find_elements(By.XPATH, "//button[normalize-space(.)='Confirm']")
    if confirm_btns:
        print("Clicking 'Confirm' button in drawer...")
        driver.execute_script("arguments[0].click();", confirm_btns[0])
        time.sleep(4)

    # Switch to Printify mockups tab
    mockup_tabs = driver.find_elements(By.XPATH, "//*[contains(@class, 'tab-label') and contains(text(), 'Printify mockups')]")
    if mockup_tabs:
        print("Switching to 'Printify mockups' tab...")
        driver.execute_script("arguments[0].click();", mockup_tabs[0])
        time.sleep(2)

    # Select the 6 designated mockups
    for model_name, cam_query in TARGET_PRINTIFY_MOCKUPS:
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

    # Save selection
    save_sel_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Save selection')]")
    if save_sel_btns:
        print("Clicking 'Save selection'...")
        driver.execute_script("arguments[0].click();", save_sel_btns[0])
        time.sleep(5.0)

    # Save as draft
    save_draft_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Save as draft')]")
    for b in save_draft_btns:
        if b.is_displayed() and b.is_enabled():
            print("Clicking 'Save as draft'...")
            driver.execute_script("arguments[0].click();", b)
            time.sleep(5.0)
            break

    # Verify via API
    cnt, imgs = verify_api_product(pid)
    print(f"[VERIFIED] Product {pid} has {cnt} mockups selected in API.")
    return cnt == 8

def main():
    opts = Options()
    opts.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
    driver = webdriver.Chrome(options=opts)

    all_ok = True
    for item in PRODUCTS_TO_CONFIGURE:
        ok = configure_product(driver, item)
        if not ok:
            all_ok = False
        time.sleep(2)

    print("\n" + "=" * 70)
    print("ALL 5 REMAINING PRODUCTS CONFIGURED!" if all_ok else "SOME PRODUCTS HAD ISSUES")
    print("=" * 70)

if __name__ == "__main__":
    main()
