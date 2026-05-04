from fastai.learner import load_learner
import pandas as pd
import torch
import os

model_path = 'models/recommender.pkl'
learn = None

def load_model():
    global learn
    if os.path.exists(model_path):
        learn = load_learner(model_path)
        print("Model loaded successfully.")
    else:
        print("Model not found. Please train the model first.")

def get_recommendations(user_id: str, top_k: int = 5):
    if learn is None:
        return {"error": "Model not loaded"}
    
    # Get all unique items from the dataloaders
    try:
        items = list(learn.dls.classes['item'])
    except Exception as e:
        return {"error": f"Could not retrieve item classes from model: {str(e)}"}

    # If the user is unknown to the model (Cold Start)
    if user_id not in learn.dls.classes['user']:
        # Fallback to generic items for new users. 
        # In a real system, this would be based on popularity.
        # Note: items[0] is often a special token like '#na#' in fastai
        return {
            "user_id": user_id, 
            "recommendations": items[1:top_k+1], 
            "note": "New user, returning generic recommendations"
        }
    
    # Create a test dataframe for this user with all items
    test_df = pd.DataFrame({'user': [user_id] * len(items), 'item': items})
    
    # Predict ratings for all items for this user
    dl = learn.dls.test_dl(test_df)
    preds, _ = learn.get_preds(dl=dl)
    
    # Add predictions to the dataframe
    test_df['pred_rating'] = preds.numpy().flatten()
    
    # Filter out the special '#na#' token if present
    test_df = test_df[test_df['item'] != '#na#']
    
    # Sort by predicted rating descending
    test_df = test_df.sort_values(by='pred_rating', ascending=False)
    
    # Get top K items
    top_items = test_df.head(top_k)['item'].tolist()
    
    return {
        "user_id": user_id,
        "recommendations": top_items
    }
