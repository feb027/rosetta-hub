import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
    title: 'Anadromes',
    slug: 'anadromes',
    difficulty: 'easy',
    tags: ['string', 'puzzle'],
    description: `
    An anadrome is a word or phrase that spells a different word or phrase when reversed (e.g., "regal" -> "lager").
    It is a special case of an anagram.
    
    Task:
    Find and display anadrome pairs with more than 6 characters.
    
    Examples:
    - "desserts" <-> "stressed"
    - "gateman" <-> "nametag"
  `,
    rosettaCodeUrl: 'https://rosettacode.org/wiki/Anadromes'
};
