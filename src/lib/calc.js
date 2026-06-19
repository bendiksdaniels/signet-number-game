// Financial-freedom maths. The headline number is an annuity that draws the pot
// down to zero by a chosen horizon; `sustainableMonthly` is what you could draw
// forever (a perpetuity at the fund's yield) without touching principal, shown
// behind the "make it last" toggle.
//
// "Spend it down" plans to the average age of death in the player's country, so
// the pot empties right about when the average person passes. Spending every
// euro over that realistic horizon (rather than to a padded age 90) is what
// lifts the monthly figure. Retirement is capped at 70, below every Baltic life
// expectancy, so this horizon is always positive and no retirement age breaks it.

export function annuityMonthly(target, months, annualRealReturn) {
  const r = annualRealReturn / 12
  if (r <= 0) return target / months
  return (target * r) / (1 - Math.pow(1 + r, -months))
}

export function computeResults({ target, age, retire, country }, data) {
  const { salary, investReturn, lifeExp } = data
  // Draw the pot to zero by the average age of death (rounded), so "spend it
  // down" really does spend every euro by the time the average person dies.
  const endAge = Math.round(lifeExp?.[country] ?? 80)
  const years = Math.max(1, endAge - retire)
  const months = years * 12

  // The pot stays invested in the Signet Baltic Bond Fund (investReturn) in BOTH
  // modes, so they stay consistent: spending it down draws principal + yield to
  // zero by endAge, while "make it last" draws only the yield and never touches
  // principal. One shared rate guarantees spend-down >= live-off-yield (no odd
  // inversion where preserving the pot would somehow pay more than emptying it).
  const monthly = annuityMonthly(target, months, investReturn)
  const sustainableMonthly = (target * investReturn) / 12

  const avgSalary = salary[country] ?? 0
  const multiple = avgSalary ? monthly / avgSalary : 0

  return {
    target, age, retire, country,
    endAge, years, months,
    monthly, sustainableMonthly,
    avgSalary, multiple,
  }
}

// Tangible "what this buys", realistically. The gross monthly drawdown is taxed
// (investment income tax), then the fixed life expenses in the capital's luxury
// district come out (a luxury home + utilities). Whatever is left is free to
// spend, expressed two ways: fancy dinners out a week (EUR 100 a meal) and
// holidays a year (a EUR 2,000 week away). tax + rent + utilities + free == gross.
export const MEAL_PRICE = 100
export const TRIP_COST = 2000
// Real-world ceilings so a very large pot reads like a life, not "100+". You can
// eat at most three meals out a day (21 a week), and a week away every fortnight
// (26 a year) is already near-permanent travel. Past these the money is there,
// but the time in the year is not.
export const MAX_MEALS_PER_WEEK = 21
export const MAX_HOLIDAYS_PER_YEAR = 26
// Above this pot size the holiday line upgrades to a luxury PRIVATE-JET escape: a
// one-week getaway for two (mid/heavy jet charter + 5-star suite + experiences,
// ~EUR 110k-330k all-in; EUR 150k is a round mid-band figure). Capped at 6 a
// year, the realistic ceiling for major UHNW getaways.
export const LUX_TRIP_THRESHOLD = 5000000
export const LUX_TRIP_COST = 150000
export const MAX_LUX_TRIPS_PER_YEAR = 6
// Lifestyle tiers, most expensive first: a prestige-district home, a city-centre
// flat, or the suburbs. Trading down on rent frees up money to travel, so a
// smaller number can still buy holidays in a cheaper tier.
export const TIERS = ['luxury', 'central', 'suburb']
const WEEKS_PER_MONTH = 52 / 12

export function lifestyle(grossMonthly, country, data, tier = 'luxury', target = 0) {
  const d = data[country] || data.EE
  const tiers = d.tiers || {}
  const t = tiers[tier] || tiers.luxury || {}
  const taxRate = d.investTaxRate ?? 0.2
  const tax = Math.round(grossMonthly * taxRate)
  const net = grossMonthly - tax
  const rent = Math.round(t.rent || 0)
  // Utilities scale with the home (bigger tier = more to heat/power), so they live
  // on the tier; fall back to a country-level figure if a tier omits them.
  const utilities = Math.round(t.utilities ?? d.utilitiesMonthly ?? 0)
  const living = rent + utilities
  const leftover = Math.max(0, net - living)

  const mealsPerWeek = Math.min(MAX_MEALS_PER_WEEK, Math.round(leftover / WEEKS_PER_MONTH / MEAL_PRICE))
  // Big pots (target >= LUX_TRIP_THRESHOLD) holiday by private jet: pricier trips,
  // a lower yearly cap, and a different label downstream.
  const luxe = target >= LUX_TRIP_THRESHOLD
  const tripCost = luxe ? LUX_TRIP_COST : TRIP_COST
  const tripCap = luxe ? MAX_LUX_TRIPS_PER_YEAR : MAX_HOLIDAYS_PER_YEAR
  const holidaysPerYear = Math.min(tripCap, Math.floor((leftover * 12) / tripCost))
  const affords = net >= living
  const coverPct = living > 0 ? Math.max(1, Math.round((net / living) * 100)) : 100

  return {
    capital: d.capital,
    tier,
    district: t.district || null,
    gross: grossMonthly,
    tax,
    net,
    rent,
    utilities,
    living,
    leftover,
    mealsPerWeek,
    holidaysPerYear,
    mealPrice: MEAL_PRICE,
    tripCost,
    tripKind: luxe ? 'luxe' : 'standard',
    affords,
    coverPct,
    taxRate,
    // Segments sum to gross, driving the breakdown bar. 'free' is the gold slice.
    segments: [
      { key: 'tax', value: tax },
      { key: 'rent', value: rent },
      { key: 'utilities', value: utilities },
      { key: 'free', value: leftover },
    ],
  }
}

// The fanciest home the income can COMFORTABLY carry: one where the money left
// after the home and bills is at least what the home and bills cost (coverage of
// 200%+), so you are not "barely affording" the luxury district. A tight budget
// therefore defaults to a cheaper, modest home where it can still live well and
// travel. If nothing is comfortable, fall back to the cheapest home it can
// afford at all, then to the cheapest tier regardless.
export function bestTier(grossMonthly, country, data) {
  for (const tier of TIERS) {
    const l = lifestyle(grossMonthly, country, data, tier)
    if (l.affords && l.leftover >= l.living) return tier
  }
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (lifestyle(grossMonthly, country, data, TIERS[i]).affords) return TIERS[i]
  }
  return TIERS[TIERS.length - 1]
}
