"""
Temporal IoU Window Detector.
Finds the interval [suspicious_start, suspicious_end] with maximal suspicious transaction concentration.
Calculates Temporal IoU against ground truth or flag dates.
"""
import polars as pl
from datetime import datetime, timedelta

def detect_suspicious_window(account_txns_df, window_days=30):
    """
    Given a DataFrame of transactions for a single suspected mule account,
    identifies the time window [start, end] of peak suspicious activity.
    """
    if len(account_txns_df) == 0:
        return "", ""

    # Sort by timestamp
    txns = account_txns_df.sort("transaction_timestamp")
    
    # Calculate suspicious score per transaction
    # Higher weights for structuring (45k-50k), round 5k amounts, and high amounts
    txns = txns.with_columns([
        (
            (pl.col("amount") >= 45000) & (pl.col("amount") < 50000)
        ).cast(pl.Float64) * 5.0 + 
        (
            (pl.col("amount") % 5000 == 0) & (pl.col("amount") > 0)
        ).cast(pl.Float64) * 2.0 +
        (
            pl.col("amount") > 100000
        ).cast(pl.Float64) * 3.0 +
        1.0  # base activity count
    ]).rename({"literal": "suspicious_score"})

    # Extract timestamps and scores
    timestamps = [datetime.fromisoformat(ts) for ts in txns["transaction_timestamp"].to_list()]
    scores = txns["suspicious_score"].to_list()
    
    if len(timestamps) == 1:
        start_ts = timestamps[0].isoformat()
        end_ts = (timestamps[0] + timedelta(days=1)).isoformat()
        return start_ts, end_ts

    best_score = -1.0
    best_start = timestamps[0]
    best_end = timestamps[-1]
    
    # Sliding window search
    w_delta = timedelta(days=window_days)
    left = 0
    curr_score = 0.0

    for right in range(len(timestamps)):
        curr_score += scores[right]
        while timestamps[right] - timestamps[left] > w_delta:
            curr_score -= scores[left]
            left += 1
        
        if curr_score > best_score:
            best_score = curr_score
            best_start = timestamps[left]
            best_end = timestamps[right]

    return best_start.isoformat(), best_end.isoformat()

def compute_temporal_iou(pred_start_str, pred_end_str, true_start_str, true_end_str):
    """
    Calculates Temporal Intersection over Union (IoU) between two time intervals.
    """
    if not pred_start_str or not pred_end_str or not true_start_str or not true_end_str:
        return 0.0

    p_start = datetime.fromisoformat(pred_start_str)
    p_end = datetime.fromisoformat(pred_end_str)
    t_start = datetime.fromisoformat(true_start_str)
    t_end = datetime.fromisoformat(true_end_str)

    # Intersection
    inter_start = max(p_start, t_start)
    inter_end = min(p_end, t_end)
    inter_duration = max(0.0, (inter_end - inter_start).total_seconds())

    # Union
    union_start = min(p_start, t_start)
    union_end = max(p_end, t_end)
    union_duration = max(1.0, (union_end - union_start).total_seconds())

    return inter_duration / union_duration
