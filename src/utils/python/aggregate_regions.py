import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

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

aggregated_regions = df.groupby('region').agg({
    'yellow_cards': 'sum',
    'double_yellow_cards': 'sum',
    'red_cards': 'sum',
    'penalties': 'sum',
    'appearances': 'sum',
    'name': 'count'
})

aggregated_regions = aggregated_regions.rename(columns={'name': 'referees'})

aggregated_regions['total_cards'] = (
    aggregated_regions['yellow_cards']
    + aggregated_regions['double_yellow_cards']
    + aggregated_regions['red_cards']
)

aggregated_regions['yc_per_appearance'] = aggregated_regions['yellow_cards'] / aggregated_regions['appearances']
aggregated_regions['yyc_per_appearance'] = aggregated_regions['double_yellow_cards'] / aggregated_regions['appearances']
aggregated_regions['rc_per_appearance'] = aggregated_regions['red_cards'] / aggregated_regions['appearances']
aggregated_regions['penalties_per_appearance'] = aggregated_regions['penalties'] / aggregated_regions['appearances']
aggregated_regions['tc_per_appearance'] = aggregated_regions['total_cards'] / aggregated_regions['appearances']
aggregated_regions['appearances_per_referee'] = aggregated_regions['appearances'] / aggregated_regions['referees']

# YELLOW PER APPEARANCE
plt.figure(figsize=(12, 6))
plt.bar(aggregated_regions.index, aggregated_regions['yc_per_appearance'])
plt.xlabel('Regions')
plt.ylabel('Yellow Cards')
plt.title('Yellow Cards per Appearance')
plt.savefig('src/utils/python/plots/yellow_cards_per_appearance')

# DOUBLE YELLOW PER APPEARANCE
plt.figure(figsize=(12, 6))
plt.bar(aggregated_regions.index, aggregated_regions['yyc_per_appearance'])
plt.xlabel('Regions')
plt.ylabel('Double-Yellow Cards')
plt.title('Double Yellow Cards per Appearance')
plt.savefig('src/utils/python/plots/double_yellow_cards_per_appearance')

# RED PER APPEARANCE
plt.figure(figsize=(12, 6))
plt.bar(aggregated_regions.index, aggregated_regions['rc_per_appearance'])
plt.xlabel('Regions')
plt.ylabel('Red Cards')
plt.title('Red Cards per Appearance')
plt.savefig('src/utils/python/plots/red_cards_per_appearance')

# PENALTIES PER APPEARANCE
plt.figure(figsize=(12, 6))
plt.bar(aggregated_regions.index, aggregated_regions['penalties_per_appearance'])
plt.xlabel('Regions')
plt.ylabel('Penalties')
plt.title('Penalties per Appearance')
plt.savefig('src/utils/python/plots/penalties_per_appearance')

# GROUPED BY TYPE
x = np.arange(len(aggregated_regions.index))
width = 0.18

plt.figure(figsize=(12, 6))
plt.bar(x - 1.5*width, aggregated_regions['yc_per_appearance'],   width, label='Yellow', color='yellow')
plt.bar(x - 0.5*width, aggregated_regions['yyc_per_appearance'],  width, label='Double yellow', color='orange')
plt.bar(x + 0.5*width, aggregated_regions['rc_per_appearance'],   width, label='Red', color='red')
plt.bar(x + 1.5*width, aggregated_regions['penalties_per_appearance'], width, label='Penalties', color='blue')
plt.xticks(x, aggregated_regions.index)
plt.ylabel('Cards / appearance')
plt.xlabel('Region')
plt.title('Cards per appearance by region and type')
plt.legend()
plt.tight_layout()
plt.savefig('src/utils/python/plots/grouped_bar_each_card_plus_penalties')

# TOTAL CARDS PER APPEARANCE
plt.figure(figsize=(12, 6))
plt.bar(aggregated_regions.index, aggregated_regions['tc_per_appearance'])
plt.xlabel('Regions')
plt.ylabel('Total Cards')
plt.title('Total Cards per Appearance')
plt.savefig('src/utils/python/plots/total_cards_per_appearance')

# APPEARANCES PER REFEREE
plt.figure(figsize=(12, 6))
plt.bar(aggregated_regions.index, aggregated_regions['appearances_per_referee'])
plt.xlabel('Regions')
plt.ylabel('Appearances')
plt.title('Appearances per referee')
plt.savefig('src/utils/python/plots/appearances_per_referee')

print(aggregated_regions.head())

# aggregated_countries = df.groupby('nationality').agg({
#     'yellow_cards': 'sum',
#     'double_yellow_cards': 'sum',
#     'red_cards': 'sum',
#     'penalties': 'sum',
#     'appearances': 'sum'
# })

# print(aggregated_countries.index)