import 'server-only'
import { prisma } from './db'
import { SAFETY_SUFFIX, SPOOKY_CUTE_EXTRA } from './constants'
import { DictionaryCategory } from '@prisma/client'

const SPOOKY_TAGS = ['spooky', 'spooky-cute', 'halloween', 'ghost']

interface TokenSelection {
  palette: string
  style: string
  theme: string
  mood: string
  title?: string
  creature?: string
  effects?: string[]
  addons?: string[]
  steps?: string[]
  ingredients?: string[]
}

interface BuildResult {
  composedPrompt: string
  tokenIds: Record<string, string | string[]>
}

async function resolveToken(
  category: DictionaryCategory,
  label: string
): Promise<{ promptText: string; tags: string[] }> {
  const item = await prisma.dictionaryItem.findFirst({
    where: { category, label, isActive: true },
    select: { promptText: true, tags: true },
  })

  if (!item) {
    throw new Error(`Unknown ${category} token: "${label}"`)
  }

  return item
}

export async function buildPrompt(
  tokens: TokenSelection
): Promise<BuildResult> {
  const fragments: string[] = []
  const allTags: string[] = []

  // Required single tokens
  for (const [category, label] of [
    ['palette', tokens.palette],
    ['style', tokens.style],
    ['theme', tokens.theme],
    ['mood', tokens.mood],
  ] as const) {
    const item = await resolveToken(category, label)
    fragments.push(item.promptText)
    allTags.push(...item.tags)
  }

  // Optional single tokens
  if (tokens.title) {
    const item = await resolveToken('title', tokens.title)
    fragments.push(item.promptText)
    allTags.push(...item.tags)
  }

  if (tokens.creature) {
    const item = await resolveToken('creature', tokens.creature)
    fragments.push(item.promptText)
    allTags.push(...item.tags)
  }

  // Optional array tokens
  const arrayFields: { category: DictionaryCategory; values?: string[] }[] = [
    { category: 'effect', values: tokens.effects },
    { category: 'addon', values: tokens.addons },
    { category: 'step', values: tokens.steps },
    { category: 'ingredient', values: tokens.ingredients },
  ]

  for (const { category, values } of arrayFields) {
    if (!values) continue
    for (const label of values) {
      const item = await resolveToken(category, label)
      fragments.push(item.promptText)
      allTags.push(...item.tags)
    }
  }

  // Append safety suffix (always)
  fragments.push(SAFETY_SUFFIX)

  // Append spooky-cute guardrail if any spooky tags detected
  const hasSpooky = allTags.some((tag) =>
    SPOOKY_TAGS.includes(tag.toLowerCase())
  )
  if (hasSpooky) {
    fragments.push(SPOOKY_CUTE_EXTRA)
  }

  const tokenIds: Record<string, string | string[]> = {
    palette: tokens.palette,
    style: tokens.style,
    theme: tokens.theme,
    mood: tokens.mood,
  }
  if (tokens.title) tokenIds.title = tokens.title
  if (tokens.creature) tokenIds.creature = tokens.creature
  if (tokens.effects) tokenIds.effects = tokens.effects
  if (tokens.addons) tokenIds.addons = tokens.addons
  if (tokens.steps) tokenIds.steps = tokens.steps
  if (tokens.ingredients) tokenIds.ingredients = tokens.ingredients

  return {
    composedPrompt: fragments.join(', '),
    tokenIds,
  }
}
