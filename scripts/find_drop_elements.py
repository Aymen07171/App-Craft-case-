from selenium import webdriver
from selenium.webdriver.chrome.options import Options

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

cdp_res = driver.execute_cdp_cmd("Runtime.evaluate", {
    "expression": """
        (function() {
            let all = document.querySelectorAll('*');
            let dropElements = [];
            for (let el of all) {
                let ls = getEventListeners(el);
                if (ls.drop || ls.dragover) {
                    dropElements.push({
                        tag: el.tagName,
                        id: el.id,
                        className: el.className,
                        role: el.getAttribute('role'),
                        events: Object.keys(ls)
                    });
                }
            }
            return JSON.stringify(dropElements);
        })()
    """,
    "includeCommandLineAPI": True
})
print("Drop elements:", cdp_res)
