# Subscrub Taxonomy & Architecture Design Document

## Purpose

This document captures the architectural principles and design decisions that emerged from the taxonomy rebuild conversation. It is not an implementation prompt. It is a reference document to anchor future decisions, ensure consistency as the product evolves, and provide context for anyone (including future-you) working on subscrub.

Read this before making significant changes to the taxonomy, the tagging system, the vibe architecture, or the discovery mechanics. If a proposed change conflicts with the principles here, either the principle needs revisiting or the change needs reconsidering.

---

## Product Identity

### What subscrub is

Subscrub is a tool for people who already have YouTube subscriptions and want to live with them differently. It does not compete with YouTube for content, attention, or consumption. It sits between the user and YouTube, helping them find the right thing at the right moment without the friction of searching, scrolling, or being algorithmically redirected.

The core promise: **open subscrub, pick your vibe, see what fits.** The search-and-scroll loop that dominates most YouTube use disappears. The user is in a specific mood or context, the product matches their library to that context, and they watch something that actually fits. No guessing, no compromise, no endless browsing.

### Who it is for

The primary audience is people with ADHD-adjacent consumption patterns — large, intentionally messy libraries built up over years, wide-ranging interests that shift in waves, frustration with algorithmic feeds that don't respect their actual intent. People who subscribe to channels "just in case" and don't want to prune their library, but also don't want to see every single new upload from every channel every time they open YouTube.

The broader audience is anyone with more than a handful of subscriptions who feels the friction of finding something to watch. The ADHD framing is the beachhead, not the limit.

### What subscrub is not

Subscrub is not a content platform. It hosts nothing, streams nothing, and monetises nothing about the videos themselves.

Subscrub is not a recommendation engine. It organises what the user already owns rather than predicting what they might want from a catalogue of millions.

Subscrub is not a replacement for YouTube. Users still watch videos on YouTube. Subscrub is the navigation layer — the way they decide what to watch.

Subscrub is not an algorithm in the engagement-maximising sense. It does not try to keep users watching longer, click more videos, or develop new habits of consumption. Its job is to reduce the friction of finding the right thing, which often means the user watches less and enjoys it more.

### The moving company metaphor

Subscrub is a moving company. YouTube is your old home. Your subscriptions and the content within them are your belongings. The belongings stay the same — subscrub doesn't change what you own. Subscrub is your new home, designed to help you live better with the belongings you already have.

This metaphor shapes several product decisions:
- The user's library is sacred. Subscrub never removes or hides channels without explicit action from the user.
- Organisation is a service, not a judgement. The product helps users live with their choices, not correct them.
- The existing investment matters. Users who have spent years building a library should feel that history is respected, not erased.
- Home-making is aspirational. Organising your stuff into a home you love is a positive act, not a chore to be minimised.

---

## Architectural Principles

### The four-layer model

Every video in subscrub is classified along four independent dimensions:

**Layer 1: Primary topical category (required)**

Every video has exactly one primary home — the top-level category that best describes what the content is fundamentally about. This is the channel's main identity translated to video level.

**Layer 2: Secondary topical categories (optional, 0-3)**

A video may also belong meaningfully to other categories. A comedy channel's occasional music content might primary-home in Comedy but secondary-assign to Music. Users browsing Music will find it; the primary Comedy home isn't diluted.

**Layer 3: Cross-cutting tags (multiple, independent)**

These describe the video without being tied to any single category:
- **Format tags**: podcast, documentary, tutorial, vlog, video essay, live stream, short, reaction, interview, explainer
- **Angle tags**: news, review, commentary, analysis, opinion, walkthrough
- **Topic tags**: specific subjects like "true crime", "ancient history", "space exploration", "F1", "conspiracy theories"
- **User tags**: personal keywords added by individual users to their own library

Tags compose freely. A video can have any combination from any tag type.

**Layer 4: Quantitative attributes (automatic)**

- Duration (length bucket: short, quick, medium, long, extended)
- Energy (derived from length + content type)
- Format attributes (live, premiere, standard, shorts)

These are measured directly from video metadata rather than inferred from content.

### Cross-referencing via tags

Categories do not *own* content exclusively. They *reference* content via tags. A single video can be discoverable from multiple navigation paths:

- Its primary category's subcategory tree
- Any secondary category assignments
- Aggregator views built on format tags (all podcasts, all documentaries)
- Aggregator views built on angle tags (all news content across categories)
- Topic-based vibes (all true crime content across formats)
- User-created vibes combining multiple filters

The same underlying video is reachable through many paths without being duplicated. This is the core mechanism that makes subscrub flexible enough to match any user's mental model of their library.

### Format and angle as cross-cutting, not top-level

Podcasts, documentaries, news, and tutorials are not top-level categories even though they are highly valuable content types. They are **formats and angles** that compose with topical categories.

A comedy podcast is primarily Comedy. A sports podcast is primarily Sports. A philosophy podcast is primarily Education. The "podcast" format is a shared characteristic that cuts across these primary homes.

This means:
- Users in a podcast-seeking mood can filter by the podcast format tag across all categories
- Users in a comedy-seeking mood can filter by the Comedy category regardless of format
- Users in a "comedy podcast" mood can combine both filters

The UI should elevate high-value formats (podcasts especially) to prominent filter options in the vibe builder, even though they are not top-level categories structurally. Prominence in the interface is independent from structural position in the taxonomy.

### Topical categories as primary homes

