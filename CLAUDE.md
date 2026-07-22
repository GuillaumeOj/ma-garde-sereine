# Ma Garde Sereine

## Keep the help center in sync with the features you change

The user-facing help center lives in `frontend/src/content/help.ts` — bilingual
(`fr`/`en`) articles explaining how the product works: getting started, family &
contract invitations, how salary / paid leave / unpaid leave are calculated, how
to declare each month, absences, exceptional hours, and a security & data FAQ. It
is public and crawlable (`/help`, one page per article) and linked from both the
marketing site and the dashboard, so it doubles as SEO surface.

**When you add, change, or remove user-facing behavior, update the matching help
article in the same change.** A help article that still describes the old
behavior is worse than none — it misleads with authority. This bites hardest when
a calculation rule changes: the article's numbers, rules and caveats must match
the code (e.g. the congés-payés « rappel de 1/10 » made the old "the 10 %
indemnity is not recomputed" line wrong overnight).

In practice, in the same change:

- **Addition** → add a section, or a whole new article. A new article also needs
  its `/help/<slug>` entry in `frontend/public/sitemap.xml` and a `related`
  cross-link from a neighbouring article.
- **Update** → correct the affected article's prose in **both** `fr` and `en`
  (the catalog is kept in lockstep). Re-check any figures, thresholds and "what
  is / isn't automated" claims against the code.
- **Deletion** → remove the article or section, delete its `sitemap.xml` entry,
  and drop any now-dangling `related` slugs pointing at it.

The calculation reference the articles are built from is `docs/shared-care-pay.md`
(and the backend domain modules under `contracts/`); keep the doc, the code and
the help center telling the same story.
