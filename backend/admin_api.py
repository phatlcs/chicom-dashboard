"""
Admin panel API endpoints for ChiCom Dashboard.
Handles data batch management, uploads, and monthly report generation.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
import tempfile
import os
from datetime import datetime
import json

from data_loader import load_xlsx_data, get_batch_summary, list_batches
from compute import compute_all

router = APIRouter(prefix="/api/admin", tags=["admin"])

# ============================================================================
# Data Batch Management
# ============================================================================

@router.get("/batches")
async def get_batches(
    month: str = Query(None, description="Filter by month (YYYY-MM)")
):
    """Get list of all data batches, optionally filtered by month."""
    try:
        month_date = None
        if month:
            month_date = datetime.strptime(month, "%Y-%m")

        batches = list_batches(month_date)
        return {
            "status": "success",
            "count": len(batches),
            "batches": batches
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/batches/{batch_id}")
async def get_batch_details(batch_id: int):
    """Get detailed information about a specific batch."""
    try:
        summary = get_batch_summary(batch_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Batch not found")
        return {
            "status": "success",
            "batch": summary
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# File Upload
# ============================================================================

@router.post("/upload/xlsx")
async def upload_xlsx(
    file: UploadFile = File(...),
    month: str = Query(..., description="Month for data (YYYY-MM format)")
):
    """
    Upload XLSX file for data ingestion.

    Expected columns:
    - group_id, author_name, author_id, created_date, content, title, depth, post_type
    - link, context, master_topic, sub_topic, sentiment, persona, brand_mentions
    - product_category, recommendation, granular_topic, trigger_to_leave, relevant
    """
    try:
        # Validate month format
        month_date = datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")

    try:
        # Validate file extension
        if not file.filename.endswith('.xlsx'):
            raise HTTPException(status_code=400, detail="File must be .xlsx format")

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix='.xlsx',
            dir=tempfile.gettempdir()
        ) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Load data into database
        batch_id, stats = load_xlsx_data(
            file_path=tmp_path,
            month_year=month_date,
            uploaded_by='admin_panel'
        )

        # Clean up temp file
        os.unlink(tmp_path)

        return {
            "status": "success",
            "message": "XLSX data uploaded and processed successfully",
            "batch_id": batch_id,
            "stats": stats
        }

    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Report Generation
# ============================================================================

@router.post("/generate-report/{batch_id}")
async def generate_monthly_report(batch_id: int):
    """
    Generate monthly report (Q1-Q14 aggregations and insights) for a batch.
    This will:
    1. Compute all Q1-Q14 aggregates
    2. Generate LLM insights for each question
    3. Store results in monthly_aggregates and monthly_insights tables
    """
    try:
        batch_summary = get_batch_summary(batch_id)
        if not batch_summary:
            raise HTTPException(status_code=404, detail="Batch not found")

        # TODO: Implement report generation
        # This should call compute_all() with data filtered by batch_id
        # and store results in monthly_aggregates and monthly_insights

        return {
            "status": "success",
            "message": f"Report generation started for batch {batch_id}",
            "batch_id": batch_id,
            "month": batch_summary['month'],
            "total_posts": batch_summary['total_posts']
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report/{batch_id}")
async def get_monthly_report(batch_id: int):
    """Get the generated report for a batch."""
    try:
        batch_summary = get_batch_summary(batch_id)
        if not batch_summary:
            raise HTTPException(status_code=404, detail="Batch not found")

        # TODO: Fetch aggregates and insights from database for this batch_id
        # Return Q1-Q14 data in the same format as current dashboard

        return {
            "status": "success",
            "batch_id": batch_id,
            "month": batch_summary['month'],
            "kpi": {
                "total_posts": batch_summary['total_posts'],
                "relevant_posts": batch_summary['relevant_posts']
            },
            "q1_q14": {}  # TODO: fetch from DB
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Stats & Dashboard
# ============================================================================

@router.get("/stats")
async def get_admin_stats():
    """Get overall admin dashboard statistics."""
    try:
        batches = list_batches()

        stats = {
            "total_batches": len(batches),
            "total_posts": sum(b['total'] for b in batches),
            "total_relevant": sum(b['relevant'] for b in batches),
            "batches_by_status": {
                "completed": len([b for b in batches if b['status'] == 'COMPLETED']),
                "processing": len([b for b in batches if b['status'] == 'PROCESSING']),
                "failed": len([b for b in batches if b['status'] == 'FAILED']),
            },
            "latest_batches": batches[:5]
        }

        return {
            "status": "success",
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Configuration
# ============================================================================

@router.get("/config/master-topics")
async def get_master_topics():
    """Get available master topics for classification."""
    # TODO: Fetch from database
    return {
        "status": "success",
        "topics": []
    }

@router.get("/config/personas")
async def get_personas():
    """Get available persona categories."""
    # TODO: Fetch from database
    return {
        "status": "success",
        "personas": []
    }

@router.get("/config/product-categories")
async def get_product_categories():
    """Get available product categories (Q10)."""
    # TODO: Fetch from database
    return {
        "status": "success",
        "categories": []
    }
