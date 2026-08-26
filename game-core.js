(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SixthSenseCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CURATED_ANSWERS = [
    ["admire", "To regard with warm approval."], ["almost", "Very nearly, but not quite."],
    ["always", "At every time; without exception."], ["animal", "A living creature that can move and sense."],
    ["answer", "A response to a question."], ["artist", "Someone who creates expressive work."],
    ["autumn", "The season of falling leaves."], ["bakery", "A place where bread and cakes are made."],
    ["banana", "A curved yellow fruit."], ["basket", "A woven container with an open top."],
    ["beacon", "A guiding light or signal."], ["beauty", "A quality that delights the senses."],
    ["better", "More desirable or improved."], ["beyond", "Farther away or on the other side."],
    ["bottle", "A narrow-necked container for liquids."], ["breeze", "A light, gentle wind."],
    ["bridge", "A structure that carries you across a gap."], ["bright", "Giving off plenty of light."],
    ["bubble", "A thin sphere filled with air."], ["butter", "A creamy spread made from milk."],
    ["button", "A small fastener or clickable control."], ["camera", "A device that captures photographs."],
    ["candle", "Wax with a wick that gives light."], ["canyon", "A deep valley with steep sides."],
    ["castle", "A large fortified home."], ["circle", "A perfectly round shape."],
    ["clever", "Quick to understand or invent."], ["cloudy", "Covered with many clouds."],
    ["coffee", "A rich drink brewed from roasted beans."], ["comedy", "Entertainment meant to make you laugh."],
    ["cookie", "A small, sweet baked treat."], ["cotton", "A soft natural fiber from a plant."],
    ["cousin", "A child of your aunt or uncle."], ["create", "To bring something new into being."],
    ["dancer", "Someone who moves rhythmically to music."], ["joyful", "Feeling or showing great happiness."],
    ["desert", "A very dry region with little rain."], ["dinner", "The main meal of the day."],
    ["doctor", "A professional who treats illness."], ["dragon", "A legendary fire-breathing creature."],
    ["dreams", "Stories and images experienced during sleep."], ["effort", "The energy used to do something."],
    ["family", "People related by birth, care, or choice."], ["famous", "Known by many people."],
    ["farmer", "Someone who grows crops or raises animals."], ["flower", "The colorful blooming part of a plant."],
    ["forest", "A large area thick with trees."], ["friend", "A person you know, like, and trust."],
    ["future", "The time that is still to come."], ["garden", "A place where plants are grown."],
    ["gentle", "Kind, calm, and not rough."], ["golden", "Bright yellow like precious metal."],
    ["guitar", "A stringed instrument played by hand."], ["hammer", "A tool used for driving nails."],
    ["health", "The state of body and mind being well."], ["honest", "Truthful and sincere."],
    ["island", "Land surrounded by water."], ["jacket", "A short coat worn outdoors."],
    ["jungle", "Dense tropical land full of plants."], ["kitten", "A young cat."],
    ["ladder", "Rungs used for climbing up or down."], ["little", "Small in size or amount."],
    ["lovely", "Beautiful or very pleasant."], ["market", "A place where goods are bought and sold."],
    ["memory", "Something remembered from the past."], ["mirror", "A surface that shows your reflection."],
    ["moment", "A very short period of time."], ["monkey", "A clever primate often with a long tail."],
    ["sunray", "A beam of light from the sun."], ["mother", "A female parent."],
    ["nature", "The living world and its landscapes."], ["nearby", "Not far away."],
    ["orange", "A citrus fruit and a warm color."], ["pencil", "A tool for writing or drawing."],
    ["people", "Human beings considered together."], ["pepper", "A spice or crisp garden vegetable."],
    ["planet", "A large world orbiting a star."], ["pocket", "A small sewn pouch in clothing."],
    ["pretty", "Attractive in a delicate way."], ["purple", "A color between red and blue."],
    ["rabbit", "A small animal with long ears."], ["raffle", "A drawing in which prizes are won by chance."],
    ["random", "Chosen without a planned pattern."], ["rattle", "To make a rapid series of short, sharp sounds."],
    ["reward", "Something given for a good effort."], ["rocket", "A vehicle propelled toward space."],
    ["school", "A place for teaching and learning."], ["secret", "Something kept from being known."],
    ["shadow", "A dark shape made when light is blocked."], ["silver", "A shiny gray-white metal."],
    ["simple", "Easy to understand or do."], ["sister", "A female sibling."],
    ["smooth", "Even to the touch, without roughness."], ["soccer", "A team sport played with a round ball."],
    ["spring", "The season when plants begin to grow."], ["street", "A public road in a town or city."],
    ["summer", "The warmest season of the year."], ["sunset", "The time the sun drops below the horizon."],
    ["temple", "A building used for worship."], ["ticket", "A pass that grants entry or travel."],
    ["travel", "To go from one place to another."], ["turtle", "A reptile protected by a shell."],
    ["velvet", "A fabric with a soft, dense surface."], ["window", "An opening that lets in light and a view."],
    ["winter", "The coldest season of the year."], ["wonder", "A feeling of surprise and admiration."],
    ["yellow", "The color of sunshine and lemons."], ["zigzag", "A line made of sharp alternating turns."]
  ].map(([word, clue]) => ({ word, clue }));

  function loadAnswerBank() {
    if (typeof globalThis !== "undefined" && Array.isArray(globalThis.SixthSenseAnswers)) return globalThis.SixthSenseAnswers;
    if (typeof require === "function") {
      try { return require("./answer-bank.js"); } catch (_) { return []; }
    }
    return [];
  }

  const loadedAnswers = loadAnswerBank();
  const ANSWERS = (loadedAnswers.length ? loadedAnswers : CURATED_ANSWERS)
    .filter(item => item && typeof item.word === "string" && typeof item.clue === "string")
    .map(item => ({ word: item.word.toLowerCase(), clue: item.clue, tier: ["easy", "medium", "extreme"].includes(item.tier) ? item.tier : "easy" }));

  const TIER_ORDER = Object.freeze(["easy", "medium", "extreme"]);
  const ANSWER_TIERS = Object.freeze(Object.fromEntries(TIER_ORDER.map(tier => [
    tier,
    Object.freeze(ANSWERS.filter(item => item.tier === tier))
  ])));

  const MAX_GUESSES = 7;
  const WORD_LENGTH = 6;
  const STARTING_COINS = 20;
  const LIFELINE_COSTS = Object.freeze({ sense: 3, peek: 5, clear: 4, skip: 6 });
  const ADVENTURE_TOTAL = ANSWERS.length;
  const adventureRouteCache = new Map();

  function rewardForAttempts(attempts) {
    const safeAttempts = Math.min(MAX_GUESSES, Math.max(1, Number(attempts) || MAX_GUESSES));
    return 16 - (safeAttempts * 2);
  }

  const EXTRA_GUESSES = `
    aboard absorb absurd accent accept access accord across acting action active actual adjust advice affair afford afraid agency agenda amount annual appeal appear around arrive asking asleep assist attack attend author avenue avoid awake award aware barely battle behave belief belong beside better border boring borrow branch breath broken bronze budget bundle burden career carpet caught center chance change charge choice choose church cinema citizen closed closer common corner course cousin custom danger decide demand depend design detail direct double driven during easily eating editor effect eleven emerge empire energy engine enough escape evened fabric failed fairly flight frozen garage gather gender ground growth handle happen hardly height hidden hollow hungry impact income indeed inside intend invite itself kindly lawyer leader league learn lesson letter likely listen lonely manner master matter medium member middle minute modern mostly museum myself narrow nation normal object office parent person phrase pillow police prefer prince public quiet rarely rather reader really record return safety sample season second settle should signal single slight source speech spirit stable steady stone strong sudden taught tennis thanks theory thirty though thread throat thrown timing toward useful vision warmth wealth weekly weight wholly winner within wonder wooden worker writer
  `.trim().split(/\s+/).filter(word => word.length === WORD_LENGTH);

  function loadFrequencyWords() {
    if (typeof globalThis !== "undefined" && Array.isArray(globalThis.SixthSenseWords)) return globalThis.SixthSenseWords;
    if (typeof require === "function") {
      try { return require("./word-bank.js"); } catch (_) { return []; }
    }
    return [];
  }

  const WORDS = new Set([...ANSWERS.map(item => item.word), ...EXTRA_GUESSES, ...loadFrequencyWords()]);

  function scoreGuess(guess, answer) {
    const result = Array(WORD_LENGTH).fill("absent");
    const remaining = Object.create(null);
    for (let i = 0; i < WORD_LENGTH; i += 1) {
      if (guess[i] === answer[i]) result[i] = "exact";
      else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < WORD_LENGTH; i += 1) {
      if (result[i] === "exact") continue;
      if ((remaining[guess[i]] || 0) > 0) {
        result[i] = "present";
        remaining[guess[i]] -= 1;
      }
    }
    return result;
  }

  function validateHardMode(guess, history) {
    const fixed = Array(WORD_LENGTH).fill(null);
    const requiredCounts = Object.create(null);
    history.forEach(entry => {
      const counts = Object.create(null);
      entry.score.forEach((status, index) => {
        const letter = entry.guess[index];
        if (status === "exact") fixed[index] = letter;
        if (status === "exact" || status === "present") counts[letter] = (counts[letter] || 0) + 1;
      });
      Object.keys(counts).forEach(letter => {
        requiredCounts[letter] = Math.max(requiredCounts[letter] || 0, counts[letter]);
      });
    });
    for (let index = 0; index < fixed.length; index += 1) {
      if (fixed[index] && guess[index] !== fixed[index]) return `Position ${index + 1} must be ${fixed[index].toUpperCase()}.`;
    }
    for (const [letter, count] of Object.entries(requiredCounts)) {
      const actual = [...guess].filter(char => char === letter).length;
      if (actual < count) return `Your guess must include ${count > 1 ? `${count} ${letter.toUpperCase()}s` : letter.toUpperCase()}.`;
    }
    return null;
  }

  function dateKey(date = new Date()) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }

  function dayNumber(date = new Date()) {
    const epoch = Date.UTC(2026, 0, 1);
    return Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - epoch) / 86400000) + 1;
  }

  function dailyAnswer(date = new Date()) {
    const day = dayNumber(date);
    const mixed = Math.abs((day * 73 + 41) % ANSWER_TIERS.easy.length);
    return ANSWER_TIERS.easy[mixed];
  }

  function answersForDifficulty(difficulty = "easy") {
    return ANSWER_TIERS[TIER_ORDER.includes(difficulty) ? difficulty : "easy"];
  }

  function unlockedDifficulty(completedWords = []) {
    const completed = completedWords instanceof Set ? completedWords : new Set(completedWords);
    if (!ANSWER_TIERS.easy.every(item => completed.has(item.word))) return "easy";
    if (!ANSWER_TIERS.medium.every(item => completed.has(item.word))) return "medium";
    return "extreme";
  }

  function progressionPool(completedWords = []) {
    const unlockedIndex = TIER_ORDER.indexOf(unlockedDifficulty(completedWords));
    return TIER_ORDER.slice(0, unlockedIndex + 1).flatMap(tier => ANSWER_TIERS[tier]);
  }

  function practiceAnswer(excludeWord, random = Math.random, completedWords = []) {
    const completed = completedWords instanceof Set ? completedWords : new Set(completedWords);
    const pool = progressionPool(completed);
    const unsolved = pool.filter(item => item.word !== excludeWord && !completed.has(item.word));
    const choices = unsolved.length ? unsolved : pool.filter(item => item.word !== excludeWord);
    return choices[Math.floor(random() * choices.length)];
  }

  function seededRandom(seed) {
    let state = Number(seed) >>> 0;
    return function () {
      state = (state + 0x6D2B79F5) >>> 0;
      let mixed = state;
      mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }

  function adventureRoute(seed = 1) {
    const normalizedSeed = Number(seed) >>> 0 || 1;
    if (adventureRouteCache.has(normalizedSeed)) return adventureRouteCache.get(normalizedSeed);
    const route = TIER_ORDER.flatMap((tier, tierIndex) => {
      const shuffled = [...ANSWER_TIERS[tier]];
      const random = seededRandom(normalizedSeed ^ Math.imul(tierIndex + 1, 0x9E3779B1));
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
      }
      return shuffled;
    });
    const frozen = Object.freeze(route);
    adventureRouteCache.set(normalizedSeed, frozen);
    if (adventureRouteCache.size > 4) adventureRouteCache.delete(adventureRouteCache.keys().next().value);
    return frozen;
  }

  function adventureProgress(level = 0) {
    const completed = Math.max(0, Math.min(ADVENTURE_TOTAL, Math.floor(Number(level) || 0)));
    let offset = 0;
    for (let tierIndex = 0; tierIndex < TIER_ORDER.length; tierIndex += 1) {
      const tier = TIER_ORDER[tierIndex];
      const tierTotal = ANSWER_TIERS[tier].length;
      if (completed < offset + tierTotal || tierIndex === TIER_ORDER.length - 1) {
        return Object.freeze({
          level: completed,
          total: ADVENTURE_TOTAL,
          tier,
          tierIndex,
          tierLevel: Math.max(0, Math.min(tierTotal, completed - offset)),
          tierTotal,
          complete: completed >= ADVENTURE_TOTAL
        });
      }
      offset += tierTotal;
    }
  }

  function adventureAnswer(level = 0, seed = 1) {
    const safeLevel = Math.max(0, Math.min(ADVENTURE_TOTAL - 1, Math.floor(Number(level) || 0)));
    return adventureRoute(seed)[safeLevel];
  }

  function isValidWord(word) {
    return typeof word === "string" && word.length === WORD_LENGTH && WORDS.has(word.toLowerCase());
  }

  return {
    ANSWERS, ANSWER_TIERS, TIER_ORDER, WORDS, MAX_GUESSES, WORD_LENGTH, STARTING_COINS, LIFELINE_COSTS, ADVENTURE_TOTAL,
    scoreGuess, validateHardMode, dateKey, dayNumber, dailyAnswer, practiceAnswer, isValidWord,
    rewardForAttempts, answersForDifficulty, unlockedDifficulty, progressionPool,
    adventureRoute, adventureProgress, adventureAnswer
  };
});
