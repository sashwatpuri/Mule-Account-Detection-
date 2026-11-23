"""
Unit tests for model verification and metrics evaluation.
"""
import os
import joblib
import numpy as np
from sklearn.metrics import roc_auc_score, average_precision_score, f1_score

def evaluate_predictions(y_true, y_prob):
    roc = roc_auc_score(y_true, y_prob)
    pr = average_precision_score(y_true, y_prob)
    f1 = f1_score(y_true, (y_prob >= 0.5).astype(int))
    return {"roc_auc": roc, "pr_auc": pr, "best_f1": f1}

def test_evaluate_predictions_metrics():
    y_true = np.array([1, 1, 0, 0, 0, 0, 0, 0, 0, 0])
    y_prob = np.array([0.9, 0.8, 0.1, 0.2, 0.1, 0.05, 0.3, 0.15, 0.05, 0.2])

    metrics = evaluate_predictions(y_true, y_prob)
    assert "roc_auc" in metrics
    assert "pr_auc" in metrics
    assert "best_f1" in metrics
    assert metrics["roc_auc"] == 1.0
    assert metrics["pr_auc"] == 1.0
    assert metrics["best_f1"] == 1.0

def test_best_model_loading():
    model_path = os.path.join("outputs", "best_model.joblib")
    assert os.path.exists(model_path), "outputs/best_model.joblib must exist"
    model = joblib.load(model_path)
    assert hasattr(model, "predict_proba"), "Model must implement predict_proba"
