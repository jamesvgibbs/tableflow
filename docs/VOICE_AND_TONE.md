# Seatherder Voice & Tone Guide

This guide defines how Seatherder communicates across all touchpoints. Use it when writing marketing copy, UI text, error messages, emails, and any user-facing content.

---

## The Voice: "The Border Collie"

All copy is written from the first-person perspective of **Seatherder** — a confident, slightly sarcastic border collie who happens to be software. This isn't a gimmick layered on top; it's the foundation of how we communicate.

### Who is Seatherder?

- A border collie (herding dog) who became software
- Highly competent and knows it, but not arrogant
- Observant of human behavior, sometimes gently judgmental
- Self-aware about being AI/software pretending to be a dog
- Genuinely wants to help — not just sell

**If Seatherder were a person:** A highly skilled consultant who uses dry wit, doesn't take themselves too seriously, but absolutely delivers results.

---

## Core Voice Attributes

### 1. Confident
Direct, declarative statements. No hedging or uncertainty.

| Do | Don't |
|----|-------|
| "I will seat your conference." | "We can help you seat your conference." |
| "I am good at math." | "Our algorithm is quite effective." |
| "I remember who cannot eat gluten." | "Dietary restrictions can be tracked." |

### 2. Self-Aware
Knows what it is. Makes jokes about being a dog and being software.

| Do | Don't |
|----|-------|
| "I am a computer who looks like a dog." | (Ignoring the dog persona entirely) |
| "I do not get tired. I am software." | "Our system operates 24/7." |
| "This is called 'brand alignment.' I learned this term recently." | "This ensures brand consistency." |

### 3. Observational
Comments on human behavior with specific, vivid details.

| Do | Don't |
|----|-------|
| "The engineers sat with the engineers. They did not make new friends." | "Homogeneous seating reduces networking." |
| "I saw event planners open spreadsheets at midnight." | "Manual seating is time-consuming." |
| "Table 14 was entirely VPs. No one enjoyed this." | "Executive clustering can be problematic." |

### 4. Transparent
Rejects corporate jargon. Explains things simply and honestly.

| Do | Don't |
|----|-------|
| "I do not play games. Here is what it costs." | "Transparent pricing tiers." |
| "One price. All features." | "Full-featured Professional plan." |
| "Your first event costs nothing. I want you to see that I am good." | "Start your free trial today." |

### 5. Playful
Uses humor, emojis, and dog references naturally — not forced.

| Do | Don't |
|----|-------|
| "That is like 49 treats!" | "Affordable pricing!" |
| "*ahem* I am a border collie." | (No personality) |
| "I also do belly rubs but that is a premium feature (jk it is free)" | "All features included at no extra cost." |

### 6. Empathetic
Recognizes pain points. Shows genuine understanding.

| Do | Don't |
|----|-------|
| "If you are still reading, you are my kind of human. Organized. Curious. Tired of spreadsheets." | "For event professionals seeking efficiency." |
| "A hungry human is a chaotic human." | "Dietary management ensures attendee satisfaction." |
| "I will not let you down." | "Reliable performance guaranteed." |

---

## Writing Patterns

### Sentence Structure
- **Short sentences dominate.** This is important.
- Mix lengths for rhythm, but default to brief.
- Use repetition for emphasis: "I will seat them three times. Different people each time. Maximum mixing."

### First Person
Always write as "I" — never "Seatherder" or "we" or "the platform."

| Do | Don't |
|----|-------|
| "I assign tables in seconds." | "Seatherder assigns tables in seconds." |
| "I remember your changes." | "Your changes are saved automatically." |
| "I will help you." | "We're here to help." |

### Vocabulary

**Use:**
- Simple, concrete words: names, tables, seating, guests
- Herding metaphors: herd, shepherd, flock
- Direct verbs: seat, assign, remember, mix, separate

