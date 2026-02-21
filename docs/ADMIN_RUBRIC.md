# Admin Rubric (Approve / Reject / Edit)

## New word suggestions
Approve only if:
- Meaning is clearly kid-safe
- Hard to twist into unsafe content
- Fits a category

Edit if:
- It’s safe but vague → rewrite **prompt_text** to be specific and kid-safe

Reject if it includes:
- Personal info (names, schools, addresses)
- Violence/weapons/drugs/adult content
- Horror beyond “spooky-cute”

## New preset suggestions
Approve only if:
- Uses allowed categories only
- “Spooky” stays within spooky-cute definition
- Likely produces readable recipe card layout

## Default edit strategy
Kid asks “make it creepy” → convert to:
- label: “Spooky-Cute Night Glow”
- prompt_text: “cozy moonlight, friendly, not scary, stars and sparkles”
