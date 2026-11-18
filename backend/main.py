"""
AML Mule Account Detection - FastAPI Backend Service
Provides REST API endpoints for:
- Overview Dashboard metrics & feature importances
- Decision Tree model performance & evaluation results
- Suspicious accounts triage queue with search & filters
- Single account investigation dossier & real transaction ledger
- Real transaction-level network topology graph
"""

import os
import sys
import json
import time
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import polars as pl
import pandas as pd
import numpy as np
import joblib

# ---------------------------------------------------------------------------
# Path Resolution
# ---------------------------------------------------------------------------
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATASET_DIR = os.path.join(BASE_DIR, "DataSet")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
ALT_OUTPUTS_DIR = os.path.join(BASE_DIR, "Mule-Account-Detection--main", "outputs")

def find_file(relative_paths: List[str]) -> str:
    for rel in relative_paths:
        full = os.path.normpath(os.path.join(BASE_DIR, rel))
        if os.path.exists(full):
            return full
    raise FileNotFoundError(f"Could not find any of: {relative_paths}")

# Locate model, evaluation JSON, and dataset
MODEL_PATH = find_file([
    "outputs/baseline_decision_tree.joblib",
    "Mule-Account-Detection--main/outputs/baseline_decision_tree.joblib"
])

EVAL_PATH = find_file([
    "outputs/full_decision_tree_results.json",
    "Mule-Account-Detection--main/outputs/full_decision_tree_results.json"
])

DATASET_PATH = find_file([
    "Mule-Account-Detection--main/outputs/train_features_full.parquet",
    "outputs/train_features_full.parquet",
    "Mule-Account-Detection--main/outputs/train_10k_baseline.parquet"
])

TRANSACTIONS_INDEX_PATH = os.path.join(DATASET_DIR, "transactions_index.json")

# ---------------------------------------------------------------------------
# FastAPI Initialization
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AML Mule Account Detection API",
    description="Backend service powering ML inference and investigative analytics",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global In-Memory State
# ---------------------------------------------------------------------------
STATE: Dict[str, Any] = {
    "model_bundle": None,
    "eval_results": None,
    "accounts_df": None,
    "accounts_dict": {},
    "account_ids_list": [],
    "transactions_index": [],
    "overview_metrics": None,
}

