import logging
import re

from bs4 import BeautifulSoup

from src.browser import fetch_page_html

logger = logging.getLogger(__name__)


def scrape_book_detail(url: str) -> dict:
    """Scrape a single book page for metadata, characters, and description."""
    html = fetch_page_html(url)
    soup = BeautifulSoup(html, "html.parser")

    result: dict = {}

    # Parse infobox
    infobox = soup.find("aside", class_="portable-infobox") or soup.find(
        "table", class_="infobox"
    )
    if infobox:
        result.update(_parse_infobox(infobox))

    # Parse description from first paragraphs
    content = soup.find("div", class_="mw-parser-output")
    if content:
        paragraphs = content.find_all("p", recursive=False)
        desc_parts = []
        for p in paragraphs[:3]:
            text = p.get_text(strip=True)
            if text and len(text) > 20:
                desc_parts.append(text)
        if desc_parts:
            result["description"] = " ".join(desc_parts)[:2000]

    # Parse appearances by category
    appearances = parse_appearances(soup)
    result["characters"] = appearances.get("characters", [])
    # characters is now list[dict] with {"name": str, "tags": list[str]}

    return result


def _parse_infobox(infobox) -> dict:
    data: dict = {}

    for item in infobox.find_all(["div", "tr"]):
        label_el = item.find(["h3", "th", "span"], class_=lambda c: c and "label" in str(c))
        value_el = item.find(["div", "td"], class_=lambda c: c and "value" in str(c))

        if not label_el or not value_el:
            if item.name == "tr":
                cells = item.find_all(["th", "td"])
                if len(cells) == 2:
                    label_el, value_el = cells[0], cells[1]
                else:
                    continue
            else:
                continue

        label = label_el.get_text(strip=True).lower()
        value = value_el.get_text(strip=True)

        if "author" in label:
            data["author"] = _clean_author_name(value_el)
        elif "page" in label:
            match = re.search(r"(\d+)", value)
            if match:
                data["page_count"] = int(match.group(1))
        elif "isbn" in label:
            data["isbn"] = re.sub(r"[^0-9X-]", "", value)[:17]
        elif "publish" in label or "release" in label:
            data["publication_date"] = value
        elif "timeline" in label or "chronology" in label:
            data["timeline_raw"] = value
            years = _parse_timeline_years(value)
            if years:
                data.update(years)

    return data


def _clean_author_name(value_el) -> str:
    """Extract the primary author name from the infobox author field.

    The infobox may contain footnote refs, role annotations, and multiple
    concatenated author names. We extract the first <a> link's text as the
    cleanest source, falling back to text cleanup if no link exists.
    """
    # Best approach: get the first author link
    first_link = value_el.find("a", href=True)
    if first_link:
        name = first_link.get("title") or first_link.get_text(strip=True)
        # Some titles have " (author)" disambiguation
        name = re.sub(r"\s*\(.*?\)\s*$", "", name)
        return name.strip()

    # Fallback: clean up the raw text
    raw = value_el.get_text(strip=True)
    return clean_author_string(raw)


def clean_author_string(raw: str) -> str:
    """Clean a raw author string by removing footnotes, annotations, and extras.

    Handles: [1] footnotes, (Foreword)/(as X) annotations, co-authors
    concatenated without separators, and "and"/"&" between authors.
    Returns just the primary author name.
    """
    # Remove footnote markers like [1], [2], [1][2]
    name = re.sub(r"\[\d+\]", "", raw)
    # Remove parenthesized annotations (Foreword), (as George Lucas), etc.
    name = re.sub(r"\(.*?\)", "", name)
    # Split on "and" or "&" between authors
    parts = re.split(r"(?<=\w)\s*(?:and|&)\s*(?=[A-Z])", name)
    name = parts[0].strip()
    # Split concatenated names: look for 3+ lowercase letters followed directly by
    # an uppercase letter (no space). The 3-char minimum preserves "McDowell",
    # "MacBride" etc. while still catching "ShermanDan", "WilliamsW.", "WatsonK."
    name = re.split(r"(?<=[a-z]{3})(?=[A-Z])", name)[0].strip()
    return name


