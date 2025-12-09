# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

# This imports the list `routers` from app/routers/__init__.py
from .routers import routers

app = FastAPI(title="KYC Verification API", version="1.0.0")

# ----------------------
# CORS CONFIG
# ----------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# OPENAPI JWT SUPPORT
# ----------------------
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description="Backend for AI-Powered KYC Verification & Fraud Detection",
        routes=app.routes,
    )

    schema.setdefault("components", {}).setdefault("securitySchemes", {})["bearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
    }

    schema["security"] = [{"bearerAuth": []}]
    app.openapi_schema = schema
    return schema

app.openapi = custom_openapi

# ----------------------
# INCLUDE ALL ROUTERS
# ----------------------
for router in routers:
    app.include_router(router)

# ----------------------
# ROOT ENDPOINT
# ----------------------
@app.get("/")
def root():
    return {"message": "✅ Backend Running", "milestone": 2}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
