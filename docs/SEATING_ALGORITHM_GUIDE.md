# Seating Algorithm Guide

How Seatherder's smart seating algorithm works and when to use each preset.

---

## Overview

When you ask me to assign tables, I consider multiple factors to create the best possible seating arrangement. I balance mixing people from different groups while ensuring they have enough in common for good conversation.

---

## The 5 Core Weights

Each weight controls a different aspect of how I seat your guests. Values range from **-1 to 1** (except Repeat Avoidance which is 0-1).

| Weight | What it Controls | Positive (+) | Negative (-) |
|--------|------------------|--------------|--------------|
| **Department Mix** | Should people from same department/company sit together? | Mix different departments | Keep same departments together |
| **Interest Affinity** | Should people with similar interests sit together? | Group similar interests | Mix different interests |
| **Job Level Diversity** | Should juniors sit with executives? | Mix all levels together | Keep similar levels together |
| **Goal Compatibility** | Should complementary networking goals be matched? | Match complementary goals | Ignore goals |
| **Repeat Avoidance** | (Multi-round) Avoid sitting with same people twice? | Strongly avoid repeats | Allow repeats |

---

## The 4 Presets

### Balanced (Default)

**Best for:** General events, team lunches, casual networking

| Weight | Value | Effect |
|--------|-------|--------|
| Department Mix | 0.8 | Mostly mixes departments |
| Interest Affinity | 0.3 | Slight preference for shared interests |
| Job Level Diversity | 0.5 | Moderate level mixing |
| Goal Compatibility | 0.4 | Some goal matching |
| Repeat Avoidance | 0.9 | Strong repeat avoidance |

**What happens:** I mix departments so Engineering does not all sit together, but I give people enough common ground (similar interests) so conversations flow naturally. Good for most situations.

---

### Maximum Diversity

**Best for:** Breaking silos, forcing cross-pollination, company all-hands, team building

| Weight | Value | Effect |
|--------|-------|--------|
| Department Mix | 1.0 | Maximum department mixing |
| Interest Affinity | -0.3 | Actively mixes different interests |
| Job Level Diversity | 1.0 | Maximum level mixing |
| Goal Compatibility | 0.2 | Mostly ignores goals |
| Repeat Avoidance | 1.0 | Never repeats tablemates |

**What happens:** I push people outside their comfort zones. No two people from the same department at a table if I can help it. Interns sit with VPs. People with different interests are grouped together to spark unexpected conversations.

---

### Group Similar

**Best for:** Interest-based meetups, affinity groups, topical discussions, study groups

| Weight | Value | Effect |
|--------|-------|--------|
| Department Mix | 0.3 | Light department mixing |
| Interest Affinity | 0.9 | Strongly groups by interest |
| Job Level Diversity | 0.2 | Keeps similar levels together |
| Goal Compatibility | 0.7 | Good goal matching |
| Repeat Avoidance | 0.8 | Moderate repeat avoidance |

**What happens:** I seat people with shared interests together. All the AI enthusiasts at one table, marketing folks at another. Seniors tend to sit with seniors. Good when the goal is deep discussion on specific topics.

---

### Networking Optimized

**Best for:** Business networking, investor events, job fairs, speed networking

| Weight | Value | Effect |
|--------|-------|--------|
| Department Mix | 0.7 | Good department mixing |
| Interest Affinity | 0.5 | Moderate interest grouping |
| Job Level Diversity | 0.6 | Good level mixing |
| Goal Compatibility | 0.9 | Maximum goal matching |
| Repeat Avoidance | 0.95 | Very high repeat avoidance |

**What happens:** I focus on creating valuable connections based on what people want to achieve. Someone looking for a mentor gets seated with investors (who often mentor). Recruiters sit with eager learners. I avoid putting two salespeople together (they would compete). Every round brings entirely new faces.

---

## Goal Compatibility

When you use Networking Optimized or set Goal Compatibility high, I consider what each guest wants to achieve:

| If a guest wants to... | I seat them with people who want to... | I avoid seating them with... |
|------------------------|----------------------------------------|------------------------------|
| **Find a Mentor** | Invest, Network, Recruit | Other mentor-seekers (they cannot help each other) |
| **Recruit Talent** | Learn, Find Mentor | Other recruiters (competition) |
| **Learn New Skills** | Recruit, Network, Learn | — |
| **Expand Network** | Network, Partner, Invest | — |
| **Find Partners** | Invest, Network, Partner | — |
| **Find Customers** | Invest, Partner, Network | Other salespeople (competition) |
| **Find Investment** | Partner, Sell, Find Mentor | — |

### Why these pairings work

- **Investors + Mentor-seekers:** Investors often enjoy mentoring promising people
- **Recruiters + Learners:** Eager learners make great candidates
- **Partners + Investors:** Natural business synergy
- **Networkers + Networkers:** They energize each other
- **Salespeople apart:** Two salespeople at a table compete instead of connect

---

## Cross-Event Memory

I remember who sat together at your previous events. Use the **New Connections Preference** slider to control this:

