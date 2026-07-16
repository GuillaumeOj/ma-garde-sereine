# Shared care, hours, and the monthly declaration

Design notes for the *garde partagée* pay model: how hours are typed, how they are
split between families, and how a month is declared to pajemploi.

This document exists because the reasoning is expensive to reconstruct and almost
none of it is derivable from the code. The regulatory quotes are the load-bearing
part — if you change a threshold, change it here first.

**Scope: `garde d'enfants à domicile` only.** The `assistant maternel` case
(childminder at their own home) has a *different* set of rules — 45h conventional
week, `heures complémentaires`, a freely-negotiated majoration with a 10% floor —
and is deliberately not modelled. Do not generalise the constants below to it.

## 1. The regulatory ground truth

Source: URSSAF, [Le contrat de travail d'un salarié à domicile][urssaf-contrat],
section *"Les différents types d'heures"* → tab *"Garde d'enfants à domicile"*.
Convention collective: **IDCC 3239** (particuliers employeurs et emploi à domicile).

> **Heures normales :** elles correspondent aux heures habituelles de garde de
> l'enfant. La durée hebdomadaire conventionnelle de travail est fixée à
> **40 heures par semaine**.

> **Heures supplémentaires :** elles correspondent aux heures effectuées au-delà
> de 40 heures par semaine, dans la limite de la durée maximale de travail. Elles
> donnent lieu à une majoration de **25 % (pour les 8 premières heures)** et
> **50 % (pour les heures supplémentaires au-delà de 8 heures)**.

> **Heures de présence de nuit :** elles correspondent aux heures effectuées entre
> **20 heures et 6 heures 30**, et sont rémunérées par une **indemnité forfaitaire**
> dont le montant ne peut être inférieur à **un quart du salaire contractuel** versé
> pour une durée de travail effectif équivalente. Cette présence ne peut pas excéder
> 12 heures consécutives […]

> **Heures de présence responsable :** elles correspondent aux heures où la garde
> d'enfants peut utiliser son temps pour elle-même tout en restant vigilante pour
> intervenir s'il y a lieu. Une heure de présence responsable équivaut à
> **deux tiers d'une heure de travail effectif**.

So the weekly bands are:

| Weekly effective hours | Rate |
| --- | --- |
| 0 – 40 | normal |
| 41 – 48 (first 8 over) | +25% |
| 49+ | +50% |

A **secondary source claimed the bands were the 36th–43rd hour**. That is wrong for
IDCC 3239 — it is the generic 35h Code du travail rule leaking in. The 40h figure is
confirmed both by the URSSAF page quoted above and by the
[Code du travail numérique][cdtn-hs] (which also lists 45h — that is the
`assistant maternel` case, not ours).

> [!NOTE]
> `urssaf.fr` refuses our fetcher (the connection hangs), but plain `curl` with a
> browser User-Agent retrieves it fine. Use `curl` if you need to re-check these
> quotes.

### Not every "extra hour" is an overtime hour

This is the trap. Three different things a parent would casually call "extra hours"
are paid by three different mechanisms:

| Kind | Mechanism |
| --- | --- |
| Extra effective work (early morning, late afternoon) | Adds to the weekly total → may cross into +25% / +50% |
| **Présence de nuit** (20:00–06:30) | Flat **indemnity**, floor of ¼ of the contractual rate. **Not hours.** |
| **Présence responsable** | Counts as **⅔** of an effective hour |

Hence an exceptional-hours entry carries a **type**, never just a duration.

### Mensualisation

Regular care must be mensualised: the monthly salary is a fixed amount that does not
follow the calendar month's actual day count.

```
monthly_hours = weekly_hours × weeks_per_year ÷ 12
```

`weeks_per_year` is 52 for an *année complète* (47 worked weeks + 5 weeks of paid
leave). An *année incomplète* uses its own count. **The codebase had nowhere to store
this** — it is a new field.

Contractual overtime is mensualised the same way and keeps its band. A 45h/week
contract is *structurally* 40h normal + 5h at 25%, every week:

```
normal = 40 × 52 ÷ 12 = 173.33 h
at 25% =  5 × 52 ÷ 12 =  21.67 h
```

Which is why the planning can pre-fill the declaration: the schedule yields the
*structural* split, and only genuinely exceptional hours are typed by hand.

## 2. Splitting hours between families

### The constraint

pajemploi has **no way to split an hourly rate between two employers**. Each family
files its own declaration. So the split has to happen in the **hours**, not the rate:
each family declares the share of hours attributable to it, all at the same rate.

The invariant that must always hold:

> The hours declared by all families **sum to the hours the nanny actually worked**.
> Never more (the nanny is paid twice), never less (the nanny is underpaid).

### Why a per-family percentage does not work

The obvious model — one `share` percentage per family on the contract — dies on two
real cases:

1. **A family is absent on one weekday.** Wednesday is 0/100 while every other day is
   50/50. One percentage cannot be both.
2. **A child attends only part of the day.** Family A has kid1 all day and kid2 only
   after school (16:30–18:00); family B has one kid all day. Then 08:00–16:30 is
   50/50 but 16:30–18:00 is ⅔/⅓. **A family's weight is a function of the time of
   day**, not a property of the family.

Case 2 is the one that settles it. A static weight is wrong for part of every day.

### The model

Store **which children are present when**; *derive* the weight per time segment.

- **`Contract.split_method`** — `EQUAL` | `BY_CHILDREN`, agreed when the contract
  is signed. This is a genuine choice by the families, not something derivable:
  two families can have 2 and 1 children and still agree to split 50/50.
- **`ContractChild(contract, child)`** — which children this contract covers.
  (No `Contract`↔`Child` link existed before; `Child` only knew its `Family`.)
- **`ContractChildWindow(contract_child, weekday, start_time, end_time)`** —
  *optional*. **No window at all means the child is present whenever the nanny
  works**, which is the common case and therefore the default. Windows narrow a
  child to part of a day. If a child has any window, its presence is exactly the
  union of its windows.

> [!IMPORTANT]
> "Has any window" is evaluated **per child, across all weekdays** — never per weekday.
> The per-weekday reading (`windows.filter(weekday=d)` inside the loop) looks identical
> and inverts the Wednesday case: a child with windows on Mon/Tue/Thu/Fri has none on
> Wednesday, so the per-weekday reading concludes "no windows → present all day" — the
> exact opposite of what those windows were written to say. The two readings differ
> *only* on this case, which is the one the table below relies on.

Then, for each schedule block, a pure function cuts the block at every instant where
the set of present children changes, and each resulting segment is split on its own:

```
weight(family, segment) = 1  if the family has >= 1 child present in the segment, else 0
                                                          # split_method == EQUAL
                        = number of that family's children present in the segment
                                                          # split_method == BY_CHILDREN

share(family, segment)  = weight(family, segment) ÷ Σ weights over families in segment
```

> [!IMPORTANT]
> Under `EQUAL` the weight is **1 per family with a child present**, *not* 1 per family
> on the contract. The second reading is the natural one and it is wrong: it hands
> family B a half share of a Wednesday its child never attended, contradicting the case
> table below. Presence gates the weight under **both** methods; the method only decides
> whether a present family counts once or once per child.

**If no child is present in a segment** (every child windowed out of an early-morning
hour, say), the weights all collapse to zero. Do not drop the segment — that breaks the
sum invariant and underpays the nanny. **Fall back to an equal split across every family
on the contract, and warn.** This is not a defensive branch: a contract with no
`ContractChild` rows at all hits it for *every* segment, which is exactly how the
feature stays additive for contracts that predate it (equal split when shared, 100% when
solo — the status quo).

### Worked example

Monday 08:00–18:00. Family A: kid1 (all day) + kid2 (16:30–18:00 window).
Family B: kid1 (all day). `split_method = BY_CHILDREN`.

| Segment | Children present | Weights A / B | Hours | → A | → B |
| --- | --- | --- | --- | --- | --- |
| 08:00–16:30 | A1, B1 | 1 / 1 | 8.5 | 4.25 | 4.25 |
| 16:30–18:00 | A1, A2, B1 | 2 / 1 | 1.5 | 1.00 | 0.50 |
| | | | **10.0** | **5.25** | **4.75** |

5.25 + 4.75 = 10.0 — the invariant holds.

### Every known case against the model

| Case | Expressed as | Result |
| --- | --- | --- |
| Both families 1 kid, equal care | no windows, either method | 50/50 |
| B does not employ on Wednesday | B's kid: windows on Mon/Tue/Thu/Fri only | Wed → A 100% |
| A has 2 kids, B has 1, proportional | no windows, `BY_CHILDREN` | ⅔ / ⅓ |
| …same, but families agreed equal | no windows, `EQUAL` | 50/50 |
| A's kid2 attends after school only | kid2: a 16:30–18:00 window | 50/50, then ⅔ / ⅓ |

Known rough edge: **excluding a single weekday means listing windows for the other
four**, because "no windows" already means "always present". The UI should offer an
"apply to all days except…" affordance rather than making anyone type four windows.

### A note on the official framing

URSSAF describes garde partagée as **location-based**:

> **En cas de garde partagée**, les deux employeurs devront s'entendre sur la
> planification des heures de garde. Cette répartition sera indiquée sur les contrats
> de travail, ainsi que le lieu de garde. **Chaque famille rémunère les heures
> effectuées à son domicile** selon les modalités définies au contrat de travail.

Our model splits *simultaneous* hours at one home instead. That is the pragmatic
answer to the single-rate limitation above, and it is what the families actually
agreed to — but the official framing differs, which is worth knowing if the question
ever comes up.

## 3. The monthly declaration

What each family ultimately needs to type into pajemploi:

- working hours
- overtime hours at 25%
- overtime hours at 50%
- total amount = `normal × rate + h25 × rate × 1.25 + h50 × rate × 1.50`
- each advantage: transport, kilometric, in-kind

Assembled as:

1. **Base** — the nanny's weekly hours **banded first** (§1), *then* each band split
   per family (§2), then mensualised.
2. **Minus unpaid absences** — an unpaid `Leave` deducts **the hours actually
   scheduled for that weekday** (a 4h Wednesday costs less than a 10h Monday), at
   the family's share of those hours.
3. **Plus exceptional hours** — typed per §1, attributed per §3.1 below.
4. **Advantages** — `transport_fee` and `benefits_in_kind` are one monthly figure for
   one nanny, so they are **split by each family's share of the month's hours**; the
   nanny receives the agreed total, not a multiple of it. `mileage_rate × kilometers`
   uses the km entered on the declaration.
5. **Paid leave** taken is reported two ways, without choosing between them: quota −
   taken, and accrued (2.5 days per month worked) − taken.

### Band before split — never the reverse

This is the largest money decision in the feature. Splitting first and banding each
family's slice **destroys the majoration**: a 45h week split 30/15 leaves both families
under 40h, so nobody declares overtime and the nanny silently loses it. Band the
nanny's *total* week (she really did work 45h), then split each band.

The counter-argument is real and was weighed: at pajemploi each family files separately,
never sees the other's hours, and URSSAF's framing is per-home (§2). It was rejected —
the 40h threshold protects the nanny, and an arrangement between employers should not
dissolve it. Keep this in a single `band_week()` function so the ruling is one edit.

### 3.1 Exceptional hours do **not** use the windows

Windows describe the *regular* week. An exceptional entry is by definition irregular, so
reading presence from the windows is not just imprecise — it is backwards. If child A's
window is 16:30–18:00 and family A files an exceptional 19:00–21:00, the window says A's
child is absent, weight 0, and **family A's own extra hours are billed to family B**.

Rule: for exceptional hours, presence is **whoever filed the entry**. Under
`BY_CHILDREN` a filing family weighs as its full `ContractChild` count. Union each
family's own overlapping entries before splitting (A filing 19–21 *and* 20–22 by mistake
means 3h, not 5h). Where two *different* families' entries overlap in time, that overlap
splits by the same weight rule — which is the reconciliation the families expect.

