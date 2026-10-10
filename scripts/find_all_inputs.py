from selenium import webdriver
from selenium.webdriver.chrome.options import Options

opts = Options()
opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
driver = webdriver.Chrome(options=opts)

res = driver.execute_script("""
    function findInputs(root) {
        let results = [];
        let inputs = root.querySelectorAll('input');
        for (let inp of inputs) {
            results.push({
                type: inp.type,
                name: inp.name,
                id: inp.id,
                class: inp.className,
                style: inp.getAttribute('style'),
                visible: inp.offsetParent !== null
            });
        }
        let all = root.querySelectorAll('*');
        for (let el of all) {
            if (el.shadowRoot) {
                results = results.concat(findInputs(el.shadowRoot));
            }
        }
        return results;
    }
    return findInputs(document);
""")
print(f"Total inputs found across DOM & Shadow roots: {len(res)}")
for i, item in enumerate(res):
    print(f"  Input {i}: {item}")
