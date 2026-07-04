import pytest
import numpy as np
from unittest.mock import MagicMock, patch
from app.ml.model_registry import ModelRegistry


def test_model_registry_singleton():
    r1 = ModelRegistry()
    r2 = ModelRegistry()
    assert r1 is r2


def test_model_registry_not_loaded():
    registry = ModelRegistry()
    registry.model = None
    registry.scaler = None
    assert not registry.is_loaded()


def test_model_registry_predict_not_loaded():
    registry = ModelRegistry()
    registry.model = None
    with pytest.raises(RuntimeError, match="No model loaded"):
        registry.predict([0.0] * 30)


def test_model_registry_predict_loaded():
    registry = ModelRegistry()

    mock_model = MagicMock()
    mock_model.predict_proba.return_value = np.array([[0.88, 0.12]])

    mock_scaler = MagicMock()
    mock_scaler.transform.return_value = np.zeros((1, 2))

    registry.model = mock_model
    registry.scaler = mock_scaler
    registry.threshold = 0.5
    registry.active_version_tag = "v1.0.0"
    registry.active_version_id = "00000000-0000-0000-0000-000000000001"

    label, prob = registry.predict([0.0] * 30)
    assert label == 0        # prob=0.12 < threshold=0.5
    assert abs(prob - 0.12) < 1e-6


def test_model_registry_fraud_prediction():
    registry = ModelRegistry()

    mock_model = MagicMock()
    mock_model.predict_proba.return_value = np.array([[0.05, 0.95]])

    mock_scaler = MagicMock()
    mock_scaler.transform.return_value = np.zeros((1, 2))

    registry.model = mock_model
    registry.scaler = mock_scaler
    registry.threshold = 0.5

    label, prob = registry.predict([0.0] * 30)
    assert label == 1        # fraud
    assert prob > 0.5


def test_batch_predict_shape():
    registry = ModelRegistry()

    mock_model = MagicMock()
    mock_model.predict_proba.return_value = np.array([[0.9, 0.1], [0.2, 0.8], [0.7, 0.3]])

    mock_scaler = MagicMock()
    mock_scaler.transform.return_value = np.zeros((3, 2))

    registry.model = mock_model
    registry.scaler = mock_scaler
    registry.threshold = 0.5

    features = [[0.0] * 30 for _ in range(3)]
    labels, probas = registry.predict_batch(features)
    assert len(labels) == 3
    assert len(probas) == 3
    assert labels[0] == 0   # 0.1 < 0.5
    assert labels[1] == 1   # 0.8 > 0.5
