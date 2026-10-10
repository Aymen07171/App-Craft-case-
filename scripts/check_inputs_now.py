from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

inputs = driver.find_elements(By.XPATH, "//input[@type='file']")
print(f"File inputs right now: {len(inputs)}")
for i, inp in enumerate(inputs):
    print(f"  Input {i}: id={inp.get_attribute('id')}, outerHTML={inp.get_attribute('outerHTML')[:120]}")
