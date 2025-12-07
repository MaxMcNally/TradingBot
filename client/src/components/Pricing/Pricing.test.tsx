import { describe, it, vi, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Pricing from "./Pricing";

vi.mock("../../hooks", () => {
  const plans = [
    {
      tier: "FREE",
      name: "Free",
      monthlyPrice: 0,
      priceCents: 0,
      currency: "USD",
      headline: "Get started",
      features: ["Feature A"],
      badge: undefined
    },
    {
      tier: "BASIC",
      name: "Basic",
      monthlyPrice: 9.99,
      priceCents: 999,
      currency: "USD",
      headline: "For regular traders",
      features: ["Feature B"],
      badge: "Popular"
    }
  ];

  return {
    useSubscription: () => ({
      plans,
      providers: ["STRIPE", "PAYPAL", "SQUARE"],
      subscription: { planTier: "FREE", planStatus: "ACTIVE", provider: "NONE" },
      history: [],
      isPlansLoading: false,
      isSubscriptionLoading: false,
      checkout: vi.fn(),
      cancelSubscription: vi.fn(),
      switchToFree: vi.fn(),
      refetchSubscription: vi.fn(),
      isMutating: false
    }),
    useUser: () => ({ user: { id: 1 } })
  };
});

describe("Pricing component", () => {
  it("renders available plans and marks the current one", () => {
    render(<Pricing />);

    expect(screen.getByText(/Free Plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Basic/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Current Plan/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Choose Plan/i })).toBeEnabled();
  });
});
