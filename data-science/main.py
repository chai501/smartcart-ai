from fastapi import FastAPI, HTTPException
import recommender
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the model when the server starts
    recommender.load_model()
    yield

app = FastAPI(title="Smart E-Commerce Recommendation Service", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"status": "ML Service is Running. Use /recommend/{user_id} to get recommendations."}

@app.get("/recommend/{user_id}")
def recommend(user_id: str, top_k: int = 5):
    result = recommender.get_recommendations(user_id, top_k=top_k)
    if "error" in result:
        raise HTTPException(status_code=503, detail=result["error"])
    return result

if __name__ == "__main__":
    import uvicorn
    # To run locally during development
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
