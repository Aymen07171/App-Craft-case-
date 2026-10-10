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

    # Only 001 files and the 6-design catalog should remain
    keep_files = {
        "CASE-LOTUSS-001_9x16_Artwork.png",
        "CASE-VOLCAN-001_9x16_Artwork.png",
        "CASE-MOONBU-001_9x16_Artwork.png",
        "CASE-PHOENI-001_9x16_Artwork.png",
        "CASE-RONINS-001_9x16_Artwork.png",
        "CASE-SEADRA-001_9x16_Artwork.png",
        "CaseCraft_Master_6_Designs_Catalog.xlsx"
    }

    print("[*] Target files to KEEP in Google Drive (1 per category):")
    for k in sorted(keep_files):
        print(f"    - {k}")

    deleted_total = 0
    max_passes = 30

    for p in range(max_passes):
        # Refresh every 6 deletions to keep view clean
        if p > 0 and p % 6 == 0:
            driver.get(drive_url)
            time.sleep(3)

        # Find any file that is NOT in keep_files
        text_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'CASE-') or contains(text(), 'CaseCraft_Master_30')]")
        target_el = None
        target_name = ""

        for te in text_elements:
            t = te.text.strip()
            if (t.startswith("CASE-") or t.startswith("CaseCraft_Master_30")) and t not in keep_files:
                target_el = te
                target_name = t
                break

        if not target_el:
            print(f"[*] No more unwanted files found after {p} passes!")
            break

        print(f"[{p+1}] Trashing: {target_name}...")
        try:
            row = target_el.find_element(By.XPATH, "./ancestor-or-self::div[@role='row' or @data-target='item' or @data-id or contains(@class, 'c-P-p') or contains(@class, 'i92Sbe')][1]")
            ActionChains(driver).move_to_element(row).click().perform()
            time.sleep(0.6)

            trash_btns = driver.find_elements(By.XPATH, "//div[@aria-label='Move to trash Delete' or contains(@data-tooltip, 'Move to trash')]")
            if trash_btns:
                ActionChains(driver).move_to_element(trash_btns[0]).click().perform()
                deleted_total += 1
                time.sleep(1.2)
            else:
                print(f"    [!] Trash button not visible for {target_name}")
                time.sleep(1)
        except Exception as e:
            print(f"    Error: {e}")
            time.sleep(1)

    print(f"\n[*] Total files moved to trash: {deleted_total}")

    # Final verification
    driver.get(drive_url)
    time.sleep(4)

    verified = set()
    text_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'CASE-') or contains(text(), 'CaseCraft_Master')]")
    for te in text_elements:
        txt = te.text.strip()
        if txt.startswith("CASE-") or txt.startswith("CaseCraft_Master"):
            verified.add(txt)

    print("\n" + "=" * 70)
    print(f"[*] FINAL VERIFIED GOOGLE DRIVE CONTENTS ({len(verified)} items):")
    print("=" * 70)
    for i, item in enumerate(sorted(verified), 1):
        print(f"    {i:02d}. {item}")
    print("=" * 70)

if __name__ == "__main__":
    main()
