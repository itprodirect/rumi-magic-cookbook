import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient, DictionaryCategory } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import fs from 'node:fs'
import path from 'node:path'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const CATEGORY_FILES: { category: DictionaryCategory; file: string }[] = [
  { category: 'palette', file: 'palettes.json' },
  { category: 'style', file: 'styles.json' },
  { category: 'effect', file: 'effects.json' },
  { category: 'addon', file: 'addons.json' },
  { category: 'theme', file: 'themes.json' },
  { category: 'mood', file: 'moods.json' },
  { category: 'step', file: 'steps.json' },
  { category: 'title', file: 'titles.json' },
  { category: 'creature', file: 'creatures.json' },
  { category: 'ingredient', file: 'ingredients.json' },
]

interface DictionaryEntry {
  label: string
  prompt_text: string
  tags: string[]
}

interface PresetEntry {
  name: string
  description: string
  token_ids: Record<string, string | string[]>
}

async function main() {
  const contentDir = path.join(__dirname, '..', 'content')

  let dictionaryCount = 0

  for (const { category, file } of CATEGORY_FILES) {
    const filePath = path.join(contentDir, file)
    const items: DictionaryEntry[] = JSON.parse(
      fs.readFileSync(filePath, 'utf-8')
    )

    for (const item of items) {
      await prisma.dictionaryItem.upsert({
        where: {
          category_label: { category, label: item.label },
        },
        update: {
          promptText: item.prompt_text,
          tags: item.tags,
          isActive: true,
        },
        create: {
          category,
          label: item.label,
          promptText: item.prompt_text,
          tags: item.tags,
        },
      })
      dictionaryCount++
    }
  }

  const presetsPath = path.join(contentDir, 'presets.json')
  const presets: PresetEntry[] = JSON.parse(
    fs.readFileSync(presetsPath, 'utf-8')
  )

  let presetCount = 0

  for (const preset of presets) {
    await prisma.preset.upsert({
      where: { name: preset.name },
      update: {
        description: preset.description,
        tokenIds: preset.token_ids,
        isActive: true,
      },
      create: {
        name: preset.name,
        description: preset.description,
        tokenIds: preset.token_ids,
      },
    })
    presetCount++
  }

  console.log(`Seeded ${dictionaryCount} dictionary items, ${presetCount} presets`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
