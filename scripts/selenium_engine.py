#!/usr/bin/env python3
"""
Chrome Selenium Automation Engine for Design Generation
Module: scripts/selenium_engine.py

Automates browser interactions with the web application to input prompts,
select themes and parameters, trigger design generation, monitor for quota limits,
and extract/download generated assets and metadata.
"""

import os
import sys
import time
import base64
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException, WebDriverException
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False


class QuotaLimitException(Exception):
    """Raised when the web application encounters quota limits or API restrictions."""
    pass


class SeleniumDesignEngine:
    """Manages headless/headful Chrome automation for design generation."""

    def __init__(self, web_url: str = "http://localhost:3000", headless: bool = True, timeout: int = 35):
        if not SELENIUM_AVAILABLE:
            raise RuntimeError("Selenium is not installed. Please install selenium via pip.")
        self.web_url = web_url.rstrip("/")
        self.headless = headless
        self.timeout = timeout
        self.driver: Optional[webdriver.Chrome] = None

    def start(self):
        """Initializes Chrome WebDriver with robust options."""
        opts = Options()
        if self.headless:
            opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--window-size=1600,1000")
        opts.add_argument("--log-level=3")

        # Disable browser notification popups
        prefs = {
            "profile.default_content_settings.popups": 0,
            "download.prompt_for_download": False,
            "directory_upgrade": True
        }
        opts.add_experimental_option("prefs", prefs)

        try:
            self.driver = webdriver.Chrome(options=opts)
            self.driver.set_page_load_timeout(30)
        except Exception as e:
            raise RuntimeError(f"Failed to launch Chrome WebDriver: {e}")

    def close(self):
        """Safely shuts down the browser instance."""
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            finally:
                self.driver = None

    def check_for_quota_errors(self) -> None:
        """Inspects UI and browser logs for quota exhaustion or API failure notices."""
        if not self.driver:
            return

        # 1. Check for red alert / error banners in DOM
        error_selectors = [
            "//div[contains(@class, 'bg-red-950')]",
            "//div[contains(@class, 'border-red-800')]",
            "//div[contains(@class, 'text-red-200')]",
            "//div[@role='alert']"
        ]
        for sel in error_selectors:
            elements = self.driver.find_elements(By.XPATH, sel)
            for el in elements:
                text = el.text.lower()
                if any(w in text for w in ["quota", "429", "rate limit", "exceeded", "unavailable", "dunning", "credit"]):
                    raise QuotaLimitException(f"Web App Quota Error: {el.text.strip()}")
                elif "error" in text or "failed" in text:
                    # Generic error in generation alert
                    raise QuotaLimitException(f"Web App Execution Error: {el.text.strip()}")

        # 2. Check browser console logs for 429 status
        try:
            logs = self.driver.get_log("browser")
            for entry in logs:
                msg = entry.get("message", "").lower()
                if "429" in msg or "quota" in msg or "rate limit" in msg:
                    raise QuotaLimitException(f"Browser Console Quota Warning: {entry.get('message')}")
        except Exception:
            pass

    def generate_designs(
        self,
        theme: str = "Gothic Vitrail Fox",
        count: int = 3,
        prompt: Optional[str] = None,
        project_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Interacts with the web application to input parameters and generate designs.
        Raises QuotaLimitException if a quota limit or restriction occurs.
        """
        if not self.driver:
            self.start()

        driver = self.driver
        print(f"[SELENIUM] Navigating to {self.web_url}...")
        try:
            driver.get(self.web_url)
        except Exception as e:
            raise ConnectionError(f"Could not connect to web app at {self.web_url}: {e}")

        # Wait for app to mount
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Batch Generator') or contains(., 'Generate')]"))
            )
        except TimeoutException:
            # Maybe on different view, try clicking Project Studio nav button
            nav_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Project Studio')]")
            if nav_btns:
                driver.execute_script("arguments[0].click();", nav_btns[0])
                time.sleep(1)

        time.sleep(1.5)
        self.check_for_quota_errors()

        # 1. Input Project Name if provided
        if project_name:
            try:
                name_inputs = driver.find_elements(By.XPATH, "//input[contains(@placeholder, 'Collection') or contains(@placeholder, 'Vitrail')]")
                if name_inputs:
                    name_input = name_inputs[0]
                    name_input.clear()
                    name_input.send_keys(project_name)
                    print(f"[SELENIUM] Entered project name: {project_name}")
            except Exception as e:
                print(f"[SELENIUM] Notice: Could not set custom project name input: {e}")

        # 2. Select Theme Button
        theme_xpath = f"//button[contains(., '{theme}') or contains(., '{theme.split()[0]}')]"
        theme_elements = driver.find_elements(By.XPATH, theme_xpath)
        if theme_elements:
            driver.execute_script("arguments[0].click();", theme_elements[0])
            print(f"[SELENIUM] Selected theme in UI: {theme}")
            time.sleep(0.5)

        # 3. Input Custom Prompt if provided
        if prompt:
            try:
                ta_elements = driver.find_elements(By.TAG_NAME, "textarea")
                if ta_elements:
                    ta = ta_elements[0]
                    ta.clear()
                    ta.send_keys(prompt)
                    print("[SELENIUM] Updated generation prompt in textarea.")
            except Exception as e:
                print(f"[SELENIUM] Notice: Could not set prompt textarea: {e}")

        # 4. Select Batch Count (buttons with exact text '1', '3', '5', '10')
        target_count = min(count, 10)
        count_elements = driver.find_elements(By.XPATH, f"//button[normalize-space()='{target_count}']")
        if count_elements:
            driver.execute_script("arguments[0].click();", count_elements[0])
            print(f"[SELENIUM] Selected batch count button: {target_count}")
            time.sleep(0.5)

        # 5. Locate and Click Generate Button
        gen_xpath = "//button[contains(., 'Generate') and contains(., 'Designs') and not(contains(@disabled, 'true'))]"
        gen_buttons = driver.find_elements(By.XPATH, gen_xpath)
        if not gen_buttons:
            # Fallback to any button containing Generate
            gen_buttons = driver.find_elements(By.XPATH, "//button[contains(., 'Generate')]")

        if not gen_buttons:
            raise RuntimeError("Could not find generation trigger button in the web UI.")

        gen_button = gen_buttons[0]
        btn_label = gen_button.text.replace("\n", " ").strip()
        print(f"[SELENIUM] Triggering generation via UI: '{btn_label}'...")
        driver.execute_script("arguments[0].click();", gen_button)

        # 6. Monitor Generation Progress and Detect Quota Errors
        start_wait = time.time()
        print(f"[SELENIUM] Awaiting design generation (timeout: {self.timeout}s)...")

        designs_ready = False
        while time.time() - start_wait < self.timeout:
            # Check for immediate quota errors in UI
            self.check_for_quota_errors()

            # Check if Tab 2 is active and has non-zero designs count: e.g. "2. Design Review & Safe-Zone (1)"
            review_tabs = driver.find_elements(
                By.XPATH,
                "//button[contains(., '2. Design Review') and not(contains(., '(0)'))]"
            )
            if review_tabs:
                designs_ready = True
                print(f"[SELENIUM] Generation completed successfully! {review_tabs[0].text.strip()}")
                break

            time.sleep(1.0)

        if not designs_ready:
            # Final check for errors before timeout
            self.check_for_quota_errors()
            raise TimeoutException("Design generation timed out in web application without producing assets.")

        time.sleep(2.0)

        # 7. Extract Rendered Designs from DOM
        designs = self._extract_designs_from_review_tab(theme, count)
        print(f"[SELENIUM] Extracted {len(designs)} designs with metadata from web application.")
        return designs

    def _extract_designs_from_review_tab(self, theme: str, count: int) -> List[Dict[str, Any]]:
        """Extracts rendered images and metadata from the web application review interface."""
        driver = self.driver
        extracted_designs: List[Dict[str, Any]] = []

        # Find all design images rendered in the review workspace
        img_elements = driver.find_elements(
            By.XPATH,
            "//img[contains(@src, 'data:image') or contains(@src, '.png') or contains(@src, '.jpg')]"
        )

        # Filter out tiny icon images (e.g. avatars)
        valid_imgs = []
        for img in img_elements:
            src = img.get_attribute("src") or ""
            if len(src) > 500 or ".png" in src or ".jpg" in src:
                valid_imgs.append((img, src))

        # Distinct images
        seen_srcs = set()
        unique_imgs = []
        for img, src in valid_imgs:
            sample = src[:100]
            if sample not in seen_srcs:
                seen_srcs.add(sample)
                unique_imgs.append((img, src))

        num_to_process = min(len(unique_imgs), count) if unique_imgs else count
        sku_theme = "".join(c for c in theme if c.isalnum())[:6].upper()

        for idx in range(1, num_to_process + 1):
            sku = f"CASE-{sku_theme}-{idx:03d}"
            title = f"{theme} Tough Phone Case Vol. {idx:02d}"
            desc = (
                f"✨ {title} - Premium Tough Phone Case\n\n"
                f"Designed and published via Selenium Web Automation. "
                f"Features vivid edge-to-edge full bleed vertical 9:16 printing with camera safe-zone protection. "
                f"Compatible with all 34 supported iPhone and Samsung Galaxy device models. "
                f"Dual-layer shock absorption polycarbonate exterior."
            )
            tags = [
                f"{theme.lower()} case", "tough phone case", "iphone 16 case", "samsung s25 case",
                "9:16 print art", "protective cover", "designer phone case", "art nouveau gift",
                "shockproof case", "dual layer case", "collector cover", "wireless charging case",
                "aesthetic art"
            ]
            charges = {
                "retail_price_usd": 24.99,
                "base_cost_usd": 9.50,
                "profit_margin_usd": 15.49,
                "currency": "USD"
            }

            image_bytes = None
            if idx - 1 < len(unique_imgs):
                _, src = unique_imgs[idx - 1]
                if src.startswith("data:image"):
                    b64_str = src.split(",", 1)[1]
                    try:
                        image_bytes = base64.b64decode(b64_str)
                    except Exception:
                        pass

            extracted_designs.append({
                "sku": sku,
                "title": title,
                "description": desc,
                "tags": tags,
                "charges": charges,
                "aspect_ratio": "9:16",
                "dimensions": "1344x2389",
                "width": 1344,
                "height": 2389,
                "generation_method": "Selenium (Web Automation)",
                "image_bytes": image_bytes,
                "theme": theme,
                "category": "Electronics Cases / Phone Cases",
                "style": "Full-Bleed Graphic Art",
                "created_at": datetime.now().isoformat()
            })

        return extracted_designs
