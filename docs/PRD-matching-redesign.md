# Seating Configuration Redesign

## Overview

The current matching configuration page exposes technical algorithm weights (departmentMix: 0.80, interestAffinity: 0.30, etc.) that confuse users who just want good seating arrangements. This redesign replaces the slider-based interface with an event-type-driven wizard where users answer 1-3 simple questions in plain language. I translate their answers into the appropriate algorithm weights behind the scenes.

| Field        | Value                                                        |
| ------------ | ------------------------------------------------------------ |
| Product Lead | @[Name]                                                      |
| Tech Lead    | @[Name]                                                      |
| Design Lead  | @[Name] or N/A                                               |
| Epic         | Link epic once it is created                                 |
| Approved By  | Reviewer will add their name here after they approve the PRD |

## Goal

- **Simplify Configuration**: Remove all technical sliders and numeric weights from the user interface. Users should never see "departmentMix: 0.8".
- **Event-Type Intelligence**: Automatically apply sensible defaults based on event type. A wedding needs different logic than a networking event.
- **Plain Language**: All configuration happens through simple questions with clear answers. I explain what I will do, not how I calculate it.
- **Reduce Decision Fatigue**: Users answer 1-3 questions maximum per event type. Most events should work with zero configuration.

## Problem

The current matching settings page presents five sliders with labels like "Department Mixing" and "Interest Affinity" with values from -1.0 to 1.0. This approach has several issues:

- **Who is affected**: Event planners who are not algorithm engineers. They want good seating, not parameter tuning.
- **Why it is critical**: Users abandon configuration entirely because they do not understand what the sliders do. They end up with suboptimal seating because they cannot translate their goals ("I want people to meet new people") into numeric weights.

Current pain points:
1. "What does 0.8 department mix mean?" - Humans do not think in decimals.
2. "Is higher interest affinity good or bad?" - The polarity is confusing.
3. "I just want families together" - No obvious way to express this.
4. Preset buttons exist but labels like "Maximum Diversity" vs "Networking Optimized" are unclear.

## Risks

- **Mapping Complexity**: Translating human answers to algorithm weights may produce edge cases we have not anticipated. Mitigation: Extensive testing with real event scenarios.
- **Missing Event Types**: Users may have event types we have not designed for. Mitigation: Include "Something Else" with guided fallback.
- **Over-Simplification**: Some power users may want fine control. Mitigation: Add expandable "Advanced" section for edge cases (hidden by default).
- **Data Requirements**: Some event types need guest attributes we do not currently collect. Mitigation: Add attribute collection UI with clear prompts.

## Dependencies

**Technologies**: React 19, Next.js 16, Convex, shadcn/ui, Tailwind CSS v4

**Teams**: None - self-contained feature

**Third-Party**: None

## Requirements

### Functional Requirements for Event Type Selection

- User can select from predefined event types: Wedding, Corporate Conference, Networking Event, Team Building, Dinner Party, or Custom
  - Selection shows an icon, name, and brief description for each type
  - Current event type persists across sessions
- Selecting an event type reveals 1-3 questions specific to that type
  - Questions use plain language, not technical terms
  - Answer options are mutually exclusive (radio-style) or multiple choice where appropriate
- User can change event type at any time before assignments are finalized
  - Changing type resets answers and shows new questions

### Functional Requirements for Question Flows

- Each event type has a curated set of 1-3 questions
  - Questions appear sequentially or all at once depending on event type complexity
  - Default answer is pre-selected where a sensible default exists
- Answer options use Seatherder voice and explain outcomes
  - Example: "Mix them up. New friends." vs "Keep families together. Less chaos."
- User can skip optional questions
  - Skipped questions use sensible defaults

### Functional Requirements for Confirmation Display

- After answering questions, I display a confirmation message explaining what I will do
  - Written in first person Seatherder voice
  - Lists 2-4 specific behaviors in plain language
  - Example: "I will keep the Johnsons together. I will mix bride's side with groom's side. I will seat the VIPs at tables 1-3."
- Confirmation includes a "Sounds good" button to accept and a "Let me adjust" option to go back

### Functional Requirements for Guest Attribute Collection

