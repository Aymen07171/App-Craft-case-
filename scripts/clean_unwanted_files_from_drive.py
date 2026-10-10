import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

def main():
    opts = Options()
    opts.add_experimental_option('debuggerAddress', '127.0.0.1:9222')
    driver = webdriver.Chrome(options=opts)

    drive_folder_url = "https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO"
    driver.get(drive_folder_url)
    time.sleep(4)

    keep_files = {
        "CASE-LOTUSS-001_9x16_Artwork.png",
        "CASE-VOLCAN-001_9x16_Artwork.png",
        "CASE-MOONBU-001_9x16_Artwork.png",
        "CASE-PHOENI-001_9x16_Artwork.png",
        "CASE-RONINS-001_9x16_Artwork.png",
        "CASE-SEADRA-001_9x16_Artwork.png",
        "CaseCraft_Master_6_Designs_Catalog.xlsx"
    }

    print("[*] Target files to KEEP in Google Drive:")
    for k in sorted(keep_files):
        print(f"    - {k}")

    deleted_count = 0
    max_attempts = 35

    for attempt in range(max_attempts):
        # Refresh every 5 deletes to keep DOM fresh
        if attempt > 0 and attempt % 5 == 0:
            driver.get(drive_folder_url)
            time.sleep(3)

        # Find any text element matching CASE- or CaseCraft_Master_30
        candidates = driver.find_elements(By.XPATH, "//*[starts-with(text(), 'CASE-') or starts-with(text(), 'CaseCraft_Master_30')]")
        unwanted_target = None
        for cand in candidates:
            txt = cand.text.strip()
            if txt and txt not in keep_files:
                unwanted_target = cand
                break

        if not unwanted_target:
            print("[*] No more unwanted items found!")
            break

        file_to_del = unwanted_target.text.strip()
        print(f"[{attempt + 1}] Selecting and moving to trash: {file_to_del}...")

        try:
            # Click the item to select it
            ActionChains(driver).move_to_element(unwanted_target).click().perform()
            time.sleep(0.8)

            # Find trash button
            trash_btns = driver.find_elements(By.XPATH, "//div[@aria-label='Move to trash Delete' or contains(@data-tooltip, 'Move to trash')]")
            if trash_btns:
                driver.execute_script("arguments[0].click();", trash_btns[0])
                deleted_count += 1
                time.sleep(1.2)
            else:
                print("    Trash button not visible, retrying selection...")
                time.sleep(1)
        except Exception as e:
            print(f"    Notice: {e}")
            time.sleep(1)

    print(f"\n[*] Total files moved to trash: {deleted_count}")

    # Final refresh & verification
    driver.get(drive_folder_url)
    time.sleep(4)

    verified = set()
    text_elements = driver.find_elements(By.XPATH, "//*[starts-with(text(), 'CASE-') or starts-with(text(), 'CaseCraft_Master')]")
    for te in text_elements:
        txt = te.text.strip()
        if txt:
            verified.add(txt)

    print("\n" + "=" * 70)
    print(f"[*] FINAL VERIFIED GOOGLE DRIVE CONTENTS ({len(verified)} files):")
    print("=" * 70)
    for i, f in enumerate(sorted(verified)):
        print(f"    {i+1}. {f}")
    print("=" * 70)

if __name__ == "__main__":
    main()
