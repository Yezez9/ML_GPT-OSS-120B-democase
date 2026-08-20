# MLBB Hero Insights — Chatbot Context

This file is the grounding context for the AI chatbot. It summarizes the
full scraped dataset (133 heroes, not just the heroes shown in the
project's charts) so the chatbot can answer questions about any hero,
role, or pattern — not only the top 10.

**Data snapshot:** Mobile Legends: Bang Bang hero statistics, single-day
snapshot dated **August 18, 2026**. All rates below are as of this date
and do not represent long-term trends.

**Dataset shape:** 133 heroes × 9 stat/category columns
(`Hero_Pickrate`, `Hero_Banrate`, `Hero_winrate`, `Hero_Specialty_1/2`,
`Hero_Role_1/2`, `Hero_Lane_1/2`).

---

## 1. Dataset-wide summary statistics

| Metric | Mean | Min | Max |
|---|---|---|---|
| Pick Rate (%) | 0.75 | 0.06 (Yve, Chip) | 3.41 (Hanabi) |
| Ban Rate (%) | 6.37 | 0.05 | 59.37 (Belerick) |
| Win Rate (%) | 49.75 | 42.10 (Granger) | 58.50 (Marcel) |

The average win rate across all 133 heroes sits almost exactly at 50%,
which is expected for a balanced live-service game — most heroes cluster
close to even, and the "top 10" charts only show the tails of a much
flatter overall distribution.

---

## 2. Role distribution (Hero_Role_1 — primary role)

| Role | # of Heroes | Avg Win Rate | Avg Ban Rate | Avg Pick Rate |
|---|---|---|---|---|
| Fighter | 37 | 49.89% | 4.90% | 0.69% |
| Mage | 25 | 49.51% | 3.42% | 0.75% |
| Marksman | 20 | 49.13% | 3.09% | 1.02% |
| Assassin | 20 | 49.21% | 8.67% | 0.79% |
| Tank | 18 | 50.01% | 9.80% | 0.72% |
| Support | 13 | **51.22%** | **12.96%** | 0.52% |

**Key pattern:** Support has the fewest heroes (13) but the **highest
average win rate and highest average ban rate** of any role. This means
support heroes are disproportionately impactful relative to how many
exist — a strong, defensible insight for the chatbot to surface if asked
"which role is strongest" or "why is Marcel banned so much."

Fighter is the most populous role (37 heroes, nearly 28% of the roster)
but sits almost exactly at the dataset average in every metric — a large,
balanced category rather than a standout one.

23 heroes have a **secondary role** (`Hero_Role_2` populated), most
commonly Assassin (9), Tank (7), Fighter (7), and Mage (7) as the
secondary tag — reflecting hybrid heroes like Masha (Fighter/Tank).

---

## 3. Lane distribution (Hero_Lane_1)

| Lane | # of Heroes |
|---|---|
| Jungle | 31 |
| Roam | 28 |
| Exp Lane | 28 |
| Mid Lane | 27 |
| Gold Lane | 19 |

Gold Lane has the fewest dedicated heroes (19), consistent with it being
traditionally Marksman-dominated — a narrower hero pool than the other
four lanes.

---

## 4. Specialty distribution

**Primary specialty (Hero_Specialty_1), most common:**
Chase (22), Finisher (18), Burst (17), Damage (13), Crowd Control (10)

**Secondary specialty (Hero_Specialty_2), most common:**
Burst (34), Damage (26), Crowd Control (12), Finisher (9)

"Burst" is rare as a primary specialty but the single most common
secondary specialty — suggesting many heroes are built around a core
identity (Chase, Finisher, Damage) with burst damage as a supporting trait
rather than their defining trait.

---

## 5. Top performers (highest win rate, full list top 15)

| Hero | Win Rate | Ban Rate | Pick Rate | Role |
|---|---|---|---|---|
| Marcel | 58.50% | 32.48% | 0.27% | Support |
| Rafaela | 57.87% | 9.76% | 0.96% | Support |
| Masha | 57.21% | 0.36% | 0.11% | Fighter |
| Melissa | 56.04% | 8.60% | 1.47% | Marksman |
| Gloo | 54.87% | 48.95% | 0.66% | Tank |
| Hanzo | 54.76% | 10.80% | 0.77% | Assassin |
| Khufra | 54.61% | 2.47% | 0.34% | Tank |
| Lolita | 54.44% | 0.36% | 0.09% | Support |
| Argus | 54.32% | 0.83% | 0.34% | Fighter |
| Minotaur | 54.24% | 5.01% | 0.81% | Tank |
| Floryn | 53.90% | 19.62% | 1.09% | Support |
| Sun | 53.27% | 42.50% | 1.51% | Fighter |
| Atlas | 53.24% | 23.56% | 1.05% | Tank |
| Miya | 53.21% | 16.45% | 3.34% | Marksman |
| Belerick | 53.20% | 59.37% | 1.56% | Tank |

Notable: **Masha, Lolita, and Argus are all "hidden gem" heroes** — top-15
win rate but under 1% pick rate and under 1% ban rate, meaning almost
nobody plays them or bans them, yet they perform exceptionally well when
picked. This is a strong answer for "what's an underrated hero I should
try."

---

## 6. Weakest performers (lowest win rate, bottom 10)

| Hero | Win Rate | Ban Rate | Pick Rate | Role |
|---|---|---|---|---|
| Granger | 42.10% | 2.18% | 1.29% | Marksman |
| Fanny | 42.33% | 2.51% | 0.59% | Assassin |
| Franco | 43.15% | 5.46% | 1.09% | Tank |
| Kalea | 43.38% | 0.41% | 0.12% | Support |
| Lancelot | 43.45% | 0.70% | 0.54% | Assassin |
| Mathilda | 44.61% | 0.32% | 0.16% | Support |
| Valentina | 44.70% | 0.13% | 0.16% | Mage |
| Karina | 45.65% | 1.83% | 0.52% | Assassin |
| Gatotkaca | 45.76% | 0.51% | 0.62% | Tank |
| Tigreal | 45.81% | 8.29% | 1.94% | Tank |

Notable: **Granger and Fanny are both mechanically demanding, historically
popular heroes** with relatively low win rates but non-trivial pick rates
(1.29% and 0.59%) — a pattern consistent with high-skill-ceiling heroes
that many players pick but few play optimally, dragging the average win
rate down despite the hero's real power ceiling being high. This is a
useful caveat for the chatbot to offer if asked "is Granger bad" — low
average win rate doesn't necessarily mean low power level.

---

## 7. Most picked heroes (top 10 by pick rate)

| Hero | Pick Rate | Win Rate | Role |
|---|---|---|---|
| Hanabi | 3.41% | 53.06% | Marksman |
| Miya | 3.34% | 53.21% | Marksman |
| Eudora | 2.15% | 52.40% | Mage |
| Dyrroth | 1.98% | 49.93% | Fighter |
| Tigreal | 1.94% | 45.81% | Tank |
| Vexana | 1.89% | 50.12% | Mage |
| Lesley | 1.86% | 46.88% | Marksman |
| Yi Sun-shin | 1.72% | 51.57% | Assassin |
| Paquito | 1.72% | 50.74% | Fighter |
| Angela | 1.67% | 49.01% | Support |
| Belerick | 1.56% | 53.20% | Tank |

Marksman dominates the most-picked list (Hanabi, Miya, Lesley all
appear), consistent with Marksman having the highest average pick rate of
any role (1.02%, from Section 2) — beginner-friendly, always-relevant
role in most match compositions.

**Tigreal is a notable outlier**: high pick rate (1.94%, top 5) but a
below-average win rate (45.81%) — likely picked reflexively as a
"default tank" rather than for strong performance, another good nuance
for the chatbot to surface.

---

## 8. Least picked heroes (bottom 10 — niche/underused)

| Hero | Pick Rate | Win Rate | Role |
|---|---|---|---|
| Yve | 0.06% | 51.01% | Mage |
| Chip | 0.06% | 48.78% | Support |
| Baxia | 0.08% | 46.87% | Tank |
| Lolita | 0.09% | 54.44% | Support |
| Faramis | 0.09% | 50.84% | Support |
| Masha | 0.11% | 57.21% | Fighter |
| Kalea | 0.12% | 43.38% | Support |
| Khaleed | 0.16% | 51.06% | Fighter |
| Zhuxin | 0.16% | 47.54% | Mage |
| Bruno | 0.16% | 48.02% | Marksman |

Mixed bag here: some of these (Masha, Lolita, Faramis) have strong win
rates despite being barely played — genuine hidden gems. Others (Kalea,
Baxia, Bruno) are both rarely played *and* underperforming — likely
heroes that are currently weak or out of meta favor.

---

## 9. Chart-derived insights (from the group's visualizations)

These three charts were built from the top-10 subsets of this same
dataset. The chatbot should treat these as illustrative highlights, not
the full picture — the sections above cover all 133 heroes.

**Chart: Top 10 Heroes — Win Rate vs Ban Rate**
Ban rate and win rate are not tightly correlated. Belerick has the
highest ban rate (59.37%) but only a mid-pack win rate (53.20%) among the
top group — banned more for disruptiveness/reputation than raw win
performance. Marcel and Saber show the opposite: high win rate, low ban
rate — efficient, under-the-radar picks.

**Chart: Top 10 Most Banned Heroes**
Belerick, Paquito, and Hirara lead ban rate, all well above 50%. This
list is a direct, reliable lookup for "which heroes will probably be
banned in ranked."

**Chart: Top 10 Heroes by Win Rate**
Only Marcel and Gloo appear in both this chart and the ban-rate
comparison chart — meaning most of the highest-win-rate heroes are
**not** heavily banned, reinforcing the "hidden gem" pattern seen
dataset-wide in Sections 5 and 6.

---

## 10. Chatbot guardrails (for system prompt use)

- This is a **single-day snapshot** (Aug 18, 2026) — do not present these
  rates as long-term meta trends or predict future balance changes.
- If asked about a hero, stat, or comparison not covered in this file,
  say the dataset doesn't have that level of detail rather than
  guessing.
- Win rate reflects average performance across all players who picked
  the hero that day — it is influenced by hero difficulty/skill ceiling,
  not purely raw power (see Granger/Fanny note in Section 6).
- Role and specialty fields may include a secondary value
  (`_2` columns) for hybrid heroes — check both fields when answering
  role-based questions.