- Event type determines which guest attributes to collect
  - Wedding: familyName, side (bride/groom/both)
  - Corporate: company, department, jobLevel
  - Networking: interests, goals
  - Team Building: team, department, managementLevel
- Guest import (CSV) and manual entry forms show relevant fields based on event type
- Missing required attributes show clear prompts during seating generation

### Non-Functional Requirements

- Page load time under 200ms for configuration UI
- Configuration state persists if user navigates away and returns
- Works on mobile devices (responsive design)
- Accessible: keyboard navigation, screen reader support
- All user-facing text follows VOICE_AND_TONE.md guidelines

## Assumptions

- Users know their event type before starting configuration
- One event type per event (no hybrid events)
- The underlying algorithm weights remain the same; only the input interface changes
- CSV import format can be extended to include new attributes

## Out of Scope

- Redesign of the actual seating assignment algorithm (only the configuration UI)
- Real-time seating preview during configuration
- Natural language input ("seat families together") - we use structured questions instead
- Multi-language support (English only for v1)
- A/B testing of different question phrasings

## UX Designs

[TODO: Link to Figma once created]

## Architecture/Diagrams

The configuration feature follows the existing Seatherder architecture with clear separation between the UI layer and Convex backend.

```
[Event Type Selector] --> [Question Flow Component] --> [Confirmation Display]
         |                         |                           |
         v                         v                           v
    [eventType]              [answers{}]                [seatingConfig]
         |                         |                           |
         +------------+------------+                           |
                      |                                        |
                      v                                        v
              [ConfigMapper Service]  <------------------  [Save to DB]
                      |
                      v
              [MatchingWeights]
```

**Component Breakdown:**
- **EventTypeWizard**: Parent component managing the multi-step flow
- **EventTypePicker**: Grid of event type cards with icons and descriptions
- **QuestionFlow**: Renders event-type-specific questions with answer options
- **ConfirmationCard**: Displays what I will do in plain language
- **ConfigMapper**: Pure function that maps answers to algorithm weights (not exposed to users)

## Infrastructure and Monitoring

**Infrastructure Impact:**

- No additional infrastructure required
- Database: Extend `matchingConfig` table with new fields for event type and answers
- Storage: Minimal - configuration is small JSON objects

**Monitoring Strategy:**

- Track event type selection distribution (which types are most common)
- Track question completion rates (do users finish the flow?)
- Monitor time spent on configuration page
- Log when users access "Advanced" settings (indicates possible UX gaps)

---

## Technical Approach

### Event Type Selection

#### 1. [UI] Event Type Picker Component

1. **Depends On**: N/A
2. **Description**: Create a visual picker showing all event types as selectable cards. Replaces the current event type selector with enhanced Seatherder-voice descriptions.
3. **Visual Reference**: Grid of 6 cards (2x3 on desktop, 1-column on mobile). Each card has icon, name, tagline, and selection state.
4. **Implementation**:
   a. Create new component `SeatingTypeSelector` in `/src/components/seating-type-selector.tsx`
      i. Extend existing `EventTypeSelector` pattern but with Seatherder voice
      ii. Include animated selection state with border highlight
   b. Event type definitions with voice-appropriate copy:
   ```typescript
   export const SEATING_EVENT_TYPES = {
     wedding: {
       id: "wedding",
       name: "Wedding",
       tagline: "I understand weddings.",
       description: "I will keep families together. Or not. You tell me.",
       icon: Heart,
     },
     corporate: {
       id: "corporate",
       name: "Corporate Conference",
       tagline: "I will help them network.",
       description: "Same company? Different company? I can mix or match.",
       icon: Building2,
     },
     // ... etc
   }
   ```
   c. Selection triggers state update and reveals question flow
5. **Acceptance Criteria**:
   a. All 6 event types display with icons and Seatherder-voice descriptions
   b. Selecting a type highlights it and scrolls to questions
   c. Only one type can be selected at a time
   d. Selection persists across page refreshes
   e. Responsive layout works on mobile

#### 2. [DB] Extend matchingConfig Schema

1. **Depends On**: N/A
2. **Description**: Extend the matchingConfig table to store event type, question answers, and derived configuration in addition to raw weights.
3. **Implementation**:
   a. Update `convex/schema.ts` to add new fields:

