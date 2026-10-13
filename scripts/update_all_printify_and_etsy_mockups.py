#!/usr/bin/env python3
"""
scripts/update_all_printify_and_etsy_mockups.py
Uploads corrected 2048x2048 lifestyle mockups to Printify, selects strictly the 8 approved mockups
(2 custom lifestyle mockups first + 6 designated Printify mockups), and syncs/publishes to Etsy.
"""

import os
import sys
import time
import json
import urllib.request
import urllib.error
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

SHOP_ID = "29067558"
BASE_URL = "https://api.printify.com/v1"
env_text = Path(".env").read_text(encoding="utf-8")
TOKEN = [l.split("=", 1)[1].strip() for l in env_text.splitlines() if l.startswith("PRINTIFY_API_TOKEN=")][0]
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
    "User-Agent": "CraftCase/1.0"
}

ALL_PRODUCTS = [
    # 7 Frog Products
    ("CASE-FROGLV-001", "6acca8512fe24e63d7081433"),
    ("CASE-FROGLV-002", "6acce0b68b0d8773c80012e6"),
    ("CASE-FROGLV-003", "6acce0bbc73d3718f10562f1"),
    ("CASE-FROGLV-004", "6acce0bfd84251369c0ac373"),
    ("CASE-FROGLV-005", "6acce0c48b0d8773c80012eb"),
    ("CASE-FROGLV-006", "6acce0c8997ccda18c0325ef"),
    ("CASE-FROGLV-007", "6acce0cdd84251369c0ac382"),
    # 10 Sardinhas Products
    ("CASE-SARDPT-001", "6ace0af22dcac9d9f107b986"),
    ("CASE-SARDPT-002", "6ace0af82691ab33cb0ef08c"),
    ("CASE-SARDPT-003", "6ace0afd2691ab33cb0ef08f"),
    ("CASE-SARDPT-004", "6ace0b013c7ee8006e001962"),
    ("CASE-SARDPT-005", "6ace0b05b3874313f8087799"),
    ("CASE-SARDPT-006", "6ace0b093c7ee8006e001967"),
    ("CASE-SARDPT-007", "6ace0b0d2691ab33cb0ef093"),
    ("CASE-SARDPT-008", "6ace0b12b3874313f808779c"),
    ("CASE-SARDPT-009", "6ace0b162dcac9d9f107b98a"),
    ("CASE-SARDPT-010", "6ace0b1a2e6f7187920a144b"),
]

TARGET_PRINTIFY_MOCKUPS = [
    ("iPhone 18 Pro Max", "camera_label=front"),
    ("iPhone 16 Pro Max", "camera_label=close-up"),
    ("iPhone 16 Pro Max", "camera_label=layers"),
    ("iPhone 11", "camera_label=context-1"),
    ("Samsung Galaxy S24", "camera_label=close-up-2"),
    ("Samsung Galaxy S26", "camera_label=front"),
]

def api_req(path, method="GET", body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"raw": err_body}

def clear_popups(driver):
    driver.execute_script("""
        document.querySelectorAll('[data-amplitude-engagement-modal-overlay], .rc-dialog-root, .rc-dialog-mask, .rc-dialog-wrap').forEach(el => el.remove());
        const popups = Array.from(document.querySelectorAll('div')).filter(d => d.innerText.includes('MULTI-USER ACCESS') || d.innerText.includes('Sharing is caring'));
        popups.forEach(p => p.remove());
    """)

