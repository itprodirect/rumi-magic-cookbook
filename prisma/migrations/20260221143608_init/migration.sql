-- CreateEnum
CREATE TYPE "DictionaryCategory" AS ENUM ('palette', 'style', 'effect', 'addon', 'theme', 'mood', 'step', 'title', 'creature', 'ingredient');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "dictionary_items" (
    "id" TEXT NOT NULL,
    "category" "DictionaryCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "prompt_text" TEXT NOT NULL,
    "tags" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dictionary_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "token_ids" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_requests" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "token_ids" JSONB NOT NULL,
    "composed_prompt" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "image_data" TEXT,
    "moderation_input" JSONB,
    "moderation_output" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "generation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestions" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "category" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dictionary_items_category_label_key" ON "dictionary_items"("category", "label");

-- CreateIndex
CREATE UNIQUE INDEX "presets_name_key" ON "presets"("name");