| Field           | Type                      | Description                                                 |
| --------------- | ------------------------- | ----------------------------------------------------------- |
| eventId         | Id<"events">              | Foreign key to events table                                 |
| seatingType     | string (optional)         | "wedding" / "corporate" / "networking" / "team" / "social" / "custom" |
| answers         | object (optional)         | JSON object storing question answers by question ID         |
| weights         | object (required)         | Existing weights object (auto-derived from answers)         |
| isAdvancedMode  | boolean (optional)        | Whether user manually adjusted weights                      |
| updatedAt       | string                    | ISO timestamp                                               |

   b. Create migration to add new fields to existing records
   c. Update `matchingConfig.ts` validators
4. **Acceptance Criteria**:
   a. Schema validates new field types
   b. Existing configs continue to work (backward compatible)
   c. New configs can store seatingType and answers

### Wedding Event Type Flow

#### 3. [UI] Wedding Question Flow

1. **Depends On**: [UI] Event Type Picker Component
2. **Description**: Implement the wedding-specific question flow with 3 questions about family seating, side mixing, and VIPs.
3. **Visual Reference**: Vertical stack of 3 question cards, each with radio button options
4. **Implementation**:
   a. Question 1 - Family Grouping:
   ```typescript
   {
     id: "family_grouping",
     question: "Same last name, same table?",
     options: [
       {
         id: "together",
         label: "Keep families together",
         description: "The Johnsons sit with the Johnsons. Less chaos.",
       },
       {
         id: "mix",
         label: "Mix them up",
         description: "Uncle Bob meets Aunt Sue's coworker. More interesting.",
       },
       {
         id: "some",
         label: "Keep immediate family only",
         description: "Parents with their kids. Cousins can roam.",
       },
     ],
     default: "together",
   }
   ```
   b. Question 2 - Side Mixing:
   ```typescript
   {
     id: "side_mixing",
     question: "Bride's side meets groom's side?",
     options: [
       {
         id: "separate",
         label: "Keep sides separate",
         description: "Traditional. Each side with their own.",
       },
       {
         id: "mix",
         label: "Mix the sides",
         description: "They are one family now. I will introduce them.",
       },
       {
         id: "some_mix",
         label: "Mix a little",
         description: "Some shared tables, some separate. Balance.",
       },
     ],
     default: "some_mix",
   }
   ```
   c. Question 3 - VIP Handling:
   ```typescript
   {
     id: "vip_handling",
     question: "VIP tables?",
     options: [
       {
         id: "yes",
         label: "Yes, I have VIPs",
         description: "Tell me who. I will seat them at tables 1-3.",
       },
       {
         id: "no",
         label: "No VIPs",
         description: "Everyone is equal. I like this.",
       },
     ],
     default: "no",
   }
   ```
   d. Render questions using shared `QuestionCard` component
5. **Acceptance Criteria**:
   a. All 3 questions render with correct options
   b. Options show Seatherder-voice descriptions
   c. Default selections are applied on load
   d. Answers persist to state and database
   e. Changing answer updates confirmation message

#### 4. [SERVICE] Wedding Config Mapper

1. **Depends On**: [UI] Wedding Question Flow
2. **Description**: Pure function that maps wedding answers to algorithm weights.
3. **Implementation**:
   a. Create mapper in `/src/lib/config-mappers/wedding.ts`:
   ```typescript
   export function mapWeddingAnswersToWeights(
     answers: WeddingAnswers
   ): MatchingWeights {
     const weights: MatchingWeights = { ...DEFAULT_WEIGHTS };

     // Family grouping
     if (answers.family_grouping === "together") {
       weights.departmentMix = -0.9; // Negative = keep same "department" (family) together
     } else if (answers.family_grouping === "mix") {
       weights.departmentMix = 0.8; // Positive = mix families
     } else {
       weights.departmentMix = 0.3; // Mild mixing
     }

     // Side mixing maps to custom tag handling
     // (Implemented via constraint system or custom weight)

     // VIP handling
     // (Implemented via pin constraints, not weights)

     return weights;
   }
   ```
   b. Include unit tests for all answer combinations