def _parse_timeline_years(text: str) -> dict | None:
    """Extract BBY/ABY year(s) from timeline text."""
    matches = re.findall(r"(\d+(?:\.\d+)?)\s*(BBY|ABY)", text, re.IGNORECASE)
    if not matches:
        return None

    years = []
    for val, era in matches:
        year = float(val)
        if era.upper() == "BBY":
            year = -year
        years.append(int(year))

    if len(years) == 1:
        return {"timeline_year": years[0]}
    else:
        return {
            "timeline_year_start": min(years),
            "timeline_year_end": max(years),
            "timeline_year": min(years),
        }


# Wookieepedia appearance categories and their anchor IDs.
# Add new entries here to scrape additional categories in the future.
APPEARANCE_CATEGORIES = {
    "characters": "app_characters",
    # "organisms": "app_organisms",
    # "droids": "app_droids",
    # "events": "app_events",
    # "locations": "app_locations",
    # "organizations": "app_organizations",
    # "species": "app_species",
    # "vehicles": "app_vehicles",
    # "technology": "app_technology",
    # "miscellanea": "app_miscellanea",
}


def parse_appearances(soup) -> dict[str, list[dict]]:
    """Parse the Appearances section, returning a dict of category -> list of entries.

    Each entry is {"name": str, "tags": list[str]} where tags are things like
    "First appearance", "Mentioned only", "Appears in hologram", etc.

    Wookieepedia structures the Appearances section with sub-categories, each
    identified by an anchor ID (e.g. id="app_characters"). This function extracts
    entries from each category listed in APPEARANCE_CATEGORIES.

    To add more categories in the future, simply uncomment or add entries to
    APPEARANCE_CATEGORIES above.
    """
    results: dict[str, list[dict]] = {}

    for category, anchor_id in APPEARANCE_CATEGORIES.items():
        entries = _extract_category_entries(soup, anchor_id, category)
        if entries:
            results[category] = entries

    return results


def _extract_category_entries(soup, anchor_id: str, fallback_label: str) -> list[dict]:
    """Extract name+tag entries from a single appearance sub-category."""
    # Primary: find by anchor ID (e.g. id="app_characters")
    anchor = soup.find(id=anchor_id)
    if anchor:
        container = _find_name_container_after(anchor)
        if container:
            return _extract_entries(container)

    # Fallback: search for a heading with the category label within the Appearances section
    app_heading = None
    for h in soup.find_all(["h2", "h3"]):
        if "appearances" in h.get_text(strip=True).lower():
            app_heading = h
            break

    if not app_heading:
        return []

    sibling = app_heading.find_next_sibling()
    while sibling:
        if sibling.name == "h2":
            break
        if sibling.name in ("h3", "b", "p"):
            text = sibling.get_text(strip=True).lower()
            if fallback_label in text:
                container = _find_name_container_after(sibling)
                if container:
                    return _extract_entries(container)
                return []
        sibling = sibling.find_next_sibling()

    return []


def _find_name_container_after(element):
    """Find the next <table class='appearances'> or <ul> after an anchor element.

    Wookieepedia uses <table class="appearances"> for modern pages and <ul> for
    older ones. This walks siblings of the anchor (and its parents) to find either.
    """
    for sib in element.next_siblings:
        if not hasattr(sib, "name") or not sib.name:
            continue
        if sib.name == "table" and "appearances" in (sib.get("class") or []):
            return sib
        if sib.name == "ul":
            return sib
        if sib.name == "p" and sib.get("id", "").startswith("app_"):
            break

    return None


def _extract_entries(container) -> list[dict]:
    """Extract name + appearance tags from a <table class='appearances'> or <ul>.

    Returns list of {"name": str, "tags": list[str]}.
    Tags are extracted from <small> elements next to each link, e.g.
    "(First appearance)", "(Mentioned only)", "(Appears in hologram)".
    """
    entries: list[dict] = []

    # Both layouts use <li> items within <ul> — modern pages just wrap them in a table>td
    li_elements = container.find_all("li", recursive=True)

    for li in li_elements:
        link = li.find("a", href=True)
        if not link:
            continue
        name = link.get("title") or link.get_text(strip=True)
        if not name or name.startswith(("Category:", "Wookieepedia:")):
            continue

        # Extract tags from <small> elements in this <li>
        tags = []
        for small in li.find_all("small"):
            tag_text = small.get_text(strip=True)
            # Strip surrounding parentheses
            tag_text = tag_text.strip("()")
            if tag_text:
                tags.append(tag_text)

        entries.append({"name": name, "tags": tags})

    return entries
