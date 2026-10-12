#!/usr/bin/env python3
import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
driver = webdriver.Chrome(options=opts)

# Remove any engagement/modal overlays
driver.execute_script("""
    document.querySelectorAll('[data-amplitude-engagement-modal-overlay], .rc-dialog-root, .rc-dialog-mask, .rc-dialog-wrap').forEach(el => el.remove());
    // Also remove banner modals inside iframe or custom popups
    const popups = Array.from(document.querySelectorAll('div')).filter(d => d.innerText.includes('MULTI-USER ACCESS') || d.innerText.includes('Sharing is caring'));
    popups.forEach(p => p.remove());
""")
time.sleep(1)

# Inspect the Upload mockups panel
panel_info = driver.execute_script("""
    const panel = document.querySelector('pfy-upload-mockup-drawer, [data-testid="uploadMockupDrawer"], .drawer');
    const inputs = Array.from(document.querySelectorAll('input[type="file"]')).map(i => ({ id: i.id, outer: i.outerHTML }));
    const btns = Array.from(document.querySelectorAll('button')).map(b => ({ text: b.innerText.trim(), class: b.className }));
    return {
        inputs,
        btns: btns.filter(b => b.text.length > 0 && b.text.length < 30)
    };
""")
print("PANEL INFO:", json.dumps(panel_info, indent=2))

driver.save_screenshot(r"C:\Users\jacka\.gemini\antigravity\brain\93b4ac09-5823-4126-86c4-fc067944487c\clean_drawer_screen.png")
print("Saved clean screenshot!")
