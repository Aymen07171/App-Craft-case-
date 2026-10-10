from selenium import webdriver
from selenium.webdriver.chrome.options import Options

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

cdp_res = driver.execute_cdp_cmd("Runtime.evaluate", {
    "expression": """
        (function() {
            let targets = [
                { name: 'window', el: window },
                { name: 'document', el: document },
                { name: 'body', el: document.body },
                { name: 'main', el: document.querySelector('[role=\"main\"]') }
            ];
            let out = [];
            for (let t of targets) {
                if (t.el) {
                    let ls = getEventListeners(t.el);
                    out.push({
                        name: t.name,
                        events: Object.keys(ls)
                    });
                }
            }
            return JSON.stringify(out);
        })()
    """,
    "includeCommandLineAPI": True
})
print("CDP event listeners:", cdp_res)