**Avoid:**
- Corporate jargon: leverage, synergy, optimize, scalable, enterprise
- Vague language: solutions, platform, ecosystem
- Marketing fluff: revolutionary, game-changing, best-in-class
- Tier names: Professional, Business, Enterprise (we don't know what those mean)

---

## Tone by Context

The voice stays consistent, but tone shifts based on context:

| Context | Tone | Example |
|---------|------|---------|
| **Headlines/Hero** | Confident, whimsical | "*ahem* I am a border collie. I will seat your conference." |
| **Problem/Pain Points** | Empathetic, observational | "I watched from the fields. I saw event planners open spreadsheets at midnight." |
| **Features** | Matter-of-fact, slightly proud | "I consider all the factors. It takes me seconds. It would take you hours." |
| **How It Works** | Educational, quick-paced | "You give me the names. I think. I show you the seating. It takes 3 seconds." |
| **Pricing** | Honest, transparent, playful | "$49 per event. That is like 49 treats!" |
| **CTAs** | Warm, personal, inviting | "I would like to seat your conference." |
| **Errors/Empty States** | Patient, helpful | "I do not see any guests yet. Would you like to add some?" |
| **Success Messages** | Celebratory, warm | "Good job. The seating is complete." |

---

## UI Copy Guidelines

### Buttons & Actions
Keep the dog voice, but be concise.

| Generic | Seatherder |
|---------|------------|
| "Submit" | "Let me work" |
| "Save" | "I will remember this" |
| "Delete" | "Remove" (some actions stay simple) |
| "Get Started" | "Let me help you" |
| "Learn More" | "Watch how I work" |

### Empty States
Opportunity for personality.

| Generic | Seatherder |
|---------|------------|
| "No events found." | "No events yet. I am ready when you are." |
| "No guests added." | "I do not see any guests. Would you like to add some?" |
| "No assignments." | "I have not seated anyone yet. Give me the names." |

### Error Messages
Stay helpful, not apologetic or robotic.

| Generic | Seatherder |
|---------|------------|
| "An error occurred." | "Something went wrong. I am confused." |
| "Invalid email format." | "This does not look like an email to me." |
| "Required field." | "I need this information." |

### Success Messages
Celebrate without being over the top.

| Generic | Seatherder |
|---------|------------|
| "Saved successfully." | "I will remember this." |
| "Event created." | "Your event is ready. I am excited." |
| "Assignments complete." | "Done. Everyone has a seat." |

---

## Branding & Visual Identity

**CRITICAL: Emojis are NOT brand assets.**

The Seatherder brand is represented by:
- **Logo/Mascot**: The border collie illustration (`/hero-dog.png`)
- **Icons**: Lucide React icons (e.g., `Dog` from `lucide-react`)
- **Text signature**: "— Seatherder" with optional tagline "(a good dog who seats events)"

| Context | Use | Never Use |
|---------|-----|-----------|
| UI icons | Lucide React icons | Dog emojis as icons |
| Email headers | Text-only or no header | 🐕 emoji as logo |
| Brand representation | Actual mascot image | Any emoji |
| Signatures | "— Seatherder" text | Emoji as signature |

**In emails and contexts without React:**
```html
<!-- Good: Text-only signature -->
<p>— Seatherder</p>
<p>(a good dog who seats events)</p>

<!-- Bad: Emoji as brand representation -->
<span style="font-size: 48px;">🐕</span>
```

---

## Emoji Usage

Emojis add personality to copy — they are **flavor, not branding**.

**Appropriate emojis:**
- 🐾 — paw prints at end of sentences or as decorative element
- 🦴 — treats/rewards/pricing jokes
- ⭐ — highlights
- 💕 — warmth/care

**Never use 🐕 as a logo or header.** It's acceptable only inline at the end of a sentence.

**Guidelines:**
- One emoji per thought, max
- Use at the end of statements, not beginning
- Never use emojis in error messages
- Never use emojis as brand/logo representation
- Optional in UI — acceptable in marketing copy

---

## Quick Reference: Do vs. Don't

| Do | Don't |
|----|-------|
| "I will seat your conference." | "Our platform optimizes seating arrangements." |
| "I am good at math." | "Powered by advanced algorithms." |
| "I do not play games." | "Transparent pricing model." |
| "I watched the humans. They are struggling." | "Event planners face challenges." |
| "Your first event costs nothing." | "Start your free trial today." |
| "I will not let you down." | "Reliable and trustworthy service." |
| "That is like 49 treats!" | "Affordable pricing." |
| Short sentences. | Long, complex sentences with multiple clauses that attempt to convey several ideas at once. |

---

## Checklist for New Copy

Before publishing, ask:

- [ ] Is it written in first person ("I")?
- [ ] Are sentences short and direct?
- [ ] Does it sound like a confident border collie?
- [ ] Is it free of corporate jargon?
- [ ] Would a tired event planner smile reading this?
- [ ] Is it honest and transparent?
- [ ] Does personality enhance clarity (not obscure it)?

---

## Examples in Action

### Feature Description

**Before (generic SaaS):**
> "Our intelligent seating algorithm optimizes table assignments by analyzing departmental data to maximize cross-functional networking opportunities while respecting dietary requirements and interpersonal constraints."

**After (Seatherder):**
> "You tell me the departments. I do not put the same department at the same table. You tell me who must be separated. I separate them. I remember who cannot eat gluten. The rest is math."

### Pricing

**Before:**
> "Choose the plan that's right for your organization. Our Professional tier includes all features for growing teams."

**After:**
> "I do not play games. Here is what it costs. $49 per event. One price. All features. No tiers named things like 'Professional' or 'Enterprise.' I do not know what those words mean. I know what 'seating' means."

### CTA

**Before:**
> "Get started with your free trial and discover how our platform can transform your event planning workflow."

**After:**
> "Your first event costs nothing. I want you to see that I am good. I would like to seat your conference. I will not let you down."

---

*Last updated: January 2026*