def load_backend_state():
    print(f"Loading Decision Tree model from: {MODEL_PATH}")
    bundle = joblib.load(MODEL_PATH)
    STATE["model_bundle"] = bundle

    print(f"Loading Evaluation JSON from: {EVAL_PATH}")
    with open(EVAL_PATH, "r", encoding="utf-8") as f:
        STATE["eval_results"] = json.load(f)

    if os.path.exists(TRANSACTIONS_INDEX_PATH):
        print(f"Loading Transaction Index from: {TRANSACTIONS_INDEX_PATH}")
        with open(TRANSACTIONS_INDEX_PATH, "r", encoding="utf-8") as f:
            STATE["transactions_index"] = json.load(f)
    else:
        print("Warning: transactions_index.json not found.")

    print(f"Loading Accounts Dataset from: {DATASET_PATH}")
    df = pl.read_parquet(DATASET_PATH)

    # Compute actual model probabilities for all accounts
    feature_cols = bundle["feature_cols"]
    cat_cols = bundle["cat_cols"]
    clf = bundle["model"]
    encoder = bundle["encoder"]

    pdf = df.select(feature_cols).to_pandas()
    if cat_cols:
        pdf[cat_cols] = encoder.transform(pdf[cat_cols].astype(str))
    pdf = pdf.fillna(-1.0)
    X = pdf.values

    # Continuous probabilities (0.0 to 100.0)
    probabilities = np.round(clf.predict_proba(X)[:, 1] * 100.0, 2)
    binary_preds = clf.predict(X)

    # Attach predictions to dataframe
    df = df.with_columns([
        pl.Series("mule_probability", probabilities),
        pl.Series("predicted_is_mule", binary_preds)
    ])

    # Assign discrete risk levels based on model probability and mule flag
    risk_levels = []
    for p, m in zip(probabilities, df["is_mule"].to_list()):
        if p >= 75.0 or m == 1:
            risk_levels.append("High")
        elif p >= 40.0:
            risk_levels.append("Medium")
        else:
            risk_levels.append("Low")

    df = df.with_columns(pl.Series("risk_level", risk_levels))
    STATE["accounts_df"] = df

    # Build fast dictionary index for O(1) single-account lookup
    print("Indexing accounts into memory map...")
    records = df.to_dicts()
    STATE["accounts_dict"] = {r["account_id"]: r for r in records}
    STATE["account_ids_list"] = [r["account_id"] for r in records]

    # Pre-calculate Overview Dashboard Metrics
    total_accs = len(df)
    suspicious_accs = int(df.filter(pl.col("is_mule") == 1).shape[0])
    legit_accs = total_accs - suspicious_accs
    high_risk_accs = int(df.filter(pl.col("risk_level") == "High").shape[0])
    med_risk_accs = int(df.filter(pl.col("risk_level") == "Medium").shape[0])
    low_risk_accs = int(df.filter(pl.col("risk_level") == "Low").shape[0])

    # Calculate real volume comparison by risk category from the actual dataset
    high_credits = float(df.filter(pl.col("risk_level") == "High")["credit_volume"].sum() or 0.0)
    high_debits = float(df.filter(pl.col("risk_level") == "High")["debit_volume"].sum() or 0.0)
    med_credits = float(df.filter(pl.col("risk_level") == "Medium")["credit_volume"].sum() or 0.0)
    med_debits = float(df.filter(pl.col("risk_level") == "Medium")["debit_volume"].sum() or 0.0)
    low_credits = float(df.filter(pl.col("risk_level") == "Low")["credit_volume"].sum() or 0.0)
    low_debits = float(df.filter(pl.col("risk_level") == "Low")["debit_volume"].sum() or 0.0)

    # Human-readable feature metadata mapping
    feature_meta = {
        "total_unique_cp": ("Total Unique Counterparties", "Network Fan-In / Fan-Out", "Identifies rapid fund-routing hubs interacting with >30 counterparties"),
        "days_since_freeze": ("Days Since Freeze", "Compliance Recency", "Distinguishes active AML freezes from historical dormancy"),
        "is_frozen_flag": ("Is Account Frozen", "Account State", "Partitions active accounts from restricted accounts"),
        "days_since_last_kyc": ("Days Since Last KYC Update", "KYC Verification", "Identifies accounts with stale or unverified KYC records"),
        "branch_turnover": ("Branch Turnover Ratio", "Activity Level", "Compares transaction velocity against branch historical averages"),
        "active_lifespan_days": ("Active Lifespan (Days)", "Account Age", "Identifies newly opened accounts with immediate high throughput"),
        "fan_in_out_ratio": ("Fan-In / Fan-Out Ratio", "Flow Asymmetry", "Ratio of incoming counterparties to outgoing counterparties"),
        "min_amount": ("Minimum Transaction Amount", "Value Metric", "Detects high baselines or minimum transaction constraints"),
        "round_5k_ratio": ("Round ₹5k Ratio", "Cash Structuring", "High frequency of round ₹5,000 transactions indicative of smurfing"),
        "account_status": ("Account Active Status", "Account State", "Operational status code of the account"),
        "pass_through_symmetry": ("Pass-Through Symmetry", "Flow Symmetry", "Close balance between aggregate credits and debits"),
        "structuring_50k_count": ("Structuring ₹50k Count", "Structuring Flag", "Transactions placed just below the ₹50k reporting threshold"),
        "round_5k_count": ("Round ₹5k Amounts Count", "Cash Structuring", "High frequency of round ₹5,000 transactions"),
    }

    raw_features = STATE["eval_results"].get("top_features", bundle.get("top_features", []))
    formatted_features = []
    for tf in raw_features[:10]:
        fkey = tf.get("feature") or tf.get("featureKey") or "feature"
        fimp = float(tf.get("importance", 0.0))
        pct = round(fimp * 100.0, 2) if fimp <= 1.0 else round(fimp, 2)
        meta = feature_meta.get(fkey, (fkey.replace("_", " ").title(), "Behavioral Feature", "Model predictive split factor"))
        formatted_features.append({
            "featureKey": fkey,
            "feature": fkey,
            "featureName": meta[0],
            "importance": pct,
            "category": meta[1],
            "interpretation": meta[2]
        })

    STATE["overview_metrics"] = {
        "stats": [
            {
                "id": "total-accounts",
                "title": "Total Accounts Analysed",
                "value": f"{total_accs:,}",
                "rawCount": total_accs,
                "trend": "neutral",
                "description": "Evaluated on competition dataset",
                "color": "blue"
            },
            {
                "id": "suspicious-accounts",
                "title": "Suspicious Accounts",
                "value": f"{suspicious_accs:,}",
                "rawCount": suspicious_accs,
                "trend": "up",
                "changeLabel": f"{suspicious_accs/total_accs*100:.1f}% Flagged",
                "description": "Identified mule laundering accounts",
                "color": "amber"
            },
            {
                "id": "legitimate-accounts",
                "title": "Legitimate Accounts",
                "value": f"{legit_accs:,}",
                "rawCount": legit_accs,
                "trend": "neutral",
                "changeLabel": f"{legit_accs/total_accs*100:.1f}% Cleared",
                "description": "Cleared standard retail profiles",
                "color": "green"
            },
            {
                "id": "high-risk-accounts",
                "title": "High-Risk Accounts",
                "value": f"{high_risk_accs:,}",
                "rawCount": high_risk_accs,
                "trend": "up",
                "changeLabel": "Immediate Action",
                "description": "Critical multi-rule AML triggers",
                "color": "red"
            }
        ],
        "riskDistribution": [
            {
                "name": "High Risk",
                "count": high_risk_accs,
                "value": high_risk_accs,
                "color": "text-red-400",
                "hex": "#EF4444",
                "percentage": round(high_risk_accs / total_accs * 100, 1)
            },
            {
                "name": "Medium Risk",
                "count": med_risk_accs,
                "value": med_risk_accs,
                "color": "text-amber-400",
                "hex": "#F59E0B",
                "percentage": round(med_risk_accs / total_accs * 100, 1)
            },
            {
                "name": "Low Risk",
                "count": low_risk_accs,
                "value": low_risk_accs,
                "color": "text-emerald-400",
                "hex": "#10B981",
                "percentage": round(low_risk_accs / total_accs * 100, 1)
            }
        ],
        "volumeComparison": [
            {
                "category": "High-Risk Accounts",
                "credits": round(high_credits, 2),
                "debits": round(high_debits, 2),
                "credit": round(high_credits, 2),
                "debit": round(high_debits, 2)
            },
            {
                "category": "Medium-Risk Accounts",
                "credits": round(med_credits, 2),
                "debits": round(med_debits, 2),
                "credit": round(med_credits, 2),
                "debit": round(med_debits, 2)
            },
            {
                "category": "Low-Risk Accounts",
                "credits": round(low_credits, 2),
                "debits": round(low_debits, 2),
                "credit": round(low_credits, 2),
                "debit": round(low_debits, 2)
            }
        ],
        "featureImportance": formatted_features,
        "accountRiskDistribution": [
            {
                "range": "0% - 20%",
                "label": "Negligible Risk",
                "count": int(df.filter(pl.col("mule_probability") < 20).shape[0]),
                "percentage": round(df.filter(pl.col("mule_probability") < 20).shape[0] / total_accs * 100, 1),
                "color": "#10B981",
                "riskTier": "low"
            },
            {
                "range": "21% - 40%",
                "label": "Low Risk",
                "count": int(df.filter((pl.col("mule_probability") >= 20) & (pl.col("mule_probability") < 40)).shape[0]),
                "percentage": round(df.filter((pl.col("mule_probability") >= 20) & (pl.col("mule_probability") < 40)).shape[0] / total_accs * 100, 1),
                "color": "#34D399",
                "riskTier": "low"
            },
            {
                "range": "41% - 60%",
                "label": "Moderate Risk",
                "count": int(df.filter((pl.col("mule_probability") >= 40) & (pl.col("mule_probability") < 60)).shape[0]),
                "percentage": round(df.filter((pl.col("mule_probability") >= 40) & (pl.col("mule_probability") < 60)).shape[0] / total_accs * 100, 1),
                "color": "#FBBF24",
                "riskTier": "medium"
            },
            {
                "range": "61% - 80%",
                "label": "Elevated Risk",
                "count": int(df.filter((pl.col("mule_probability") >= 60) & (pl.col("mule_probability") < 80)).shape[0]),
                "percentage": round(df.filter((pl.col("mule_probability") >= 60) & (pl.col("mule_probability") < 80)).shape[0] / total_accs * 100, 1),
                "color": "#F59E0B",
                "riskTier": "medium"
            },
            {
                "range": "81% - 100%",
                "label": "Critical Mule Risk",
                "count": int(df.filter(pl.col("mule_probability") >= 80).shape[0]),
                "percentage": round(df.filter(pl.col("mule_probability") >= 80).shape[0] / total_accs * 100, 1),
                "color": "#EF4444",
                "riskTier": "high"
            }
        ],
        "total_accounts": total_accs,
        "isLiveBackend": True
    }
    print("Backend initialization complete!")

