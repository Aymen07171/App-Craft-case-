from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

print(f"Tab Title: {driver.title}")
print(f"URL: {driver.current_url}")

# Find all file rows/cards in the Google Drive folder view
elements = driver.find_elements(By.XPATH, "//*[@data-target='doc' or @data-target='item' or @role='row' or contains(@class, 'c-P-p')]")
print(f"Found {len(elements)} item elements in folder.")

files_found = []
text_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'CASE-') or contains(text(), 'CaseCraft_Master')]")
for te in text_elements:
    txt = te.text.strip()
    if txt and txt not in files_found:
        files_found.append(txt)

print(f"\n[*] Total CaseCraft files verified in Google Drive: {len(files_found)}")
for i, f in enumerate(sorted(files_found)):
    print(f"    {i+1:02d}. {f}")
