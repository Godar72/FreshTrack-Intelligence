"""
src/markdown_rules.py

Dynamic Markdown Recommendation Engine & Margin Floor Safeguard.

Architecture:
1. Rule-Based Markdown Matrix:
   Maps categorized perishable waste risk (LOW, MODERATE, HIGH, CRITICAL)
   to progressive discount tiers (0%, 15%, 30%, 50%).
2. Configurable Minimum-Margin Safeguard:
   Protects retailer unit economics by ensuring:
     Discounted_Price >= Unit_Cost * (1 + min_margin_pct)
   If a proposed discount breaches the cost floor, the engine automatically
   downgrades the discount to the highest permissible tier (or 0% if none satisfy).
3. Plain-Language Explanation:
   Outputs full reasoning for auditability in grocery operations and student viva defense.
4. Academic Disclaimer:
   Discount tiers are simulation heuristics. Public historical retail datasets
   do not measure markdown price elasticity or guaranteed causal waste reduction.
"""

from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional, Tuple, Union

DEFAULT_DISCOUNT_TIERS: Dict[str, float] = {
    "LOW": 0.0,         # 0% discount: Protect normal commercial margins
    "MODERATE": 0.15,   # 15% discount: Mild demand acceleration
    "HIGH": 0.30,       # 30% discount: Urgent sell-through stimulation
    "CRITICAL": 0.50,   # 50% discount: Liquidation before expiration
}

ORDERED_TIERS: Tuple[float, ...] = (0.50, 0.30, 0.15, 0.0)


@dataclass
class MarkdownRecommendation:
    """Structured markdown recommendation with margin floor protection audit trail."""
    product_family: str
    risk_category: str
    expected_surplus_units: float
    original_price: float
    unit_cost: float
    min_margin_pct: float
    proposed_discount_pct: float
    final_discount_pct: float
    final_price: float
    floor_price: float
    margin_safeguard_triggered: bool
    explanation: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def calculate_markdown_recommendation(
    product_family: str,
    risk_category: str,
    expected_surplus_units: float,
    unit_price: float,
    unit_cost: float,
    min_margin_pct: float = 0.0,
    discount_tiers: Optional[Dict[str, float]] = None,
) -> MarkdownRecommendation:
    """
    Recommend a transparent, margin-safe dynamic discount tier.

    Parameters:
    -----------
    product_family : str
        Perishable category name.
    risk_category : str
        Waste risk tier: 'LOW', 'MODERATE', 'HIGH', or 'CRITICAL'.
    expected_surplus_units : float
        Projected unsold units at expiration date (must be >= 0).
    unit_price : float
        Regular retail selling price (must be > 0).
    unit_cost : float
        Wholesale unit cost to retailer (must be >= 0 and <= unit_price).
    min_margin_pct : float
        Minimum required profit margin above unit cost (e.g. 0.0 = breakeven floor).
    discount_tiers : dict, optional
        Custom mapping of risk category to discount percentage.

    Returns:
    --------
    MarkdownRecommendation: Full audit trail of proposed vs permitted discount.
    """
    # 1. Input Validations
    if unit_price <= 0.0:
        raise ValueError(f"unit_price must be strictly positive, got: {unit_price}")
    if unit_cost < 0.0:
        raise ValueError(f"unit_cost cannot be negative, got: {unit_cost}")
    if unit_cost > unit_price:
        raise ValueError(
            f"unit_cost ({unit_cost}) cannot exceed unit_price ({unit_price}). "
            "Retail item is already selling at a baseline loss."
        )
    if min_margin_pct < 0.0:
        raise ValueError(f"min_margin_pct cannot be negative, got: {min_margin_pct}")
    if expected_surplus_units < 0.0:
        raise ValueError(f"expected_surplus_units cannot be negative, got: {expected_surplus_units}")

    tiers = discount_tiers or DEFAULT_DISCOUNT_TIERS
    norm_risk = risk_category.strip().upper()
    if norm_risk not in tiers:
        raise ValueError(
            f"Unknown risk_category '{risk_category}'. "
            f"Expected one of: {list(tiers.keys())}"
        )

    # 2. Minimum-Margin Cost Floor
    floor_price = round(unit_cost * (1.0 + min_margin_pct), 2)
    if floor_price > unit_price:
        # If cost + required margin exceeds regular price, floor cannot be met even at 0%
        floor_price = unit_price

    # 3. Proposed Discount Tier
    proposed_discount = tiers[norm_risk]
    proposed_price = round(unit_price * (1.0 - proposed_discount), 2)

    # 4. Enforce Margin Safeguard
    safeguard_triggered = False
    final_discount = proposed_discount
    final_price = proposed_price

    if proposed_price < floor_price:
        safeguard_triggered = True
        # Downgrade to highest permissible tier that satisfies: price * (1 - d) >= floor_price
        available_tiers = sorted(tiers.values(), reverse=True)
        admissible_tier = 0.0
        for tier in available_tiers:
            test_price = round(unit_price * (1.0 - tier), 2)
            if test_price >= floor_price:
                admissible_tier = tier
                break
        final_discount = admissible_tier
        final_price = round(unit_price * (1.0 - final_discount), 2)

    # 5. Plain-Language Explanation
    if final_discount == 0.0:
        if norm_risk == "LOW":
            explanation = (
                f"Surplus risk is LOW ({expected_surplus_units:.1f} units). "
                f"Full regular price (${unit_price:.2f}) maintained to protect standard retail margin."
            )
        else:
            explanation = (
                f"Risk is {norm_risk}, but margin safeguard triggered. "
                f"Proposed {proposed_discount*100:.0f}% discount would breach the floor price of ${floor_price:.2f} "
                f"(cost: ${unit_cost:.2f} + {min_margin_pct*100:.0f}% margin). Discount capped at 0%."
            )
    elif safeguard_triggered:
        explanation = (
            f"Surplus risk is {norm_risk} ({expected_surplus_units:.1f} units at risk). "
            f"Initial proposed discount of {proposed_discount*100:.0f}% breached unit cost floor of ${floor_price:.2f}. "
            f"Safeguard adjusted discount to highest compliant tier: {final_discount*100:.0f}% "
            f"(Final price: ${final_price:.2f})."
        )
    else:
        explanation = (
            f"Surplus risk is {norm_risk} ({expected_surplus_units:.1f} units projected unsold). "
            f"Applied {final_discount*100:.0f}% markdown to accelerate sell-through before expiry. "
            f"Discounted price of ${final_price:.2f} safely clears the margin floor of ${floor_price:.2f}."
        )

    return MarkdownRecommendation(
        product_family=product_family,
        risk_category=norm_risk,
        expected_surplus_units=round(float(expected_surplus_units), 2),
        original_price=round(float(unit_price), 2),
        unit_cost=round(float(unit_cost), 2),
        min_margin_pct=round(float(min_margin_pct), 4),
        proposed_discount_pct=round(float(proposed_discount * 100.0), 2),
        final_discount_pct=round(float(final_discount * 100.0), 2),
        final_price=round(float(final_price), 2),
        floor_price=round(float(floor_price), 2),
        margin_safeguard_triggered=safeguard_triggered,
        explanation=explanation,
    )
