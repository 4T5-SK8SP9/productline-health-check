export const DEFAULT_CATEGORIES = [
  {
    id: "team-structure",
    name: "Team Structure",
    color: "#2D6A4F",
    order: 0,
    questions: [
      { id: "ts1", title: "Do we have a common set of rules in the team?", negative: "We have close to no rules in common and those we have are not followed", positive: "We have agreed on common rules for the team and everyone have been following these for a while" },
      { id: "ts2", title: "How much do we trust and rely on each other?", negative: "We work mostly individually, rarely ask for help or share openly", positive: "We openly depend on each other, share failures and wins, and have each other's backs" },
      { id: "ts3", title: "To what extent are our competences divided between us?", negative: "We are all individual specialists with a sharp line between assignments — we rarely work outside our own area", positive: "We are all able to contribute to each other's assignments and help each other get things done" },
      { id: "ts4", title: "How well do we communicate and stay aligned day-to-day?", negative: "We often find out about decisions or blockers too late — communication is fragmented", positive: "We have a rhythm that keeps everyone informed and aligned without over-meeting" },
      { id: "ts5", title: "How do we cooperate on common deliveries with other teams?", negative: "Cooperation is hard and requires a lot of planning — we often wait for each other", positive: "We have smooth cooperation, with common focus and quick response time for each team's requests" },
      { id: "ts6", title: "To what extent are we able, within the team, to deliver value end-to-end?", negative: "We are very dependent on people outside our team and we are missing key people inside our team", positive: "We are a full stack team with the right people, enabling us to deliver value without any external dependencies" }
    ]
  },
  {
    id: "product-focus",
    name: "Product Focus",
    color: "#1B4F72",
    order: 1,
    questions: [
      { id: "pf1", title: "Is there a clear vision of the product we are developing?", negative: "The purpose and vision of the product is unclear and it is difficult for us to navigate by", positive: "There is a simple, clear and convincing vision that we all know and use actively to navigate after" },
      { id: "pf2", title: "How good are we at continuously delivering value?", negative: "Our tasks span over a long period of time and there is a long-term transition between our deliveries", positive: "There is a short time from idea to delivery — we can often deliver ready-made deliveries that create value for our recipients" },
      { id: "pf3", title: "Do we have common built-in quality standards?", negative: "We do not know about the organisation's expectations for quality and have none in common in the team", positive: "Our deliveries comply with common standards and meet the organisation's expectations, even when we are in a hurry" },
      { id: "pf4", title: "How well do we understand what we're building before we start?", negative: "We often jump into work without shared understanding — requirements emerge as we go", positive: "Before we start anything, the whole team has a clear picture of what, why and for whom" },
      { id: "pf5", title: "How many tasks do we work on at the same time?", negative: "We have no focus on minimising the number of tasks in progress — often working on multiple tasks at the same time", positive: "There are only so many tasks in progress that we can keep daily progress on them — mostly we only work on one task at a time" },
      { id: "pf6", title: "Do we focus on minimising our cycle time?", negative: "There often goes a long time from starting a task until it is developed and tested", positive: "We work in a structured way to reduce the time from getting started with a task until it's finished" }
    ]
  },
  {
    id: "team-process",
    name: "Team Process",
    color: "#6B2D8B",
    order: 2,
    questions: [
      { id: "tp1", title: "Are we talking together about our work in progress?", negative: "We only rarely talk about what we each do or how we can help each other", positive: "We have found a perfect way to coordinate our work, which minimises surprises and ensures that we help each other" },
      { id: "tp2", title: "Are we planning our work ourselves?", negative: "The work is typically planned for us and we cannot influence priorities or deliverables", positive: "We plan all the work ourselves and take joint ownership of our plans and goals" },
      { id: "tp3", title: "How often do we show stakeholders what we deliver?", negative: "We do not show anything — if that happens it's random or unstructured", positive: "We regularly involve stakeholders and work closely with them, often discovering unexpected value by showing our work" },
      { id: "tp4", title: "How good are we at constantly improving the way we work?", negative: "We never allow time to reflect or discuss how we can improve our way of working", positive: "We have a constant focus on improving the way we work — everyone participates, proposals are discussed and we adapt effectively" },
      { id: "tp5", title: "How strong is our relationship with our stakeholders?", negative: "We deliver to stakeholders but rarely have a real dialogue — feedback is scarce or late", positive: "We have ongoing, trusted relationships — stakeholders are engaged partners, not just recipients" },
      { id: "tp6", title: "Do we act on data to improve — or just collect it?", negative: "We have little data, and when we do, it rarely changes how we work", positive: "We regularly review team and product data and make concrete changes based on what we learn" },
      { id: "tp7", title: "Can we speak up, disagree and fail safely in this team?", negative: "People hold back opinions, mistakes are blamed, and conflict is avoided rather than resolved", positive: "Everyone speaks up, disagreement is welcomed, and mistakes are treated as learning" }
    ]
  },
  {
    id: "technical-disciplines",
    name: "Technical Disciplines",
    color: "#7D3C0A",
    order: 3,
    questions: [
      { id: "td1", title: "To what extent can we make decisions about solutions ourselves?", negative: "Many decisions about solution architecture, UI/UX and business rules must be approved by key people outside our team", positive: "We have a high degree of freedom to make such decisions as long as we respect common agreements and standards" },
      { id: "td2", title: "Are we good at using different types of tests?", negative: "We perform almost only manual, functional tests", positive: "Our tests cover both the technical and the business, wide and deep, with a high degree of automation" },
      { id: "td3", title: "How much do we use automation?", negative: "Almost everything is done manually — there are no plans to automate testing, build, integration or deployment", positive: "We have automated many of our processes and get great value from it — we continue to look for more places to automate" },
      { id: "td4", title: "Do we actively manage technical debt and quality culture?", negative: "We keep shipping without cleaning up — debt accumulates and slows us down", positive: "Quality and sustainability are built into how we work, not treated as extras" }
    ]
  }
]

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