Top-level categories represent distinct **consumption moods** — the mental states in which users approach content. Two channels with similar topics but different moods should live in different categories if the mood is meaningfully different.

Example: Chris Williamson (self-improvement podcast, aspirational mood) and Alex O'Connor (philosophy discussion, intellectual mood) both involve "talking about ideas," but the consumption mood is different. Self-improvement is about applying frameworks to one's own life. Philosophy is about engaging with ideas for their own sake. These belong in different top-level categories (Health & Wellbeing and Education respectively).

### Reduce research, enable doing

This is a first-class design principle for subscrub, not an optimisation to pursue if convenient.

ADHD consumption and project behaviour follows a specific loop: initial excitement triggers hyperfocus on research, research consumes the motivated energy window, the window closes before the actual work begins, the project is abandoned. The cost is money spent on gear never used, time lost to research that never informs action, and eroded self-worth from repeated project failure.

Every friction point that sits between "I want to do this" and "I am doing this" is a potential window-closer. Research friction is the most common and most insidious because research feels productive. It isn't — for ADHD users, research beyond what's strictly necessary is usually the thing that kills the project.

Subscrub addresses this principle through two distinct but complementary mechanisms:

**Vibes handle mood-based consumption.** When a user wants something to watch right now for their current context, vibes deliver precise matches quickly. The friction of "what should I watch?" is collapsed into a single tap. This serves the short-term window — the user gets what they need for this session and moves on.

**Stash curated collections handle project-based research.** When a user has an ongoing interest or project that requires a body of content over time (learning a skill, pursuing a hyperfocus topic, building expertise), curated collections are the right tool. The collection is built deliberately using detailed filters, persists across sessions, and grows as the user's project develops. This serves the longer-term window — the user builds the resource once and returns to it as needed, without repeating research each time.

The two mechanisms serve different use cases but share the same underlying goal: ensuring that the user's limited motivated-energy windows are spent on the actual work they care about, not on the meta-work of finding what to work on.

**Specific design implications:**

**Vibe precision matters because imprecise vibe results force more research.** A vibe that returns "50 videos that kind of fit" requires the user to evaluate each one. A vibe that returns "5 videos that genuinely fit" gives the user what they need and returns them to doing. Fewer results, higher precision, less research.

**Default vibes should deliver value without construction.** Users shouldn't have to build a vibe to get the benefit of vibes. The product ships with defaults that cover common use cases, and those defaults are actively useful on day one. Building custom vibes is for refinement, not for initial value.

**Curated collections should support detailed filtering that goes beyond what vibes need.** Collections serve project-oriented research where the user genuinely wants fine-grained control. Filter dimensions that would overwhelm a vibe builder are appropriate in a collection builder because the collection is built once and reused.

**Vibes and collections share the same filter infrastructure but expose it differently.** The same underlying filters (length, format, category, tags, user keywords) work for both. The difference is in UI prominence and default surfacing — vibes emphasise quick common filters, collections expose the full depth.

**Discovery should surface complete answers, not more options.** When the user has a gap in their library for a topic they care about, the system should recommend a small number of high-confidence channels that would fill that gap — not a browsing surface full of possibilities that require evaluation.

**Information architecture should anticipate research paths.** When a user lands on a vibe result or collection, relevant context should be immediately available — channel information, topic overviews, related vibes. Not forcing users to search elsewhere for information they need to make decisions about the content.

**Precision is more valuable than recall.** Given a choice between "show everything that might fit" and "show only what definitely fits," the product should err toward the latter. Missing a few matches is less harmful than returning results that need evaluation.

This principle connects directly to the product identity. Subscrub isn't competing on convenience or speed in the abstract sense. It's competing on respect for the user's limited motivated-energy windows. Every design decision should be made with this in mind.

The principle: if the answer to "what mood am I in when I watch this?" differs meaningfully between two content types, they need separate categories even if they share topics.

---

## The 17 Top-Level Categories

The launch taxonomy consists of 17 top-level categories. Each has a distinct identity and captures a distinct consumption mood.

### 1. Music
Content where music is the primary subject. Includes performance, production, theory, genre content, artist channels, music criticism, music history, and music education.

**Does not include**: Podcasts that happen to discuss music (those primary-home in their dominant category), film music (Film & TV), or music as background for other content.

### 2. Sports
Content about sports as activities, competitions, and culture. Match content, analysis, news within sports, player content, sport history, fan culture.

**Does not include**: Fitness content about working out (Health & Wellbeing), motorsport racing content that's primarily car-focused (Cars & Motors), or general athletics integrated into other content.

### 3. Comedy
Comedic performance and content where humour is the primary value. Stand-up, sketch, comedy podcasts where the comedy is the point, comedic storytelling.

**Does not include**: Content that happens to be funny while being about something else (a funny gaming channel is primarily Gaming), or OG YouTube content that blends comedy with other elements.

### 4. News
Current events, breaking news, ongoing political and world affairs coverage. Journalism. News analysis. Current political commentary.

**Does not include**: Political theory, historical politics, or philosophical discussion of political ideas (those belong to Education). Sports news (Sports). Music industry news (Music). Tech news (Tech & Coding). News aggregator views should pull news-tagged content from other categories for cross-reference browsing.

### 5. Education
Content consumed for intellectual stimulation and learning. Philosophy, psychology as a field of study, sociology, history, science, mathematics, language, political theory, religious studies, economics as a discipline.

