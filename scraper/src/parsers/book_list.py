import logging

from bs4 import BeautifulSoup

from src.browser import fetch_page_html

logger = logging.getLogger(__name__)

BOOK_LIST_URL = "https://starwars.fandom.com/wiki/List_of_books"


def scrape_book_list() -> list[dict]:
    """Scrape the Wookieepedia list of books page for book links and canon status."""
    html = fetch_page_html(BOOK_LIST_URL)
    soup = BeautifulSoup(html, "html.parser")

    entries: list[dict] = []
    current_status = "canon"

    content = soup.find("div", class_="mw-parser-output")
    if not content:
        logger.error("Could not find main content div")
        return entries

    section = "before_novels"

    for element in content.children:
        tag_name = getattr(element, "name", None)

        if tag_name == "h2":
            heading_text = element.get_text(strip=True).lower()
            if "novels" in heading_text:
                section = "in_novels"
            elif section == "in_novels":
                break  # Hit the next h2 after Novels — done

        if section != "in_novels":
            continue

        if tag_name == "h3":
            heading_text = element.get_text(strip=True).lower()
            if "legends" in heading_text:
                current_status = "legends"
            elif "canon" in heading_text:
                current_status = "canon"

        if tag_name == "ul":
            for li in element.find_all("li", recursive=False):
                link = li.find("a", href=True)
                if not link:
                    continue
                href = link.get("href", "")
                if not href.startswith("/wiki/"):
                    continue
                title = link.get("title") or link.get_text(strip=True)
                if not title or title.startswith("Category:"):
                    continue
                full_url = f"https://starwars.fandom.com{href}"
                entries.append({
                    "title": title,
                    "url": full_url,
                    "canon_or_legends": current_status,
                })

    seen = set()
    unique = []
    for e in entries:
        if e["title"] not in seen:
            seen.add(e["title"])
            unique.append(e)

    logger.info(f"Parsed {len(unique)} unique book entries")
    return unique
