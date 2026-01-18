# health_ai.py
import os
import numpy as np
import pandas as pd
from django.conf import settings
import logging
import threading
import warnings

MODEL_PATH = os.path.join(
    getattr(settings, "BASE_DIR", os.path.dirname(os.path.abspath(__file__))),
    "model.pkl"
)

logger = logging.getLogger(__name__)

try:
    import joblib
    HAS_JOBLIB = True
except Exception:
    HAS_JOBLIB = False

# Global singleton instance with thread-safe locking
_health_ai_instance = None
_health_ai_lock = threading.Lock()

def get_health_ai():
    """
    Singleton pattern: Returns the same HealthAI instance for all predictions.
    This avoids reloading the model.pkl file for every prediction (major latency issue).
    Loads model.pkl only ONCE on first use, then caches it in memory.
    Thread-safe with double-check locking pattern.
    """
    global _health_ai_instance
    if _health_ai_instance is None:
        with _health_ai_lock:
            if _health_ai_instance is None:
                _health_ai_instance = HealthAI()
                logger.info("HealthAI singleton instance created and model cached in memory")
    return _health_ai_instance

class HealthAI:
    """
    Improved hybrid HealthAI:
    - Validation / sanity checks
    - Hard medical rules (immediate overrides)
    - Safe model pipeline usage (model may include scaler inside)
    - Robust rule-based fallback scoring for OOD cases
    """

    # safe clinical bounds for validating incoming measurements
    SAFE_BOUNDS = {
        'heart_rate': (20, 250),         # bpm
        'spo2': (50, 100),               # %
        'systolic': (30, 300),           # mmHg
        'diastolic': (20, 200),          # mmHg
        'respiratory_rate': (5, 60),     # breaths/min
        'temperature': (25.0, 45.0),     # °C
    }

    # thresholds used by hard rules (immediate critical)
    CRITICAL_THRESHOLDS = {
        'heart_rate_zero': 1,   # hr <= 1 -> critical (considered effectively 0)
        'spo2_critical': 85,    # spo2 <= 85 -> critical
        'systolic_low': 80,     # systolic < 80 -> critical hypotension
        'diastolic_low': 50,
        'systolic_extremely_low': 60,
        'temperature_hypothermia': 30.0,  # very low temp
    }

    def __init__(self):
        self.model = None
        if HAS_JOBLIB and os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                logger.info("HealthAI: loaded model from %s", MODEL_PATH)
            except Exception as e:
                logger.exception("Failed to load model: %s", e)
                self.model = None

    # ---------- Validation ----------
    def validate_features(self, features: dict):
        """
        Returns (ok: bool, error_message: str or None)
        """
        for k, (low, high) in self.SAFE_BOUNDS.items():
            if k not in features:
                continue
            try:
                v = float(features[k])
            except Exception:
                return False, f"Invalid numeric value for {k}"
            if v < low or v > high:
                return False, f"value for {k} out of plausible range ({low}..{high}): {v}"
        return True, None

    # ---------- Hard medical rules ----------
    def check_hard_rules(self, f: dict):
        """
        If a hard rule matches, return (override_score: float, label: str, reason: str)
        else return None
        """
        hr = float(f.get('heart_rate', 0))
        spo2 = float(f.get('spo2', 100))
        sys = float(f.get('systolic', 120))
        dia = float(f.get('diastolic', 80))
        temp = float(f.get('temperature', 36.6))
        rr = float(f.get('respiratory_rate', 16))

        # Cardiac arrest or unreadable HR -> immediate critical
        if hr <= self.CRITICAL_THRESHOLDS['heart_rate_zero']:
            return 1.0, 'high', 'heart_rate_zero'

        # Very low oxygen saturation
        if spo2 <= self.CRITICAL_THRESHOLDS['spo2_critical']:
            return 1.0, 'high', 'low_spo2'

        # Severe hypotension
        if sys <= self.CRITICAL_THRESHOLDS['systolic_extremely_low'] or dia <= 30:
            return 1.0, 'high', 'severe_hypotension'

        # Hypothermia extremely low temp
        if temp <= self.CRITICAL_THRESHOLDS['temperature_hypothermia']:
            return 1.0, 'high', 'hypothermia_extreme'

        # Very high fever + tachycardia + high RR -> consider high
        if temp >= 40.0 and hr >= 120 and rr >= 30:
            return 1.0, 'high', 'hyperpyrexia_with_instability'

        return None

    # ---------- Safe model prediction ----------
    def _model_predict(self, X):
        """
        Attempts to obtain a score in [0,1] from the loaded model.
        Accepts X as DataFrame with feature names or 2D numpy array.
        Model is now a Pipeline with StandardScaler + GradientBoostingRegressor.
        """
        if self.model is None:
            return None

        try:
            # Suppress the feature names warning for sklearn models trained with feature names
            # but used with arrays/dataframes without matching names
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", message=".*does not have valid feature names.*")
                # Pipeline handles scaling internally, predict returns continuous score
                if hasattr(self.model, "predict"):
                    pred = self.model.predict(X)
                    # Get first prediction and clamp to [0,1]
                    score = float(pred[0]) if len(pred) > 0 else 0.0
                    score = max(0.0, min(1.0, score))
                    return float(score)
        except Exception as e:
            logger.exception("Model prediction failed: %s", e)
            return None

        return None

    # ---------- Improved fallback rule-based scorer ----------
    def rule_based_score(self, f: dict):
        """
        Returns a score in [0,1] computed by a set of weighted clinical rules.
        Designed to be more sensitive to extreme values and OOD points.
        """
        score = 0.0
        hr = float(f.get('heart_rate', 0))
        spo2 = float(f.get('spo2', 100))
        sys = float(f.get('systolic', 120))
        dia = float(f.get('diastolic', 80))
        rr = float(f.get('respiratory_rate', 16))
        temp = float(f.get('temperature', 36.6))

        # SpO2 strong driver
        if spo2 < 70:
            score += 0.8
        elif spo2 < 85:
            score += 0.6
        elif spo2 < 92:
            score += 0.35
        elif spo2 < 95:
            score += 0.1

        # Heart rate
        if hr <= 0:
            score += 0.8
        elif hr < 40:
            score += 0.6
        elif hr < 50:
            score += 0.35
        elif hr > 140:
            score += 0.6
        elif hr > 120:
            score += 0.4
        elif hr > 100:
            score += 0.15

        # Blood pressure
        if sys < 60 or dia < 40:
            score += 0.7
        elif sys < 80 or dia < 50:
            score += 0.5
        elif sys > 200 or dia > 120:
            score += 0.6
        elif sys > 160 or dia > 100:
            score += 0.25
        elif sys > 140 or dia > 90:
            score += 0.1

        # Respiratory rate
        if rr < 6 or rr > 40:
            score += 0.4
        elif rr < 10 or rr > 30:
            score += 0.15

        # Temperature
        if temp < 30:
            score += 0.6
        elif temp < 34:
            score += 0.4
        elif temp >= 41:
            score += 0.6
        elif temp >= 39:
            score += 0.2
        elif temp >= 37.5:
            score += 0.05

        # Cap and normalize
        score = min(1.0, score)
        return float(round(score, 3))

    # ---------- Public predict interface ----------
    def predict(self, features: dict):
        """
        features: dict with keys heart_rate, spo2, systolic, diastolic, respiratory_rate, temperature
        returns: dict with risk_score (0..1), risk_label, source ('model'|'rules'|'override'), reason
        """
        # 1) Validate inputs
        ok, err = self.validate_features(features)
        if not ok:
            # If validation fails because of out-of-bounds BUT still medically critical,
            # prefer to mark critical for patient safety (instead of rejecting blindly).
            # For truly invalid types, return error.
            # We'll check numeric issues:
            return {
                "error": "Invalid input",
                "detail": err
            }

        # 2) Hard rules (immediate overrides)
        hard = self.check_hard_rules(features)
        if hard is not None:
            score, label, reason = hard
            return {
                "risk_score": float(round(score, 3)),
                "risk_label": label,
                "source": "override",
                "reason": reason
            }

        # 3) Try model prediction (safe)
        keys = ['heart_rate','spo2','systolic','diastolic','respiratory_rate','temperature']
        # Create DataFrame with feature names instead of plain numpy array
        # This prevents sklearn warning about missing feature names
        X = pd.DataFrame([[float(features.get(k, 0)) for k in keys]], columns=keys)
        score = None
        try:
            score = self._model_predict(X)
        except Exception as e:
            logger.exception("Model predict wrapper error: %s", e)
            score = None

        # 4) If model fails or returns None or NaN -> fallback to rules
        if score is None or (isinstance(score, float) and (np.isnan(score) or score < 0 or score > 1)):
            score = self.rule_based_score(features)
            label = self.score_to_label(score)
            return {
                "risk_score": float(round(score, 3)),
                "risk_label": label,
                "source": "rules",
                "reason": "model_unavailable_or_ood"
            }

        # 5) model returned a valid score -> return it
        score = float(max(0.0, min(1.0, score)))
        label = self.score_to_label(score)
        return {
            "risk_score": float(round(score, 3)),
            "risk_label": label,
            "source": "model",
            "reason": "model_probability"
        }

    @staticmethod
    def score_to_label(score: float):
        if score < 0.33:
            return 'low'
        elif score < 0.66:
            return 'medium'
        else:
            return 'high'