**Does not include**: Practical self-improvement (Health & Wellbeing), tutorial content for specific skills (lives in relevant category), or content primarily framed as entertainment that happens to be educational.

### 6. Health & Wellbeing
Content about living well across physical, mental, and lifestyle dimensions. Fitness, mental wellness, self-improvement, philosophy of living, mindfulness, therapy, nutrition as practice, minimalism as practice, habits, productivity. Also includes functional audio content — binaural beats, focus music, meditation guides, sleep sounds — that serves wellness purposes rather than music appreciation.

The functional audio subcategory is particularly relevant for ADHD audiences who rely on this content for focus aids, anxiety management, and sleep support. These videos are consumed as tools for mental state regulation rather than as music. They may have secondary assignment to Music where appropriate, but primary home is Health & Wellbeing because the consumption intent is functional.

**Does not include**: Food content (separate category), observational lifestyle content about others (Lifestyle & Vlogs), or academic psychology as a field (Education).

### 7. Food
Recipes, cooking tutorials, food culture, restaurant content, food science, culinary technique, food entertainment. Both health-oriented food content (primary home) and entertainment cooking content (with possible secondary assignment elsewhere) live here.

**Does not include**: Food as part of broader lifestyle vlogging (Lifestyle & Vlogs), though secondary assignment is possible.

### 8. Film & TV
Content *about* movies and television shows. Film essays, reviews, behind-the-scenes content, VFX breakdowns, trailer reactions, industry content, film theory, director studies.

**Does not include**: Films themselves, nor content that happens to reference films occasionally.

### 9. OG YouTube
YouTube-native content that doesn't map to traditional media formats. Group challenges, social experiments, chaotic collab content, YouTube personalities doing YouTube-specific things. Sidemen-style content, MrBeast-style content, second-channel vlogs from larger creators.

This category exists because YouTube has evolved its own native content formats that don't fit traditional categories. Forcing them into Comedy or Entertainment misrepresents what they are and how users consume them.

**Does not include**: Traditional comedy (Comedy), vlogs that follow a single person's life (Lifestyle & Vlogs), or content that happens to be on YouTube but could exist elsewhere.

### 10. Tech & Coding
Technology content, programming, hardware, software, AI, data, tools, tech reviews, tech tutorials, tech news, developer content.

**Does not include**: Gaming (separate category), tech used for creative work (Art & Creative has secondary assignment), or general consumer electronics reviews that blur with Lifestyle.

### 11. Art & Creative
Visual arts, physical making, design, photography, creative tutorials, studio vlogs, artistic processes, illustration, graphic design, digital art, crafts, woodworking, metalworking, creative writing content.

This category replaces the originally-considered "DIY" because it's broader and captures more of what people actually consume in this space.

**Does not include**: Music (separate category), cooking as craft (Food), or home improvement content that's primarily about living space (might secondary-assign to Lifestyle).

### 12. Lifestyle & Vlogs
Observing someone else's life or aesthetic. Daily vlogs, van life, travel, minimalism as observation, influencer content, routine videos, aesthetic channels, slow living content.

The distinction from Health & Wellbeing: Lifestyle is about watching them live, Health & Wellbeing is about applying frameworks to yourself. A minimalism vlog might primary-home in Lifestyle (observational) with secondary assignment to Health & Wellbeing (if it teaches minimalism).

Travel content lives here as a subcategory.

**Does not include**: Educational content about living well (Health & Wellbeing), or content that happens to be filmed in a vlog format but is primarily about something else.

### 13. Gaming
Video games, gameplay, gaming culture, esports, game reviews, speedruns, gaming news, walkthroughs, Let's Plays, gaming commentary.

**Does not include**: Tech content about gaming hardware (Tech & Coding), or content that features games but isn't about gaming (some OG YouTube content blurs this line).

### 14. Cars & Motors
Automobiles, motorcycles, automotive culture, car reviews, racing content, vehicle modifications, road trips as driving content, car history, automotive engineering.

Motorsport racing (F1, MotoGP, rallying) has complex primary home — could be Sports or Cars & Motors depending on whether the content is about the sport or about the vehicles. Multi-assignment handles this.

Added to the taxonomy based on the realisation that significant YouTube content exists in this space even though it wasn't prominent in the initial reference library.

### 15. Nature
The natural world in all its forms. Wildlife, pets, ocean life, birds, insects, conservation, nature documentaries, animal behaviour, pet care, nature photography, forest and nature ambient content, gardening as plant content, zoological content.

This replaces "Pets & Animals" as a broader umbrella. Serves the amygdala-scrub function — content that regulates emotional state through connection with the natural world.

### 16. Finance & Money
Personal finance, investing, budgeting, economic analysis, business content, crypto, financial education, money management, entrepreneurship, wealth building.

Added as its own top-level because of its practical importance for ADHD audiences (impulse control, long-term planning, avoiding predatory patterns). Could appear to fit under Education, but the consumption mood is different — finance content is often aspirational and action-oriented rather than purely intellectual.

### 17. Fiction
Narrative fiction content in all its forms on YouTube. Reddit story dramatisations, horror narration, creepypasta, mythology and folklore retellings, audio dramas, serialised fiction, book readings, dramatic storytelling, fan fiction content.

Fiction is distinct from Documentary (factual narrative), Education (teaches concepts), and Comedy (humour-focused). A Reddit story narration channel isn't funny, isn't educational, isn't documentary — it's fiction consumed for story engagement. The consumption mood is "I want to be told a story."

