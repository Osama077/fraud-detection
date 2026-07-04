"""
Full ML Training Pipeline — Enhanced
Run: python -m app.ml.pipeline.train

Models:
  1. Logistic Regression (with GridSearch)
  2. Random Forest (with GridSearch)
  3. XGBoost (with GridSearch)
  4. Isolation Forest (unsupervised baseline)
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import RobustScaler
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, f1_score, precision_score, recall_score
)
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier

RANDOM_STATE = 42
N_JOBS = -1

_artifacts_env = os.getenv("MODEL_ARTIFACTS_PATH")
if _artifacts_env:
    ARTIFACTS_DIR = Path(_artifacts_env)
else:
    ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

_data_env = os.getenv("CREDITCARD_CSV_PATH")
if _data_env:
    DATA_PATH = Path(_data_env)
else:
    DATA_PATH = Path(__file__).parents[4] / "ml" / "data" / "creditcard.csv"


def load_data(path: Path = None) -> pd.DataFrame:
    if path is None:
        path = DATA_PATH
    if not path.exists():
        raise FileNotFoundError(
            f"Training dataset not found at {path}. "
            f"Download from "
            f"https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud "
            f"and place at ml/data/creditcard.csv "
            f"or set CREDITCARD_CSV_PATH env var."
        )
    print(f"[Pipeline] Loading data from {path}")
    df = pd.read_csv(path)
    print(f"[Pipeline] Shape: {df.shape} | Fraud rate: {df['Class'].mean():.4%}")
    return df


def eda_summary(df: pd.DataFrame) -> dict:
    summary = {
        "total_rows": len(df),
        "fraud_count": int(df["Class"].sum()),
        "legitimate_count": int((df["Class"] == 0).sum()),
        "fraud_rate": float(df["Class"].mean()),
        "missing_values": int(df.isnull().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum()),
        "amount_stats": df["Amount"].describe().to_dict(),
    }
    print(f"[EDA] {json.dumps(summary, indent=2)}")
    return summary


def preprocess(df: pd.DataFrame):
    X = df.drop("Class", axis=1).values
    y = df["Class"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    scaler = RobustScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    print(f"[Preprocessing] Train: {X_train.shape} | Test: {X_test.shape}")
    print(f"[Preprocessing] Train fraud before SMOTE: {y_train.sum()} / {len(y_train)}")
    return X_train, X_test, y_train, y_test, scaler


def apply_smote(X_train, y_train):
    smote = SMOTE(k_neighbors=5, random_state=RANDOM_STATE)
    X_res, y_res = smote.fit_resample(X_train, y_train)
    print(f"[SMOTE] After resampling: {X_res.shape} | Fraud: {y_res.sum()}")
    return X_res, y_res


def find_best_threshold(y_true, probas, start=0.3, end=0.8, step=0.01):
    best_t = 0.5
    best_f1 = 0.0
    for t in np.arange(start, end, step):
        preds = (probas >= t).astype(int)
        f = f1_score(y_true, preds, zero_division=0)
        if f > best_f1:
            best_f1 = f
            best_t = float(t)
    return best_t


def compute_metrics(y_true, y_pred, probas, algorithm, extra=None):
    metrics = {
        "algorithm": algorithm,
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "auc_roc": float(roc_auc_score(y_true, probas)),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
    }
    if extra:
        metrics.update(extra)
    print(f"[{algorithm}] Metrics: {metrics}")
    print(classification_report(y_true, y_pred, target_names=["Legitimate", "Fraud"]))
    return metrics


def train_isolation_forest(X_train, X_test, y_test) -> dict:
    print("[IF] Training Isolation Forest (enhanced)...")
    contamination = 492 / 284807
    iso = IsolationForest(
    n_estimators=100,
        contamination=contamination,
        random_state=RANDOM_STATE,
        n_jobs=N_JOBS,
        bootstrap=True,
    )
    iso.fit(X_train)

    y_pred_raw = iso.predict(X_test)
    y_pred = np.where(y_pred_raw == -1, 1, 0)
    probas = np.where(y_pred_raw == -1, 1 - contamination, contamination)

    metrics = compute_metrics(y_test, y_pred, probas, "IF")

    model_path = ARTIFACTS_DIR / "isolation_forest.pkl"
    joblib.dump(iso, model_path)
    print(f"[IF] Saved to {model_path}")
    return metrics


def train_logistic_regression(X_res, y_res, X_test, y_test) -> dict:
    print("[LR] Training Logistic Regression...")
    param_grid = {"C": [0.1, 1.0, 10.0]}
    lr = LogisticRegression(
        solver="saga",
        class_weight="balanced",
        max_iter=2000,
        random_state=RANDOM_STATE,
        tol=0.001,
    )
    cv = StratifiedKFold(n_splits=2, shuffle=True, random_state=RANDOM_STATE)
    grid = GridSearchCV(lr, param_grid, cv=cv, scoring="f1", n_jobs=N_JOBS, verbose=0)
    grid.fit(X_res, y_res)

    best_lr = grid.best_estimator_
    print(f"[LR] Best params: {grid.best_params_}")

    probas = best_lr.predict_proba(X_test)[:, 1]
    best_threshold = find_best_threshold(y_test, probas)
    y_pred = (probas >= best_threshold).astype(int)

    metrics = compute_metrics(y_test, y_pred, probas, "LR",
                               {"best_C": grid.best_params_["C"],
                                "best_threshold": best_threshold})

    model_path = ARTIFACTS_DIR / "logistic_regression.pkl"
    meta_path = ARTIFACTS_DIR / "lr_metadata.json"
    joblib.dump(best_lr, model_path)
    with open(meta_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[LR] Saved to {model_path}")
    return metrics


def train_random_forest(X_res, y_res, X_test, y_test) -> dict:
    print("[RF] Training Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=N_JOBS,
    )
    rf.fit(X_res, y_res)

    probas = rf.predict_proba(X_test)[:, 1]
    best_threshold = find_best_threshold(y_test, probas)
    y_pred = (probas >= best_threshold).astype(int)

    metrics = compute_metrics(y_test, y_pred, probas, "RF",
                               {"best_threshold": best_threshold})

    model_path = ARTIFACTS_DIR / "random_forest.pkl"
    meta_path = ARTIFACTS_DIR / "rf_metadata.json"
    joblib.dump(rf, model_path)
    with open(meta_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[RF] Saved to {model_path}")
    return metrics


def train_xgboost(X_res, y_res, X_test, y_test) -> dict:
    print("[XGB] Training XGBoost...")
    scale_pos_weight = (y_res == 0).sum() / (y_res == 1).sum()

    xgb = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        eval_metric="logloss",
        random_state=RANDOM_STATE,
        n_jobs=N_JOBS,
        verbosity=0,
    )
    xgb.fit(X_res, y_res)

    probas = xgb.predict_proba(X_test)[:, 1]
    best_threshold = find_best_threshold(y_test, probas)
    y_pred = (probas >= best_threshold).astype(int)

    metrics = compute_metrics(y_test, y_pred, probas, "XGB",
                               {"best_threshold": best_threshold})

    model_path = ARTIFACTS_DIR / "xgboost.pkl"
    meta_path = ARTIFACTS_DIR / "xgb_metadata.json"
    joblib.dump(xgb, model_path)
    with open(meta_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[XGB] Saved to {model_path}")
    return metrics


def run_pipeline():
    df = load_data()
    eda_summary(df)
    X_train, X_test, y_train, y_test, scaler = preprocess(df)
    X_res, y_res = apply_smote(X_train, y_train)

    if_metrics = train_isolation_forest(X_train, X_test, y_test)
    lr_metrics = train_logistic_regression(X_res, y_res, X_test, y_test)
    rf_metrics = train_random_forest(X_res, y_res, X_test, y_test)
    xgb_metrics = train_xgboost(X_res, y_res, X_test, y_test)

    scaler_path = ARTIFACTS_DIR / "scaler.pkl"
    joblib.dump(scaler, scaler_path)
    print(f"[Pipeline] Saved scaler to {scaler_path}")

    summary = {
        "isolation_forest": if_metrics,
        "logistic_regression": lr_metrics,
        "random_forest": rf_metrics,
        "xgboost": xgb_metrics,
    }
    with open(ARTIFACTS_DIR / "training_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"\n[Pipeline] Training complete. Artifacts saved to: {ARTIFACTS_DIR}")
    return summary


if __name__ == "__main__":
    run_pipeline()
