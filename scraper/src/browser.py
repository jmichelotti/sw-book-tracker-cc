"""Shared Playwright browser instance for scraping Fandom/Wookieepedia pages."""

import logging
import os
import time
from playwright.sync_api import sync_playwright, Browser, Page

logger = logging.getLogger(__name__)

_playwright = None
_browser: Browser | None = None

# Set HEADLESS=0 to launch a visible browser (bypasses anti-bot detection)
HEADLESS = os.getenv("HEADLESS", "0") == "1"


def get_browser() -> Browser:
    global _playwright, _browser
    if _browser is None:
        _playwright = sync_playwright().start()
        _browser = _playwright.chromium.launch(
            headless=HEADLESS,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ],
        )
        mode = "headless" if HEADLESS else "headed"
        logger.info(f"Launched Chromium browser ({mode})")
    return _browser


def fetch_page_html(
    url: str,
    wait_selector: str = "div.mw-parser-output",
    timeout: int = 90000,
    max_retries: int = 2,
) -> str:
    """Fetch a page using Playwright and return its HTML after JS execution.

    Retries on timeout in case of slow page loads.
    """
    browser = get_browser()

    for attempt in range(max_retries + 1):
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            java_script_enabled=True,
        )
        page: Page = context.new_page()
        try:
            page.goto(url, timeout=timeout, wait_until="domcontentloaded")

            try:
                page.wait_for_selector(wait_selector, timeout=timeout)
            except Exception:
                if attempt < max_retries:
                    logger.warning(
                        f"Attempt {attempt + 1} timed out for {url}, retrying after delay..."
                    )
                    context.close()
                    time.sleep(10 * (attempt + 1))
                    continue
                raise

            html = page.content()
            return html
        finally:
            context.close()

    raise RuntimeError(f"Failed to fetch {url} after {max_retries + 1} attempts")


def close_browser() -> None:
    global _playwright, _browser
    if _browser:
        _browser.close()
        _browser = None
    if _playwright:
        _playwright.stop()
        _playwright = None
