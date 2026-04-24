"""
Boost Dashboard — FastAPI backend
Run: uvicorn main:app --reload --port 8080
or:  python main.py
"""
import io
import mimetypes
import sys
from pathlib import Path

import pandas as pd
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse, Response

# Allow importing from this directory when run directly
sys.path.insert(0, str(Path(__file__).parent))
from compute import compute_all  # noqa: E402

app = FastAPI(title="Boost Dashboard API")

DASHBOARD = Path(__file__).parent.parent / "dashboard"

# ── In-memory state ──────────────────────────────────────────────────────────
_state = {
    "js":   None,   # current data_computed.js content
    "info": None,   # dataset metadata dict
}


# ── API routes ────────────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    """Accept a CSV file, compute all aggregates, store in memory."""
    raw = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(raw), encoding="utf-8-sig", low_memory=False)
    except Exception:
        try:
            df = pd.read_csv(io.BytesIO(raw), encoding="latin-1", low_memory=False)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Cannot parse CSV: {e}")

    try:
        js, info = compute_all(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {e}")

    info["filename"] = file.filename or "uploaded.csv"
    _state["js"]   = js
    _state["info"] = info
    return JSONResponse({"status": "ok", "info": info})


@app.get("/api/status")
def status():
    if _state["info"]:
        return JSONResponse({"status": "ok", **_state["info"]})
    return JSONResponse({"status": "no_data"})


# ── Dynamic data_computed.js ──────────────────────────────────────────────────

@app.get("/data_computed.js")
def data_js():
    if _state["js"]:
        return Response(_state["js"], media_type="application/javascript")
    # Fall back to pre-built static file
    static = DASHBOARD / "data_computed.js"
    if static.exists():
        return Response(static.read_text(encoding="utf-8"), media_type="application/javascript")
    return Response("// no data loaded yet", media_type="application/javascript")


# ── Static file serving ───────────────────────────────────────────────────────

def _serve(path: Path):
    if not path.exists() or not path.is_file():
        return None
    mime, _ = mimetypes.guess_type(str(path))
    return Response(path.read_bytes(), media_type=mime or "application/octet-stream")


@app.get("/")
def root():
    r = _serve(DASHBOARD / "index.html")
    return r or Response("not found", status_code=404)


@app.get("/{full_path:path}")
def static(full_path: str):
    # Never serve data_computed.js from here (already handled above)
    if full_path == "data_computed.js":
        return data_js()
    target = DASHBOARD / full_path
    r = _serve(target)
    if r:
        return r
    # SPA fallback
    return _serve(DASHBOARD / "index.html") or Response("not found", status_code=404)


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"Dashboard:  http://localhost:8080")
    print(f"Upload API: POST http://localhost:8080/api/upload")
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True,
                reload_dirs=[str(Path(__file__).parent)])