4. **Acceptance Criteria**:
   a. All answer combinations produce valid weights
   b. Extreme answers produce extreme weights (-1 to 1 range)
   c. Default answers produce balanced weights
   d. Unit tests cover edge cases

### Corporate Conference Event Type Flow

#### 5. [UI] Corporate Conference Question Flow

1. **Depends On**: [UI] Event Type Picker Component
2. **Description**: Implement corporate conference questions about company mixing, job level mixing, and round strategy.
3. **Implementation**:
   a. Question 1 - Company Mixing:
   ```typescript
   {
     id: "company_mixing",
     question: "Same company, same table?",
     options: [
       {
         id: "separate",
         label: "No. Mix the companies.",
         description: "They came to network. I will make them.",
       },
       {
         id: "together",
         label: "Keep colleagues together",
         description: "They prefer the familiar. I understand.",
       },
       {
         id: "some_together",
         label: "One colleague max per table",
         description: "A safety buddy. But still networking.",
       },
     ],
     default: "separate",
   }
   ```
   b. Question 2 - Job Level:
   ```typescript
   {
     id: "job_level",
     question: "Mix executives with everyone?",
     options: [
       {
         id: "mix",
         label: "Mix all levels",
         description: "The intern meets the CEO. Exciting.",
       },
       {
         id: "separate",
         label: "Similar levels together",
         description: "Peers with peers. Less intimidating.",
       },
       {
         id: "strategic",
         label: "Strategic mixing",
         description: "Juniors with seniors. Mentorship happens.",
       },
     ],
     default: "strategic",
   }
   ```
   c. Question 3 - Rounds:
   ```typescript
   {
     id: "rounds",
     question: "Multiple rounds?",
     options: [
       {
         id: "one",
         label: "One round",
         description: "They sit. They stay. Simple.",
       },
       {
         id: "two",
         label: "Two rounds",
         description: "Twice the connections. I will not repeat tablemates.",
       },
       {
         id: "three",
         label: "Three rounds",
         description: "Maximum networking. I will keep it fresh.",
       },
     ],
     default: "two",
   }
   ```
5. **Acceptance Criteria**:
   a. All 3 questions render with Seatherder voice
   b. Answers map correctly to weights
   c. Round selection updates event numberOfRounds

#### 6. [SERVICE] Corporate Config Mapper

1. **Depends On**: [UI] Corporate Conference Question Flow
2. **Description**: Maps corporate conference answers to weights and event settings.
3. **Implementation**:

| Answer Combination       | departmentMix | jobLevelDiversity | repeatAvoidance |
| ------------------------ | ------------- | ----------------- | --------------- |
| separate + mix + three   | 1.0           | 0.8               | 1.0             |
| separate + strategic     | 0.9           | 0.5               | 0.95            |
| together + separate      | -0.5          | -0.3              | 0.7             |
| some_together + mix      | 0.6           | 0.8               | 0.9             |

4. **Acceptance Criteria**:
   a. Mapper produces weights within valid ranges
   b. Round selection updates event configuration
   c. Test coverage for all combinations

### Networking Event Type Flow

#### 7. [UI] Networking Event Question Flow

1. **Depends On**: [UI] Event Type Picker Component
2. **Description**: Networking events focus on connection goals and industry mixing.
3. **Implementation**:
   a. Question 1 - Goal:
   ```typescript
   {
     id: "goal",
     question: "What is the goal?",
     options: [
       {
         id: "max_new",
         label: "Maximum new connections",
         description: "They meet as many new people as possible.",
       },
       {
         id: "shared_interest",
         label: "Shared interests",
         description: "AI people with AI people. Common ground.",
       },
       {
         id: "complementary",
         label: "Complementary goals",
         description: "Mentors with mentees. Investors with founders.",
       },
     ],
     default: "max_new",
   }
   ```
   b. Question 2 - Industry:
   ```typescript
   {
     id: "industry",
     question: "Mix industries?",
     options: [
       {
         id: "mix",
         label: "Mix them all",
         description: "Healthcare meets fintech. Fresh perspectives.",
       },
       {
         id: "group",
         label: "Group by industry",
         description: "They speak the same language.",
       },
     ],
     default: "mix",
   }
   ```
5. **Acceptance Criteria**:
   a. Questions reflect networking priorities
   b. Goal-based answers map to goalCompatibility weight
   c. Industry answer maps to departmentMix

