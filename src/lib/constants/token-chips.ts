/**
 * Visual chip definitions for the token picker.
 *
 * Each chip maps a friendly emoji + label to the actual DB dictionary
 * `category` and `label` the /api/generate endpoint expects.
 *
 * Visual categories (tabs in the picker) group DB categories:
 *   - subject → creature + theme
 *   - style   → style (also surfaced in StyleSelector separately)
 *   - mood    → mood + palette
 *   - extra   → effect + addon
 */

/** Visual tab categories in the token picker */
export type VisualCategory = 'subject' | 'setting' | 'mood' | 'extra'

/** A chip in the token picker UI */
export interface TokenChip {
  /** Unique ID: `${dbCategory}::${label}` */
  id: string
  /** Human-readable label (matches DB DictionaryItem.label) */
  label: string
  /** Emoji shown on the chip */
  emoji: string
  /** Visual category (which tab this appears under) */
  category: VisualCategory
  /** DB dictionary category for API submission */
  dbCategory: string
  /** API field name for /api/generate body */
  apiField: string
  /** Whether this field accepts multiple values */
  isMulti: boolean
}

/** Tab config for the picker */
export interface CategoryTab {
  id: VisualCategory
  label: string
  emoji: string
  /** Tailwind color class for selected chips in this category */
  activeColor: string
  /** Tailwind border color for selected state */
  activeBorder: string
  /** Tailwind bg for selected state */
  activeBg: string
}

export const CATEGORY_TABS: CategoryTab[] = [
  {
    id: 'subject',
    label: 'Subject',
    emoji: '🎭',
    activeColor: 'text-coral-dark',
    activeBorder: 'border-coral',
    activeBg: 'bg-coral/15',
  },
  {
    id: 'setting',
    label: 'Setting',
    emoji: '🌍',
    activeColor: 'text-teal-dark',
    activeBorder: 'border-teal',
    activeBg: 'bg-teal/15',
  },
  {
    id: 'mood',
    label: 'Mood',
    emoji: '✨',
    activeColor: 'text-lavender-dark',
    activeBorder: 'border-lavender',
    activeBg: 'bg-lavender/20',
  },
  {
    id: 'extra',
    label: 'Extra',
    emoji: '🎀',
    activeColor: 'text-golden',
    activeBorder: 'border-golden',
    activeBg: 'bg-golden/15',
  },
]

/**
 * Emoji lookup by DB label.
 * Used to augment dictionary items fetched from the API with emojis.
 * If a label isn't found here, a default emoji is used per category.
 */
export const EMOJI_MAP: Record<string, string> = {
  // Creatures (subject)
  'Axolotl (Pink)': '🦎',
  'Axolotl (Pastel Rainbow)': '🌈',
  'Axolotl (Galaxy)': '🌌',
  'Axolotl (Spooky-Cute Night)': '🎃',
  'Unicorn': '🦄',
  'Puppy': '🐶',
  'Kitten': '🐱',

  // Themes (setting)
  'Pancake Party': '🥞',
  'Magic Cookbook': '📖',
  'Fairy Forest': '🌲',
  'Outer Space': '🚀',
  'Underwater Sparkle': '🌊',
  'Rainbow Winter': '❄️',
  'Cloud Kingdom': '☁️',
  'Neon Playground': '🎮',
  'Sticker Universe': '⭐',
  'Dreamy Bedtime Sky': '🌙',

  // Moods
  'Super Happy': '😄',
  'Happy': '😊',
  'Cozy': '💖',
  'Dreamy': '🌙',
  'Silly': '🤪',
  'Magical': '✨',
  'Sparkly': '💎',
  'Spooky-Cute': '🎃',

  // Palettes (mood tab)
  'Rainbow': '🌈',
  'Pastel Rainbow': '🦋',
  'Neon Rainbow': '💡',
  'Cotton Candy': '🍬',
  'Sunset Glow': '🌅',
  'Ocean Sparkle': '🌊',
  'Galaxy Lights': '🌌',
  'Midnight Glitter': '🌃',
  'Rose Gold Shimmer': '🌹',
  'Icy Winter': '🧊',

  // Effects (extra)
  'Sparkles': '✨',
  'Glitter Dust': '🦠',
  'Star Confetti': '🌟',
  'Heart Confetti': '💕',
  'Rainbow Glow': '🌈',
  'Neon Outline': '💜',
  'Glow Aura': '🔮',
  'Bokeh Lights': '💡',
  'Magic Swirls': '🪄',
  'Twinkling Stars': '⭐',
  'Soft Clouds': '☁️',
  'Sticker Shadow': '🏷️',
  'Confetti Border': '🎊',
  'Glitter Frame': '🖼️',
  'Sparkle Trail': '💫',

  // Addons (extra)
  'Pancakes': '🥞',
  'Cute Face': '😊',
  'Party Hat': '🎉',
  'Bow Ribbon': '🎀',
  'Tiny Crown': '👑',
  'Flower Crown': '🌸',
  'Wings': '🦋',
  'Scarf': '🧣',
  'Sunglasses': '😎',
  'Magic Wand': '🪄',

  // Styles
  'Kawaii Sticker': '🏷️',
  'Storybook': '📚',
  '3D Toy': '🧸',
  'Neon Cartoon': '💡',
  'Watercolor Sparkle': '🎨',
  'Glitter Gel-Pen': '✏️',
  'Kids Game UI': '🎮',
  'Neon Sign': '💜',
  'Magical Postcard': '✉️',
  'Candy-Coated': '🍭',
}

/** Default emoji fallbacks by DB category */
export const DEFAULT_EMOJI: Record<string, string> = {
  creature: '🐾',
  theme: '🏠',
  mood: '😊',
  palette: '🎨',
  effect: '✨',
  addon: '🎁',
  style: '🖌️',
  step: '📝',
  ingredient: '🧪',
  title: '📋',
}

/**
 * Maps a DB dictionary category to a visual tab category
 * and its API field name for the /api/generate body.
 */
export const DB_TO_VISUAL: Record<string, { visual: VisualCategory; apiField: string; isMulti: boolean }> = {
  creature:   { visual: 'subject', apiField: 'creature',    isMulti: false },
  theme:      { visual: 'setting', apiField: 'theme',       isMulti: false },
  mood:       { visual: 'mood',    apiField: 'mood',        isMulti: false },
  palette:    { visual: 'mood',    apiField: 'palette',     isMulti: false },
  effect:     { visual: 'extra',   apiField: 'effects',     isMulti: true },
  addon:      { visual: 'extra',   apiField: 'addons',      isMulti: true },
}

/** Build a TokenChip from a DB dictionary item */
export function dictItemToChip(item: { id: string; category: string; label: string }): TokenChip | null {
  const mapping = DB_TO_VISUAL[item.category]
  if (!mapping) return null

  return {
    id: `${item.category}::${item.label}`,
    label: item.label,
    emoji: EMOJI_MAP[item.label] ?? DEFAULT_EMOJI[item.category] ?? '🔹',
    category: mapping.visual,
    dbCategory: item.category,
    apiField: mapping.apiField,
    isMulti: mapping.isMulti,
  }
}
