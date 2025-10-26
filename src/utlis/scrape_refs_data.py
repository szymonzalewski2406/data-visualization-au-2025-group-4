import requests
import csv
from bs4 import BeautifulSoup
import os

HEADERS = {"User-Agent": "Mozilla/5.0"}
# BASE = "https://www.transfermarkt.co.uk/uefa-champions-league/schiedsrichter/pokalwettbewerb/CL"
# BASE = "https://www.transfermarkt.co.uk/uefa-europa-league/schiedsrichter/pokalwettbewerb/EL"
BASE = "https://www.transfermarkt.co.uk/uefa-conference-league/schiedsrichter/pokalwettbewerb/UCOL"
SEASONS = ("gesamt", "2021", "2022", "2023", "2024")

os.makedirs("uefa_conference_data", exist_ok=True)

for season in SEASONS:
    # Get last page from page 1
    soup = BeautifulSoup(requests.get(f"{BASE}/page/1/?saison_id={season}", headers=HEADERS).text, "lxml")
    last_page_title = soup.find("li", class_="tm-pagination__list-item tm-pagination__list-item--icon-last-page") \
                        .find("a", class_="tm-pagination__link")["title"]
    last_page = int(last_page_title.split("page ")[-1].split(")")[0])

    with open(F"uefa_conference_data/uefa_{season}.csv", "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow([
            "name", "nationality", "age", "yellow_cards",
            "double_yellow_cards", "red_cards", "penalties", "appearances"
        ])

        for page in range(1, last_page + 1):
            url = f"{BASE}/page/{page}/?saison_id={season}"
            soup = BeautifulSoup(requests.get(url, headers=HEADERS).text, "lxml")

            container = soup.find("div", id="yw1")
            if not container:
                continue
            rows = container.find_all("tr", class_=["odd", "even"])

            for row in rows:
                name = row.find("td", class_="links no-border-links hauptlink").get_text(strip=True)
                nationality = row.find("img", class_="flaggenrahmen")["title"]

                cells = row.find_all("td", class_="zentriert")
                # take all cells from index 2 onward (skip portrait + flag)
                numbers = [td.get_text(strip=True) for td in cells[2:]]

                writer.writerow([name, nationality] + numbers)