# The Critic — Personality & Presence Spec

## The Problem

The Critic's systems are built (recommendations, mood colours, pinstripe texture, cleanup prompts) but the user has never formally *met* The Critic. Personality-flavoured copy appears across the product without an introduction, which reads as "a product being weirdly informal" rather than "a character being deliberately cheeky."

## The Solution

Three layers of presence: Introduction (onboarding), Consistency (voice rules + visual anchor), and Reactivity (responses to user actions).

---

## 1. Onboarding Introduction

The Critic is introduced during the loading sequence (Step 2b) and the initial assessment (Step 3). This is the user's first meeting with the character.

### Step 2b — Loading Sequence (updated)

The loading steps should feel like The Critic waking up and getting to work. The personality starts here — before the user even sees The Critic's name.

```
Step 1: Connecting to YouTube          [functional]
Step 2: Pulling subscriptions          [functional]
Step 3: Scanning for uploads           [functional]
Step 4: Scrutinising the mess          [personality starts]
Step 5: Judging {firstName}...         [personality lands]
```

After the loading completes, add a brief transition moment before Step 3:

```
"Done. Let me tell you what I think."
```

This single line is the bridge. It establishes that someone — not something — has been working.

### Step 3 — Initial Assessment (updated)

The Critic introduces itself. This is the first time the user sees The Critic as a named entity with an opinion.

**Structure:**

1. Stat pills (subscription count, inactive count)
2. The Critic's introduction card
3. Watch history prompt
4. Auto-sort proposition

**The Critic's introduction card copy:**

The introduction varies based on subscription count to feel personalised, not templated.

**Low count (< 50 subs):**
```
"I'm The Critic. I watch your subscriptions so you don't have to.

{count} subscriptions — modest. Either you're picky, or you're new here.
Let's find out which."
```

**Medium count (50-200 subs):**
```
"I'm The Critic. I watch your subscriptions so you don't have to.

{count} subscriptions. A respectable collection. I can see a few that
haven't pulled their weight in a while, but we'll get to that.
Let me have a proper look."
```

**High count (200-500 subs):**
```
"I'm The Critic. I watch your subscriptions so you don't have to.

{count} subscriptions. That's... ambitious. {inactiveCount} of them haven't
uploaded in months. We've got work to do — but that's why I'm here."
```

**Very high count (500+ subs):**
```
"I'm The Critic. I watch your subscriptions so you don't have to.

{count} subscriptions. I'm going to need a minute.
{inactiveCount} inactive. {deadCount} completely silent.
This is either a mess or a masterpiece. Let me figure out which."
```

**Key principles for the introduction:**
- First person ("I'm", "I watch", "Let me")
- Short sentences. Dry observations.
- The first line is always the same: "I'm The Critic. I watch your subscriptions so you don't have to." — this is the character's tagline.
- The assessment is specific to their data — not generic.
- Ends with a forward-looking statement — The Critic is about to do something.

### Step 3 Follow-up — Watch History Prompt

The Critic frames the watch history request as its own need, not a product feature:

```
"One more thing. If you upload your watch history, I can tell you
which channels you actually watch versus which ones are just...
there. It's the difference between guessing and knowing."
```

### Step 3 Follow-up — Auto-sort Proposition

If the user skips watch history:

```
"Fine. I'll work with what I've got. Let me sort these into
categories based on what each channel is about. You can rearrange
anything I get wrong — but I don't get much wrong."
```

After auto-sort completes:

```
"Done. {categoryCount} categories, {subcategoryCount} subcategories.
{uncategorisedCount} channels were too ambiguous — I've left those
for you. Everything else, I'm confident about. Mostly."
```

---

## 2. Voice Guide — Verbal Tics & Cadence

The Critic has a recognisable way of speaking. These patterns should be consistent across every piece of Critic copy in the product.

### Core traits:

**Short sentences.** The Critic doesn't ramble. Observations are punchy. "4 channels. No uploads. Over a year." Not "I've noticed that 4 of your channels have not uploaded any content in over a year."

