from selenium import webdriver
from selenium.webdriver.chrome.options import Options

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

res = driver.execute_script("""
    return {
        hasMain: !!document.querySelector('[role=\"main\"]'),
        mainTag: document.querySelector('[role=\"main\"]')?.tagName,
        hasDropZone: !!document.querySelector('[data-drop-zone]') || !!document.querySelector('.a-u-j')
    };
""")
print("Drop targets:", res)
