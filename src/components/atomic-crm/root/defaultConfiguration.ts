import type { ConfigurationContextValue } from "./ConfigurationContext";

export const defaultDarkModeLogo = "./logos/logo_atomic_crm_dark.svg";
export const defaultLightModeLogo = "./logos/logo_atomic_crm_light.svg";

export const defaultCurrency = "USD";

export const defaultTitle = "Life HQ";

export const defaultCompanySectors = [
  { value: "food-drink", label: "Food & Drink" },
  { value: "coffee", label: "Coffee" },
  { value: "outdoors", label: "Outdoors" },
  { value: "fitness", label: "Fitness" },
  { value: "culture", label: "Culture & Arts" },
  { value: "nightlife", label: "Nightlife" },
  { value: "shopping", label: "Shopping" },
  { value: "travel", label: "Travel" },
  { value: "work-spot", label: "Work Spot" },
  { value: "other", label: "Other" },
];

export const defaultDealStages = [
  { value: "someday", label: "Someday" },
  { value: "soon", label: "Soon" },
  { value: "active", label: "Active" },
  { value: "done", label: "Done" },
  { value: "shelved", label: "Shelved" },
];

export const defaultDealPipelineStatuses = ["done"];

export const defaultDealCategories = [
  { value: "personal", label: "Personal" },
  { value: "health", label: "Health" },
  { value: "social", label: "Social" },
  { value: "creative", label: "Creative" },
  { value: "learning", label: "Learning" },
  { value: "money", label: "Money" },
  { value: "home", label: "Home" },
  { value: "business", label: "Business" },
  { value: "side-project", label: "Side Project" },
  { value: "fun", label: "Fun" },
  { value: "other", label: "Other" },
];

export const defaultNoteStatuses = [
  { value: "idea", label: "Idea", color: "#7dbde8" },
  { value: "now", label: "Now", color: "#e8cb7d" },
  { value: "highlight", label: "Highlight", color: "#e88b7d" },
  { value: "done", label: "Done", color: "#a4e87d" },
];

export const defaultTaskTypes = [
  { value: "none", label: "None" },
  { value: "reminder", label: "Reminder" },
  { value: "call", label: "Call" },
  { value: "text", label: "Text" },
  { value: "errand", label: "Errand" },
  { value: "appointment", label: "Appointment" },
  { value: "hangout", label: "Hangout" },
  { value: "idea", label: "Idea" },
  { value: "chore", label: "Chore" },
  { value: "focus", label: "Focus block" },
  { value: "fun", label: "Fun" },
];

export const defaultConfiguration: ConfigurationContextValue = {
  companySectors: defaultCompanySectors,
  currency: defaultCurrency,
  dealCategories: defaultDealCategories,
  dealPipelineStatuses: defaultDealPipelineStatuses,
  dealStages: defaultDealStages,
  noteStatuses: defaultNoteStatuses,
  taskTypes: defaultTaskTypes,
  title: defaultTitle,
  darkModeLogo: defaultDarkModeLogo,
  lightModeLogo: defaultLightModeLogo,
};
