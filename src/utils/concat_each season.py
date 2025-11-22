import pandas as pd

for league in ['champions', 'conference', 'europa']:

    uefa_2021 = pd.read_csv(f'public/datasets/{league}_league/{league}_league_2021_2022.csv')
    uefa_2022 = pd.read_csv(f'public/datasets/{league}_league/{league}_league_2022_2023.csv')
    uefa_2023 = pd.read_csv(f'public/datasets/{league}_league/{league}_league_2023_2024.csv')
    uefa_2024 = pd.read_csv(f'public/datasets/{league}_league/{league}_league_2024_2025.csv')

    overall_data = pd.concat([uefa_2021, uefa_2022, uefa_2023, uefa_2024], ignore_index=True)

    df_merged = overall_data.groupby(['name', 'nationality', 'age'], as_index=False).agg({
        'yellow_cards': 'sum',
        'double_yellow_cards': 'sum',
        'red_cards': 'sum',
        'penalties': 'sum',
        'appearances': 'sum'
    })

    df_merged.to_csv(f'public/datasets/{league}_league/{league}_league_total.csv', index=False)