Exceptional hours must fall **outside** the schedule; an entry overlapping a scheduled
block would be paid twice, once inside the mensualised base and once as an add-on. A
child present outside their *window* but inside the *schedule* is a different thing
entirely (the nanny works no longer; only the split moves) and is modelled separately.

### Snapshotting

The declaration **snapshots its rate periods** alongside the declared hours: a
declaration records what was *filed*, so it must not drift when the terms change later.

**Plural, deliberately.** A month can span several `ContractTerms` (a mid-month raise),
and then `total ≠ hours × rate` for any single rate — the parent cannot reproduce the
figure from what they see. So store the per-period detail, plus flat scalars for the
terms in force on the month's **last day** (what the UI shows; almost every month has
exactly one), plus a warning that the rate moved. Sub-periods are weighted by
`days_in_sub_period ÷ days_in_month`, which sums to exactly 1 — so **a mid-month avenant
changes the price, never the total hours**.

### 3.2 Two things that look like bugs and are not

Both of these will, sooner or later, be "fixed" by someone acting in good faith. They
are load-bearing.

**Bank holidays must not touch the base.** Mensualisation already smooths them — the
whole point of a fixed `× 52 ÷ 12` is that the calendar month does not matter. May has
more jours fériés than March and the salary is identical; that is the design, not an
oversight. `BankHoliday`'s docstring says the *planning* hides working blocks on a
non-workable holiday, and reusing that fact for *pay* would deduct them twice.

