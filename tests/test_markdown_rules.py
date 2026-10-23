"""
tests/test_markdown_rules.py

Unit tests for dynamic markdown recommendation matrix, minimum-margin
safeguards, input validation, and audit trail explanations.
"""

import pytest

from src.markdown_rules import (
    DEFAULT_DISCOUNT_TIERS,
    MarkdownRecommendation,
    calculate_markdown_recommendation,
)


def test_markdown_recommendation_all_tiers_no_safeguard_breach():
    """
    Test standard discount tier assignment when gross margins are healthy
    (unit_price = $10.00, unit_cost = $3.00, min_margin = 0% -> Floor = $3.00).
    All discounts (50%, 30%, 15%, 0%) yield prices >= $5.00, so no safeguard is triggered.
    """
    price = 10.00
    cost = 3.00

    # 1. LOW Risk -> 0%
    rec_low = calculate_markdown_recommendation(
        product_family="DAIRY",
        risk_category="LOW",
        expected_surplus_units=0.0,
        unit_price=price,
        unit_cost=cost,
    )
    assert rec_low.proposed_discount_pct == 0.0
    assert rec_low.final_discount_pct == 0.0
    assert rec_low.final_price == 10.00
    assert rec_low.margin_safeguard_triggered is False

    # 2. MODERATE Risk -> 15%
    rec_mod = calculate_markdown_recommendation(
        product_family="DAIRY",
        risk_category="MODERATE",
        expected_surplus_units=20.0,
        unit_price=price,
        unit_cost=cost,
    )
    assert rec_mod.proposed_discount_pct == 15.0
    assert rec_mod.final_discount_pct == 15.0
    assert rec_mod.final_price == 8.50
    assert rec_mod.margin_safeguard_triggered is False

    # 3. HIGH Risk -> 30%
    rec_high = calculate_markdown_recommendation(
        product_family="DAIRY",
        risk_category="HIGH",
        expected_surplus_units=50.0,
        unit_price=price,
        unit_cost=cost,
    )
    assert rec_high.proposed_discount_pct == 30.0
    assert rec_high.final_discount_pct == 30.0
    assert rec_high.final_price == 7.00
    assert rec_high.margin_safeguard_triggered is False

    # 4. CRITICAL Risk -> 50%
    rec_crit = calculate_markdown_recommendation(
        product_family="DAIRY",
        risk_category="CRITICAL",
        expected_surplus_units=100.0,
        unit_price=price,
        unit_cost=cost,
    )
    assert rec_crit.proposed_discount_pct == 50.0
    assert rec_crit.final_discount_pct == 50.0
    assert rec_crit.final_price == 5.00
    assert rec_crit.margin_safeguard_triggered is False


def test_margin_safeguard_downgrade_to_30_pct():
    """
    Unit Price: $10.00, Unit Cost: $6.00, min_margin: 5%
    Floor Price = $6.00 * 1.05 = $6.30.
    Proposed CRITICAL (50%) -> Price = $5.00 < $6.30 (BREACH).
    Next highest tier: 30% -> Price = $7.00 >= $6.30 (COMPLIANT).
    Safeguard should trigger and downgrade discount from 50% to 30%.
    """
    rec = calculate_markdown_recommendation(
        product_family="MEATS",
        risk_category="CRITICAL",
        expected_surplus_units=40.0,
        unit_price=10.00,
        unit_cost=6.00,
        min_margin_pct=0.05,
    )
    assert rec.proposed_discount_pct == 50.0
    assert rec.final_discount_pct == 30.0
    assert rec.final_price == 7.00
    assert rec.floor_price == 6.30
    assert rec.margin_safeguard_triggered is True
    assert "breached unit cost floor" in rec.explanation


def test_margin_safeguard_downgrade_to_15_pct():
    """
    Unit Price: $10.00, Unit Cost: $8.00, min_margin: 0% -> Floor = $8.00.
    Proposed HIGH (30%) -> Price = $7.00 < $8.00 (BREACH).
    Next tier: 15% -> Price = $8.50 >= $8.00 (COMPLIANT).
    Safeguard should downgrade from 30% to 15%.
    """
    rec = calculate_markdown_recommendation(
        product_family="POULTRY",
        risk_category="HIGH",
        expected_surplus_units=30.0,
        unit_price=10.00,
        unit_cost=8.00,
        min_margin_pct=0.0,
    )
    assert rec.proposed_discount_pct == 30.0
    assert rec.final_discount_pct == 15.0
    assert rec.final_price == 8.50
    assert rec.margin_safeguard_triggered is True


def test_margin_safeguard_downgrade_to_0_pct():
    """
    Unit Price: $10.00, Unit Cost: $9.00, min_margin: 0% -> Floor = $9.00.
    Proposed MODERATE (15%) -> Price = $8.50 < $9.00 (BREACH).
    No discounted tier (50%, 30%, 15%) can satisfy $9.00 floor.
    Safeguard must downgrade to 0% (full price).
    """
    rec = calculate_markdown_recommendation(
        product_family="SEAFOOD",
        risk_category="MODERATE",
        expected_surplus_units=15.0,
        unit_price=10.00,
        unit_cost=9.00,
        min_margin_pct=0.0,
    )
    assert rec.proposed_discount_pct == 15.0
    assert rec.final_discount_pct == 0.0
    assert rec.final_price == 10.00
    assert rec.margin_safeguard_triggered is True
    assert "capped at 0%" in rec.explanation


def test_markdown_input_validations():
    """Verify input parameter guards raise appropriate ValueErrors."""
    # Negative unit price
    with pytest.raises(ValueError, match="unit_price must be strictly positive"):
        calculate_markdown_recommendation("DAIRY", "LOW", 0.0, unit_price=-5.0, unit_cost=2.0)

    # Negative unit cost
    with pytest.raises(ValueError, match="unit_cost cannot be negative"):
        calculate_markdown_recommendation("DAIRY", "LOW", 0.0, unit_price=10.0, unit_cost=-1.0)

    # Cost exceeds price (baseline negative margin)
    with pytest.raises(ValueError, match="unit_cost .* cannot exceed unit_price"):
        calculate_markdown_recommendation("DAIRY", "LOW", 0.0, unit_price=10.0, unit_cost=15.0)

    # Negative min margin pct
    with pytest.raises(ValueError, match="min_margin_pct cannot be negative"):
        calculate_markdown_recommendation("DAIRY", "LOW", 0.0, unit_price=10.0, unit_cost=5.0, min_margin_pct=-0.1)

    # Negative surplus units
    with pytest.raises(ValueError, match="expected_surplus_units cannot be negative"):
        calculate_markdown_recommendation("DAIRY", "LOW", -5.0, unit_price=10.0, unit_cost=5.0)

    # Unknown risk category
    with pytest.raises(ValueError, match="Unknown risk_category"):
        calculate_markdown_recommendation("DAIRY", "EXTREME_DANGER", 10.0, unit_price=10.0, unit_cost=5.0)
