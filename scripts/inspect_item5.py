import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

item5 = driver.find_element(By.XPATH, "//li[@data-key='19']")
print("Item 5 HTML:")
print(item5.get_attribute("outerHTML"))

# Check parent/children
for child in item5.find_elements(By.XPATH, ".//*"):
    print(f"  Child: tag={child.tag_name}, class={child.get_attribute('class')}")
