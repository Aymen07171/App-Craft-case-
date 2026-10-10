from selenium import webdriver
from selenium.webdriver.chrome.options import Options

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

res = driver.execute_script("""
    let keys = Object.keys(window).filter(k => 
        k.toLowerCase().includes('token') || 
        k.toLowerCase().includes('auth') || 
        k.toLowerCase().includes('drive') || 
        k.toLowerCase().includes('wiz') ||
        k.toLowerCase().includes('gapi') ||
        k.startsWith('_') === false
    );
    return {
        keys: keys.slice(0, 50),
        hasGapi: typeof window.gapi !== 'undefined',
        hasWiz: typeof window._wiz !== 'undefined',
        cookieLength: document.cookie.length
    };
""")
print("Window inspection:", res)
