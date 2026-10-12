#!/usr/bin/env python3
import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
driver = webdriver.Chrome(options=opts)

btn_info = driver.execute_script("""
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Upload'));
    return btns.map(b => ({
        outer: b.outerHTML,
        parent: b.parentElement ? b.parentElement.outerHTML : ''
    }));
""")
print("UPLOAD BTNS:", json.dumps(btn_info, indent=2))
