# 100 Prisoners Problem

## Overview
The 100 Prisoners problem is a fascinating probability puzzle that demonstrates the power of strategy over random chance.

## The Problem
- 100 prisoners numbered 1-100
- 100 drawers with cards numbered 1-100 (randomly shuffled)
- Each prisoner can open 50 drawers
- If ALL prisoners find their number, they're pardoned
- If ANY prisoner fails, all are sentenced

## Strategies

### Random Strategy
- Each prisoner randomly selects 50 drawers
- Success probability: (1/2)^100 ≈ 0%
- Completely impractical

### Optimal Strategy (Follow the Loop)
- Each prisoner starts at drawer matching their number
- Follow the card numbers like a linked list
- Success probability: ~31.18%
- **Over 1 trillion times better than random!**

## Why It Works

The key insight is **permutation cycles**:

1. The drawer-card arrangement forms cycles
2. When following your number, you traverse a cycle
3. You succeed if your cycle length ≤ 50
4. All prisoners in the same cycle succeed together
5. Failure only occurs if there's a cycle > 50

The probability that no cycle exceeds 50 in a random permutation of 100 elements is:

```
1 - (1/51 + 1/52 + ... + 1/100) ≈ 0.3118 or 31.18%
```

## Visualization Features

Our interactive visualization shows:

- **Adjustable prisoner count** (5-20 for clarity)
- **Both strategies** (optimal vs random)
- **Step-by-step animation** showing each drawer opening
- **Real-time statistics** tracking success rates
- **Color-coded drawers**:
  - Cyan: Currently being opened
  - Blue: Previously opened
  - Green: Found the matching card!
  - Gray: Unopened

## Educational Value

This problem teaches:
- The power of mathematical strategy
- Permutation cycle theory
- Probability and combinatorics
- How cooperation and strategy can dramatically improve outcomes

## References

- [Rosetta Code: 100 Prisoners](https://rosettacode.org/wiki/100_prisoners)
- [Wikipedia: 100 Prisoners Problem](https://en.wikipedia.org/wiki/100_prisoners_problem)
- [Numberphile Video](https://www.youtube.com/watch?v=iSNsgj1OCLA)
