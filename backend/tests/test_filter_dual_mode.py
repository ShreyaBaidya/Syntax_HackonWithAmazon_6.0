"""
Unit tests for dual-mode filtering and get_product_conflicts in profile_service.
Tests tasks 3.1 and 3.2 of the amazon-polish-enhancements spec.
"""
import pytest
from app.services.profile_service import filter_products, get_product_conflicts


# ── Test data ─────────────────────────────────────────────────────────────────

PRODUCT_PEANUT_BUTTER = {
    "name": "Peanut Butter",
    "tags": "spread snack breakfast",
    "allergen_tags": ["Nuts"],
    "ingredients": ["peanuts", "salt", "sugar"],
}

PRODUCT_OAT_MILK = {
    "name": "Oat Milk",
    "tags": "beverage dairy-free vegan",
    "allergen_tags": ["Gluten"],
    "ingredients": ["oats", "water", "sunflower oil"],
}

PRODUCT_APPLE = {
    "name": "Fresh Apple",
    "tags": "fruit fresh organic",
    "allergen_tags": [],
    "ingredients": ["apple"],
}

PRODUCT_LEGACY_ONLY = {
    "name": "Mystery Snack",
    "tags": "snack contains-milk dairy cheese",
}

PRODUCT_INGREDIENT_MATCH = {
    "name": "Veggie Curry",
    "tags": "ready-to-eat vegetarian",
    "allergen_tags": [],
    "ingredients": ["onion", "tomato", "coconut milk", "spices"],
}


# ── Task 3.1: Dual-mode filtering tests ──────────────────────────────────────


class TestDualModeFiltering:
    def test_filter_by_allergen_tags(self):
        """Products with matching allergen_tags are filtered out."""
        products = [PRODUCT_PEANUT_BUTTER, PRODUCT_APPLE]
        exclusion = {"nut"}
        result = filter_products(products, exclusion)
        assert result == [PRODUCT_APPLE]

    def test_filter_by_ingredients(self):
        """Products with matching ingredients are filtered out."""
        products = [PRODUCT_INGREDIENT_MATCH, PRODUCT_APPLE]
        exclusion = {"milk"}
        result = filter_products(products, exclusion)
        # "coconut milk" contains "milk" as substring
        assert result == [PRODUCT_APPLE]

    def test_filter_by_legacy_tags(self):
        """Products matching via legacy tags string are still filtered (backward compat)."""
        products = [PRODUCT_LEGACY_ONLY, PRODUCT_APPLE]
        exclusion = {"dairy"}
        result = filter_products(products, exclusion)
        assert result == [PRODUCT_APPLE]

    def test_filter_case_insensitive(self):
        """Filtering is case-insensitive across all modes."""
        product = {
            "name": "Test",
            "tags": "healthy",
            "allergen_tags": ["NUTS"],
            "ingredients": ["Almonds"],
        }
        exclusion = {"nut"}
        result = filter_products([product], exclusion)
        assert result == []

    def test_filter_empty_exclusion_set_returns_all(self):
        """Empty or None exclusion set returns all products unchanged."""
        products = [PRODUCT_PEANUT_BUTTER, PRODUCT_APPLE]
        assert filter_products(products, None) == products
        assert filter_products(products, set()) == products

    def test_filter_no_false_positives_on_safe_products(self):
        """Products without any matching keywords are preserved."""
        products = [PRODUCT_APPLE, PRODUCT_OAT_MILK]
        exclusion = {"meat", "chicken"}
        result = filter_products(products, exclusion)
        assert result == products

    def test_filter_product_without_new_fields(self):
        """Products missing allergen_tags and ingredients (legacy) are handled gracefully."""
        legacy_product = {"name": "Old Product", "tags": "snack healthy"}
        exclusion = {"snack"}
        result = filter_products([legacy_product], exclusion)
        assert result == []

    def test_filter_preserves_order(self):
        """Filtered products maintain original order."""
        products = [PRODUCT_APPLE, PRODUCT_PEANUT_BUTTER, PRODUCT_OAT_MILK]
        exclusion = {"nut"}
        result = filter_products(products, exclusion)
        assert result == [PRODUCT_APPLE, PRODUCT_OAT_MILK]


# ── Task 3.2: get_product_conflicts tests ─────────────────────────────────────


class TestGetProductConflicts:
    def test_conflict_from_allergen_tags(self):
        """Detects conflicts from structured allergen_tags."""
        conflicts = get_product_conflicts(PRODUCT_PEANUT_BUTTER, {"nut"})
        assert "nut" in conflicts

    def test_conflict_from_ingredients(self):
        """Detects conflicts from ingredients list."""
        conflicts = get_product_conflicts(PRODUCT_INGREDIENT_MATCH, {"milk"})
        assert "milk" in conflicts

    def test_conflict_from_tags(self):
        """Detects conflicts from legacy tags string."""
        conflicts = get_product_conflicts(PRODUCT_LEGACY_ONLY, {"dairy"})
        assert "dairy" in conflicts

    def test_no_conflicts_returns_empty(self):
        """Returns empty list when no keywords conflict."""
        conflicts = get_product_conflicts(PRODUCT_APPLE, {"meat", "dairy"})
        assert conflicts == []

    def test_multiple_conflicts(self):
        """Returns all conflicting keywords."""
        product = {
            "name": "Complex",
            "tags": "dairy snack",
            "allergen_tags": ["Nuts", "Soy"],
            "ingredients": ["milk", "soy lecithin", "peanuts"],
        }
        conflicts = get_product_conflicts(product, {"nut", "milk", "soy"})
        assert set(conflicts) == {"nut", "milk", "soy"}

    def test_conflict_priority_allergen_over_ingredients(self):
        """A keyword matching allergen_tags is reported (not duplicated from ingredients)."""
        product = {
            "name": "Nutty Bar",
            "tags": "snack",
            "allergen_tags": ["Nuts"],
            "ingredients": ["peanuts", "sugar"],
        }
        conflicts = get_product_conflicts(product, {"nut"})
        assert conflicts == ["nut"]
        # Should not be duplicated
        assert conflicts.count("nut") == 1
