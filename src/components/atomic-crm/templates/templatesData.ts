// Template gallery data. Each template seeds real rows via applyTemplate().
export interface TemplateDef {
  id: string;
  emoji: string;
  title: string;
  category: string;
  description: string;
  /** Where to send the user after applying. */
  goto: string;
  seeds: {
    routines?: { name: string; emoji: string; steps: string[]; remind_time?: string }[];
    lists?: { name: string; emoji: string; items: string[] }[];
    trackers?: { name: string; emoji: string; kind: "check" | "count" | "scale" | "note"; unit?: string; target?: number }[];
    todos?: { text: string; priority?: number }[];
    project?: { name: string; description?: string; todos: string[] };
    page?: { title: string; emoji: string; kind: "doc" | "sheet"; content: Record<string, unknown>; accent?: string };
  };
}

export const TEMPLATES: TemplateDef[] = [
  // ── Routines ──────────────────────────────────────────────────────────────
  {
    id: "morning-kickstart", emoji: "🌅", title: "Morning Kickstart", category: "Routines",
    description: "A gentle 5-step launch sequence — water, meds, move, one small win.",
    goto: "/routines",
    seeds: { routines: [{ name: "Morning Kickstart", emoji: "🌅", steps: ["Drink a glass of water", "Take meds/vitamins", "2-minute stretch", "Look at Today in Life HQ", "One small win before phone"] }] },
  },
  {
    id: "wind-down", emoji: "🌙", title: "Wind-down", category: "Routines",
    description: "Land the day softly: tidy, tomorrow's top 1, screens off.",
    goto: "/routines",
    seeds: { routines: [{ name: "Wind-down", emoji: "🌙", steps: ["10-minute tidy sweep", "Pick tomorrow's ONE thing", "Set out clothes", "Screens away", "Lights low"] }] },
  },
  {
    id: "adhd-reset", emoji: "🔄", title: "ADHD Room Reset", category: "Routines",
    description: "The shame-free unfuck-your-space loop: trash, dishes, laundry, surfaces.",
    goto: "/routines",
    seeds: { routines: [{ name: "Room Reset", emoji: "🔄", steps: ["Grab trash into one bag", "Dishes to the sink", "Laundry into the basket", "Clear one surface", "Open a window"] }] },
  },
  {
    id: "gym-day", emoji: "💪", title: "Gym Day", category: "Routines",
    description: "Pre/post workout checklist so gym days run on rails.",
    goto: "/routines",
    seeds: { routines: [{ name: "Gym Day", emoji: "💪", steps: ["Pack bag + water", "Pre-workout snack", "Warm-up 5 min", "Log the workout", "Protein within an hour"] }] },
  },
  {
    id: "sunday-review", emoji: "🗓️", title: "Sunday Review", category: "Routines",
    description: "A weekly reset ritual — clear inboxes, scan the week, pick 3 priorities.",
    goto: "/routines",
    seeds: { routines: [{ name: "Sunday Review", emoji: "🗓️", steps: ["Open Life HQ Review page", "Clear phone + email inbox", "Scan calendar for the week", "Pick 3 priorities", "Brain-dump loose thoughts"] }] },
  },

  // ── Lists ────────────────────────────────────────────────────────────────
  {
    id: "grocery-staples", emoji: "🛒", title: "Grocery Staples", category: "Lists",
    description: "A reusable staples list — check off as you shop, clear, reuse.",
    goto: "/lists",
    seeds: { lists: [{ name: "Groceries", emoji: "🛒", items: ["Eggs", "Milk / oat milk", "Bread", "Chicken", "Rice", "Frozen veg", "Coffee", "Fruit", "Snacks", "Paper towels"] }] },
  },
  {
    id: "packing", emoji: "🧳", title: "Packing List", category: "Lists",
    description: "Never forget the charger again.",
    goto: "/lists",
    seeds: { lists: [{ name: "Packing", emoji: "🧳", items: ["Phone charger", "Toothbrush + paste", "Meds", "Underwear x days", "Socks x days", "Shirts", "Deodorant", "Headphones", "ID / wallet", "Water bottle"] }] },
  },
  {
    id: "meal-ideas", emoji: "🍳", title: "Easy Meal Ideas", category: "Lists",
    description: "Low-effort meals for low-spoon days.",
    goto: "/lists",
    seeds: { lists: [{ name: "Easy Meals", emoji: "🍳", items: ["Eggs + toast", "Rice + frozen veg + protein", "Quesadillas", "Pasta + jar sauce", "Rotisserie chicken bowls", "Smoothie", "Sandwich + fruit"] }] },
  },
  {
    id: "errands", emoji: "🚗", title: "Errands Run", category: "Lists",
    description: "Batch the out-of-the-house stuff into one trip.",
    goto: "/lists",
    seeds: { lists: [{ name: "Errands", emoji: "🚗", items: ["Gas", "Pharmacy", "Groceries", "Post office", "Returns"] }] },
  },
  {
    id: "wishlist", emoji: "🎁", title: "Wishlist / To-Buy", category: "Lists",
    description: "Park impulse buys here for 30 days before buying.",
    goto: "/lists",
    seeds: { lists: [{ name: "To-Buy (30-day rule)", emoji: "🎁", items: [] }] },
  },

  // ── Trackers ──────────────────────────────────────────────────────────────
  {
    id: "hydration", emoji: "💧", title: "Hydration", category: "Trackers",
    description: "Tap +1 per glass. Daily goal: 8.",
    goto: "/track",
    seeds: { trackers: [{ name: "Water", emoji: "💧", kind: "count", unit: "glasses", target: 8 }] },
  },
  {
    id: "mood-energy", emoji: "🌤️", title: "Mood + Energy", category: "Trackers",
    description: "Two 1–5 scales — see patterns in the heatmap after a week.",
    goto: "/track",
    seeds: { trackers: [{ name: "Mood", emoji: "🌤️", kind: "scale" }, { name: "Energy", emoji: "⚡", kind: "scale" }] },
  },
  {
    id: "meds-sleep", emoji: "💊", title: "Meds + Sleep", category: "Trackers",
    description: "The two ADHD load-bearing walls: meds check + hours slept.",
    goto: "/track",
    seeds: { trackers: [{ name: "Meds", emoji: "💊", kind: "check", target: 1 }, { name: "Sleep", emoji: "😴", kind: "count", unit: "hrs" }] },
  },
  {
    id: "journal", emoji: "📓", title: "One-line Journal", category: "Trackers",
    description: "A single sentence a day — future-you will thank you.",
    goto: "/track",
    seeds: { trackers: [{ name: "Journal", emoji: "📓", kind: "note" }] },
  },

  // ── Projects ─────────────────────────────────────────────────────────────
  {
    id: "move-apartment", emoji: "📦", title: "Move Apartment", category: "Projects",
    description: "A project with the full moving checklist as next actions.",
    goto: "/deals",
    seeds: { project: { name: "Move apartment", description: "Everything for the move, in one place.", todos: ["Give notice to landlord", "Book movers / truck", "Change address (USPS)", "Transfer utilities", "Pack room by room", "Deep clean old place", "Photos for deposit"] } },
  },
  {
    id: "side-project", emoji: "🚀", title: "Launch a Side Project", category: "Projects",
    description: "From idea to shipped v1 without scope-creep spiraling.",
    goto: "/deals",
    seeds: { project: { name: "Side project v1", description: "Smallest version that's real.", todos: ["Write the one-sentence pitch", "List the 3 core features (only 3)", "Build ugly v1", "Show 3 people", "Ship it public"] } },
  },
  {
    id: "declutter", emoji: "🧹", title: "Declutter Sprint", category: "Projects",
    description: "One zone at a time — keep, donate, trash.",
    goto: "/deals",
    seeds: { project: { name: "Declutter sprint", todos: ["Closet", "Desk + drawers", "Kitchen counters", "Car", "Digital: phone home screen", "Donate run"] } },
  },

  // ── Docs ─────────────────────────────────────────────────────────────────
  {
    id: "weekly-planner", emoji: "🗒️", title: "Weekly Planner", category: "Docs",
    description: "A simple doc: top 3, schedule notes, brain-dump.",
    goto: "/pages",
    seeds: { page: { title: "Weekly Planner", emoji: "🗒️", kind: "doc", accent: "#0ea5e9", content: { text: "TOP 3 THIS WEEK\n1.\n2.\n3.\n\nSCHEDULE NOTES\n- Mon:\n- Tue:\n- Wed:\n- Thu:\n- Fri:\n- Weekend:\n\nBRAIN DUMP\n- " } } },
  },
  {
    id: "meeting-notes", emoji: "🗣️", title: "Meeting / Call Notes", category: "Docs",
    description: "Who, what, decisions, next actions.",
    goto: "/pages",
    seeds: { page: { title: "Call Notes", emoji: "🗣️", kind: "doc", accent: "#8b5cf6", content: { text: "WITH\n\nDATE\n\nWHAT WE COVERED\n- \n\nDECISIONS\n- \n\nNEXT ACTIONS\n- [ ] " } } },
  },
  {
    id: "idea-inbox", emoji: "💡", title: "Idea Inbox", category: "Docs",
    description: "One doc to catch every shower thought.",
    goto: "/pages",
    seeds: { page: { title: "Idea Inbox", emoji: "💡", kind: "doc", accent: "#f59e0b", content: { text: "Rules: no idea is too dumb to write down. Sort later, never while capturing.\n\n- " } } },
  },

  // ── Sheets ───────────────────────────────────────────────────────────────
  {
    id: "budget-sheet", emoji: "💵", title: "Monthly Budget", category: "Sheets",
    description: "Income, bills, spending — a simple money grid.",
    goto: "/pages",
    seeds: { page: { title: "Monthly Budget", emoji: "💵", kind: "sheet", accent: "#10b981", content: { cols: ["Item", "Category", "Amount", "Paid?"], rows: [["Rent", "Housing", "", ""], ["Utilities", "Housing", "", ""], ["Phone", "Bills", "", ""], ["Groceries", "Food", "", ""], ["Subscriptions", "Bills", "", ""], ["Gas", "Transport", "", ""], ["", "", "", ""]] } } },
  },
  {
    id: "job-tracker-sheet", emoji: "💼", title: "Job Search Grid", category: "Sheets",
    description: "A spreadsheet view of your hunt — pairs with the Jobs pipeline.",
    goto: "/pages",
    seeds: { page: { title: "Job Search Grid", emoji: "💼", kind: "sheet", accent: "#f59e0b", content: { cols: ["Company", "Role", "Applied", "Contact", "Notes"], rows: [["", "", "", "", ""], ["", "", "", "", ""], ["", "", "", "", ""]] } } },
  },
  {
    id: "meal-plan-sheet", emoji: "🥗", title: "Meal Plan Week", category: "Sheets",
    description: "Days × meals grid.",
    goto: "/pages",
    seeds: { page: { title: "Meal Plan", emoji: "🥗", kind: "sheet", accent: "#14b8a6", content: { cols: ["Day", "Lunch", "Dinner"], rows: [["Mon", "", ""], ["Tue", "", ""], ["Wed", "", ""], ["Thu", "", ""], ["Fri", "", ""], ["Sat", "", ""], ["Sun", "", ""]] } } },
  },
  {
    id: "subscriptions-sheet", emoji: "🔁", title: "Subscriptions Audit", category: "Sheets",
    description: "What's quietly billing you every month.",
    goto: "/pages",
    seeds: { page: { title: "Subscriptions", emoji: "🔁", kind: "sheet", accent: "#f43f5e", content: { cols: ["Service", "$/mo", "Renews", "Keep?"], rows: [["", "", "", ""], ["", "", "", ""], ["", "", "", ""]] } } },
  },

  // ── To-do packs ──────────────────────────────────────────────────────────
  {
    id: "weekly-admin", emoji: "🧾", title: "Weekly Admin Pack", category: "To-dos",
    description: "The boring-but-vital pile, pre-written.",
    goto: "/todos",
    seeds: { todos: [{ text: "Pay / check bills" }, { text: "Inbox zero sweep" }, { text: "Laundry" }, { text: "Plan next week's meals" }, { text: "Water plants" }] },
  },
  {
    id: "job-followup-pack", emoji: "📞", title: "Job Follow-up Pack", category: "To-dos",
    description: "The unglamorous follow-through that gets offers.",
    goto: "/todos",
    seeds: { todos: [{ text: "Follow up on pending applications", priority: 2 }, { text: "Send 2 new applications" }, { text: "Update resume bullet points" }, { text: "Message one person in your network" }] },
  },
];

export const TEMPLATE_CATEGORIES = [...new Set(TEMPLATES.map((t) => t.category))];
