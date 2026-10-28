"""
Model Evaluation Metrics for Imbalanced AML Classification.
Computes ROC-AUC, PR-AUC, F1-optimal threshold, precision, and recall.
"""
import numpy as np
from sklearn.metrics import (
    roc_auc_score, average_precision_score, precision_recall_curve,
    f1_score, precision_score, recall_score, confusion_matrix
)

def evaluate_predictions(y_true, y_prob):
    """
    Comprehensive evaluation for imbalanced binary classification.
    """
    roc_auc = roc_auc_score(y_true, y_prob)
    pr_auc = average_precision_score(y_true, y_prob)

    # Find optimal threshold for F1
    precisions, recalls, thresholds = precision_recall_curve(y_true, y_prob)
    
    # Avoid div by zero in f1 calculation
    f1_scores = np.zeros_like(thresholds)
    for i, t in enumerate(thresholds):
        preds = (y_prob >= t).astype(int)
        f1_scores[i] = f1_score(y_true, preds, zero_division=0)

    best_idx = np.argmax(f1_scores) if len(f1_scores) > 0 else 0
    best_thresh = thresholds[best_idx] if len(thresholds) > 0 else 0.5
    best_f1 = f1_scores[best_idx] if len(f1_scores) > 0 else 0.0

    optimal_preds = (y_prob >= best_thresh).astype(int)
    prec = precision_score(y_true, optimal_preds, zero_division=0)
    rec = recall_score(y_true, optimal_preds, zero_division=0)
    cm = confusion_matrix(y_true, optimal_preds).tolist()

    return {
        "roc_auc": round(float(roc_auc), 4),
        "pr_auc": round(float(pr_auc), 4),
        "best_threshold": round(float(best_thresh), 4),
        "best_f1": round(float(best_f1), 4),
        "precision_at_best_thresh": round(float(prec), 4),
        "recall_at_best_thresh": round(float(rec), 4),
        "confusion_matrix": cm,
    }
