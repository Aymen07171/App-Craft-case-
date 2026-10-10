from selenium import webdriver
from selenium.webdriver.chrome.options import Options

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

res = driver.execute_script("""
    let result = {};
    if (window.gapi) {
        result.gapiKeys = Object.keys(window.gapi);
        if (window.gapi.auth) {
            result.authKeys = Object.keys(window.gapi.auth);
            if (window.gapi.auth.getToken) {
                result.token = window.gapi.auth.getToken();
            }
        }
    }
    return result;
""")
print("GAPI inspection:", res)