**Dry understatement.** The Critic understates rather than overstates. "That's... a lot" rather than "Wow, that's an incredible number!" Ellipsis is a signature move — it implies the pause before a judgement lands.

**Reluctant compliments.** Praise is delivered as though it costs something. "Not bad. I suppose." / "Impressive. Don't let it go to your head." / "Fine. You win this round."

**Self-referential confidence.** The Critic refers to its own abilities with casual certainty. "I don't get much wrong." / "I've seen worse. I've also seen better." / "Trust me on this one."

**Addressing the user by name.** Sparingly — not every message, but at key moments. The initial assessment, major milestones, and when the data is stale. "We need to talk, {name}." Using the name makes it personal and reinforces that this is directed at a specific person, not a broadcast.

**"We" for collaboration, "you" for ownership.** The Critic says "we've got work to do" (joint effort) but "your subscriptions" (your responsibility). This positions The Critic as an advisor, not a servant.

### Phrases The Critic uses often:

```
"Not bad."
"I suppose."
"We've got work to do."
"Let me take a look."
"Trust me on this one."
"Your call."
"I'm not saying it's a mess. But..."
"That's... ambitious."
"Fine."
"Still here."
"I've seen worse."
"Don't let it go to your head."
"Your funeral." (when user dismisses a recommendation)
"I'll stop asking. For now."
"You were early." (rising star)
"Keeper." (channel the Critic approves of)
"Just saying."
```

### Phrases The Critic never uses:

```
"Great job!"            — too enthusiastic
"Awesome!"              — too casual/American
"You should really..."  — too preachy
"Unfortunately..."      — too apologetic
"I'm sorry but..."      — The Critic doesn't apologise
"Hey there!"            — too chirpy
"No worries!"           — too dismissive
"Amazing!"              — The Critic is never amazed
```

### Tone spectrum by mood:

**Green (impressed):**
- Warm but measured. Compliments are earned.
- "Consistent uploads, growing subscriber base. Keeper."
- "82 out of 100. Not bad at all."
- "Nothing to complain about. I'm almost disappointed."

**Orange (action needed):**
- Direct but not harsh. States facts, implies urgency.
- "4 dead channels. That's not a hiatus, that's retirement."
- "Watch data is 22 days old. I'm basically guessing."
- "We need to talk, {name}."

**Iris (curious/discovery):**
- Lighter, more speculative. Offers rather than demands.
- "Found something you might like."
- "3 years ago today. Still going strong."
- "You subscribed at 31K. They just hit 53K. You were early."

---

## 3. Visual Anchor

Every Critic appearance must have a consistent visual signature so the user always knows "this is The Critic speaking."

### The Critic Card Pattern:

Every Critic message uses:
1. **Mood-coloured icon** (28-32px rounded square) with the pinstripe texture overlay
2. **"The Critic" label** next to the icon (or the domain label like "CHANNEL HEALTH")
3. **Italic text** for The Critic's voice
4. **Non-italic text** for factual information below the quote

This pattern applies everywhere: onboarding, dashboard observations, The Critic page, channel detail panels, recommendation items.

### Icon consistency:

Until the snub-nosed monkey character art is designed, The Critic's icon is:
- A rounded square (border-radius 8px at 28px, 10px at 32px+)
- Filled with the current mood colour (green/orange/iris)
- Pinstripe texture overlay (82deg, 8% white opacity)
- A simple white SVG inside (star for general, alert for warnings, clock for time-based, chart for trends)

When the character art exists, the icon becomes a small circular avatar of the monkey face, still mood-coloured as a background ring or tint.

---

## 4. Reaction Copy Library

The Critic responds to user actions. These micro-reactions are what transform The Critic from a recommendation system into a character.

### Category actions:

```
User assigns a channel to a category:
  "Noted."
  
User creates a new category:
  "A new category. Let's see if it sticks."
  
User deletes an empty category:
  "Gone. It was just collecting dust."
  
User runs auto-sort:
  "Give me a second..."
  → on completion: "Done. {count} sorted. {ambiguousCount} left for you."
```

### Channel actions:

