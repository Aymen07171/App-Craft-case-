from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

dialogs = driver.find_elements(By.XPATH, "//*[contains(text(), 'Upload') or contains(text(), 'upload') or contains(text(), 'item') or contains(text(), 'CaseCraft_Master_30_Designs_Catalog')]")
seen = set()
for d in dialogs:
    t = d.text.strip().replace('\n', ' ')
    if t and t not in seen:
        seen.add(t)
        print("Status:", t)
