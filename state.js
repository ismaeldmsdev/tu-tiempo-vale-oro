export const STORAGE_KEY = "life-cost-calculator-state-v1";

export const appState = {
  netSalary: null,
  dailyHours: null,
  workingDays: null,
  subscriptions: [],
};

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (error) {
    console.warn("No se pudo guardar el estado en localStorage", error);
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;

    appState.netSalary =
      typeof parsed.netSalary === "number" ? parsed.netSalary : null;
    appState.dailyHours =
      typeof parsed.dailyHours === "number" ? parsed.dailyHours : null;
    appState.workingDays =
      typeof parsed.workingDays === "number" ? parsed.workingDays : null;

    appState.subscriptions = Array.isArray(parsed.subscriptions)
      ? parsed.subscriptions.filter(
          (s) =>
            s &&
            typeof s.name === "string" &&
            typeof s.cost === "number" &&
            s.cost >= 0
        )
      : [];
  } catch (error) {
    console.warn("No se pudo cargar el estado desde localStorage", error);
  }
}

