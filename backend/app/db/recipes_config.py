"""
Load recipes configuration from JSON.
"""

import json
from pathlib import Path

_CONFIG_PATH = Path(__file__).parent / "recipes_config.json"
with open(_CONFIG_PATH) as f:
    RECIPES_CONFIG = json.load(f)
