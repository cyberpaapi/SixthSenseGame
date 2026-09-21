(function (root, factory) {
  const catalog = factory();
  if (typeof module === "object" && module.exports) module.exports = catalog;
  else root.SixthSenseStoreCatalog = catalog;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  // INR amounts are Console setup guidance only. Checkout always uses Play's current localized offer.
  return Object.freeze({
    remove_banner_ads: Object.freeze({ title: "Remove Ads", inr: 799, permanent: true, coins: 0, inventory: {}, art: "remove-ads", description: "Permanently remove banners and automatic ads. Optional reward ads stay available." }),
    coins_500: Object.freeze({ title: "Coin Pouch", inr: 99, coins: 500, inventory: {}, art: "coins-small", description: "500 coins" }),
    coins_1500: Object.freeze({ title: "Coin Stash", inr: 249, coins: 1500, inventory: {}, art: "coins-medium", description: "1,500 coins" }),
    coins_3500: Object.freeze({ title: "Coin Chest", inr: 499, coins: 3500, inventory: {}, art: "coins-large", description: "3,500 coins" }),
    lifeline_kit: Object.freeze({ title: "Lifeline Kit", inr: 149, coins: 0, inventory: { sense: 5, peek: 3, clear: 3 }, art: "lifeline-kit", description: "5 Sense clues · 3 Peek · 3 Clear" }),
    complete_pack: Object.freeze({ title: "Complete Pack", inr: 999, permanent: true, coins: 1500, inventory: { sense: 10, peek: 5, clear: 5 }, art: "complete-pack", description: "Remove Ads forever + 1,500 coins + 10 Sense clues + 5 Peek + 5 Clear. Supplies granted once." })
  });
});
