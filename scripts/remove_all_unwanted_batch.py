import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

def main():
    opts = Options()
    opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
    driver = webdriver.Chrome(options=opts)

    drive_url = "https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO"
    driver.get(drive_url)
    time.sleep(3)

    # Categories to keep (001 only)
    themes = ["LOTUSS", "VOLCAN", "MOONBU", "PHOENI", "RONINS", "SEADRA"]
    
    # Generate list of exact unwanted filenames
    unwanted_files = []
    for th in themes:
        for num in ["002", "003", "004", "005"]:
            unwanted_files.append(f"CASE-{th}-{num}_9x16_Artwork.png")
    unwanted_files.append("CaseCraft_Master_30_Designs_Catalog.xlsx")

    print(f"[*] Starting cleanup of {len(unwanted_files)} unwanted files...")

    deleted = 0
    for idx, fname in enumerate(unwanted_files, 1):
        elems = driver.find_elements(By.XPATH, f"//*[contains(text(), '{fname}')]")
        if not elems:
            continue

        try:
            el = elems[0]
            # Find row container
            row = el.find_element(By.XPATH, "./ancestor-or-self::div[@role='row' or @data-target='item' or @data-id or contains(@class, 'c-P-p') or contains(@class, 'i92Sbe')][1]")
            ActionChains(driver).move_to_element(row).click().perform()
            time.sleep(0.5)

            trash_btns = driver.find_elements(By.XPATH, "//div[@aria-label='Move to trash Delete' or contains(@data-tooltip, 'Move to trash')]")
            if trash_btns:
                driver.execute_script("arguments[0].click();", trash_btns[0])
                deleted += 1
                print(f"[{deleted:02d}/{len(unwanted_files)}] Trashed: {fname}")
                time.sleep(1.0)
            else:
                print(f"[!] Trash button not visible for: {fname}")
        except Exception as e:
            print(f"[!] Error deleting {fname}: {e}")

    print(f"\n[*] Cleanup completed! Total trashed: {deleted}")

    # Verify final contents
    driver.get(drive_url)
    time.sleep(3)

    verified = set()
    text_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'CASE-') or contains(text(), 'CaseCraft_Master')]")
    for te in text_elements:
        txt = te.text.strip()
        if txt:
            verified.add(txt)

    print("\n" + "=" * 70)
    print(f"[*] VERIFIED GOOGLE DRIVE FOLDER CONTENTS ({len(verified)} items):")
    print("=" * 70)
    for i, item in enumerate(sorted(verified), 1):
        print(f"    {i:02d}. {item}")
    print("=" * 70)

if __name__ == "__main__":
    main()
