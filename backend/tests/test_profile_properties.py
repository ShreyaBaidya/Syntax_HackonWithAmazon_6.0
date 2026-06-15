# Feature: dietary-allergy-profile, Property 2: Exclusion_Set computation correctness
"""
Property-based test for compute_exclusion_set correctness.

Validates: Requirements 1.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6

Asserts that for any valid combination of diet_tags, allergen_tags, and
custom_exclusions, the computed exclusion set equals exactly the union of:
  - DIET_TAG_EXCLUSIONS[tag] for each tag in diet_tags
  - ALLERGEN_TAG_EXCLUSIONS[tag] for each tag in allergen_tags
  - {kw.strip().lower() for kw in custom_exclusions.split(",") if kw.strip()}
"""

import sys
import os

# Ensure the backend app is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from hypothesis import given, settings
from hypothesis import strategies as st

from app.services.profile_service import (
    compute_exclusion_set,
    DIET_TAG_EXCLUSIONS,
    ALLERGEN_TAG_EXCLUSIONS,
)

# ── Strategies ────────────────────────────────────────────────────────────────

VALID_DIET_TAGS = list(DIET_TAG_EXCLUSIONS.keys())
VALID_ALLERGEN_TAGS = list(ALLERGEN_TAG_EXCLUSIONS.keys())

diet_tags_strategy = st.lists(
    st.sampled_from(VALID_DIET_TAGS),
    min_size=0,
    max_size=len(VALID_DIET_TAGS),
)

allergen_tags_strategy = st.lists(
    st.sampled_from(VALID_ALLERGEN_TAGS),
    min_size=0,
    max_size=len(VALID_ALLERGEN_TAGS),
)

# Generate custom exclusions as comma-separated printable strings
custom_exclusions_strategy = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "P", "Z")),
    min_size=0,
    max_size=80,
)


# ── Property Test ─────────────────────────────────────────────────────────────


@settings(max_examples=100)
@given(
    diet_tags=diet_tags_strategy,
    allergen_tags=allergen_tags_strategy,
    custom_exclusions=custom_exclusions_strategy,
)
def test_exclusion_set_computation_correctness(
    diet_tags: list,
    allergen_tags: list,
    custom_exclusions: str,
) -> None:
    """
    Property 2: The computed exclusion set must be exactly the union of all
    mapped keywords from diet tags, allergen tags, and custom exclusion tokens.

    **Validates: Requirements 1.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
    """
    # Act
    result = compute_exclusion_set(diet_tags, allergen_tags, custom_exclusions)

    # Compute expected set independently
    expected: set = set()

    for tag in diet_tags:
        tag_lower = tag.lower()
        if tag_lower in DIET_TAG_EXCLUSIONS:
            expected.update(DIET_TAG_EXCLUSIONS[tag_lower])

    for tag in allergen_tags:
        tag_lower = tag.lower()
        if tag_lower in ALLERGEN_TAG_EXCLUSIONS:
            expected.update(ALLERGEN_TAG_EXCLUSIONS[tag_lower])

    for kw in custom_exclusions.split(","):
        cleaned = kw.strip().lower()
        if cleaned:
            expected.add(cleaned)

    # Assert: computed set matches expected union exactly
    assert result == expected, (
        f"Mismatch!\n"
        f"  diet_tags={diet_tags}\n"
        f"  allergen_tags={allergen_tags}\n"
        f"  custom_exclusions={custom_exclusions!r}\n"
        f"  result - expected = {result - expected}\n"
        f"  expected - result = {expected - result}"
    )

    # Assert: result is a set (no duplicates by construction)
    assert isinstance(result, set)


# Feature: dietary-allergy-profile, Property 3: Exclusion_Set computation idempotence


@settings(max_examples=100)
@given(
    diet_tags=diet_tags_strategy,
    allergen_tags=allergen_tags_strategy,
    custom_exclusions=custom_exclusions_strategy,
)
def test_exclusion_set_idempotence(
    diet_tags: list,
    allergen_tags: list,
    custom_exclusions: str,
) -> None:
    """
    Property 3: Computing the Exclusion_Set twice with the same inputs
    SHALL produce an identical set — the computation is deterministic
    and idempotent (no hidden state, no randomness).

    **Validates: Requirement 8.7**
    """
    # First computation
    result1 = compute_exclusion_set(diet_tags, allergen_tags, custom_exclusions)

    # Second computation with identical inputs
    result2 = compute_exclusion_set(diet_tags, allergen_tags, custom_exclusions)

    # Assert idempotence: both calls yield the same result
    assert result1 == result2, (
        f"Idempotence violated!\n"
        f"  diet_tags={diet_tags}\n"
        f"  allergen_tags={allergen_tags}\n"
        f"  custom_exclusions={custom_exclusions!r}\n"
        f"  result1={result1}\n"
        f"  result2={result2}\n"
        f"  diff (result1 - result2)={result1 - result2}\n"
        f"  diff (result2 - result1)={result2 - result1}"
    )

    # Assert both are sets (stable set-based representation)
    assert isinstance(result1, set)
    assert isinstance(result2, set)


