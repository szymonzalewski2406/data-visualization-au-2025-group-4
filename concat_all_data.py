import pandas as pd

champions = pd.read_csv('uefa_champions_data/uefa_gesamt.csv')
conference = pd.read_csv('uefa_conference_data/uefa_gesamt.csv')
europa = pd.read_csv('uefa_europa_data/uefa_gesamt.csv')

champions['league'] = 'Champions'
conference['league'] = 'Conference'
europa['league'] = 'Europa'

combined = pd.concat([champions, conference, europa])
combined.to_csv('combined.csv')