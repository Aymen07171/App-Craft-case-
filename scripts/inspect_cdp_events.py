from selenium import webdriver
from selenium.webdriver.chrome.options import Options

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

# Let's inspect getEventListeners using CDP!
cdp_res = driver.execute_cdp_cmd("Runtime.evaluate", {
    "expression": """
        (function() {
            let targets = [window, document, document.body, document.querySelector('[role=\"main\"]')];
            let out = [];
            for (let t of targets) {
                if (t && typeof getEventListeners === 'function') {
                    let ls = getEventListeners(t);
                    out.push({
                        target: t.tagName || 'window/doc',
                        events: Object.keys(ls)
                    });
                }
            }
            return JSON.stringify(out);
        })()
    """
})
print("CDP event listeners:", cdp_res)
