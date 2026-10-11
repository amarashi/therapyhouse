/**
 * Structured data for the fee table on /fees/.
 *
 * Plain functions so `node --test` can check the rule that matters: an Offer
 * carries a price only once the clinic has confirmed its fee list (the page's
 * `lastReviewed` is set). Until then each Offer names the session and nothing
 * else, so a search engine is never handed a price the clinic has not signed off.
 */

/** Every dollar figure in an amount string: "$280–$350" -> [280, 350]. */
export function dollarAmounts(amount) {
  return (amount.match(/\$[\d,]+(?:\.\d+)?/g) ?? []).map((a) => Number(a.replace(/[$,]/g, '')));
}

/**
 * The span of session fees, for `MedicalBusiness.priceRange`: "$170–$350".
 * Adjustments (the +$10 evening fee) are not sessions and are left out.
 */
export function priceRange(fees) {
  const amounts = fees.filter((f) => !f.adjustment).flatMap((f) => dollarAmounts(f.amount));
  if (amounts.length === 0) return undefined;
  const lo = Math.min(...amounts);
  const hi = Math.max(...amounts);
  return lo === hi ? `$${lo}` : `$${lo}–$${hi}`;
}

/** One Offer per bookable session; prices only when `confirmed`. */
export function feeOffers(fees, { confirmed }) {
  return fees
    .filter((f) => !f.adjustment)
    .map((f) => {
      const offer = {
        '@type': 'Offer',
        name: f.label,
        itemOffered: { '@type': 'Service', name: f.label },
      };
      if (!confirmed) return offer;
      const amounts = dollarAmounts(f.amount);
      if (amounts.length === 1) {
        return { ...offer, price: amounts[0].toFixed(2), priceCurrency: 'AUD' };
      }
      if (amounts.length === 2) {
        return {
          ...offer,
          priceSpecification: {
            '@type': 'PriceSpecification',
            minPrice: amounts[0].toFixed(2),
            maxPrice: amounts[1].toFixed(2),
            priceCurrency: 'AUD',
          },
        };
      }
      return offer;
    });
}
