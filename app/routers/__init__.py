from .auth_routes import router as auth_router
from .docs_routes import router as docs_router
from .verification_routes import router as verification_router
from .fraud_routes import router as fraud_router
from .compliance_routes import router as compliance_router

routers = [auth_router, docs_router, verification_router, fraud_router, compliance_router]
