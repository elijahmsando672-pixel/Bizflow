import { AppError } from './AppError.js';

/**
 * The default Kenyan VAT rate, in percent.
 *
 * Used only to backfill `businesses.tax_rate` for tenants that predate the
 * column. It is deliberately *not* a fallback for reading the rate: every caller
 * loads the rate from its business row, so changing the statutory rate is a
 * migration over existing rows rather than a code change that silently reprices
 * everyone's catalogue.
 */
export const DEFAULT_TAX_RATE_PERCENT = 16;

/**
 * Rounds to 2 decimal places, the scale of every money column in the schema.
 *
 * `Number.EPSILON` nudges values like 1.005 that land a hair below the halfway
 * point in binary floating point. Without it `Math.round(1.005 * 100)` is 100
 * and the cent is silently dropped. This is presentation rounding, not a
 * substitute for computing in the database: it exists so the number JavaScript
 * prints matches the DECIMAL(12,2) Postgres stores.
 */
export const roundMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new AppError(`Cannot round a non-numeric amount: ${value}`, 400);
  }
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

/**
 * Reads a business's configured tax rate.
 *
 * A missing row falls back to the default rather than throwing, so a tenant
 * created before the column existed still produces a sale instead of an error.
 * The rate is stored as a percentage (16, not 0.16) because that is how it is
 * entered and displayed; the conversion happens here so no caller has to
 * remember which convention a given column uses.
 */
export const loadTaxRate = async (runner, businessId) => {
  const run = typeof runner === 'function' ? runner : runner.query.bind(runner);
  const { rows } = await run(
    'SELECT tax_rate FROM businesses WHERE id = $1',
    [businessId]
  );

  const stored = rows[0]?.tax_rate;
  if (stored === null || stored === undefined) return DEFAULT_TAX_RATE_PERCENT;

  const percent = Number(stored);
  if (!Number.isFinite(percent) || percent < 0) {
    throw new AppError(`Business has an invalid tax rate: ${stored}`, 500);
  }
  return percent;
};

/**
 * Computes the money columns of a sale or invoice from its lines.
 *
 * Two decisions are encoded here, and both were previously implicit and wrong:
 *
 * **Tax applies to the discounted amount.** A KSh 500 discount on a KSh 1000 sale
 * is taxed on KSh 500. Taxing the gross and discounting afterwards meant every
 * discounted sale overcharged the customer *and* overstated the VAT owed to the
 * revenue authority, by an amount that grew with the discount. Since the receipt
 * displays subtotal, discount, then tax, charging tax on gross also disagreed
 * with the customer's own arithmetic.
 *
 * **A discount larger than the subtotal is rejected.** This used to be silently
 * clamped by `Math.max(0, ...)`, which stored a sale with a positive subtotal, a
 * positive tax, and a total of zero, then posted a zero cashflow entry. The
 * transaction committed and nothing reported a problem. A caller passing a
 * discount that cannot apply is making a mistake worth surfacing.
 *
 * Line-level discounts reduce the taxable base too, since they are already
 * removed when summing the subtotal. Tax is rounded once on the final base rather
 * than per line: rounding per line and summing drifts by a cent or two on some
 * baskets, and the receipt must show a total that reconciles.
 *
 * @param items            lines with `qty`, `unit_price`, optional `discount`
 * @param orderDiscount    discount applied to the whole document
 * @param taxRatePercent   the business's rate, as a percentage
 */
export const calculateTotals = ({ items, orderDiscount = 0, taxRatePercent = DEFAULT_TAX_RATE_PERCENT }) => {
  if (!Array.isArray(items)) {
    throw new AppError('Items must be an array', 400);
  }

  let subtotal = 0;
  for (const item of items) {
    const qty = Number(item.qty);
    const unitPrice = Number(item.unit_price);
    if (!Number.isFinite(qty) || !Number.isFinite(unitPrice)) {
      throw new AppError(`Line item has a non-numeric quantity or price: ${item.product_name || 'item'}`, 400);
    }
    if (qty < 0 || unitPrice < 0) {
      throw new AppError(`Line item has a negative quantity or price: ${item.product_name || 'item'}`, 400);
    }
    const lineDiscount = Number(item.discount || 0);
    const line = (qty * unitPrice) - lineDiscount;
    if (line < 0) {
      throw new AppError(
        `Discount of KSh ${roundMoney(lineDiscount)} on "${item.product_name || 'item'}" exceeds the line total`,
        400
      );
    }
    subtotal += line;
  }

  subtotal = roundMoney(subtotal);

  const discount = roundMoney(Number(orderDiscount || 0));
  if (discount < 0) {
    throw new AppError('Discount cannot be negative', 400);
  }
  if (discount > subtotal) {
    throw new AppError(
      `Discount of KSh ${discount} exceeds the subtotal of KSh ${subtotal}`,
      400
    );
  }

  const taxable = roundMoney(subtotal - discount);
  const taxAmount = roundMoney((taxable * Number(taxRatePercent)) / 100);
  const total = roundMoney(taxable + taxAmount);

  return {
    subtotal,
    taxAmount,
    taxRatePercent: Number(taxRatePercent),
    discount,
    taxable,
    total,
  };
};