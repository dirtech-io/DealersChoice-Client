const RANKS = "23456789TJQKA";

/**
 * --- HIGH HAND EVALUATION ---
 * Now includes Short Deck (6+ Hold'em) rules support.
 */
export const evaluateHighStrength = (cards, isShortDeck = false) => {
  if (cards.length < 2) return "High Card";

  const rankCounts = {};
  const suitCounts = {};
  const rankValues = [];

  cards.forEach((c) => {
    const r = c[0];
    const s = c.slice(-1).toLowerCase(); // Handle 10h as '1', '0', 'h'
    const rankChar = r === "1" ? "T" : r; // Normalize '10' to 'T'

    rankCounts[rankChar] = (rankCounts[rankChar] || 0) + 1;
    suitCounts[s] = (suitCounts[s] || 0) + 1;
    rankValues.push(RANKS.indexOf(rankChar));
  });

  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const maxSuitCount = Math.max(...Object.values(suitCounts), 0);

  // --- Straight Check ---
  const uniqueRanks = [...new Set(rankValues)].sort((a, b) => a - b);

  // Ace-Low Straight Logic (A-2-3-4-5)
  if (uniqueRanks.includes(12)) uniqueRanks.unshift(-1);

  // Short Deck Ace-Low Straight Logic (A-6-7-8-9)
  if (isShortDeck && uniqueRanks.includes(12)) {
    // In Short Deck, A acts as a 5 for the low straight
    uniqueRanks.push(3); // 3 is index for rank '5' if it existed, but we use logic below
  }

  let isStraight = false;
  let consecutive = 1;
  for (let i = 0; i < uniqueRanks.length - 1; i++) {
    if (uniqueRanks[i + 1] === uniqueRanks[i] + 1) {
      consecutive++;
      if (consecutive >= 5) isStraight = true;
    } else {
      consecutive = 1;
    }
  }

  // Specialized Short Deck Ace-Low (A, 6, 7, 8, 9)
  if (isShortDeck && !isStraight) {
    const sdLow = [12, 4, 5, 6, 7]; // A, 6, 7, 8, 9
    isStraight = sdLow.every((r) => uniqueRanks.includes(r));
  }

  const isFlush = maxSuitCount >= 5;

  // --- Hand Ranking Logic ---
  if (isFlush && isStraight) return "Straight Flush";
  if (counts[0] === 4) return "Four of a Kind";

  // Short Deck: Flush beats Full House
  if (isShortDeck) {
    if (isFlush) return "Flush";
    if (counts[0] === 3 && counts[1] >= 2) return "Full House";
  } else {
    if (counts[0] === 3 && counts[1] >= 2) return "Full House";
    if (isFlush) return "Flush";
  }

  if (isStraight) return "Straight";
  if (counts[0] === 3) return "Three of a Kind";
  if (counts[0] === 2 && counts[1] === 2) return "Two Pair";
  if (counts[0] === 2) return "One Pair";

  return "High Card";
};

/**
 * --- LOW HAND EVALUATION (8-or-better) ---
 */
export const evaluateLowStrength = (cards) => {
  const uniqueLowRanks = [
    ...new Set(cards.map((c) => (c[0] === "1" ? "T" : c[0]))),
  ]
    .filter((r) => "A2345678".includes(r))
    .sort((a, b) => RANKS.indexOf(b) - RANKS.indexOf(a));

  if (uniqueLowRanks.length < 5) return null;

  const topCard = uniqueLowRanks[0];
  return `${topCard}-Low`;
};

/**
 * --- COMBINATORIAL HELPERS ---
 */
const getCombinations = (array, size) => {
  if (size > array.length) return [];
  const result = [];
  const f = (start, combo) => {
    if (combo.length === size) {
      result.push(combo);
      return;
    }
    for (let i = start; i < array.length; i++) {
      f(i + 1, [...combo, array[i]]);
    }
  };
  f(0, []);
  return result;
};

/**
 * --- GAME VARIANT WRAPPERS ---
 */
export const getHandDescription = (gameType, holeCards, board = []) => {
  if (!holeCards || holeCards.length === 0) return "";

  const cleanBoard = board.filter((c) => !!c);
  const isOmaha = gameType?.includes("PLO");
  const isHiLo = gameType?.includes("8") || gameType?.includes("HILO");
  const isShortDeck = gameType?.includes("SHORT");

  const strengthOrder = [
    "High Card",
    "One Pair",
    "Two Pair",
    "Three of a Kind",
    "Straight",
    "Flush",
    "Full House",
    "Four of a Kind",
    "Straight Flush",
  ];

  // Adjust order for Short Deck
  if (isShortDeck) {
    strengthOrder[4] = "Straight";
    strengthOrder[5] = "Full House";
    strengthOrder[6] = "Flush";
  }

  let highStrength = "High Card";
  let lowStrength = null;

  if (isOmaha) {
    // MANDATORY: 2 from hand, 3 from board
    const handCombos = getCombinations(holeCards, 2);
    const boardCombos = getCombinations(
      cleanBoard,
      Math.min(cleanBoard.length, 3),
    );

    let bestHighIndex = -1;
    let bestLowCardValue = 99;

    handCombos.forEach((h) => {
      boardCombos.forEach((b) => {
        const fiveCardHand = [...h, ...b];
        const hStr = evaluateHighStrength(fiveCardHand, isShortDeck);
        const hIdx = strengthOrder.indexOf(hStr);

        if (hIdx > bestHighIndex) {
          bestHighIndex = hIdx;
          highStrength = hStr;
        }

        if (isHiLo && fiveCardHand.length === 5) {
          const lStr = evaluateLowStrength(fiveCardHand);
          if (lStr) {
            const topLowValue = RANKS.indexOf(lStr.split("-")[0]);
            if (topLowValue < bestLowCardValue) {
              bestLowCardValue = topLowValue;
              lowStrength = lStr;
            }
          }
        }
      });
    });
  } else {
    // HOLD'EM / PINEAPPLE / DRAW
    // Can use any combination (usually best 5 of total)
    const allCards = [...holeCards, ...cleanBoard];
    const allCombos = getCombinations(allCards, Math.min(allCards.length, 5));

    let bestHighIndex = -1;
    let bestLowCardValue = 99;

    allCombos.forEach((combo) => {
      const hStr = evaluateHighStrength(combo, isShortDeck);
      const hIdx = strengthOrder.indexOf(hStr);
      if (hIdx > bestHighIndex) {
        bestHighIndex = hIdx;
        highStrength = hStr;
      }

      if (isHiLo) {
        const lStr = evaluateLowStrength(combo);
        if (lStr) {
          const topLowValue = RANKS.indexOf(lStr.split("-")[0]);
          if (topLowValue < bestLowCardValue) {
            bestLowCardValue = topLowValue;
            lowStrength = lStr;
          }
        }
      }
    });
  }

  if (isHiLo && lowStrength) {
    return `${highStrength} & ${lowStrength}`;
  }
  return highStrength;
};
