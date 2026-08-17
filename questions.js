export const DEFAULT_CATEGORIES = [
  {
    id: "better",
    name: "Better",
    color: "#2D6A4F",
    order: 0,
    questions: [
      {
        id: "b1",
        title: "How well do we satisfy our customers?",
        crawl: "We do not meet expectations and only find out after releases.",
        walk: "We verify that expectations are met every second week.",
        run: "We exceed expectations by shaping work before implementation.",
        fly: "We often anticipate their expectations."
      },
      {
        id: "b2",
        title: "How well do we track progress?",
        crawl: "We do not have one way of tracking progress.",
        walk: "We track deliverables.",
        run: "We track whether our product is used.",
        fly: "We track achieved outcomes."
      },
      {
        id: "b3",
        title: "How much do we challenge requests?",
        crawl: "We uncritically deliver most requests.",
        walk: "We question some assumptions.",
        run: "We validate significant hypotheses.",
        fly: "We run experiments on requests as well as our own ideas."
      }
    ]
  },
  {
    id: "faster",
    name: "Faster",
    color: "#1B4F72",
    order: 1,
    questions: [
      {
        id: "f1",
        title: "How frequently do we deploy new features?",
        crawl: "We deploy every quarter.",
        walk: "We deploy every month.",
        run: "We deploy every second week.",
        fly: "We deploy each feature individually on demand."
      },
      {
        id: "f2",
        title: "How objectively do we decide?",
        crawl: "We mainly decide based on opinions.",
        walk: "We mainly decide based on experience.",
        run: "We mainly decide based on experience and data.",
        fly: "We mainly decide based on experience, data and feedback."
      },
      {
        id: "f3",
        title: "How well do we handle unplanned requests?",
        crawl: "We are too busy to consider anything unplanned.",
        walk: "We only have time for critical defects.",
        run: "We have time for defects, and unidentified dependencies and risks.",
        fly: "We assess new requests and adjust priorities without disrupting flow."
      }
    ]
  },
  {
    id: "safer",
    name: "Safer",
    color: "#7D3C0A",
    order: 2,
    questions: [
      {
        id: "s1",
        title: "How early do we catch quality issues?",
        crawl: "Incidents appear in production.",
        walk: "Incidents are found manually when deploying.",
        run: "Incidents are caught with automation when integrating.",
        fly: "Incidents are prevented throughout."
      }
    ]
  },
  {
    id: "happier",
    name: "Happier",
    color: "#6B2D8B",
    order: 3,
    questions: [
      {
        id: "h1",
        title: "How well do we empower teams?",
        crawl: "The teams are told what to do and how.",
        walk: "The teams decide how they work, but not on what.",
        run: "The teams decide how they work and what to work on toward a given goal.",
        fly: "The teams decide how they work, what to work on, and their goals."
      },
      {
        id: "h2",
        title: "How sustainable is our workload?",
        crawl: "Workload is often unsustainable for most people.",
        walk: "Workload is unsustainable for key people at releases or peak.",
        run: "Workload is stable and sustainable, and evenly distributed within teams.",
        fly: "Workload is stable, sustainable, and evenly distributed across teams."
      },
      {
        id: "h3",
        title: "How effectively do we improve our ways of working?",
        crawl: "We rarely improve.",
        walk: "We remove surface issues every quarter.",
        run: "We remove underlying problems every second week.",
        fly: "We remove root-causes immediately when issues are identified."
      }
    ]
  }
]

export const CWRF_LABELS = ['Crawl', 'Walk', 'Run', 'Fly']
export const CWRF_COLORS = ['#DC2626', '#EA580C', '#2563EB', '#16A34A']
export const CWRF_BGS = ['#FEF2F2', '#FFF7ED', '#EFF6FF', '#F0FDF4']

export function scoreToLabel(score) {
  return CWRF_LABELS[score - 1] ?? score
}

// Load categories from Firebase, fall back to defaults
export async function loadCategories(db) {
  try {
    const { ref, get } = await import('firebase/database')
    const snap = await get(ref(db, 'config/categories'))
    if (snap.exists()) {
      const data = snap.val()
      return Object.values(data).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }
  } catch (e) { console.warn('Using default categories', e) }
  return DEFAULT_CATEGORIES
}

export let CATEGORIES = DEFAULT_CATEGORIES
export let ALL_QUESTIONS = DEFAULT_CATEGORIES.flatMap(c => c.questions.map(q => ({ ...q, categoryId: c.id, categoryName: c.name, categoryColor: c.color })))
export let TOTAL_QUESTIONS = ALL_QUESTIONS.length

export function updateRuntimeCategories(cats) {
  CATEGORIES = cats
  ALL_QUESTIONS = cats.flatMap(c => c.questions.map(q => ({ ...q, categoryId: c.id, categoryName: c.name, categoryColor: c.color })))
  TOTAL_QUESTIONS = ALL_QUESTIONS.length
}
