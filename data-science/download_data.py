import os
import pandas as pd

def download_and_prepare_data():
    """
    Downloads the Amazon product review dataset from HuggingFace Datasets Hub
    (McAuley-Lab/Amazon-Reviews-2023) which is publicly available and actively maintained.

    The dataset mirrors the original Stanford SNAP Amazon reviews but is
    reliably hosted on HuggingFace, making it ideal for training our
    collaborative filtering recommender model.

    Columns used: user_id, parent_asin (= item_id), rating
    """
    try:
        from datasets import load_dataset
    except ImportError:
        print("Installing datasets library...")
        os.system("pip install datasets")
        from datasets import load_dataset

    # Categories to download — each is a separate HuggingFace subset
    categories = [
        "Video_Games",
        "Software",
        "Pet_Supplies",
        "Office_Products",
        "Toys_and_Games",
    ]

    samples_per_category = 20_000
    all_reviews = []

    print("Downloading Amazon review data from HuggingFace Datasets...")

    for category in categories:
        try:
            print(f"  ↳ Loading {category} ({samples_per_category:,} reviews)...")
            # streaming=True avoids downloading the full file before reading
            ds = load_dataset(
                "McAuley-Lab/Amazon-Reviews-2023",
                f"raw_review_{category}",
                split="full",
                streaming=True,
                trust_remote_code=True,
            )

            rows = []
            for item in ds:
                rows.append({
                    "user_id": item["user_id"],
                    "item_id": item["parent_asin"],   # ASIN — used in recommendation URL
                    "rating": float(item["rating"]),
                })
                if len(rows) >= samples_per_category:
                    break

            df = pd.DataFrame(rows).dropna()
            all_reviews.append(df)
            print(f"     ✅ Loaded {len(df):,} reviews from {category}")

        except Exception as e:
            print(f"     ❌ Failed to load {category}: {e}")

    if not all_reviews:
        print("\nFailed to download any data.")
        print("Generating synthetic data for testing instead...")
        _generate_synthetic_data()
        return

    final_df = pd.concat(all_reviews, ignore_index=True)
    final_df = final_df.drop_duplicates(subset=["user_id", "item_id"])

    os.makedirs("data", exist_ok=True)
    csv_path = os.path.join("data", "reviews.csv")
    final_df.to_csv(csv_path, index=False)

    print(f"\n✅ Saved {len(final_df):,} reviews to {csv_path}")
    print(f"   Unique users: {final_df['user_id'].nunique():,}")
    print(f"   Unique items: {final_df['item_id'].nunique():,}")


def _generate_synthetic_data(n_users=500, n_items=200, n_ratings=10_000):
    """Fallback: generate synthetic user-item ratings for testing."""
    import numpy as np
    rng = np.random.default_rng(42)
    df = pd.DataFrame({
        "user_id": ["U" + str(rng.integers(0, n_users)) for _ in range(n_ratings)],
        "item_id": ["B" + str(rng.integers(0, n_items)).zfill(10) for _ in range(n_ratings)],
        "rating": rng.integers(1, 6, n_ratings).astype(float),
    }).drop_duplicates(subset=["user_id", "item_id"])

    os.makedirs("data", exist_ok=True)
    csv_path = os.path.join("data", "reviews.csv")
    df.to_csv(csv_path, index=False)
    print(f"⚠️  Saved {len(df):,} synthetic reviews to {csv_path}")


if __name__ == "__main__":
    download_and_prepare_data()