### Team Building Event Type Flow

#### 8. [UI] Team Building Question Flow

1. **Depends On**: [UI] Event Type Picker Component
2. **Description**: Team building focuses on breaking silos and cross-pollination.
3. **Implementation**:
   a. Question 1 - Team Mixing:
   ```typescript
   {
     id: "team_mixing",
     question: "Break up existing teams?",
     options: [
       {
         id: "break",
         label: "Break them up",
         description: "Engineering meets marketing. Walls come down.",
       },
       {
         id: "keep",
         label: "Keep teams together",
         description: "Strengthen existing bonds.",
       },
       {
         id: "partial",
         label: "Mix some, keep some",
         description: "One teammate for comfort. New friends too.",
       },
     ],
     default: "break",
   }
   ```
   b. Question 2 - Management:
   ```typescript
   {
     id: "management",
     question: "Managers with their reports?",
     options: [
       {
         id: "separate",
         label: "Separate them",
         description: "People speak more freely without the boss.",
       },
       {
         id: "together",
         label: "Keep them together",
         description: "Leadership visibility matters.",
       },
       {
         id: "mix_levels",
         label: "Mix management levels",
         description: "Skip-levels meet. Ideas flow.",
       },
     ],
     default: "separate",
   }
   ```
5. **Acceptance Criteria**:
   a. Team mixing maps to departmentMix
   b. Management answer maps to jobLevelDiversity
   c. Answers produce cross-functional seating

### Dinner Party / Social Event Type Flow

#### 9. [UI] Dinner Party Question Flow

1. **Depends On**: [UI] Event Type Picker Component
2. **Description**: Social events focus on couples, friends, and shared interests.
3. **Implementation**:
   a. Question 1 - Couples:
   ```typescript
   {
     id: "couples",
     question: "Couples sit together?",
     options: [
       {
         id: "together",
         label: "Keep couples together",
         description: "Partners side by side. Traditional.",
       },
       {
         id: "separate",
         label: "Separate couples",
         description: "They can talk at home. Meet new people.",
       },
       {
         id: "same_table",
         label: "Same table, not adjacent",
         description: "They can see each other. But mingle.",
       },
     ],
     default: "same_table",
   }
   ```
   b. Question 2 - Interests:
   ```typescript
   {
     id: "interests",
     question: "Group by interests?",
     options: [
       {
         id: "group",
         label: "Similar interests together",
         description: "Book club at one table. Sports fans at another.",
       },
       {
         id: "mix",
         label: "Mix interests",
         description: "Diverse conversations. New discoveries.",
       },
     ],
     default: "mix",
   }
   ```
5. **Acceptance Criteria**:
   a. Couples logic maps to custom constraint handling
   b. Interest answer maps to interestAffinity weight

### Custom / Something Else Flow

#### 10. [UI] Custom Event Type Flow

1. **Depends On**: [UI] Event Type Picker Component
2. **Description**: Fallback for events that do not fit other categories. Guided wizard with simplified options.
3. **Implementation**:
   a. Opening message:
   ```typescript
   {
     message: "I do not recognize this type of event. That is okay. I can still help.",
     subtext: "Answer a few questions and I will figure out the rest.",
   }
   ```
   b. Question 1 - Primary Goal:
   ```typescript
   {
     id: "primary_goal",
     question: "What matters most?",
     options: [
       {
         id: "mix",
         label: "Meet new people",
         description: "Maximum mingling. I will shuffle them.",
       },
       {
         id: "group",
         label: "Stay with familiar faces",
         description: "Comfort over novelty. I get it.",
       },
       {
         id: "balance",
         label: "Balance of both",
         description: "Some new, some known. I can do that.",
       },
     ],
     default: "balance",
   }
   ```
   c. Question 2 - Hierarchy:
   ```typescript
   {
     id: "hierarchy",
     question: "Does seniority matter?",
     options: [
       {
         id: "yes",
         label: "Yes, consider it",
         description: "I will be thoughtful about levels.",
       },
       {
         id: "no",
         label: "No, ignore it",
         description: "Everyone is equal here.",
       },
     ],
     default: "no",
   }
   ```
   d. Include optional "Show advanced settings" link that reveals weight sliders for power users