# Feature: dietary-allergy-profile, Property 4: Filter completeness — no excluded product passes

from app.services.profile_service import filter_products

# ── Strategies for Property 4 ────────────────────────────────────────────────

ALL_KEYWORDS = list(
    set(kw for keywords in DIET_TAG_EXCLUSIONS.values() for kw in keywords)
    | set(kw for keywords in ALLERGEN_TAG_EXCLUSIONS.values() for kw in keywords)
)

product_strategy = st.fixed_dictionaries(
    {
        "name": st.text(min_size=1, max_size=30),
        "tags": st.text(min_size=0, max_size=100),
    }
)

products_strategy = st.lists(product_strategy, min_size=0, max_size=20)

exclusion_set_strategy = st.frozensets(
    st.sampled_from(ALL_KEYWORDS), min_size=1, max_size=10
)


# ── Property Test ─────────────────────────────────────────────────────────────


@settings(max_examples=100)
@given(
    products=products_strategy,
    exclusion_fs=exclusion_set_strategy,
)
def test_filter_completeness_no_excluded_product_passes(
    products: list,
    exclusion_fs: frozenset,
) -> None:
    """
    Property 4: Filter completeness — no excluded product passes.

    For any list of products and any non-empty exclusion set, every product in
    the output of filter_products SHALL have a tags field that does NOT contain
    any keyword from the exclusion set as a case-insensitive substring.

    Also verifies:
    - Stability: calling filter again produces same result
    - No mutation: original product list unchanged after filtering

    **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 4.1, 11.2**
    """
    exclusion_set = set(exclusion_fs)

    # Save a deep copy of the original products to check for mutation
    import copy

    products_copy = copy.deepcopy(products)

    # Act
    filtered = filter_products(products, exclusion_set)

    # Assert: no excluded product passes
    for product in filtered:
        tags_lower = product.get("tags", "").lower()
        assert not any(kw in tags_lower for kw in exclusion_set), (
            f"Filter completeness violated!\n"
            f"  Product passed filter but contains excluded keyword.\n"
            f"  product={product}\n"
            f"  exclusion_set={exclusion_set}\n"
            f"  matching keywords={[kw for kw in exclusion_set if kw in tags_lower]}"
        )

    # Assert: stability — calling filter again produces same result
    filtered_again = filter_products(products, exclusion_set)
    assert filtered == filtered_again, (
        f"Filter stability violated!\n"
        f"  First call result length: {len(filtered)}\n"
        f"  Second call result length: {len(filtered_again)}"
    )

    # Assert: no mutation — original product list is unchanged
    assert products == products_copy, (
        f"Filter mutated original product list!\n"
        f"  original: {products_copy}\n"
        f"  after filter: {products}"
    )


# Feature: dietary-allergy-profile, Property 5: Filter preserves safe products


@settings(max_examples=100)
@given(
    products=products_strategy,
    exclusion_fs=exclusion_set_strategy,
)
def test_filter_preserves_safe_products(
    products: list,
    exclusion_fs: frozenset,
) -> None:
    """
    Property 5: Filter preserves safe products (no false positives).

    For any list of products and any non-empty exclusion set, every product
    whose tags field does NOT contain any keyword from the exclusion set as
    a case-insensitive substring SHALL appear in the output of filter_products.

    Also verifies:
    - Filter stability: calling again with same inputs produces same result
    - No mutation: original products list unchanged after filtering

    **Validates: Requirements 2.5, 4.2**
    """
    exclusion_set = set(exclusion_fs)

    # Save a deep copy of the original products to check for mutation
    import copy

    products_copy = copy.deepcopy(products)

    # Partition products into safe and unsafe
    safe_products = []
    for product in products:
        tags_lower = product.get("tags", "").lower()
        if not any(kw in tags_lower for kw in exclusion_set):
            safe_products.append(product)

    # Act
    filtered = filter_products(products, exclusion_set)

    # Assert: ALL safe products must appear in the filtered output (no false positives)
    for safe_product in safe_products:
        assert safe_product in filtered, (
            f"Filter false positive! Safe product was excluded.\n"
            f"  product={safe_product}\n"
            f"  exclusion_set={exclusion_set}\n"
            f"  product tags='{safe_product.get('tags', '')}'\n"
            f"  filtered count={len(filtered)}, safe count={len(safe_products)}"
        )

    # Assert: every safe product is present — filtered should contain all safe products
    assert len(filtered) == len(safe_products), (
        f"Filtered count mismatch!\n"
        f"  Expected {len(safe_products)} safe products, got {len(filtered)}\n"
        f"  exclusion_set={exclusion_set}"
    )

    # Assert: filter stability — calling again produces same result
    filtered_again = filter_products(products, exclusion_set)
    assert filtered == filtered_again, (
        f"Filter stability violated!\n"
        f"  First call result length: {len(filtered)}\n"
        f"  Second call result length: {len(filtered_again)}"
    )

    # Assert: no mutation — original products list unchanged
    assert products == products_copy, (
        f"Filter mutated original product list!\n"
        f"  original: {products_copy}\n"
        f"  after filter: {products}"
    )
