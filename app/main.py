from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from .routers import routers

# Initialize the App
app = FastAPI(title="KYC Verification API", version="1.0.0")

# 1. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Custom OpenAPI (for JWT Auth support in Swagger UI)
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description="Backend for AI-Powered Identity Verification and Fraud Detection",
        routes=app.routes,
    )
    # Add Bearer Auth scheme
    schema.setdefault("components", {}).setdefault("securitySchemes", {})["bearerAuth"] = {
        "type": "http", "scheme": "bearer", "bearerFormat": "JWT"
    }
    schema["security"] = [{"bearerAuth": []}]
    app.openapi_schema = schema
    return app.openapi_schema

app.openapi = custom_openapi

# 3. Include Routers
# This assumes 'app/routers/__init__.py' exports a list named 'routers'
for r in routers:
    app.include_router(r)

# 4. Root Endpoint
@app.get("/")
def root():
    return {"message": "✅ KYC OCR + Fraud API up", "milestone": 2}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)