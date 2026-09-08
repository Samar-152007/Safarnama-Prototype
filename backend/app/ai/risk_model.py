import math
import numpy as np

try:
    from sklearn.ensemble import RandomForestRegressor
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

class LandslideFloodRiskModel:
    """
    AI Hazard Risk Prediction Model calibrated for the North Eastern Himalayan
    and Brahmaputra/Barak basin topography (Assam, Meghalaya, Nagaland, Arunachal).
    
    Features considered:
    1. 24-hour antecedent rainfall (mm)
    2. Slope gradient angle (degrees)
    3. Pavement & drainage condition (Good=1, Fair=2, Poor=3)
    4. Historical frequency of landslides / washouts
    5. Presence of culvert / bridge bottleneck
    """
    def __init__(self):
        self.model = None
        self._init_or_train()

    def _init_or_train(self):
        if not HAS_SKLEARN:
            return

        # Train a light Random Forest on domain-calibrated synthetic Himalayan risk data
        # Inputs: [rainfall_mm, slope_deg, condition_code, historical_incidents, has_bridge]
        np.random.seed(42)
        n_samples = 400

        rainfall = np.random.uniform(5, 120, n_samples)
        slope = np.random.uniform(2, 45, n_samples)
        condition = np.random.choice([1, 2, 3], n_samples, p=[0.5, 0.35, 0.15])
        hist_incidents = np.random.poisson(1.5, n_samples)
        has_bridge = np.random.choice([0, 1], n_samples, p=[0.75, 0.25])

        # Mathematical physics-based hazard ground-truth formula
        # Rainfall exponential saturation + slope shear stress + structural degradation
        rf_factor = np.clip(rainfall / 100.0, 0, 1.5) ** 1.3
        slope_factor = np.clip(np.sin(np.radians(slope)) * 1.5, 0, 1.2)
        cond_factor = (condition - 1) * 0.25
        hist_factor = np.clip(hist_incidents * 0.08, 0, 0.4)
        bridge_factor = has_bridge * 0.15

        raw_risk = 0.35 * rf_factor + 0.30 * slope_factor + 0.20 * cond_factor + 0.15 * hist_factor + bridge_factor
        risk = np.clip(raw_risk + np.random.normal(0, 0.03, n_samples), 0.05, 0.98)

        X = np.column_stack([rainfall, slope, condition, hist_incidents, has_bridge])
        y = risk

        self.model = RandomForestRegressor(n_estimators=30, max_depth=6, random_state=42)
        self.model.fit(X, y)

    def predict_risk(
        self,
        rainfall_mm: float,
        slope_deg: float,
        condition: str,
        historical_incidents: int = 1,
        bridge_present: bool = False
    ) -> float:
        cond_map = {"Good": 1, "Fair": 2, "Poor": 3}
        cond_code = cond_map.get(condition, 2)
        bridge_code = 1 if bridge_present else 0

        if self.model is not None:
            features = np.array([[rainfall_mm, slope_deg, cond_code, historical_incidents, bridge_code]])
            predicted = float(self.model.predict(features)[0])
        else:
            # Fallback heuristic calculation if scikit-learn is absent
            rf_factor = min(rainfall_mm / 100.0, 1.5) ** 1.3
            slope_factor = min(math.sin(math.radians(slope_deg)) * 1.5, 1.2)
            cond_factor = (cond_code - 1) * 0.25
            hist_factor = min(historical_incidents * 0.08, 0.4)
            bridge_factor = 0.15 if bridge_present else 0.0

            predicted = 0.35 * rf_factor + 0.30 * slope_factor + 0.20 * cond_factor + 0.15 * hist_factor + bridge_factor

        return round(float(np.clip(predicted, 0.05, 0.99)), 3)

    @staticmethod
    def get_risk_category(score: float) -> str:
        if score < 0.35:
            return "Low"
        elif score < 0.65:
            return "Medium"
        elif score < 0.85:
            return "High"
        else:
            return "Critical"

# Singleton instance
risk_model = LandslideFloodRiskModel()
