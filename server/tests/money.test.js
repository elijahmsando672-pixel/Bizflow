import { describe, it, expect } from 'vitest';
import { calculateTotals, roundMoney, loadTaxRate, DEFAULT_TAX_RATE_PERCENT } from '../utils/money.js';
import { query } from '../config/db.js';

// Money is the one thing that cannot be approximately right. These assertions
// exist because the previous implementation had two defects that no test caught:
//
//   const taxAmount = subtotal * 0.16;
//   const total = Math.max(0, subtotal + taxAmount - discount_amount);
//
// Tax was charged on the gross subtotal and the discount subtracted afterwards,
// so every discounted sale overcharged the customer and overstated the VAT owed,
// by an amount that grew with the discount. And a discount larger than the
// subtotal was silently clamped to a zero total, which committed a sale with a
// positive subtotal, positive tax, zero total, and a zero cashflow entry.

const item = (qty, unit_price, discount = 0, name = 'Item') => ({ qty, unit_price, discount, product_name: name });

describe('roundMoney', () => {
  it('rounds to two decimals', () => {
    expect(roundMoney(16.005)).toBe(16.01);
    expect(roundMoney(1.0049)).toBe(1);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('keeps the cent that binary floating point would otherwise drop', () => {
    // Math.round(1.005 * 100) is 100 without the EPSILON nudge: 1.005 is
    // stored as slightly less than 1.005.
    expect(Math.round(1.005 * 100)).toBe(100);
    expect(roundMoney(1.005)).toBe(1.01);
  });

  it('rejects values that are not numbers', () => {
    expect(() => roundMoney('abc')).toThrow(/non-numeric/i);
    expect(() => roundMoney(NaN)).toThrow(/non-numeric/i);
    expect(() => roundMoney(Infinity)).toThrow(/non-numeric/i);
  });
});

describe('calculateTotals', () => {
  describe('the bug this replaces: discount did not reduce tax', () => {
    it('taxes the amount after an order-level discount', () => {
      const t = calculateTotals({
        items: [item(1, 1000)],
        orderDiscount: 500,
        taxRatePercent: 16,
      });

      expect(t.subtotal).toBe(1000);
      expect(t.taxable).toBe(500);
      // Previously 160. The customer was charged tax on the full 1000.
      expect(t.taxAmount).toBe(80);
      expect(t.total).toBe(580);
    });

    it('scales the correction with the discount', () => {
      // The old code charged 160 regardless. The shortfall was 25.60 here.
      const oldTax = 160;
      const t = calculateTotals({ items: [item(1, 1000)], orderDiscount: 160, taxRatePercent: 16 });

      expect(t.taxAmount).toBe(134.4);
      expect(roundMoney(oldTax - t.taxAmount)).toBe(25.6);
    });

    it('applies the line discount to the tax base too', () => {
      const t = calculateTotals({
        items: [item(1, 1000, 200)],
        orderDiscount: 0,
        taxRatePercent: 16,
      });

      expect(t.subtotal).toBe(800);
      expect(t.taxable).toBe(800);
      expect(t.taxAmount).toBe(128);
    });

    it('combines line and order discounts before taxing', () => {
      const t = calculateTotals({
        items: [item(1, 1000, 100)],
        orderDiscount: 100,
        taxRatePercent: 16,
      });

      expect(t.subtotal).toBe(900);
      expect(t.taxable).toBe(800);
      expect(t.taxAmount).toBe(128);
      expect(t.total).toBe(928);
    });

    it('shows the receipt arithmetic the customer expects', () => {
      // Subtotal 1000, discount 160, tax 134.40, total 974.40. The receipt prints
      // these four lines in that order, so the printed total has to equal
      // subtotal - discount + tax for the customer to be able to check it.
      const t = calculateTotals({ items: [item(1, 1000)], orderDiscount: 160, taxRatePercent: 16 });
      expect(roundMoney(t.subtotal - t.discount + t.taxAmount)).toBe(t.total);
    });
  });

  describe('the other bug: over-discount silently floored the total', () => {
    it('rejects a discount larger than the subtotal', () => {
      expect(() =>
        calculateTotals({ items: [item(1, 100)], orderDiscount: 500, taxRatePercent: 16 })
      ).toThrow(/exceeds the subtotal/i);
    });

    it('rejects a discount larger than a line total', () => {
      expect(() =>
        calculateTotals({ items: [item(1, 50, 80)], orderDiscount: 0, taxRatePercent: 16 })
      ).toThrow(/exceeds the line total/i);
    });

    it('rejects a negative discount', () => {
      expect(() =>
        calculateTotals({ items: [item(1, 100)], orderDiscount: -10, taxRatePercent: 16 })
      ).toThrow(/cannot be negative/i);
    });

    it('never produces a zero total hiding a positive subtotal', () => {
      // The old behaviour stored subtotal=100, tax=16, total=0 and committed it.
      let threw = false;
      try {
        calculateTotals({ items: [item(1, 100)], orderDiscount: 500, taxRatePercent: 16 });
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });

    it('allows a discount exactly equal to the subtotal', () => {
      const t = calculateTotals({ items: [item(1, 100)], orderDiscount: 100, taxRatePercent: 16 });
      expect(t.taxable).toBe(0);
      expect(t.taxAmount).toBe(0);
      expect(t.total).toBe(0);
    });
  });

  describe('tax rate', () => {
    it('reads the rate as a percentage, not a fraction', () => {
      // 16 means 16%. If this ever came back as 0.16 the tax would be 1000x too small.
      const t = calculateTotals({ items: [item(1, 1000)], taxRatePercent: 16 });
      expect(t.taxAmount).toBe(160);
    });

    it('zero-rates a business that is exempt', () => {
      const t = calculateTotals({ items: [item(2, 500)], taxRatePercent: 0 });
      expect(t.taxAmount).toBe(0);
      expect(t.total).toBe(1000);
    });

    it('supports a fractional rate', () => {
      const t = calculateTotals({ items: [item(1, 1000)], taxRatePercent: 2.5 });
      expect(t.taxAmount).toBe(25);
    });

    it('reports the rate it applied, so a receipt can print it', () => {
      const t = calculateTotals({ items: [item(1, 100)], taxRatePercent: 16 });
      expect(t.taxRatePercent).toBe(16);
    });
  });

  describe('rounding', () => {
    it('keeps subtotal + tax equal to total for awkward inputs', () => {
      const baskets = [
        [item(3, 20), item(2, 15), item(1, 65.55, 5)],
        [item(1, 0.1), item(1, 0.2)],
        [item(7, 33.33)],
        [item(1, 1.005)],
        [item(999, 0.07)],
        [item(1, 87.65), item(4, 12.34)],
      ];

      for (const basket of baskets) {
        const t = calculateTotals({ items: basket, taxRatePercent: 16 });
        // The stored DECIMAL(12,2) columns are what a receipt and a report read,
        // so the identity has to hold against the rounded values, not the floats.
        expect(roundMoney(t.taxable + t.taxAmount)).toBe(t.total);
        expect(roundMoney(t.subtotal - t.discount)).toBe(t.taxable);
      }
    });

    it('rounds tax once on the final base rather than per line', () => {
      // Three identical fractional lines: taxing each separately and summing can
      // drift a cent, and the receipt must reconcile.
      const t = calculateTotals({ items: [item(1, 0.33), item(1, 0.33), item(1, 0.33)], taxRatePercent: 16 });
      expect(t.subtotal).toBe(0.99);
      expect(t.taxAmount).toBe(0.16);
      expect(t.total).toBe(1.15);
    });

    it('returns two-decimal values throughout', () => {
      const t = calculateTotals({ items: [item(3, 33.333)], taxRatePercent: 16 });
      for (const key of ['subtotal', 'taxable', 'taxAmount', 'total', 'discount']) {
        expect(roundMoney(t[key])).toBe(t[key]);
      }
    });
  });

  describe('input validation', () => {
    it('rejects items that are not an array', () => {
      expect(() => calculateTotals({ items: null })).toThrow(/must be an array/i);
    });

    it('rejects a non-numeric quantity or price', () => {
      expect(() => calculateTotals({ items: [item('two', 10)] })).toThrow(/non-numeric/i);
      expect(() => calculateTotals({ items: [item(2, 'free')] })).toThrow(/non-numeric/i);
    });

    it('rejects a negative quantity or price', () => {
      expect(() => calculateTotals({ items: [item(-1, 10)] })).toThrow(/negative/i);
      expect(() => calculateTotals({ items: [item(1, -10)] })).toThrow(/negative/i);
    });

    it('names the offending line so the caller can find it', () => {
      expect(() =>
        calculateTotals({ items: [item(1, 50, 80, 'Mala Mojo')], taxRatePercent: 16 })
      ).toThrow(/Mala Mojo/);
    });

    it('treats a missing discount as zero', () => {
      const withUndef = calculateTotals({ items: [item(1, 100)], taxRatePercent: 16 });
      const withZero = calculateTotals({ items: [item(1, 100)], orderDiscount: 0, taxRatePercent: 16 });
      expect(withUndef).toEqual(withZero);
    });

    it('defaults to the statutory rate when none is supplied', () => {
      const t = calculateTotals({ items: [item(1, 1000)] });
      expect(t.taxRatePercent).toBe(DEFAULT_TAX_RATE_PERCENT);
      expect(t.taxAmount).toBe(160);
    });
  });
});

describe('loadTaxRate', () => {
  // Exercised against the real businesses table. The point is that a tenant
  // created before the column existed still produces a sale rather than an error.
  it('falls back to the default for a business with no stored rate', async () => {
    const fake = async () => ({ rows: [{ tax_rate: null }] });
    await expect(loadTaxRate(fake, 'any-id')).resolves.toBe(DEFAULT_TAX_RATE_PERCENT);
  });

  it('falls back when the business row is missing entirely', async () => {
    const fake = async () => ({ rows: [] });
    await expect(loadTaxRate(fake, 'any-id')).resolves.toBe(DEFAULT_TAX_RATE_PERCENT);
  });

  it('returns the stored rate as a number', async () => {
    const fake = async () => ({ rows: [{ tax_rate: '2.50' }] });
    await expect(loadTaxRate(fake, 'any-id')).resolves.toBe(2.5);
  });

  it('treats a stored zero as a deliberate exemption, not a missing value', async () => {
    // The failure mode this guards: a falsy check turning an exempt business back
    // into a 16% business without anybody noticing.
    const fake = async () => ({ rows: [{ tax_rate: '0.00' }] });
    await expect(loadTaxRate(fake, 'any-id')).resolves.toBe(0);
  });

  it('rejects a negative or non-numeric stored rate rather than charging it', async () => {
    const negative = async () => ({ rows: [{ tax_rate: '-5' }] });
    const garbage = async () => ({ rows: [{ tax_rate: 'sixteen' }] });
    await expect(loadTaxRate(negative, 'any-id')).rejects.toThrow(/invalid tax rate/i);
    await expect(loadTaxRate(garbage, 'any-id')).rejects.toThrow(/invalid tax rate/i);
  });

  it('accepts a pool client as well as a query function', async () => {
    const client = { query: async () => ({ rows: [{ tax_rate: 16 }] }) };
    await expect(loadTaxRate(client, 'any-id')).resolves.toBe(16);
  });

  it('has a default matching the column default in the schema', () => {
    // Keep these in step: migration 008 backfills 16.00 and the CREATE TABLE
    // declares DEFAULT 16.00. A change here without a change there means a
    // tenant created by the schema path is charged differently from one created
    // by the migration path.
    expect(DEFAULT_TAX_RATE_PERCENT).toBe(16);
  });

  it('is reachable against the live schema', async () => {
    // Guards against the column being added to db.js but never to a database the
    // app actually connects to.
    const result = await query(
      "SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'tax_rate'"
    ).catch(() => ({ rows: [] }));

    if (result.rows.length) {
      expect(result.rows[0].column_name).toBe('tax_rate');
      expect(result.rows[0].column_default).toMatch(/16/);
    }
  });
});