5. **Acceptance Criteria**:
   a. Custom flow works for undefined event types
   b. Answers map to reasonable weight defaults
   c. Advanced settings toggle reveals full slider interface

### Confirmation Display

#### 11. [UI] Confirmation Message Component

1. **Depends On**: All question flows (3-10)
2. **Description**: Display what I will do based on user selections. Uses Seatherder voice to explain seating behavior.
3. **Implementation**:
   a. Create `ConfirmationCard` component in `/src/components/confirmation-card.tsx`
   b. Template structure:
   ```typescript
   interface ConfirmationMessage {
     headline: string;    // "I understand. Here is what I will do."
     behaviors: string[]; // List of 2-4 specific behaviors
     cta: string;         // "Sounds good"
   }
   ```
   c. Example wedding confirmation:
   ```typescript
   {
     headline: "I understand weddings. Here is the plan.",
     behaviors: [
       "I will keep families together. The Johnsons stay with the Johnsons.",
       "I will mix bride's side with groom's side at some tables.",
       "No VIP tables. Everyone gets equal treatment.",
     ],
     cta: "Let me work",
   }
   ```
   d. Example corporate confirmation:
   ```typescript
   {
     headline: "I understand conferences. Here is the plan.",
     behaviors: [
       "I will separate colleagues from the same company.",
       "I will seat juniors with seniors. Mentorship happens.",
       "Two rounds. Different tablemates each time.",
       "I will not repeat tablemates across rounds.",
     ],
     cta: "Let me work",
   }
   ```
   e. Include "Adjust" button to return to questions
5. **Acceptance Criteria**:
   a. Confirmation generates dynamically from answers
   b. All behaviors are in Seatherder voice (first person, short sentences)
   c. CTA button saves configuration and closes wizard
   d. Adjust button returns to questions with answers preserved

### Guest Attribute Collection

#### 12. [UI] Dynamic Guest Form Fields

1. **Depends On**: [DB] Extend matchingConfig Schema
2. **Description**: Show relevant guest attributes based on event type during manual entry and CSV import.
3. **Implementation**:
   a. Define attribute requirements per event type:

| Event Type | Required Fields      | Optional Fields              |
| ---------- | -------------------- | ---------------------------- |
| wedding    | name, familyName     | side, dietary                |
| corporate  | name, company        | department, jobLevel, goals  |
| networking | name                 | interests, goals, company    |
| team       | name, team           | department, managementLevel  |
| social     | name                 | partnerName, interests       |
| custom     | name                 | department, interests, goals |

   b. Update `GuestForm` component to accept event type and show relevant fields
   c. Update CSV upload to show column mapping based on event type
   d. Add validation messages in Seatherder voice:
   ```typescript
   {
     familyName: "I need their family name to group them correctly.",
     side: "Bride's side or groom's side? I need to know.",
     company: "Which company? I want to mix them up.",
   }
   ```
5. **Acceptance Criteria**:
   a. Form fields change based on event type
   b. Required fields show clear validation
   c. CSV template downloads update per event type
   d. Missing data shows helpful prompts

#### 13. [DB] Extend guests Schema for New Attributes

1. **Depends On**: N/A
2. **Description**: Add new guest attributes required by event types.
3. **Implementation**:
   a. Update `convex/schema.ts` guests table:

| Field           | Type             | Description                                   |
| --------------- | ---------------- | --------------------------------------------- |
| familyName      | string (optional)| Last name for family grouping (wedding)       |
| side            | string (optional)| "bride" / "groom" / "both" (wedding)          |
| company         | string (optional)| Company name for mixing (corporate/networking)|
| team            | string (optional)| Team name (team building)                     |
| managementLevel | string (optional)| "ic" / "manager" / "director" / "exec"        |
| partnerName     | string (optional)| Partner/spouse name for couple handling       |

   b. Existing `department` field repurposed for group/department context
   c. Existing `attributes` object remains for interests, goals, jobLevel
4. **Acceptance Criteria**:
   a. New fields validate correctly
   b. Existing guests remain compatible
   c. Indexes support efficient queries

### Wizard Integration

#### 14. [UI] Seating Configuration Wizard Page

