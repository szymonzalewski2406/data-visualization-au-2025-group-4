import requests
import csv
from bs4 import BeautifulSoup

SEASONS = ["2021", "2022", "2023", "2024"]

page_to_scrape = requests.get("https://www.transfermarkt.co.uk/uefa-champions-league/schiedsrichter/pokalwettbewerb/CL", headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(page_to_scrape.text, "lxml")

with open("uefa_total_overview.csv", "w", newline="", encoding="utf-8") as file:
    writer = csv.writer(file)
    writer.writerow([
        "name", "nationality", "age", "yellow_cards", "double_yellow_cards", "red_cards", "penalties", "appearances"
    ])

    container = soup.find("div", id="yw1")
    rows = container.find_all("tr", attrs={"class": ["odd", "even"]})

    for row in rows:
        name = row.find("td", attrs={"class": "links no-border-links hauptlink"}).string
        
        nationality = row.find("img", attrs={"class": "flaggenrahmen"})["title"]

        cells = row.find_all("td", attrs={"class": "zentriert"})

        row_data = [name, nationality]

        for i in range(2, len(cells)):
            row_data = row_data + [cells[i].string]
        
        writer.writerow(row_data)