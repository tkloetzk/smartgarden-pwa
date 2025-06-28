// In: src/data/visualCues.ts

import { GrowthStage } from "@/types/core";

/**
 * A knowledge base of visual cues for identifying plant growth stages.
 * This data is synthesized from expert gardening guides and botanical resources
 * to help users accurately identify when their plants transition to the next stage.
 */
export const visualCues: Record<
  string,
  Partial<Record<GrowthStage, string[]>>
> = {
  // --- Root Vegetables ---
  "Little Finger Carrots": {
    seedling: [
      "First feathery, fern-like true leaves appear after the initial grass-like cotyledons.",
      "True leaves are delicate and deeply divided with a lacy appearance.",
      "Plant reaches 1-2 inches tall with pronounced carrot-like foliage.",
    ],
    vegetative: [
      "Foliage grows to 8-10 inches tall with a deepening green color.",
      "Multiple sets of feathery leaves develop, creating a robust, bushy appearance.",
      "Leaf production slows as the plant channels energy to the root underground.",
    ],
    maturation: [
      "Carrot shoulders (top of the root) begin to show at the soil surface.",
      "Roots reach their mature size of 3-4 inches in length and 1/2 inch in diameter.",
      "Foliage is lush, bushy, and about 10-12 inches tall.",
    ],
  },
  "Detroit Dark Red Beets": {
    vegetative: [
      "The first true leaves emerge, which are broader and more rounded than the initial cotyledons.",
      "True leaves display characteristic red-purple stems and prominent red veining.",
      "Leaves progressively cover more ground area as the plant establishes its rosette.",
    ],
    maturation: [
      "Beetroot shoulders begin swelling and become visible above the soil surface.",
      "The root reaches its mature size, typically between golf ball and tennis ball size (1.5-3 inches).",
      "Outer leaves may begin to show slight yellowing as the root reaches full maturity.",
    ],
  },
  "Stuttgarter Onions": {
    seedling: [
      "Thin, grass-like shoots develop into hollow, tubular leaves.",
      "The plant is established when it has 4-6 strong, upright green leaves.",
    ],
    vegetative: [
      "Rapid leaf growth occurs, with the plant developing 8-10 flourishing leaves.",
      "Leaves become notably thicker and more robust; the base remains thin like a pencil.",
    ],
    maturation: [
      "Bulbing is triggered by 14+ hours of daily light, causing the base to swell noticeably.",
      "The neck of the onion thickens and the top of the bulb may become visible at the soil line.",
      "Harvest is indicated when tops begin to yellow and about 10-50% of them have fallen over.",
    ],
  },
  "White Sweet Spanish Onions": {
    seedling: [
      "Thin, grass-like shoots develop into hollow, tubular leaves.",
      "The plant is established when it has 4-6 strong, upright green leaves.",
    ],
    vegetative: [
      "Rapid leaf growth occurs, with the plant developing 8-10 flourishing leaves.",
      "Leaves become notably thicker and more robust; the base remains thin like a pencil.",
    ],
    maturation: [
      "Bulbing is triggered by 14+ hours of daily light, causing the base to swell noticeably.",
      "The neck of the onion thickens and the top of the bulb may become visible at the soil line.",
      "Harvest is indicated when tops begin to yellow and about 10-50% of them have fallen over.",
    ],
  },
  "Beauregard Sweet Potatoes": {
    vegetative: [
      "Slips develop heart-shaped leaves and establish a fibrous root system.",
      "After a period of slow growth, vines begin to spread rapidly, reaching 6-12 feet with dense foliage.",
    ],
    maturation: [
      "There are no reliable above-ground indicators of tuber size; timing is based on days from planting (90-120 days).",
      "Vine growth slows and eventually stops as energy is sent to the storage roots.",
      "Old leaves may begin to yellow and fall off.",
    ],
  },
  // --- Leafy Greens ---
  "Astro Arugula": {
    seedling: [
      "Rounded, slightly indented cotyledons appear first.",
      "The first true leaves emerge; they are elongated and initially have smooth edges, unlike mature leaves.",
    ],
    vegetative: [
      "Leaves transform from smooth to pinnately lobed, with 4-10 distinctive lobes developing.",
      "The plant forms a rosette pattern and the color deepens to a darker green.",
      "Harvest can begin when leaves are 2-4 inches long, around 3 weeks from planting.",
    ],
  },
  "Baby's Leaf Spinach": {
    seedling: [
      "Rounded cotyledons emerge, followed by spade-shaped true leaves that are initially smooth-edged.",
      "The plant begins rapid root and shoot growth.",
    ],
    vegetative: [
      "A loose rosette formation with 6-12 leaves per plant develops.",
      "Leaves are bright green, tender, and ready for 'baby leaf' harvest when 2-4 inches long.",
    ],
  },
  "May Queen Lettuce": {
    seedling: [
      "Rounded cotyledons emerge, followed by smaller versions of the wavy, soft-textured mature leaves.",
    ],
    vegetative: [
      "An open, symmetric rosette of 8-15 smooth-edged leaves develops.",
      "Leaves begin to show their characteristic soft, buttery texture.",
    ],
    maturation: [
      "Center leaves begin to cup inward slightly while outer leaves become more horizontal.",
      "A color difference appears, with darker outer leaves and lighter inner leaves.",
      "The head is mature when it feels solid when gently squeezed.",
    ],
  },
  // --- Vining Plants ---
  "Boston Pickling Cucumber": {
    vegetative: [
      "True leaves emerge, which are serrated, rough, and distinctly cucumber-like.",
      "Vines begin to develop side shoots and tendrils for climbing after 6 nodes.",
    ],
    flowering: [
      "Small yellow flower buds appear 4-6 weeks after planting.",
      "Male flowers appear first on slender stems; female flowers appear later with a tiny cucumber at their base.",
    ],
    fruiting: [
      "After pollination, the tiny cucumber at the base of the female flower begins to swell.",
      "Harvest when fruits are firm, uniformly green, and 3-6 inches long.",
    ],
  },
  "Sugar Snap Peas": {
    seedling: [
      "The first shoot (epicotyl) emerges from the soil in a loop, as cotyledons remain underground.",
    ],
    vegetative: [
      "Compound leaves with 1-3 pairs of leaflets plus tendrils for climbing develop.",
      "Provide climbing support as soon as tendrils appear, as this signals the start of the active vining phase.",
    ],
    flowering: [
      "White, pink, or purple self-pollinating flowers emerge from the leaf axils.",
      "This typically occurs when plants are 2-6 feet tall.",
    ],
    fruiting: [
      "After flowers fade, a tiny, flat pod becomes visible.",
      "Harvest when pods are plump with visible pea outlines but are still bright green and crisp.",
    ],
  },
  // --- Berries & Specialty Crops ---
  "Day-Neutral Strawberries": {
    vegetative: [
      "New crown leaves emerge from the center of the plant, transitioning from pale to deep green.",
      "The crown diameter increases as 5-6 fully expanded leaves develop.",
      "Remove all flowers for the first 4-6 weeks to encourage strong plant establishment.",
    ],
    flowering: [
      "Small white flower buds emerge from the crown center on stems rising above the foliage.",
      "Unlike standard strawberries, these will flower regardless of day length once mature.",
    ],
    fruiting: [
      "After the 5-petaled white flowers are pollinated, they develop into small green berries that gradually turn red.",
    ],
  },
  "Caroline Raspberries": {
    vegetative: [
      "New primocanes (first-year canes) emerge as bright green shoots.",
      "These canes develop alternating leaves and thorns along their length.",
    ],
    flowering: [
      "Flower buds develop at the terminal ends of the primocanes (the current year's growth).",
      "Flowers appear in clusters of 3-7. This variety does not require a cold period to flower.",
    ],
  },
  "Rasmus Broccoli": {
    seedling: [
      "Thick, blue-green cotyledons emerge, followed by lobed true leaves with a characteristic broccoli appearance.",
    ],
    vegetative: [
      "The plant develops a large, upright structure with a thick central stalk and large, grayish-green leaves.",
    ],
    maturation: [
      "A tiny, button-like head (pea-sized to quarter-sized) begins to form deep in the center of the plant's top leaves.",
      "The head is ready to harvest when it is 6-8 inches in diameter, firm, and the buds are tightly packed and uniformly green.",
    ],
  },
  // --- Herbs ---
  "Greek Oregano": {
    vegetative: [
      "The plant becomes bushier with characteristic small, hairy, oval-shaped leaves and square stems.",
      "Essential oil content and flavor peak just before the plant begins to flower.",
    ],
  },
  "English Thyme": {
    vegetative: [
      "The plant develops into a dense, cushion-like appearance with small, gray-green, needle-like leaves that have white undersides.",
      "Aromatic intensity is at its peak just before flowering begins.",
    ],
  },
  "Greek Dwarf Basil": {
    vegetative: [
      "The plant forms a compact, dense, globe-like mound 6-8 inches tall with small, serrated leaves.",
      "Essential oil production and the characteristic spicy-anise fragrance peak just before the plant flowers.",
    ],
    flowering: [
      "The first sign is a change in the growth at the stem tips, forming a dense, cross-like pattern of new leaves.",
      "A flower stalk will begin to elongate from this point; pinch it off to prolong vegetative growth.",
    ],
  },
};