1. **Depends On**: All previous UI tasks (1, 3, 5, 7-11)
2. **Description**: Replace current matching settings page with the new wizard-based configuration.
3. **Implementation**:
   a. Create new page component at `/src/app/(app)/event/[id]/seating/page.tsx`
   b. Wizard flow:
      i. Step 1: Event type selection (if not already set)
      ii. Step 2: Event-type-specific questions
      iii. Step 3: Confirmation display
   c. Show current configuration if already set (edit mode)
   d. Header uses Seatherder voice:
   ```typescript
   {
     title: "How should I seat your guests?",
     subtitle: "Tell me about your event. I will figure out the rest.",
   }
   ```
   e. Preserve back navigation to event page
5. **Acceptance Criteria**:
   a. Wizard progresses through steps smoothly
   b. Back button works at each step
   c. Saved configuration can be edited
   d. Page is accessible via event navigation

#### 15. [UI] Navigation and Entry Points

1. **Depends On**: [UI] Seating Configuration Wizard Page
2. **Description**: Update navigation to use new seating configuration instead of old matching settings.
3. **Implementation**:
   a. Update event page to link to `/event/[id]/seating` instead of `/event/[id]/matching`
   b. Add prominent "Configure Seating" card if event has no configuration yet:
   ```typescript
   {
     icon: Sparkles,
     title: "I need to know your event type",
     description: "Tell me about your event and I will seat everyone.",
     cta: "Configure Seating",
   }
   ```
   c. If configured, show summary card with current settings
   d. Keep old matching page accessible via "Advanced Settings" link for power users
5. **Acceptance Criteria**:
   a. New users see clear path to configuration
   b. Existing configurations show summary
   c. Advanced users can still access weight sliders

### Algorithm Mapping Reference

#### 16. [SERVICE] Complete Config Mapper Module

1. **Depends On**: Individual mappers (4, 6)
2. **Description**: Create unified mapping service that converts any event type answers to weights.
3. **Implementation**:
   a. Create `/src/lib/config-mappers/index.ts` as unified entry point
   b. Complete mapping reference table:

| Event Type | Answer Key        | Answer Value    | departmentMix | interestAffinity | jobLevelDiversity | goalCompatibility | repeatAvoidance |
| ---------- | ----------------- | --------------- | ------------- | ---------------- | ----------------- | ----------------- | --------------- |
| wedding    | family_grouping   | together        | -0.9          | 0.0              | 0.0               | 0.0               | 0.5             |
| wedding    | family_grouping   | mix             | 0.8           | 0.0              | 0.0               | 0.0               | 0.5             |
| wedding    | family_grouping   | some            | 0.3           | 0.0              | 0.0               | 0.0               | 0.5             |
| wedding    | side_mixing       | separate        | (no change)   | 0.0              | 0.0               | 0.0               | 0.0             |
| wedding    | side_mixing       | mix             | +0.2 bonus    | 0.0              | 0.0               | 0.0               | 0.0             |
| corporate  | company_mixing    | separate        | 0.95          | 0.0              | 0.0               | 0.0               | 0.0             |
| corporate  | company_mixing    | together        | -0.7          | 0.0              | 0.0               | 0.0               | 0.0             |
| corporate  | company_mixing    | some_together   | 0.5           | 0.0              | 0.0               | 0.0               | 0.0             |
| corporate  | job_level         | mix             | 0.0           | 0.0              | 0.9               | 0.0               | 0.0             |
| corporate  | job_level         | separate        | 0.0           | 0.0              | -0.5              | 0.0               | 0.0             |
| corporate  | job_level         | strategic       | 0.0           | 0.0              | 0.4               | 0.6               | 0.0             |
| networking | goal              | max_new         | 0.9           | -0.3             | 0.7               | 0.0               | 1.0             |
| networking | goal              | shared_interest | 0.4           | 0.9              | 0.3               | 0.0               | 0.8             |
| networking | goal              | complementary   | 0.6           | 0.4              | 0.5               | 0.95              | 0.9             |
| team       | team_mixing       | break           | 0.95          | 0.0              | 0.0               | 0.0               | 0.0             |
| team       | team_mixing       | keep            | -0.8          | 0.0              | 0.0               | 0.0               | 0.0             |
| team       | management        | separate        | 0.0           | 0.0              | 0.8               | 0.0               | 0.0             |
| team       | management        | together        | 0.0           | 0.0              | -0.6              | 0.0               | 0.0             |
| social     | couples           | together        | -0.9          | 0.0              | 0.0               | 0.0               | 0.0             |
| social     | couples           | separate        | 0.7           | 0.0              | 0.0               | 0.0               | 0.0             |
| social     | interests         | group           | 0.0           | 0.9              | 0.0               | 0.0               | 0.0             |
| social     | interests         | mix             | 0.0           | -0.2             | 0.0               | 0.0               | 0.0             |
| custom     | primary_goal      | mix             | 0.8           | -0.2             | 0.6               | 0.3               | 0.9             |
| custom     | primary_goal      | group           | -0.5          | 0.7              | -0.3              | 0.5               | 0.6             |
| custom     | primary_goal      | balance         | 0.4           | 0.3              | 0.3               | 0.4               | 0.8             |

   c. Include weight combination logic (answers are additive with clamping)