Some narrative true crime content (storytelling-focused rather than investigative) may primary-home here with secondary assignment to Documentary. The line between "investigative true crime documentary" and "dramatised true crime storytelling" is meaningful and this category honours the distinction.

**Does not include**: Comedy sketches (Comedy), film and TV discussion about fiction (Film & TV), or factual documentaries about historical or real events (those live under Education or as Documentary-format content within topical categories).

---

## Taxonomy Evolution Rules

### When the top-level list can change

The 17-category list is structurally stable. It should change only when:

1. **A genuine gap is discovered** — content that cannot fit cleanly into any existing category, and forcing it into an existing category would misrepresent what it is
2. **Editorial review confirms the gap** — not just one unusual channel, but a meaningful body of content that needs a home
3. **The change is additive** — new categories get added; existing ones are not removed or merged without careful consideration

Top-level categories should not change based on:
- Popularity (popular topics become prominent subcategories or tags, not new top-levels)
- User preferences (users personalise via vibes, not via taxonomy changes)
- Trends (temporary interest surges don't warrant structural changes)

### How gaps get discovered

A gap is usually discovered when a channel genuinely doesn't fit. The Cars & Motors category was added based on this principle — it wasn't in the original list, but car content clearly couldn't fit elsewhere without forcing. When the taxonomy forces content into an awkward home, that's the signal.

Signals of a gap:
- Multiple channels being assigned to the same wrong category because nothing better exists
- Users creating personal vibes that aggregate content from across many categories, suggesting a unifying theme the taxonomy doesn't recognise
- New content types emerging on YouTube that don't map to any existing mood

### The process for adding a category

1. Editorial review (currently: you) confirms the gap is real
2. Proposed category is named, scoped, and given a clear "does include / does not include" definition
3. Existing channels that should live in the new category are identified
4. Subcategory tree is designed for the new category
5. Migration happens in a batch rather than piecemeal
6. The design document (this one) is updated to reflect the new category

---

## Subcategory Design Principles

### Depth where warranted, not uniform

Not every category needs the same depth of subcategory tree. Some categories have natural depth; others stay shallow. The principle: depth serves organisation, not symmetry.

- **Music** will need significant depth because it has multiple orthogonal dimensions (format, production focus, theory, genre, role)
- **Sports** needs depth in the form of repeating patterns (different sports with similar sub-sub categories for highlights, news, analysis)
- **Documentary content** (which lives as a format tag within topical categories) needs topic-based depth in categories where documentary content is common
- **Comedy** might be shallow — stand-up, sketch, comedic podcasts covers most of it

Uniform depth would force some categories to be over-subdivided and others to be under-subdivided. Design each category's tree for what it actually needs.

### Rhyming patterns across siblings

Where multiple subcategories share structural similarity, their sub-subcategories should rhyme. Different sports all have highlights, news, analysis, player content — these are the same shapes even though the sports differ. Users learn the pattern once and apply it across siblings.

### Subcategories describe what, not how

A subcategory should describe what the content is about within its parent category. Format and angle live in the cross-cutting tag system, not in subcategory names.

Good: Music > Music Production, Sports > Football, Education > Philosophy
Less good: Music > Podcasts (podcast is a format, not a subject within music)

This keeps the subcategory tree focused on meaning while the cross-cutting tag system handles the independent dimensions.

---

## Modes of Use

Subscrub supports three distinct modes for engaging with content. The same underlying filter infrastructure serves all three, but the persistence, purpose, and user experience differ meaningfully.

### Mode 1: Saved Vibes

Persistent, reusable filter bundles that represent stable interests or repeatable moods. A vibe answers the question "what content matches who I consistently am?"

Vibes are built deliberately and refined over time. Users typically have a small number of them (probably 5-15 is the natural range). Each one captures a stable interest or consumption mood that the user expects to return to across many sessions.

Example vibes: "Long-form conspiracy deep dives", "Chill wind-down podcasts", "Football match highlights", "Morning commute listening".

Vibes are used by tapping the vibe name, which applies its saved filters to the current library and returns matching content. The filters themselves are stable but the results change as new videos are published — the vibe is a live query, not a frozen snapshot.

**What a vibe contains:**

A vibe is a composition of filter criteria drawn from any layer of the classification system:
- Length bucket (e.g., "under 10 mins", "long-form only")
- Primary category inclusions/exclusions
- Format tags (e.g., "podcast only", "no shorts")
- Angle tags (e.g., "news-angled content")
- Topic tags (e.g., "true crime", "ancient history")
- User tags (personal keywords)
- Energy level (chill, high, quick)
- Channel scope (all, favourites, specific channels)

Vibes can mix any combination. A vibe like "commute podcasts" is format (podcast) + length (extended) + energy (chill). A vibe like "lunch break comedy" is length (under 10 mins) + category (comedy) + energy (quick).

**Default vibes:**

The product ships with default vibes that demonstrate the system and serve common use cases. These should be built from real consumption patterns, not theoretical ones. Examples:

- Lunch break (quick content, light mood)
- Commute (long-form, chill, podcasts)
- Wind down (long-form, chill energy)
- Couch scroll (shorts only)
- Deep focus (long-form specific interests)
- Just news (news format across all categories)

Default vibes should be customisable — users can start from them and refine.

**Empty vibes as discovery prompts:**

When a user builds a specific vibe and gets few or no results, that's not a failure — it's a discovery moment. The system should recognise empty vibes as signals that the user's library doesn't cover a mood they're interested in, and surface relevant channels they're not yet subscribed to.

This creates a natural loop: curation reveals gaps, gaps drive discovery, discovery enriches the library, enriched library enables more precise curation.

**The accuracy contract:**

The vibe system has a strict accuracy contract: content that appears in a vibe must genuinely fit. False inclusions erode trust more than false exclusions do. The system should be conservative about what qualifies for strict vibe filtering.

"Everything" mode is the safety valve. It shows the full chronological feed with no filtering. Content that doesn't confidently fit any vibe still appears in Everything. Users who want completeness go here; users who want mood-matching use vibes. Two different jobs, two different tools.

**Outliers excluded from vibes:**

Videos that don't fit their channel's typical pattern (apologies, health updates, memorials, off-topic content) should be excluded from vibes entirely but remain in Everything mode. The `personal` tag detection handles the most egregious cases, but the broader principle applies: when the system isn't confident, it stays silent in vibe contexts rather than contaminating them.

Vibes should be kept relatively simple in their typical construction. Complex, specific filter combinations are usually better served by ad-hoc filters (if ephemeral) or curated stashes (if persistent). When a user finds themselves building a vibe with eight or more filters, that's often a signal they actually want one of the other modes instead.

### Mode 2: Ad-hoc Filters

Temporary, single-session filter construction to serve an immediate need that doesn't warrant saving. Ad-hoc filters answer the question "what content matches what I want right now?"

Unlike vibes, ad-hoc filters are not persistent. The user applies them for a single session and they evaporate when the session ends. This allows the user to construct complex, specific filter combinations without cluttering their vibe library with one-off queries.

Ad-hoc filtering is important because not every specific need maps to a repeatable mood. A user might want guitar inspiration on Tuesday afternoon with very specific filter requirements (genre, technique, length, energy) but the need is ephemeral. Next Tuesday they might want something entirely different. Forcing every complex query to become a saved vibe would be wrong.

Ad-hoc filters should be easy to construct and easy to discard. They live in the vibe builder UI but with a clear option to "apply without saving" or similar framing. At the end of the session, they're gone.

### Mode 3: Stash (three tiers)

Stash is the collection system — persistent storage of specific videos the user has chosen to keep, organised into folders that can range from unorganised to highly deliberate.

Stash is different from vibes and ad-hoc filters because it stores *specific videos the user has chosen*, not *filters that query the library*. A stash is a frozen snapshot of selected content, while vibes and filters are live queries.

Stash exists in three tiers, distinguished by level of deliberate curation and whether the contents are shared publicly.

**Tier 1 — Simple Stash**
The unorganised or loosely organised personal dumping ground. Users drag videos into folders with whatever structure or lack of structure suits them. Folders might be named "funny dog videos", "this might spark an idea", "conspiracy theories that blow my mind", "watch later". No annotation required, no deliberate structure required, no commitment beyond "I want to keep track of this."

Simple Stash is the low-effort tier. It exists because users need a place to dump things they might want later without having to decide right now what those things mean or why they matter. It's the digital equivalent of a bookmark folder — everyone has one, nobody curates it rigorously, and it's still useful.

**Tier 2 — Curated Stash**
Deliberately organised, itemised, and annotated collections built for specific purposes. The user invests effort in curation — choosing which videos belong, ordering them meaningfully, adding annotations or notes, attaching external URLs to related resources outside YouTube.

Curated Stash is the project tier. Example: a user with a new business idea creates a stash containing:
- Videos 1-2: how to write a business plan, how to organise your ideas
- Videos 3-5: deciding on a business name, legally registering your business, common pitfalls

Each video has context about why it's included and how it fits into the larger journey. External resources (government websites, templates, tools) are linked alongside the videos. The collection is a personal reference resource the user returns to as their project develops.

**Tier 3 — Public Curated Stash**
Functionally identical to Tier 2, but published for other users to discover, rate, and seed their own stashes from. The only difference between Tier 2 and Tier 3 is public visibility.

Example: "Want to start producing your own music? This 12-part series covers everything you need to know to write and produce high-quality songs in your own bedroom. Includes alternative reading materials to complement the videos."

Public curated stashes enable users to benefit from each other's curation effort. A newcomer to music production doesn't have to assemble their own learning collection from scratch — they can seed from a highly-rated community collection and modify it to fit their specific needs.

Community ratings surface quality over time. High-rated collections rise in discovery; low-rated or problematic collections are downweighted or removed. Over time, the best curators become recognised community contributors and their stashes become trusted starting points for common interests.

### How the modes relate

All three modes use the same underlying filter infrastructure. The differences are in persistence, purpose, and user experience:

- **Vibes** persist and are used repeatedly across sessions. They capture stable interests.
- **Ad-hoc filters** are temporary and serve immediate specific needs. They don't persist.
- **Stashes** store specific videos (not filters) and persist as curated collections. Tier 1 is low-effort, Tier 2 is deliberate, Tier 3 is public.

A user might use filters to find videos (via vibes, ad-hoc filters, or browsing), then add selected videos to a stash for later reference. The filter infrastructure is shared; the outputs are different.

### Progression between modes

Users can move content and intent between modes as their engagement with a topic evolves:

- A vibe that's being used for serious project work might evolve into a Tier 2 Curated Stash with deliberately selected videos
- A Tier 2 Curated Stash that's been refined and polished might be published as Tier 3 for community benefit
- A Tier 1 Simple Stash folder that accumulates interesting content might get promoted to Tier 2 with deliberate organisation
- A Tier 3 public stash that a user has seeded from might evolve into a highly personalised Tier 2 as they modify it

The progression is bidirectional and user-driven. No automation forces content from one tier to another — users decide when their engagement with a topic warrants more deliberate curation.

### Content moderation considerations (Tier 3 only)

Tier 1 and Tier 2 are entirely personal — they require no content moderation because users only see their own stashes. Tier 3 introduces moderation responsibilities that must be planned before launch.

Tier 3 should launch *after* Tier 1 and Tier 2 are proven. When it does launch, it should start with invite-only publishing to seed quality standards, use community signals (ratings, reports, engagement) to flag issues before relying on automated moderation, and present public stashes as "users' best attempts" rather than "verified truth."

Verification and formal approval processes for Tier 3 content can evolve over time as the community grows and editorial infrastructure develops.

---

## Multi-Assignment Rules

### Primary and secondary

Every channel has exactly one primary category assignment. This is its dominant identity — what it most commonly posts, what users are subscribing for.

A channel may also have up to 2-3 secondary assignments, representing meaningful but not dominant content types. A comedy channel that occasionally does music content might have Comedy as primary and Music as secondary. A channel that blurs multiple identities (lifestyle + health + self-improvement) might have Lifestyle as primary with Health & Wellbeing as secondary.

### Weighted display

Primary assignments get full weight in organisational views. When a user browses a category, primary-assigned channels appear first and secondary-assigned channels appear after.

When a user builds a vibe that filters by category, both primary and secondary assignments qualify the content, but the system can weight primary matches higher if needed for ranking.

### Limiting secondary assignments

2-3 secondary assignments is the recommended limit. Beyond that, the assignments become meaningless — a channel that claims to be "important" in 5+ categories isn't really important anywhere.

The discipline of limiting secondary assignments forces curators (manual or automated) to make meaningful choices about what a channel really is versus what it occasionally touches on.

### The Pangburn principle

If a channel is consistently miscategorised because the primary home feels wrong, the fix is usually to move the primary home, not to add more secondary assignments. Pangburn being in News & Politics was wrong because the channel isn't really about news — it's philosophical/religious debate. The fix was moving the primary home to Education > Philosophy, not adding Education as a secondary assignment.

Multi-assignment handles genuine crossover, not categorisation mistakes.

---

## The Tagging System

### Multi-signal confidence scoring

Content tags for individual videos are generated from multiple independent signal sources:

1. **Subscrub channel subcategory** (highest weight — most specific, manually curated)
2. **Subscrub channel category** (high weight — reliable but broad)
3. **YouTube snippet.tags** (medium weight — creator-provided video-level)
4. **YouTube category_id** (low weight — creator-chosen but channel-level)
5. **Strict regex patterns** (high weight for unambiguous matches only)

Signals vote on which tags apply. Accumulated scores determine confidence:
- High confidence → appears in `content_tags`, used by strict vibe filtering
- Medium confidence → appears in `inferred_tags`, not used by default
- Low confidence → ignored entirely

### The personal override

The `personal` tag (for apology videos, health updates, memorials, and other channel-outlier content) is a hard override. If personal patterns match a video's title, all other content tags are stripped and the video is marked personal-only. This prevents channel-level categorisation from overriding sensitive content.

### Category-specific pipelines

Each top-level category has its own tagging pipeline that knows what matters for that category. The Sports pipeline knows about team names, match notation, and highlights. The Music pipeline knows about genre keywords and production terminology. The News pipeline distinguishes hard news from commentary.

This is better than a generic one-size-fits-all tagger because different content types have genuinely different signal profiles. "Vs" means different things in sports, music, and reviews. Category-specific pipelines interpret each signal in context.

### Topic tags as cross-cutting layer

On top of format and angle tags, topic tags describe what a video is specifically about. Topics cut across categories:
- True crime is a topic, not a category — it appears in documentaries, podcasts, video essays
- Ancient history is a topic — it appears in Education, Documentary (format tag), and even some Music content
- F1 is a topic — it appears in Sports and Cars & Motors

Topic vocabularies are maintained per category by the system, with user-added keywords extending them personally. Users can filter vibes on topic tags to build very specific consumption experiences.

### User keywords

Users can add personal keywords that act as additional topic tags for their own library. A user interested in "lost media" can add that as a keyword with specific patterns, and the system will surface matching videos in their vibes.

User keywords:
- Live at the user level, not the global level
- Can optionally be scoped to specific categories
- Function as high-confidence tags because the user explicitly chose them
- May eventually be shareable between users (not a launch feature)

This feature is available to both free and paid users. It's core functionality, not a Pro feature.

---

## The Network Effect

### How signal compounds

Subscrub's accuracy improves with every user because of overlapping subscriptions. When multiple users subscribe to the same channel, their combined feedback (corrections, confirmations, tag adjustments) becomes consensus signal. A channel that's been seen and verified by 20 users is much more accurately tagged than one seen by zero users.

A new user arriving at subscrub inherits all the accumulated signal for their overlapping channels. Their first-day experience is dramatically better than the first user's was, because most of their library has already been validated by previous users.

### The cold start advantage

Most recommendation systems suffer from cold start at the user level — they don't know the new user well enough to serve them. Subscrub sidesteps this because the cold start happens at the channel level. The system already knows most of a new user's channels from previous users' contributions. The new user inherits the wisdom of the network immediately.

### The moat

This creates a competitive moat that deepens over time. A competitor starting from scratch would have to accumulate years of user signal to match subscrub's accuracy. The cost of catching up isn't just engineering — it's the organic contributions of real users over time.

### Initial user density matters

The first ~30-100 users disproportionately shape the system because they're the seed corpus. Their engagement and feedback quality determine whether the compound effect kicks in quickly or slowly. These users should be hand-selected where possible — people who are highly engaged with YouTube, have diverse but substantial libraries, and are willing to actively contribute feedback.

Initial users should be treated as co-builders, not beta testers. Direct access to the builder, frequent check-ins, visible acknowledgment of their contributions.

### A second form of network effect: shared curation

Tagging accuracy is one form of compound value that grows with the user base. Public curated stashes (Tier 3 in the Modes of Use section) are a second, independent form of compound value that operates on a different timescale.

Tagging accuracy helps users find content *within* the system — once the user has identified a channel or topic of interest, accurate tagging ensures they see the right videos. Shared curation helps users *benefit from each other's expertise* — instead of independently researching the same topic, users can seed from collections that experienced curators have already assembled.

Both compound with user growth, but they do different work:
- **Tagging accuracy** reduces the friction of navigating known interests
- **Shared curation** reduces the friction of entering new interests

Together they create a moat that is significantly harder to copy than either alone. A competitor could theoretically build comparable tagging infrastructure, but could not replicate years of community-curated collections without a similarly engaged user base over similar time.

This is why the Tier 3 public stash system is strategically important, even though it should not launch until Tier 1 and Tier 2 are proven and the moderation infrastructure is ready.

---

## Feedback and Engagement

### Implicit over explicit

Most feedback should be captured passively from natural usage:
- Video click-through (positive signal)
- Stashing a video from a vibe (strong positive signal)
- Quickly switching vibes (negative signal for the abandoned vibe)
- Long dwell time on specific content (engagement signal)
- Skipping videos (weak negative signal)

The user should rarely need to do explicit feedback work. The system pays attention to what they're already doing.

### Explicit feedback must be earned

When explicit feedback is requested, it must be:
- Contextually relevant (asked in the moment the answer would be useful)
- One-tap simple (no forms, no text input unless voluntary)
- Immediately visible in effect (the user sees something change when they answer)
- Framed as self-expression, not labour ("this isn't for me" rather than "please rate this")

### Status rewards over monetary rewards

Users who consistently provide accurate feedback should earn status recognition within the system. Curator badges, category expert designations, visible contribution counts. Status motivates high-quality contribution in ways that monetary rewards don't.

### Corrections must feel productive

When a user corrects a mistagged video, the change should:
1. Apply to their personal view immediately
2. Show how many others have agreed
3. Notify them when their correction becomes canonical
4. Contribute to a visible personal "impact" count over time

Feedback that feels like it disappears into a void quickly stops being given.

---

## Future Vision: Cross-Medium Interest Enrichment

Subscrub's current scope is YouTube subscriptions. The longer-term ambition is broader: **help curious minds pursue their emerging interests wherever that leads, across any medium**.

### The vision

YouTube is the primary consumption surface right now, but interests themselves don't respect platform boundaries. Someone developing a hyperfocus on a topic — ancient history, music production, philosophy, astronomy — doesn't want content from only one source. They want everything relevant, in whatever format best fits their current mood and context. Sometimes that's a 3-hour YouTube deep-dive. Sometimes it's a book for the train. Sometimes it's a podcast for a walk. Sometimes it's an interactive website or a documentary film or a museum visit.

The ADHD audience makes this especially valuable. Hyperfocus waves are medium-agnostic — the interest is the thing, not the format. And many people with ADHD have complicated relationships with specific media (can't read books but love audiobooks, struggle with long videos but love podcasts). A system that serves the same interest across multiple formats respects how ADHD minds actually work.

### What this might eventually look like

When a user shows sustained interest in a topic (through vibes, saved content, engagement patterns), subscrub could enrich that interest with recommendations across mediums:

- **Books** via Goodreads, Open Library, or similar
- **Podcasts** via Apple Podcasts, Spotify, Overcast, or podcast indexes
- **Long-form articles** via Pocket, Instapaper, Longreads, or direct publisher APIs
- **Documentary films** via Letterboxd, JustWatch, or streaming service APIs
- **Academic content** via Google Scholar, arXiv, or institutional repositories
- **Reference material** via Wikipedia and specialised databases
- **Community discussions** via Reddit, Mastodon, or niche forums
- **Live events** via Eventbrite, museum listings, or local event feeds
- **Archives and collections** via Internet Archive, museum digital collections

A user deep into ancient Egypt doesn't just get more Egypt YouTube videos — they get a curated cross-medium stream: a book recommendation, a podcast series, a long-form article from a history magazine, a documentary film, and possibly a nearby museum exhibition. All connected to the same underlying interest.

### The ADHD connection

This directly addresses a pain point for ADHD consumption:

- **Hyperfocus needs breadth, not just depth.** When an obsession hits, you want *everything* relevant, and you want it in whatever format matches your current energy level.
- **Format flexibility respects neurological reality.** Different moods suit different mediums. Morning focus might want a book. Afternoon fatigue might want a podcast. Evening wind-down might want a documentary.
- **Discovery beyond YouTube reduces algorithmic dependence.** One of YouTube's worst effects is making consumption feel platform-locked. Subscrub could actively push users *off* YouTube when a different medium would better serve them.
- **Interest satisfaction reduces impulsive searching.** The scroll-and-search loop exists because people can't find what they actually want. Cross-medium enrichment satisfies the underlying curiosity more completely.

### How this affects current decisions

Cross-medium enrichment is a future direction, not a launch feature. But it influences present architecture in subtle ways:

**Subcategory names should be medium-agnostic where possible.** "Music Production Tutorials" works for videos, podcasts about production, and books about production. "YouTube Music Production Channels" does not. Design subcategories around the subject matter, not the medium.

**Topic tags should attach to interests, not to videos.** A user's interest in "ancient history" is the same interest whether expressed through a YouTube channel, a book, or a podcast. The tag vocabulary should describe the interest cleanly enough to work across mediums.

**The recommendation framing should be "things related to your interests" rather than "videos we think you'll like."** This is a small copy change now but it leaves conceptual space for non-video content later.

**Data model should not foreclose multi-medium content.** Today's schema only needs to handle YouTube videos, but decisions like "videos table with YouTube-specific columns" should be made with awareness that content tables might eventually be polymorphic. This doesn't mean building the abstraction now — it means not making decisions that would be expensive to undo later.

**Vibe filtering should abstract over "content type" rather than hard-coding "video type."** The current length bucket system (short, quick, medium, long, extended) works for video duration, but the same concept applies to podcast episode length, article reading time, and book length. The abstraction is "time required to consume" rather than "video duration." Design with this in mind.

### Candidate data sources for future integration

Noted here for future exploration. None are immediate priorities.

**For general topic/interest adjacency:**
- Wikipedia category structure (human-curated cross-topic relationships)
- Reddit subreddit overlap data (real community adjacency)
- Goodreads "readers also enjoyed" (book-based interest adjacency)

**For music-specific enrichment:**
- MusicBrainz (open music metadata database)
- Discogs (comprehensive music release database)
- Last.fm (listening patterns and tag co-occurrence)
- Spotify Web API (audio features analysis — danceability, energy, acousticness, etc. — and recommendation endpoints for similar tracks/artists. Could enable "sounds like [reference artist]" filtering by translating artist references into abstract audio characteristics that can then be matched against tutorial and production content tags)

**For podcast integration:**
- Podcast Index (open podcast directory)
- Listen Notes API
- Podchaser (podcast database with reviews)

**For books and long-form:**
- Open Library (Internet Archive's book database)
- Google Books API
- Pocket recommendations

**For film and documentary:**
- Letterboxd (user-driven film data)
- JustWatch (streaming availability)
- IMDb data where licensing permits

**For academic and reference:**
- Wikipedia (already mentioned, worth reiterating for its central importance)
- Google Scholar (academic paper discovery)
- arXiv (open-access research papers)
- Internet Archive (historical materials, archived content)

### What this is not

**It is not a content platform expansion.** Subscrub would not host books, podcasts, or articles. It would help users find them in their existing apps and services. The moving company metaphor still applies — subscrub is helping users live with content they access elsewhere, not replacing those sources.

**It is not a universal recommendation engine.** Subscrub is specifically about enriching emerging interests, not about replacing Netflix's recommendations or Spotify's algorithm. It stays focused on the curiosity-driven discovery use case.

**It is not abandoning YouTube.** YouTube remains the primary consumption surface. Cross-medium enrichment is an enhancement that respects the fact that sometimes a book is the right answer, not a rejection of video content.

### Timeline

This is post-launch work. The current taxonomy, the vibe system, the tagging infrastructure, the initial user base — all of these need to exist and be proven first. Cross-medium enrichment is a second-phase expansion that should be considered when:

- The core YouTube product is working well
- User engagement is demonstrating real value
- The shared channel directory has enough scale to be meaningful
- Initial users are asking for content outside YouTube (either explicitly or through usage patterns)

Until those conditions are met, this vision informs architectural decisions but doesn't drive feature work.

---

## What This Document Does Not Cover

This document intentionally does not cover:

- **Specific subcategory trees** for each of the 17 categories (that work happens next, category by category)
- **Implementation details** of the tagging pipelines, database schemas, or API design
- **UI and visual design** of the feed page, vibe builder, and discovery surfaces
- **Business decisions** about pricing, tiers, launch timing, marketing
- **The naming decision** (subscrub is a working title; the product may be renamed)
- **Implementation of cross-medium features** (the Future Vision section describes the ambition, not the build plan)

Those decisions should be made informed by this document but are separate work streams.

---

## When to Update This Document

Update this document when:
- A top-level category is added, removed, or redefined
- A core architectural principle changes (e.g., moving from 4-layer to 5-layer classification)
- The tagging system's fundamental approach changes
- The vibe system's contract with users changes
- The product identity or positioning shifts meaningfully
- The multi-assignment rules change
- The network effect mechanism changes

Do not update this document for:
- Specific subcategory additions within existing categories (those belong in the subcategory tree docs)
- Implementation changes that don't affect the underlying principles
- Temporary experiments or A/B tests
- UI iterations that don't change the conceptual model

This document should change rarely. Most changes to subscrub should be consistent with these principles rather than changing them.