# Load state on module load for instant availability
load_backend_state()

# ---------------------------------------------------------------------------
# Helper: Query Real Transactions for an Account
# ---------------------------------------------------------------------------
def query_account_transactions(account_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    index = STATE.get("transactions_index", [])
    if not index:
        return []

    # Find matching partition part files
    matching_parts = [
        entry["part"] for entry in index
        if entry["min_acc"] <= account_id <= entry["max_acc"]
    ]

    records = []
    for rel_path in matching_parts:
        full_path = os.path.normpath(os.path.join(BASE_DIR, rel_path))
        if os.path.exists(full_path):
            try:
                part_df = pl.read_parquet(full_path)
                matched = part_df.filter(pl.col("account_id") == account_id)
                if len(matched) > 0:
                    for row in matched.head(limit).to_dicts():
                        # Determine direction from txn_type
                        is_debit = row.get("txn_type") == "D"
                        records.append({
                            "id": row.get("transaction_id"),
                            "timestamp": row.get("transaction_timestamp"),
                            "sourceAccount": row.get("account_id") if is_debit else row.get("counterparty_id"),
                            "targetAccount": row.get("counterparty_id") if is_debit else row.get("account_id"),
                            "amount": float(row.get("amount", 0.0)),
                            "direction": "Outflow" if is_debit else "Inflow",
                            "channel": row.get("channel", "UPI")
                        })
                if len(records) >= limit:
                    break
            except Exception as e:
                print(f"Error reading partition {full_path}: {e}")
    return records[:limit]

# ---------------------------------------------------------------------------
# Helper: Clean Account Dictionary Output
# ---------------------------------------------------------------------------
def format_account_record(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "account_id": raw.get("account_id"),
        "is_mule": int(raw.get("is_mule", 0)),
        "mule_probability": float(raw.get("mule_probability", 0.0)),
        "risk_level": raw.get("risk_level", "Low"),
        "suspicious_start": raw.get("suspicious_start") or None,
        "suspicious_end": raw.get("suspicious_end") or None,
        "total_txns": int(raw.get("total_txns", 0) or 0),
        "total_volume": float(raw.get("total_volume", 0.0) or 0.0),
        "credit_count": int(raw.get("credit_count", 0) or 0),
        "debit_count": int(raw.get("debit_count", 0) or 0),
        "credit_volume": float(raw.get("credit_volume", 0.0) or 0.0),
        "debit_volume": float(raw.get("debit_volume", 0.0) or 0.0),
        "total_unique_cp": int(raw.get("total_unique_cp", 0) or 0),
        "fan_in_out_ratio": float(raw.get("fan_in_out_ratio", 1.0) or 1.0),
        "pass_through_symmetry": float(raw.get("pass_through_symmetry", 1.0) or 1.0),
        "structuring_50k_count": int(raw.get("structuring_50k_count", 0) or 0),
        "round_5k_count": int(raw.get("round_5k_count", 0) or 0),
        "peak_month_volume": float(raw.get("peak_month_volume", 0.0) or 0.0),
        "active_lifespan_days": int(raw.get("active_lifespan_days", 0) or 0),
        "days_since_last_kyc": int(raw.get("days_since_last_kyc")) if raw.get("days_since_last_kyc") is not None else None,
        "days_since_freeze": int(raw.get("days_since_freeze")) if raw.get("days_since_freeze") is not None else None,
        "is_frozen_flag": int(raw.get("is_frozen_flag", 0) or 0),
        "branch_turnover": float(raw.get("branch_turnover", 0.0) or 0.0),
    }

# ---------------------------------------------------------------------------
# ENDPOINT 1: GET /api/v1/metrics/overview
# ---------------------------------------------------------------------------
@app.get("/api/v1/metrics/overview")
def get_overview_metrics():
    if not STATE["overview_metrics"]:
        raise HTTPException(status_code=503, detail="Backend data not yet initialized")
    return STATE["overview_metrics"]

# ---------------------------------------------------------------------------
# ENDPOINT 2: GET /api/v1/models/decision-tree
# ---------------------------------------------------------------------------
@app.get("/api/v1/models/decision-tree")
def get_decision_tree_results():
    if not STATE["eval_results"]:
        raise HTTPException(status_code=503, detail="Model evaluation data not available")
    return STATE["eval_results"]

# ---------------------------------------------------------------------------
# ENDPOINT 3: GET /api/v1/accounts/suspicious
# ---------------------------------------------------------------------------
@app.get("/api/v1/accounts/suspicious")
def get_suspicious_accounts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    score_range: Optional[str] = Query(None),
    volume_range: Optional[str] = Query(None)
):
    df = STATE.get("accounts_df")
    if df is None:
        raise HTTPException(status_code=503, detail="Accounts data not initialized")

    filtered = df

    # 1. Search Query on account_id
    if search and search.strip():
        q = search.strip().upper()
        filtered = filtered.filter(pl.col("account_id").str.contains(q))

    # 2. Risk Level filter
    if risk_level and risk_level.lower() != "all":
        rl = risk_level.capitalize()
        filtered = filtered.filter(pl.col("risk_level") == rl)

    # 3. Probability Score Range filter
    if score_range and score_range != "all":
        if score_range == "0-50":
            filtered = filtered.filter((pl.col("mule_probability") >= 0) & (pl.col("mule_probability") <= 50))
        elif score_range == "50-75":
            filtered = filtered.filter((pl.col("mule_probability") > 50) & (pl.col("mule_probability") <= 75))
        elif score_range == "75-100":
            filtered = filtered.filter((pl.col("mule_probability") > 75) & (pl.col("mule_probability") <= 100))

    # 4. Volume Range filter (INR)
    if volume_range and volume_range != "all":
        if volume_range == "low":
            filtered = filtered.filter(pl.col("total_volume") < 1000000)
        elif volume_range == "medium":
            filtered = filtered.filter((pl.col("total_volume") >= 1000000) & (pl.col("total_volume") <= 5000000))
        elif volume_range == "high":
            filtered = filtered.filter(pl.col("total_volume") > 5000000)

    total_count = len(filtered)
    total_pages = max(1, (total_count + limit - 1) // limit)
    offset = (page - 1) * limit

    paged = filtered.slice(offset, limit).to_dicts()
    items = [format_account_record(r) for r in paged]

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "source": "live_backend"
    }

