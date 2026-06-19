// Financial-freedom maths. The headline number is an annuity that draws the pot
// down to zero by a fixed PLANNING age, and `sustainableMonthly` is what you
// could draw forever (a real perpetuity) without touching principal — shown
// behind the "make it last for life" toggle.
//
// We plan to age 90 (a standard, conservative retirement horizon) rather than to
// average life expectancy. Planning to life expectancy means a coin-flip chance
// of outliving your money, and it broke for anyone retiring near or past it (you
// cannot retire at 80 if the model assumes you are gone by 77). A fixed horizon
// keeps every retirement age valid and drops the morbid "you die at X" framing.
export const PLAN_TO_AGE = 90

export function annuityMonthly(target, months, annualRealReturn) {
  const r = annualRealReturn / 12
  if (r <= 0) return target / months
  return (target * r) / (1 - Math.pow(1 + r, -months))
}

export function computeResults({ target, age, retire, country }, data) {
  const { salary, realReturn } = data
  const endAge = PLAN_TO_AGE
  const years = Math.max(1, endAge - retire)
  const months = years * 12

  // Pot drawn from `retire` to `endAge`, still earning realReturn → hits zero at endAge.
  const monthly = annuityMonthly(target, months, realReturn)
  // Draw only the real return → lasts indefinitely.
  const sustainableMonthly = (target * realReturn) / 12

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
const WEEKS_PER_MONTH = 52 / 12

export function lifestyle(grossMonthly, country, data) {
  const d = data[country] || data.EE
  const taxRate = d.investTaxRate ?? 0.2
  const tax = Math.round(grossMonthly * taxRate)
  const net = grossMonthly - tax
  const rent = Math.round(d.luxuryRentMonthly || 0)
  const utilities = Math.round(d.utilitiesMonthly || 0)
  const living = rent + utilities
  const leftover = Math.max(0, net - living)

  const mealsPerWeek = Math.round(leftover / WEEKS_PER_MONTH / MEAL_PRICE)
  const holidaysPerYear = Math.floor((leftover * 12) / TRIP_COST)
  const affords = net >= living
  const coverPct = living > 0 ? Math.max(1, Math.round((net / living) * 100)) : 100

  return {
    capital: d.capital,
    district: d.district,
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
    tripCost: TRIP_COST,
    affords,
    coverPct,
    taxRate,
    // Segments sum to gross — drives the breakdown bar. 'free' is the gold slice.
    segments: [
      { key: 'tax', value: tax },
      { key: 'rent', value: rent },
      { key: 'utilities', value: utilities },
      { key: 'free', value: leftover },
    ],
  }
}