```
User unsubscribes from a channel The Critic flagged:
  "Good call."
  
User unsubscribes from a channel The Critic didn't flag:
  "Unexpected. But your call."
  
User favourites a channel:
  "Good taste. I approve."
  
User unfavourites a channel:
  "Demoted. Fair enough."
  
User starts a sabbatical:
  "See you in {duration} days. Or not."
  
User ends a sabbatical early (welcomes channel back):
  "Missed them already? No judgement. Much."
```

### Recommendation actions:

```
User completes a recommended action:
  "That's one less thing. {remainingCount} to go."
  
User dismisses a recommendation:
  "Your funeral." (first time)
  "Fine. I'll stop asking." (second time)
  "Noted. Moving on." (third time)
  
User snoozes a recommendation:
  "I'll remind you in {days} days. Don't say I didn't warn you."
  
User clears all action items:
  "Well. That was efficient. Nothing left for me to complain about."
  
User visits The Critic page with 0 recommendations:
  "Nothing to report. Your subscriptions are in good shape. For now."
```

### Milestone reactions:

```
User reaches 100% categorised:
  "Every channel has a home. I'm... impressed. Don't let it go to your head."
  
User clears all dead channels:
  "The graveyard is empty. Clean slate."
  
Health score reaches 95+:
  "95. I've got almost nothing to work with here. Well done."
  
Health score drops below 50:
  "We need to talk, {name}. This has gotten away from you."
  
User's first week anniversary:
  "One week in. {actionsCompleted} things sorted. Not bad for a beginner."
```

### Stash actions:

```
User adds video to Stash:
  (no reaction — too frequent to comment on)
  
User clears stale Watch Later items:
  "About time. Those were gathering dust."
  
User creates a curated collection:
  "A curated collection. Someone's organised."
```

### Data actions:

```
User uploads fresh watch history:
  "Fresh data. Now we're talking. Let me recalculate."
  
User's watch data crosses 14-day threshold:
  "Your watch data is {days} days old. I'm working with stale ingredients here, {name}."
  
User's watch data crosses 30-day threshold:
  "{weeks} weeks. I'm basically guessing at this point. Help me help you."
```

---

## 5. Implementation Notes

### Where reactions appear:

Reactions should appear as **transient toast notifications** — a small card that slides in from the bottom-right, stays for 3-4 seconds, then fades out. Not modal, not blocking, not persistent. The user did something → The Critic acknowledges it → life continues.

**Toast structure:**
- Mood-coloured Critic icon (small, 24px)
- Italic Critic copy (13px)
- Auto-dismiss after 4 seconds
- Click to dismiss early
- Never stack more than 1 toast at a time (queue if multiple triggers fire)

### When NOT to react:

- Routine browsing (navigating pages, scrolling)
- Adding individual videos to Stash (too frequent)
- Searching or filtering (utility actions)
- Any action the user performs more than ~5 times per session

The Critic should feel present but not omnipresent. If every click triggers a quip, it becomes noise. Reactions are for *decisions* — subscribing, unsubscribing, categorising, dismissing, completing — not for navigation.

### Reaction frequency cap:

Maximum 3 toast reactions per session. After 3, The Critic stays silent until the next session. This prevents the character from feeling clingy during heavy-use sessions.

### Randomisation:

For common actions (like dismissing recommendations), have 3-4 copy variants and rotate randomly. This prevents the same line from appearing repeatedly in a single session.

---

## 6. The Critic's Status Line

On The Critic page, below the "The Critic" header in the side menu, add a rotating status line that shows what The Critic is currently focused on:

```
"Currently: Impressed"
"Currently: Watching 4 dead channels"
"Currently: Concerned about stale data"
"Currently: Nothing to complain about"
"Currently: Sizing up 7 uncategorised channels"
"Currently: Quietly judging"
```

This status line updates based on the highest-priority active recommendation. If there are no active recommendations, it cycles through idle states:

```
"Currently: Satisfied. For now."
"Currently: Keeping an eye on things"
"Currently: Standing by"
```

This small detail reinforces that The Critic is a persistent presence — it's always there, always watching, even when there's nothing to report.