| Setting | What happens |
|---------|--------------|
| **0 (Ignore history)** | I do not consider past events. Repeat tablemates are fine. |
| **0.5 (Balanced)** | I gently encourage new connections while allowing some familiar faces. |
| **1 (Strongly prefer new)** | I strongly avoid seating people with anyone they sat with at your previous events. |

This is powerful for recurring events like monthly networking dinners or quarterly all-hands. Over time, everyone meets everyone.

---

## Constraints

Beyond the algorithm, you can set manual rules:

| Constraint | What it does |
|------------|--------------|
| **Pin** | Force a specific guest to a specific table. I will not move them. |
| **Repel** | Keep two guests apart. They will never be at the same table. |
| **Attract** | Encourage two guests to sit together. I will try to seat them together. |

Constraints override the algorithm. Use them for VIPs, accessibility needs, or known conflicts.

---

## Department Concentration

I use a non-linear penalty to prevent too many people from the same department at one table:

| People from same dept | Penalty level |
|-----------------------|---------------|
| 1 | Low |
| 2 | Medium |
| 3 | High |
| 4+ | Very high |

This means I strongly resist putting a 4th person from Engineering at a table that already has 3 engineers, even if other factors suggest it.

---

## Multi-Round Seating

When your event has multiple rounds:

1. **Round 1:** I use the full algorithm to create optimal initial seating
2. **Round 2+:** I add strong penalties for sitting with previous tablemates
3. **Travel distance:** I give a slight preference for tables near where guests sat before (less walking)

The Repeat Avoidance weight controls how strongly I avoid previous tablemates. At 1.0, I guarantee no repeats if mathematically possible.

---

## Quick Reference: Which Preset to Use

| Your Event | Recommended Preset |
|------------|-------------------|
| Company all-hands | Maximum Diversity |
| Breaking down team silos | Maximum Diversity |
| Startup pitch night | Networking Optimized |
| Investor meetup | Networking Optimized |
| Speed networking | Networking Optimized |
| Interest-based meetup | Group Similar |
| Book club dinner | Group Similar |
| Topic-focused workshop | Group Similar |
| General team dinner | Balanced |
| Casual networking | Balanced |
| Not sure | Balanced |

---

## Weddings

Weddings are different. I turn off the corporate weights (interest affinity, job level, networking goals) and focus on what actually matters: **families** and **sides**.

### How I Group Wedding Guests

For weddings, I use **Family Name** instead of department. All the Johnsons are one group. All the Garcias are another. This is the foundation of wedding seating.

I also track **Side** (bride or groom) when you want to respect traditional seating divisions.

### The 3 Wedding Questions

When you select Wedding in the wizard, I ask:

#### 1. Same last name, same table?

| Answer | What I do |
|--------|-----------|
| **Keep families together** | The Johnsons sit with the Johnsons. Less chaos, more comfort. |
| **Mix them up** | Uncle Bob meets Aunt Sue's coworker. More interesting, helps the families blend. |
| **Keep immediate family only** | Parents with their kids. Cousins can roam. A middle ground. |

#### 2. Bride's side meets groom's side?

| Answer | What I do |
|--------|-----------|
| **Keep sides separate** | Traditional. Each side with their own people. |
| **Mix the sides** | They are one family now. I will introduce them. |
| **Mix a little** | Some shared tables, some separate. A balance. |

#### 3. VIP tables?

| Answer | What I do |
|--------|-----------|
| **Yes, I have VIPs** | You mark the VIPs and tell me which tables are special. I will not seat random guests there. |
| **No VIPs** | Everyone is equal. I like this approach. |

### Wedding Weight Settings

When you answer the wedding questions, I set the weights like this:

| Weight | Wedding Setting | Why |
|--------|-----------------|-----|
| Department Mix | -0.9 to 0.8 | Controls family grouping (negative = keep together) |
| Interest Affinity | 0 | Turned off. Irrelevant for weddings. |
| Job Level Diversity | 0 | Turned off. Grandma does not care about org charts. |
| Goal Compatibility | 0 | Turned off. No one is networking at your wedding. |
| Repeat Avoidance | 0.5 | Lower than corporate events. Weddings rarely have multiple rounds. |

### Wedding Tips

- **Use Pin constraints** for the head table. Pin the wedding party to Table 1.
- **Use Repel constraints** for guests who should not be near each other. I do not ask questions.
- **Mark plus-ones** with the same family name as their partner so I keep them together.
- **Assign sides** if you want traditional bride/groom separation. Leave blank for mixed seating.

---

## Other Event Types

### Corporate Conference

I focus on company/department mixing and job level considerations. The wizard asks about:
- Same company together or apart?
- Mix executives with everyone?
- How many rounds?

### Team Building

I can break up existing teams or keep them together. The wizard asks about:
- Break up existing teams?
- Managers with their direct reports?

### Dinner Party / Social

I handle couples smartly. The wizard asks about:
- Couples together, apart, or same table but not adjacent?
- Group by interests?

### Custom / Something Else

You tell me what matters. I ask about:
- What is the primary goal?
- Does seniority matter?

The wizard asks questions in plain language. I translate your answers into the right weights.

---

## Still have questions?

The algorithm is designed to handle most situations automatically. If you have a unique scenario, try adjusting the sliders in the Matching Algorithm settings, or use constraints for specific guests.
