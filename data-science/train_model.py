import pandas as pd
from fastai.collab import CollabDataLoaders, collab_learner
import os

def train_and_export():
    csv_path = os.path.join('data', 'reviews.csv')
    if not os.path.exists(csv_path):
        print("Data not found. Please run download_data.py first.")
        return

    print("Loading data...")
    df = pd.read_csv(csv_path)

    # FastAI collab expects columns: user, item, rating.
    df = df.rename(columns={'user_id': 'user', 'item_id': 'item'})

    print("Creating DataLoaders...")
    # bs is batch size
    dls = CollabDataLoaders.from_df(df, item_name='item', bs=64)

    print("Initializing Learner...")
    # n_factors is the size of the embedding vectors
    # y_range constraints the output to be between 0.5 and 5.5 (for 1 to 5 ratings)
    learn = collab_learner(dls, n_factors=50, y_range=(0.5, 5.5))

    print("Training model...")
    # Using fit_one_cycle for fast and efficient training
    learn.fit_one_cycle(3, 5e-3)

    print("Exporting model...")
    os.makedirs('models', exist_ok=True)
    learn.export('models/recommender.pkl')
    print("Model exported successfully to models/recommender.pkl")

if __name__ == "__main__":
    train_and_export()
