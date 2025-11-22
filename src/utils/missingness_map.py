import missingno as msno
import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv('public/datasets/uefa_combined/uefa_all_leagues_combined.csv')

msno.matrix(df)
plt.show()