from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import os
import numpy as np
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TreeScopeAI Wood Species Classifier")

# Enable CORS with more specific configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Explicitly allow these methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Load model once at startup
MODEL_PATH = os.environ.get("MODEL_PATH", "/code/best.pt")

@app.on_event("startup")
async def startup_event():
    global model
    logger.info(f"Loading model from {MODEL_PATH}...")
    try:
        model = YOLO(MODEL_PATH)
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise

@app.get("/")
async def root():
    return {"message": "TreeScopeAI Wood Species Classifier API", "status": "online"}

@app.get("/species")
async def get_species():
    """Endpoint to get available wood species"""
    try:
        # Get species names from the model
        species_list = list(model.names.values())
        return {"species": species_list}
    except Exception as e:
        logger.error(f"Error getting species list: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Validate file
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        start_time = time.time()
        image_bytes = await file.read()
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Run inference
        results = model(image)
        
        # Get top prediction
        result = results[0]
        
        # Check if classification or object detection
        if hasattr(result, 'probs'):
            # Classification result
            top_class_id = result.probs.top1
            top_class_name = result.names[top_class_id]
            confidence = float(result.probs.top1conf)
        else:
            # Object detection result - use the highest confidence box
            if len(result.boxes) == 0:
                return {"error": "No objects detected"}
            
            # Find the box with the highest confidence
            best_box_idx = result.boxes.conf.argmax().item()
            top_class_id = int(result.boxes.cls[best_box_idx].item())
            top_class_name = result.names[top_class_id]
            confidence = float(result.boxes.conf[best_box_idx].item())
        
        process_time = time.time() - start_time
        
        return {
            "label": top_class_name,
            "confidence": confidence,
            "processing_time_ms": int(process_time * 1000)
        }
        
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# For testing locally
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 