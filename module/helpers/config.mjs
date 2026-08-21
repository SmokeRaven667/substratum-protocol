/**
 * Shared game constants for Substratum Protocol.
 * Values are pulled from 01-rulebook-digest.md — do not hardcode these
 * elsewhere (data models, sheets, dice logic all reference this object).
 */
export const SUBSTRATUM = {
  skills: {
    make: { label: 'SUBSTRATUM.SkillMake' },
    break: { label: 'SUBSTRATUM.SkillBreak' },
    dash: { label: 'SUBSTRATUM.SkillDash' },
    evade: { label: 'SUBSTRATUM.SkillEvade' },
    think: { label: 'SUBSTRATUM.SkillThink' },
    sway: { label: 'SUBSTRATUM.SkillSway' }
  },

  // Normal Skill die step chain (both max and current dice live on this).
  dieChain: ['d4', 'd6', 'd8', 'd10', 'd12'],

  // Sub-chain only reachable by current dice at the "Beyond the Horizon"
  // Anomaly Influence tier (8+ Stress) — d4 -> d2 -> d0.
  dieChainBeyondHorizon: ['d0', 'd2'],

  // Anomaly Influence tiers, derived from current Stress. Not stored on the
  // actor directly — computed in ScientistData#prepareDerivedData().
  anomalyInfluenceTiers: [
    { min: 0, max: 2, key: 'resistant', label: 'SUBSTRATUM.AnomalyResistant', skillPenalty: 0 },
    { min: 3, max: 4, key: 'thrumming', label: 'SUBSTRATUM.AnomalyThrumming', skillPenalty: -1 },
    { min: 5, max: 7, key: 'fragile', label: 'SUBSTRATUM.AnomalyFragile', skillPenalty: -2 },
    { min: 8, max: Infinity, key: 'beyond', label: 'SUBSTRATUM.AnomalyBeyond', skillPenalty: -2 }
  ],

  storageUnitSlots: 3,

  // The 7 core Actions (01-rulebook-digest.md p.103-118). Each has a fixed
  // first Skill plus a player-chosen second Skill — fixedSkill is that
  // first Skill's SUBSTRATUM.skills key; the "+ Skill" half of the roll
  // formula is composed in the template from the generic SUBSTRATUM.Skill
  // label rather than duplicated here.
  actions: [
    {
      key: 'confront',
      label: 'SUBSTRATUM.ActionConfront',
      fixedSkill: 'break',
      good: 'SUBSTRATUM.ActionConfrontGood',
      ok: 'SUBSTRATUM.ActionConfrontOk',
      bad: 'SUBSTRATUM.ActionConfrontBad'
    },
    {
      key: 'avoid',
      label: 'SUBSTRATUM.ActionAvoid',
      fixedSkill: 'evade',
      good: 'SUBSTRATUM.ActionAvoidGood',
      ok: 'SUBSTRATUM.ActionAvoidOk',
      bad: 'SUBSTRATUM.ActionAvoidBad'
    },
    {
      key: 'convince',
      label: 'SUBSTRATUM.ActionConvince',
      fixedSkill: 'sway',
      good: 'SUBSTRATUM.ActionConvinceGood',
      ok: 'SUBSTRATUM.ActionConvinceOk',
      bad: 'SUBSTRATUM.ActionConvinceBad'
    },
    {
      key: 'prepare',
      label: 'SUBSTRATUM.ActionPrepare',
      fixedSkill: 'make',
      good: 'SUBSTRATUM.ActionPrepareGood',
      ok: 'SUBSTRATUM.ActionPrepareOk',
      bad: 'SUBSTRATUM.ActionPrepareBad'
    },
    {
      key: 'study',
      label: 'SUBSTRATUM.ActionStudy',
      fixedSkill: 'think',
      good: 'SUBSTRATUM.ActionStudyGood',
      ok: 'SUBSTRATUM.ActionStudyOk',
      bad: 'SUBSTRATUM.ActionStudyBad'
    },
    {
      key: 'travel',
      label: 'SUBSTRATUM.ActionTravel',
      fixedSkill: 'dash',
      good: 'SUBSTRATUM.ActionTravelGood',
      ok: 'SUBSTRATUM.ActionTravelOk',
      bad: 'SUBSTRATUM.ActionTravelBad'
    },
    {
      key: 'understand',
      label: 'SUBSTRATUM.ActionUnderstand',
      fixedSkill: 'think',
      good: 'SUBSTRATUM.ActionUnderstandGood',
      ok: 'SUBSTRATUM.ActionUnderstandOk',
      bad: 'SUBSTRATUM.ActionUnderstandBad'
    }
  ],

  // Radio the Fracture Observatory, Solo-mode 2d6 oracle table
  // (848511358-Substratum-Protocol.pdf p.30).
  radioAnswerTable: [
    { min: 2, max: 3, label: 'SUBSTRATUM.RadioAnswerNoAnd' },
    { min: 4, max: 6, label: 'SUBSTRATUM.RadioAnswerNo' },
    { min: 7, max: 7, label: 'SUBSTRATUM.RadioAnswerYesBut' },
    { min: 8, max: 10, label: 'SUBSTRATUM.RadioAnswerYes' },
    { min: 11, max: 12, label: 'SUBSTRATUM.RadioAnswerYesAnd' }
  ],

  scientistDefaults: { stressCapacity: 8 },
  teamDefaults: { stressCapacity: 4 },

  // Flag scope used to tag the world-level deck/discard Cards documents and
  // each actor's personal hand, so they can be found again instead of
  // relying on (renameable) document names.
  cardFlagScope: 'substratum-protocol',

  // Standard 52-card deck, no jokers. Ace low (1) through King (13), per
  // the Skill Check rule (01-rulebook-digest.md).
  cardSuits: [
    { key: 'spades', label: 'SUBSTRATUM.SuitSpades' },
    { key: 'hearts', label: 'SUBSTRATUM.SuitHearts' },
    { key: 'diamonds', label: 'SUBSTRATUM.SuitDiamonds' },
    { key: 'clubs', label: 'SUBSTRATUM.SuitClubs' }
  ],
  cardRanks: [
    { value: 1, label: 'SUBSTRATUM.RankAce' },
    { value: 2, label: 'SUBSTRATUM.Rank2' },
    { value: 3, label: 'SUBSTRATUM.Rank3' },
    { value: 4, label: 'SUBSTRATUM.Rank4' },
    { value: 5, label: 'SUBSTRATUM.Rank5' },
    { value: 6, label: 'SUBSTRATUM.Rank6' },
    { value: 7, label: 'SUBSTRATUM.Rank7' },
    { value: 8, label: 'SUBSTRATUM.Rank8' },
    { value: 9, label: 'SUBSTRATUM.Rank9' },
    { value: 10, label: 'SUBSTRATUM.Rank10' },
    { value: 11, label: 'SUBSTRATUM.RankJack' },
    { value: 12, label: 'SUBSTRATUM.RankQueen' },
    { value: 13, label: 'SUBSTRATUM.RankKing' }
  ]
};
