"""
Decision Tree Baseline Classifier for AML Mule Detection.
Trains a class-weighted DecisionTreeClassifier with 5-Fold Stratified Cross-Validation.
Evaluates PR-AUC, ROC-AUC, F1, and extracts feature importances.
"""
import json
import polars as pl
import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import OrdinalEncoder

from src.models.metrics import evaluate_predictions

def train_decision_tree_baseline(data_path="outputs/train_features_full.parquet", max_depth=6, min_samples_leaf=20):
    print("=" * 60)
    print(f"Training Decision Tree on: {data_path}")
    print("=" * 60)

    # 1. Load data
    df = pl.read_parquet(data_path)
    print(f"Loaded {len(df):,} rows with {len(df.columns)} columns.")

    # Target
    y = df["is_mule"].to_numpy()
    mule_count = int(np.sum(y == 1))
    legit_count = int(np.sum(y == 0))
    print(f"Class distribution: {mule_count:,} Mules ({mule_count/len(y)*100:.2f}%), {legit_count:,} Legit.")

    # 2. Select feature columns (strictly excluding target and leaky compliance label metadata)
    ignore_cols = {
        "account_id", "customer_id", "is_mule", "mule_flag_date", "alert_reason",
        "flagged_by_branch", "name", "address", "phone_number", "branch_address", "branch_city",
        "first_txn_timestamp", "last_txn_timestamp", "suspicious_start", "suspicious_end",
        "account_opening_date", "relationship_start_date", "last_kyc_date", "last_mobile_update_date",
        "freeze_date", "unfreeze_date", "address_last_update_date", "passbook_last_update_date",
        "customer_pin", "permanent_pin", "branch_pin", "branch_pin_code"
    }
    
    feature_cols = [c for c in df.columns if c not in ignore_cols]
    print(f"Total features used: {len(feature_cols)}")

    # Convert to pandas for sklearn compatibility
    pdf = df.select(feature_cols).to_pandas()

    # Encode categorical columns
    cat_cols = pdf.select_dtypes(include=["object", "string", "category"]).columns.tolist()
    if cat_cols:
        encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
        pdf[cat_cols] = encoder.fit_transform(pdf[cat_cols].astype(str))

    # Impute numeric NaNs
    pdf = pdf.fillna(-1.0)
    X = pdf.values

    # 3. 5-Fold Stratified CV
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    oof_preds = np.zeros(len(y), dtype=float)
    feature_importances = np.zeros(len(feature_cols), dtype=float)

    print("\nRunning 5-Fold Stratified Cross-Validation...")
    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):
        X_train, y_train = X[train_idx], y[train_idx]
        X_val, y_val = X[val_idx], y[val_idx]

        clf = DecisionTreeClassifier(
            max_depth=max_depth,
            min_samples_leaf=min_samples_leaf,
            class_weight="balanced",
            random_state=42 + fold
        )
        clf.fit(X_train, y_train)

        val_probs = clf.predict_proba(X_val)[:, 1]
        oof_preds[val_idx] = val_probs
        feature_importances += clf.feature_importances_ / 5.0

        fold_metrics = evaluate_predictions(y_val, val_probs)
        print(f"  Fold {fold+1} | ROC-AUC: {fold_metrics['roc_auc']:.4f} | PR-AUC: {fold_metrics['pr_auc']:.4f} | F1: {fold_metrics['best_f1']:.4f}")

    # 4. Out-of-fold Overall Metrics
    overall_metrics = evaluate_predictions(y, oof_preds)
    print("\n" + "=" * 60)
    print("OVERALL OUT-OF-FOLD RESULTS (Decision Tree on Full 96,091 Accounts):")
    print(f"  ROC-AUC:                  {overall_metrics['roc_auc']:.4f}")
    print(f"  PR-AUC (Avg Precision):   {overall_metrics['pr_auc']:.4f}  (Random Baseline: {mule_count/len(y):.4f})")
    print(f"  Optimal F1 Threshold:     {overall_metrics['best_threshold']:.4f}")
    print(f"  Best F1-Score:            {overall_metrics['best_f1']:.4f}")
    print(f"  Precision at best thresh: {overall_metrics['precision_at_best_thresh']:.4f}")
    print(f"  Recall at best thresh:    {overall_metrics['recall_at_best_thresh']:.4f}")
    print(f"  Confusion Matrix:         {overall_metrics['confusion_matrix']}")
    print("=" * 60)

    # 5. Top Feature Importances
    sorted_idx = np.argsort(feature_importances)[::-1]
    top_features = []
    print("\nTop 15 Most Important Features in Decision Tree:")
    for rank, idx in enumerate(sorted_idx[:15], 1):
        feat_name = feature_cols[idx]
        imp = feature_importances[idx]
        print(f"  {rank:2d}. {feat_name:<30} {imp*100:.2f}%")
        top_features.append({"feature": feat_name, "importance": round(float(imp), 4)})

    results = {
        "model": "DecisionTreeClassifier",
        "params": {"max_depth": max_depth, "min_samples_leaf": min_samples_leaf, "class_weight": "balanced"},
        "metrics": overall_metrics,
        "top_features": top_features
    }

    out_json = "outputs/full_decision_tree_results.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to: {out_json}")
    
    return results

if __name__ == "__main__":
    train_decision_tree_baseline()
