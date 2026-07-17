from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import admin, agents, assets, documents, evaluation
from app.core.config import settings
from app.db.session import check_connection, pgvector_available

app = FastAPI(title="PlantBrain AI API", version="0.1.0")


@app.exception_handler(HTTPException)
async def http_error(_request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        content = exc.detail
    else:
        content = {"error": {"code": "http_error", "message": str(exc.detail)}}
    return JSONResponse(status_code=exc.status_code, content=content, headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def validation_error(_request: Request, exc: RequestValidationError):
    details = [{key: error[key] for key in ("loc", "type", "msg") if key in error}
               for error in exc.errors()]
    return JSONResponse(status_code=422, content={"error": {
        "code": "validation_error",
        "message": "Request validation failed.",
        "details": details,
    }})

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(assets.router)
app.include_router(agents.router)
app.include_router(evaluation.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    db_connected = check_connection()
    pgvector_enabled = pgvector_available() if db_connected else False
    payload = {
        "status": "ok" if db_connected else "degraded",
        "db_connected": db_connected,
        "pgvector_enabled": pgvector_enabled,
    }
    return payload if db_connected else JSONResponse(status_code=503, content=payload)