**Paid leave deducts nothing.** 52 weeks = 47 worked + 5 of paid leave. The leave is
already inside the mensualised base. "She was off all week and got paid the same" is
mensualisation working exactly as intended. Only *unpaid* leave deducts.

### Gaps this feature has to close

The existing models were built for planning, not pay. Closing the gap needs:

| Gap | Why it matters |
| --- | --- |
| No `weeks_per_year` anywhere | The mensualisation formula turns on it |
| `mileage_rate` (€/km) has no km operand | A rate with nothing to multiply |
| No agreed *night presence* rate | URSSAF sets a **floor** (¼ of the rate), not the amount; the agreed figure has nowhere to live |
| `Contract.paid_leave_days` is inert | Stored and populated, never read; no balance exists |
| `Leave` is informational by design | Its own docstring says it "doesn't affect pay or schedule" — this feature is what makes it mean something |
| `Leave.hours` has no time of day | A bare count cannot be segmented, so it cannot be split between families |
| Weekly hours are not persisted | Only ever computed in a serializer from `ScheduleBlock` rows |
| No `Contract`↔`Child` link | §2 needs one |

### Time is naive local, everywhere

Django is configured `TIME_ZONE = "UTC"` with `USE_TZ = True`, while the whole schedule
side stores naive `TimeField`s. Keep the pay domain on naive `date` + `time` and **never
introduce an aware `DateTimeField` into it**. An aware 20:00 Paris persists as 18:00Z in
summer and 19:00Z in winter, so a night-presence test against 20:00 would be **wrong
twice a year**, and a 00:30 entry would land on the previous UTC date and shift the
month it is declared in.

[urssaf-contrat]: https://www.urssaf.fr/accueil/particulier/particulier-employeur/embaucher-un-salarie/contrat-travail-salarie-domicile.html#ancre-le-contenu-du-contrat-de-travail
[cdtn-hs]: https://code.travail.gouv.fr/contribution/3239-heures-supplementaires
