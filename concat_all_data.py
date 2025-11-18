import pandas as pd
import os

champions = pd.read_csv('uefa_champions_data/uefa_gesamt.csv')
conference = pd.read_csv('uefa_conference_data/uefa_gesamt.csv')
europa = pd.read_csv('uefa_europa_data/uefa_gesamt.csv')

champions['league'] = 'Champions'
conference['league'] = 'Conference'
europa['league'] = 'Europa'

combined = pd.concat([champions, conference, europa])

os.makedirs('combined_data', exist_ok=True)
combined.to_csv('combined_data/uefa_all_leagues_combined.csv')