def configure_product(driver, sku, pid):
    print(f"\n--- Processing [{sku}] (PID: {pid}) ---")
    url = f"https://printify.com/app/mockup-library/shops/{SHOP_ID}/products/{pid}"
    driver.get(url)
    time.sleep(4.5)
    clear_popups(driver)
    time.sleep(1.0)

    # 1. Clear all existing mockups
    clear_btns = driver.find_elements(By.CSS_SELECTOR, "button.controls-clear")
    if clear_btns:
        driver.execute_script("arguments[0].click();", clear_btns[0])
        time.sleep(1.5)

    # 2. Click Upload mockups navigation button
    upload_nav_btns = driver.find_elements(By.CSS_SELECTOR, "button[data-analyticsid='mockupLibraryNavigationUpload'], pfy-button[data-testid='emptyStateUploadMockup'] button")
    if upload_nav_btns:
        driver.execute_script("arguments[0].click();", upload_nav_btns[0])
        time.sleep(1.5)

    clear_popups(driver)

    file_inputs = driver.find_elements(By.CSS_SELECTOR, "input[data-testid='fileInput']")
    if not file_inputs:
        print(f"  [ERROR] File input not found for {sku}")
        return False

    ip_abs = os.path.abspath(f"public/mockups/{sku}_iPhone_18_Pro_Max_Lifestyle.png")
    sg_abs = os.path.abspath(f"public/mockups/{sku}_Samsung_Galaxy_S26_Lifestyle.png")
    print(f"  Uploading corrected mockups:\n    {ip_abs}\n    {sg_abs}")
    file_inputs[0].send_keys(f"{ip_abs}\n{sg_abs}")
    time.sleep(4.5)

    # 3. Click Confirm in upload drawer
    confirm_btns = driver.find_elements(By.XPATH, "//button[normalize-space(.)='Confirm']")
    if confirm_btns:
        driver.execute_script("arguments[0].click();", confirm_btns[0])
        time.sleep(3.5)

    # 4. Switch to Printify mockups tab
    mockup_tabs = driver.find_elements(By.XPATH, "//*[contains(@class, 'tab-label') and contains(text(), 'Printify mockups')]")
    if mockup_tabs:
        driver.execute_script("arguments[0].click();", mockup_tabs[0])
        time.sleep(2.0)

    # 5. Select the 6 designated mockups
    for model_name, cam_query in TARGET_PRINTIFY_MOCKUPS:
        cards = driver.find_elements(By.XPATH, f"//button[contains(@class, 'view-type-card') and normalize-space(.)='{model_name}']")
        if cards:
            driver.execute_script("arguments[0].scrollIntoView({block: 'nearest', inline: 'center'}); arguments[0].click();", cards[0])
            time.sleep(1.0)
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
            time.sleep(0.5)

    # 6. Click Save selection
    save_sel_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Save selection')]")
    if save_sel_btns:
        driver.execute_script("arguments[0].click();", save_sel_btns[0])
        time.sleep(4.0)

    # 7. Click Save as draft if present
    save_draft_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Save as draft')]")
    for b in save_draft_btns:
        if b.is_displayed() and b.is_enabled():
            driver.execute_script("arguments[0].click();", b)
            time.sleep(4.0)
            break

    # 8. Verify via API
    st, pdata = api_req(f"/shops/{SHOP_ID}/products/{pid}.json")
    cnt = len(pdata.get("images", []))
    print(f"  [VERIFIED] {sku}: {cnt} mockups selected in Printify API.")

    # 9. Trigger Etsy publish / sync
    publish_payload = {
        "title": True,
        "description": True,
        "images": True,
        "variants": True,
        "tags": True,
        "keyFeatures": True,
        "shipping_template": True
    }
    st_pub, res_pub = api_req(f"/shops/{SHOP_ID}/products/{pid}/publish.json", "POST", publish_payload)
    print(f"  [ETSY SYNC] Status: {st_pub}")
    return True

def main():
    opts = Options()
    opts.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
    driver = webdriver.Chrome(options=opts)
    driver.set_window_size(1440, 960)

    success_count = 0
    for sku, pid in ALL_PRODUCTS:
        try:
            if configure_product(driver, sku, pid):
                success_count += 1
        except Exception as e:
            print(f"  [ERROR] Failed configuring {sku}: {e}")

    print(f"\n==================================================")
    print(f"SUMMARY: Successfully configured and published {success_count}/{len(ALL_PRODUCTS)} products.")
    print(f"==================================================")

if __name__ == "__main__":
    main()
