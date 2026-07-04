import os
import joblib
import numpy as np
from typing import Optional, Tuple
from pathlib import Path
from app.core.config import settings


class ModelRegistry:
    """Singleton registry that holds the active ML model in memory."""

    _instance: Optional["ModelRegistry"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.model = None
        self.scaler = None
        self.active_version_tag: Optional[str] = None
        self.active_version_id: Optional[str] = None
        self.threshold: float = settings.DEFAULT_THRESHOLD
        self._initialized = True

    def load(self, model_path: str, scaler_path: str, version_tag: str, version_id: str) -> None:
        """Load model and scaler from disk into memory."""
        model_path_obj = Path(model_path)
        scaler_path_obj = Path(scaler_path)
        if not model_path_obj.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        if not scaler_path_obj.exists():
            raise FileNotFoundError(f"Scaler file not found: {scaler_path}")
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        self.active_version_tag = version_tag
        self.active_version_id = version_id
        print(f"[ModelRegistry] Loaded model {version_tag} from {model_path}")

    def is_loaded(self) -> bool:
        return self.model is not None and self.scaler is not None

    def predict(self, features: list) -> Tuple[int, float]:
        if not self.is_loaded():
            raise RuntimeError("No model loaded. Please activate a model version.")

        arr = np.array(features).reshape(1, -1)
        scaled = self.scaler.transform(arr)

        if hasattr(self.model, "predict_proba"):
            proba = self.model.predict_proba(scaled)[0][1]
        else:
            proba = float(self.model.decision_function(scaled)[0])
            proba = 1 / (1 + np.exp(-proba))

        label = int(proba >= self.threshold)
        return label, float(proba)

    def predict_batch(self, features_matrix: list) -> Tuple[list, list]:
        if not self.is_loaded():
            raise RuntimeError("No model loaded.")

        arr = np.array(features_matrix)
        scaled = self.scaler.transform(arr)

        if hasattr(self.model, "predict_proba"):
            probas = self.model.predict_proba(scaled)[:, 1]
        else:
            scores = self.model.decision_function(scaled)
            probas = 1 / (1 + np.exp(-scores))

        labels = (probas >= self.threshold).astype(int).tolist()
        return labels, probas.tolist()


# Global singleton instance
model_registry = ModelRegistry()


def get_model_registry() -> ModelRegistry:
    return model_registry
