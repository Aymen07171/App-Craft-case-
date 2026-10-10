import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

test_file = os.path.abspath("CaseCraft_Master_30_Designs_Catalog.xlsx")
print(f"Testing drag-and-drop upload of: {test_file}")

# 1. Inject file input
driver.execute_script("""
    let existing = document.getElementById('py_test_upload_input');
    if (existing) existing.remove();
    let inp = document.createElement('input');
    inp.type = 'file';
    inp.multiple = true;
    inp.id = 'py_test_upload_input';
    inp.style.position = 'fixed';
    inp.style.top = '10px';
    inp.style.left = '10px';
    inp.style.zIndex = '999999';
    inp.style.opacity = '1';
    inp.style.display = 'block';
    document.body.appendChild(inp);
""")

# 2. Send keys to the input
inp = driver.find_element(By.ID, "py_test_upload_input")
inp.send_keys(test_file)
time.sleep(1)

# 3. Check files attached
files_count = driver.execute_script("""
    let inp = document.getElementById('py_test_upload_input');
    return inp.files.length;
""")
print(f"Attached files count in input: {files_count}")

# 4. Trigger drag-and-drop to target
drop_res = driver.execute_script("""
    let inp = document.getElementById('py_test_upload_input');
    if (!inp || !inp.files || inp.files.length === 0) {
        return { error: 'No files in input' };
    }
    
    let target = document.querySelector('.a-da-Mf-B-da-U') || document.querySelector('[role=\"main\"]') || document.documentElement;
    
    let dt = new DataTransfer();
    for (let i = 0; i < inp.files.length; i++) {
        dt.items.add(inp.files[i]);
    }
    
    // Dispatch dragenter
    let enterEv = new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt
    });
    target.dispatchEvent(enterEv);
    
    // Dispatch dragover
    let overEv = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt
    });
    target.dispatchEvent(overEv);
    
    // Dispatch drop
    let dropEv = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt
    });
    let dispatched = target.dispatchEvent(dropEv);
    
    return {
        success: true,
        targetTag: target.tagName,
        targetClass: target.className,
        filesDropped: dt.files.length,
        dispatched: dispatched
    };
""")
print("Drop result:", drop_res)

# 5. Wait and see if Google Drive shows upload popup
time.sleep(5)
toast = driver.find_elements(By.XPATH, "//*[contains(text(), 'Uploading') or contains(text(), 'Importation') or contains(text(), 'uploaded') or contains(text(), 'importé')]")
print(f"Upload notification elements found: {len(toast)}")
for t in toast:
    print(f"  Toast: '{t.text.strip()}'")
