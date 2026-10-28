"""
Unit tests for metrics and decision tree evaluation.
"""
import numpy as np
from src.models.metrics import evaluate_predictions

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
