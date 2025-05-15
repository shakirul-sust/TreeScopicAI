# TreeScopeAI Wood Species Classifier API

This is the FastAPI backend that runs on Hugging Face Spaces to serve the YOLOv11 model for wood species classification.

## API Endpoints

### GET /

Returns the API status.

**Response**
```json
{
  "message": "TreeScopeAI Wood Species Classifier API",
  "status": "online"
}
```

### POST /predict

Analyzes an uploaded image and returns the predicted wood species.

**Request**
- Method: POST
- Content-Type: multipart/form-data
- Body: form-data with key "file" containing the image file

**Response**
```json
{
  "label": "mahogany",
  "confidence": 0.95,
  "processing_time_ms": 250
}
```

## Setup for Hugging Face Spaces

1. Create a new Hugging Face Space with SDK: Docker
2. Clone this repository
3. Upload your YOLOv11 model file (best.pt) to the Space
4. Set the environment variable MODEL_PATH to point to your model file
5. Deploy the Space

## Local Development

1. Install dependencies
   ```
   pip install -r requirements.txt
   ```

2. Run the development server
   ```
   uvicorn main:app --reload
   ```

## Environment Variables

- `MODEL_PATH`: Path to the YOLOv11 model file (default: "best.pt")

## Testing the API

You can test the API with curl:

```bash
curl -X POST -F "file=@/path/to/image.jpg" https://yourusername-treescopeai.hf.space/predict
```

Or use the Swagger UI at `/docs` when running locally or on Hugging Face Spaces. 