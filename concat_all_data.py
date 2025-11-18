import pandas as pd
import os

champions = pd.read_csv('public/datasets/champions_league/champions_league_total.csv')
conference = pd.read_csv('public/datasets/conference_league/conference_league_total.csv')
europa = pd.read_csv('public/datasets/europa_league/europa_league_total.csv')

champions['league'] = 'Champions'
conference['league'] = 'Conference'
europa['league'] = 'Europa'

combined = pd.concat([champions, conference, europa])

os.makedirs('public/datasets/uefa_combined', exist_ok=True)
combined.to_csv('public/datasets/uefa_combined/uefa_all_leagues_combined.csv')