import pandas as pd

df = pd.read_csv('public/datasets/uefa_combined/uefa_all_leagues_combined.csv')

region_map = {
    # Nordic
    'Denmark': 'Nordic', 'Finland': 'Nordic', 'Iceland': 'Nordic',
    'Norway': 'Nordic', 'Sweden': 'Nordic',

    # Southern
    'Albania': 'Southern', 'Bosnia-Herzegovina': 'Southern',
    'Croatia': 'Southern', 'Greece': 'Southern', 'Italy': 'Southern',
    'Malta': 'Southern', 'Montenegro': 'Southern',
    'North Macedonia': 'Southern', 'Portugal': 'Southern',
    'Serbia': 'Southern', 'Slovenia': 'Southern', 'Spain': 'Southern',

    # Western/Central
    'Austria': 'Western', 'Belgium': 'Western', 'France': 'Western',
    'Germany': 'Western', 'Ireland': 'Western', 'Luxembourg': 'Western',
    'Netherlands': 'Western', 'Switzerland': 'Western',
    'England': 'Western', 'Scotland': 'Western', 'Wales': 'Western',

    # Eastern
    'Armenia': 'Eastern', 'Azerbaijan': 'Eastern', 'Belarus': 'Eastern',
    'Bulgaria': 'Eastern', 'Czech Republic': 'Eastern', 'Estonia': 'Eastern',
    'Georgia': 'Eastern', 'Hungary': 'Eastern', 'Kazakhstan': 'Eastern',
    'Kosovo': 'Eastern', 'Latvia': 'Eastern', 'Lithuania': 'Eastern',
    'Moldova': 'Eastern', 'Poland': 'Eastern', 'Romania': 'Eastern',
    'Russia': 'Eastern', 'Slovakia': 'Eastern', 'Ukraine': 'Eastern',
    'Türkiye': 'Eastern', 'Cyprus': 'Eastern',
}

df['region'] = df['nationality'].map(region_map)

print(df.head())

aggregated_regions = df.groupby('region').agg({
    'yellow_cards': 'sum',
    'double_yellow_cards': 'sum',
    'red_cards': 'sum',
    'penalties': 'sum',
    'appearances': 'sum',
    'name': 'count'
})

aggregated_regions = aggregated_regions.rename(columns={'name': 'referees'})

print(aggregated_regions.index)
print(aggregated_regions.head(10))

# aggregated_countries = df.groupby('nationality').agg({
#     'yellow_cards': 'sum',
#     'double_yellow_cards': 'sum',
#     'red_cards': 'sum',
#     'penalties': 'sum',
#     'appearances': 'sum'
# })

# print(aggregated_countries.index)