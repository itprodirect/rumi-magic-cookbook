# Data Model (MVP)

## Suggested tables (Postgres)

### dictionary_items
- id (uuid)
- category (palette|style|effect|addon|theme|mood|step|title|creature|ingredient)
- label (kid-facing)
- prompt_text (model-facing)
- tags (text[])
- is_active (bool)

### presets
- id
- name
- description
- token_ids (json)
- is_active

### generation_requests
- id
- device_id (uuid string from localStorage)
- token_ids (json)
- recipe (json: title, ingredients[], steps[])
- status (pending|approved|rejected)
- image_data (base64) OR image_url
- moderation_input (json summary)
- moderation_output (json summary)
- created_at, reviewed_at

### suggestions
- id
- device_id
- category (optional)
- phrase
- note (optional)
- status (pending|approved|rejected)
- created_at, reviewed_at

## Retention rules
- rejected: delete image immediately
- pending: delete after 7 days (cron/queue)
- approved: parent-managed