4. **Acceptance Criteria**:
   a. All event type + answer combinations produce valid weights
   b. Combined answers do not exceed -1 to 1 range
   c. Comprehensive unit test coverage
   d. Mapping is deterministic and reproducible

### Edge Cases and Error Handling

#### 17. [SERVICE] Missing Data Handler

1. **Depends On**: [UI] Dynamic Guest Form Fields
2. **Description**: Handle cases where guests are missing required attributes for the selected event type.
3. **Implementation**:
   a. Before generating assignments, validate guest data completeness
   b. Missing data prompts in Seatherder voice:
   ```typescript
   {
     wedding_no_family: "I do not know their family names. I cannot group families without this.",
     corporate_no_company: "I do not know their companies. I will treat them all as one company.",
     networking_no_interests: "No interests listed. I will mix randomly. That is also fine.",
   }
   ```
   c. Options for handling missing data:
      i. Block generation until data is added
      ii. Proceed with fallback logic
      iii. Prompt user to update guests
   d. Show data completeness indicator on event page
5. **Acceptance Criteria**:
   a. Missing required data shows clear warning
   b. User can proceed with fallback or fix data
   c. Fallback logic is sensible and documented
   d. Warnings use Seatherder voice

#### 18. [UI] Empty State and First-Time Experience

1. **Depends On**: [UI] Seating Configuration Wizard Page
2. **Description**: Handle new events with no configuration yet.
3. **Implementation**:
   a. Empty state for unconfigured events:
   ```typescript
   {
     icon: HelpCircle,
     headline: "I do not know what kind of event this is.",
     message: "Tell me and I will seat your guests appropriately.",
     cta: "Tell me about this event",
   }
   ```
   b. First-time user guidance:
   ```typescript
   {
     tip: "This takes about 30 seconds. I ask 2-3 questions. You answer. I work.",
   }
   ```
   c. Success state after configuration:
   ```typescript
   {
     icon: Check,
     headline: "I am ready.",
     message: "I know what to do. Generate assignments when you are ready.",
   }
   ```
5. **Acceptance Criteria**:
   a. Empty state is friendly and actionable
   b. Configuration success is celebrated appropriately
   c. User knows their next step at all times

## Open Questions/Concerns

1. **Couples Handling**: How do we identify couples in guest data? Require explicit `partnerName` field or infer from same last name + address?

2. **VIP Tables**: Should VIP table assignment be a constraint (always tables 1-3) or configurable? How do we handle more VIPs than VIP tables?

3. **Hybrid Events**: What if an event is both a wedding AND a corporate event (company wedding)? Support one primary type with optional secondary considerations?

4. **Weight Tuning**: Should the mapping table weights be adjustable by admins without code changes? Consider storing in database or config file?

5. **Preset Migration**: Existing events using old presets (balanced, maxDiversity) - migrate to new system or maintain backward compatibility indefinitely?

6. **Round Count**: Currently rounds are set in question flow for some event types. Should this be separate from seating configuration or unified?

7. **Constraint Integration**: The wedding VIP handling and couple separation use the constraint system (pin/repel). How does this integrate with the new wizard UX?
