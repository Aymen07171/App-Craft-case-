from selenium import webdriver
from selenium.webdriver.chrome.options import Options

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

res = driver.execute_script("""
    let out = {};
    try {
        if (window.gapi && window.gapi.auth && window.gapi.auth.getAuthHeaderValueForFirstParty) {
            out.authHeader = window.gapi.auth.getAuthHeaderValueForFirstParty(window.location.href);
        }
    } catch(e) {
        out.authHeaderErr = e.message;
    }
    try {
        if (window.gapi && window.gapi.auth2) {
            let inst = window.gapi.auth2.getAuthInstance();
            out.hasAuth2Instance = !!inst;
            if (inst && inst.currentUser) {
                let u = inst.currentUser.get();
                out.hasUser = !!u;
                if (u) {
                    out.authResponse = u.getAuthResponse();
                }
            }
        }
    } catch(e) {
        out.auth2Err = e.message;
    }
    return out;
""")
print("Auth details:", res)
