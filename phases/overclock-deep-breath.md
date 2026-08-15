# Overclock / Deep Breath

## Intended

Build Deep Breath and Overclock as actual sheet buttons
(01-rulebook-digest.md p.88) — the last two Skill-die mechanics left
deferred since Phase 4, now that both are unblocked by real Skill Check
infrastructure (`helpers/dice.mjs`) and the Exosuit work's UI patterns
(banked per-actor state, read-only availability indicators, per-tab
roll-panel controls).

## What actually happened

- **Deep Breath**: new button in both actor headers. Resets every
  Skill's current die to max and refreshes the actor's Overclock use;
  posts a chat card listing what changed plus the "MC introduces a new
  complication" reminder. At 8+ Stress (Beyond the Horizon), only steps
  current up 1 instead of a full reset — `ScientistData#anomalyInfluence`
  drives this, and since `TeamData` never derives that tier at all
  (Anomaly Influence explicitly doesn't apply to Team, per
  `actor-team.mjs`), the optional-chaining check naturally always resolves
  to a full reset for Team without needing a type-specific branch.
- **Team's once-per-session limit wired up**: the `deepBreathUsed` flag
  and its manual checkbox already existed on the Team sheet (built in
  Phase 3/`team-actor-sheet.md`) but had no consumer. The Deep Breath
  action now sets it automatically on use (`actor.type === 'team'` check
  inside the shared `deepBreath()` helper) and the header button disables
  itself while it's set — the checkbox remains the GM/player's manual
  override to reset it at session start or force it either way.
- **Overclock**: two checkboxes on the roll panel (one per Skill slot,
  mutually exclusive — checking both warns and blocks the roll). The
  checked Skill rolls a d12 instead of its own current die for that one
  Check; `rollSkillCheck()` gained an `overclockSkill` param that swaps
  which die gets rolled (and rerolled, if Advantage/Disadvantage also
  targets it) without touching the normal step-down logic, which still
  reads the Skill's *real* current die throughout.
- **Overclock's cost**: consumed the instant it's used, independent of
  outcome (`system.overclockAvailable` set false as part of the same
  `actor.update()` as everything else from that Check). On top of that,
  an OK or Bad result steps the overclocked Skill's *max* die down one —
  or, if that max was already floored at d4, marks +2 Stress instead.
  Getting this right when the overclocked Skill also happens to be the
  one that normally steps down its *current* (both mutations targeting
  the same field in one `actor.update()`) needed explicit handling: the
  max-down consequence reads whichever `current` value is already staged
  in that update (from the ordinary step-down) rather than the actor's
  stale pre-roll value, so the two effects compose correctly instead of
  one clobbering the other.
- **`stepUpDie()` generalized**: previously hardcoded its ceiling to the
  global d12 (Systems Upgrade's use, raising a Skill's own max). Deep
  Breath's partial restore needed to step current up toward *that Skill's
  own* max instead — added an optional `ceiling` param (default
  unchanged) rather than a second function, since the two calls are the
  same operation with a different cap.
- **One undocumented-in-the-PDF judgment call**: whether a freshly
  created scientist starts with Overclock already available, or has to
  Deep Breath once first to unlock it. Went with starting `true` (the
  more generous, less fiddly-edge-case reading) and flagged it to the
  user rather than guessing silently — a one-line flip in the Actor
  DataModels' `initial` value if that's wrong.
- **Live-verified by the user** in the running Foundry world — d12
  substitution, both Overclock consequence branches (max step-down and
  the d4-floor Stress mark), and the Team Deep Breath button's
  disable/re-enable cycle all confirmed working.

## Deferred, not built in this phase

- **Simplified Solo** resolution variant (single Skill Check, no
  two-card comparison) — the last item on the post-roadmap list, still
  untouched.
- **Cutting the first real release** — `system.zip`/`system.json` release
  assets, per Phase 10's deferred note; still pending.
- Items still don't step down through use (noted since Phase 4 and again
  in `phases/exosuit-abilities.md`) — Overclock and Deep Breath only
  touch Skill dice, not gear.
