import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

df = pd.read_csv('public/datasets/champions_league/champions_league_total.csv')

yellow_cards_per_country_champions = df.groupby('nationality').agg({
    'yellow_cards': 'sum',
    'appearances': 'sum'
})

yellow_cards_per_country_champions['yellow_per_appearance'] = (yellow_cards_per_country_champions['yellow_cards'] / yellow_cards_per_country_champions['appearances'])

yellow_cards_per_country_champions = yellow_cards_per_country_champions.sort_values('yellow_per_appearance', ascending=False)

plt.figure(figsize=(8, 5))
# plt.bar(yellow_cards_per_country_champions.index, yellow_cards_per_country_champions['yellow_per_appearance'])
sns.barplot(x=yellow_cards_per_country_champions.index, y=yellow_cards_per_country_champions['yellow_per_appearance'])
plt.xticks(rotation=45)
plt.xlabel('Countries')
plt.ylabel('Yellow Cards per Appearance')
plt.title('Total Yellow Cards per Country per Appearance - UEFA Champions League')
plt.tight_layout()
plt.show()

# WITHOUT NORMALIZATION
# plt.figure(figsize=(8, 5))
# plt.bar(yellow_cards_per_country_champions.index, yellow_cards_per_country_champions['yellow_cards'])
# plt.xticks(rotation=45)
# plt.xlabel('Countries')
# plt.ylabel('Yellow Cards')
# plt.title('Yellow Cards per Country (Not Normalized)')
# plt.show()

#############
# Plot 2
#############

uefa_combined = pd.read_csv('public/datasets/uefa_combined/uefa_all_leagues_combined.csv')

total_referees = uefa_combined.groupby('name').agg({
    'yellow_cards': 'sum',
    'appearances': 'sum',
    'double_yellow_cards': 'sum',
    'red_cards': 'sum',
    'age': 'first'
})

total_referees['average_cards_per_game'] = ((total_referees['yellow_cards'] + total_referees['double_yellow_cards'] + total_referees['red_cards']) / total_referees['appearances'])

plt.figure(figsize=(8, 5))
sns.scatterplot(x=total_referees['age'], y=total_referees['average_cards_per_game'])
plt.xticks(rotation=45)
plt.xlabel('Referee Age')
plt.ylabel('Average Cards per Game')
plt.title('Referee Age vs. Average Cards per Game')
plt.tight_layout()
plt.show()

# John Brooks,England,0,11,0,0,0,4,Europa has 0 age, Ishmael Barbara,Malta,0,5,0,1,0,2,Conference has 0 age

##################
# Plot 3
##################

df = pd.read_csv('public/datasets/uefa_combined/uefa_all_leagues_combined.csv')

df['total_cards'] = df['yellow_cards'] + df['double_yellow_cards'] + df['red_cards']

top20_referees = df.nlargest(20, 'total_cards')['name']

melted = pd.melt(
    df,
    id_vars=['name', 'league'],
    value_vars=['yellow_cards', 'double_yellow_cards', 'red_cards'],
    var_name='card_type',
    value_name='num_cards'
)

melted_top20 = melted[melted['name'].isin(top20_referees)]

plt.figure(figsize=(12, 6))
sns.barplot(
    x='name',          # referee on x-axis
    y='num_cards',     # number of cards issued
    hue='card_type',   # colored by card type
    data=melted_top20, # top 20
    dodge=True         # groups bars side by side
)
plt.xticks(rotation=90)
plt.xlabel('Referee')
plt.ylabel('Number of Cards')
plt.title('Top 20 Referees: Cards Issued by Type')
plt.tight_layout()
plt.show()

sns.catplot(
    x='name',
    y='num_cards',
    hue='card_type',
    col='league',      # one plot per league
    data=melted_top20,
    kind='bar',
    col_wrap=1,        # vertical arrangement
    height=5,
    aspect=2
)
plt.xticks(rotation=90)
plt.tight_layout()
plt.show()