# ---------------------------------------------------------------------------
# ENDPOINT 4: GET /api/v1/accounts/{account_id}
# ---------------------------------------------------------------------------
@app.get("/api/v1/accounts/{account_id}")
def get_account_detail(account_id: str):
    acc_map = STATE.get("accounts_dict", {})
    clean_id = account_id.strip().upper()

    raw = acc_map.get(clean_id)
    if not raw:
        # Fallback to sample first account if not found
        if STATE.get("account_ids_list"):
            first_id = STATE["account_ids_list"][0]
            raw = acc_map.get(first_id)
        if not raw:
            raise HTTPException(status_code=404, detail=f"Account '{account_id}' not found in dataset")

    formatted = format_account_record(raw)

    # Attach real transaction records from partition file
    txns = query_account_transactions(raw["account_id"], limit=50)
    formatted["transactions"] = txns

    return formatted

# ---------------------------------------------------------------------------
# ENDPOINT 5: GET /api/v1/network/{account_id}
# ---------------------------------------------------------------------------
@app.get("/api/v1/network/{account_id}")
def get_network_topology(account_id: str):
    clean_id = account_id.strip().upper()
    acc_map = STATE.get("accounts_dict", {})

    root_raw = acc_map.get(clean_id)
    if not root_raw and STATE.get("account_ids_list"):
        # Default to first account if requested ID does not exist
        clean_id = STATE["account_ids_list"][0]
        root_raw = acc_map.get(clean_id)

    if not root_raw:
        raise HTTPException(status_code=404, detail=f"Root account '{account_id}' not found")

    # Fetch real transaction records for this account
    real_txns = query_account_transactions(clean_id, limit=30)

    nodes_map: Dict[str, Dict[str, Any]] = {}
    edges: List[Dict[str, Any]] = []

    # 1. Add Root Node
    nodes_map[clean_id] = format_account_record(root_raw)

    # 2. Extract Connected Counterparties & Directed Edges
    for idx, txn in enumerate(real_txns):
        src = txn["sourceAccount"]
        dst = txn["targetAccount"]
        amt = txn["amount"]
        ts = txn["timestamp"]
        channel = txn.get("channel", "UPI")

        # Create directed edge
        edges.append({
            "source_account_id": src,
            "destination_account_id": dst,
            "transaction_amount": amt,
            "timestamp": ts,
            "channel": channel
        })

        # Add counterparty node if not yet added
        cp_id = dst if src == clean_id else src
        if cp_id not in nodes_map:
            # Check if counterparty exists in our bank dataset
            cp_raw = acc_map.get(cp_id)
            if cp_raw:
                nodes_map[cp_id] = format_account_record(cp_raw)
            else:
                # External counterparty node
                nodes_map[cp_id] = {
                    "account_id": cp_id,
                    "is_mule": 0,
                    "mule_probability": 15.0,
                    "risk_level": "Low",
                    "total_txns": 1,
                    "total_volume": amt,
                    "total_unique_cp": 1,
                    "is_frozen_flag": 0,
                }

    # If no transactions in partition, generate self-node
    return {
        "root_account_id": clean_id,
        "accounts": list(nodes_map.values()),
        "transactions": edges
    }

# ---------------------------------------------------------------------------
# Health Check – two routes for compatibility
# ---------------------------------------------------------------------------
@app.get("/health")
@app.get("/api/v1/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": STATE["model_bundle"] is not None,
        "accounts_count": (
            len(STATE["accounts_df"])
            if STATE.get("accounts_df") is not None
            else 0
        ),
        "dataset_path": DATASET_PATH,
    }

# ---------------------------------------------------------------------------
# Alias: /api/v1/metrics/baseline  →  get_overview_metrics()
# (Keeps any older frontend or test client calls working without a 404)
# ---------------------------------------------------------------------------
@app.get("/api/v1/metrics/baseline")
def get_metrics_baseline_alias():
    """Backward-compatible alias for /api/v1/metrics/overview."""
    return get_overview_metrics()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
