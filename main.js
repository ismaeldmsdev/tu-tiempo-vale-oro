import { appState, saveState, loadState } from "./state.js";
import {
  formatCurrency,
  formatHoursAndMinutes,
  calculateMonthlyHours,
  calculateHourlyRate,
} from "./calculations.js";

const netSalaryInput = document.getElementById("netSalary");
const dailyHoursInput = document.getElementById("dailyHours");
const workingDaysInput = document.getElementById("workingDays");
const salaryForm = document.getElementById("salaryForm");
const hourlyRateDisplay = document.getElementById("hourlyRateDisplay");

const subscriptionForm = document.getElementById("subscriptionForm");
const subscriptionNameInput = document.getElementById("subscriptionName");
const subscriptionCostInput = document.getElementById("subscriptionCost");
const subscriptionsEmptyState = document.getElementById(
  "subscriptionsEmptyState"
);
const subscriptionsList = document.getElementById("subscriptionsList");
const subscriptionRowTemplate = document.getElementById(
  "subscriptionRowTemplate"
);

const totalCostDisplay = document.getElementById("totalCostDisplay");
const totalHoursDisplay = document.getElementById("totalHoursDisplay");
const insightText = document.getElementById("insightText");

const installButton = document.getElementById("installButton");

const chartCanvas = document.getElementById("subscriptionsChart");

let donutChart = null;
let deferredPrompt = null;

function deleteSubscription(id) {
  appState.subscriptions = appState.subscriptions.filter(
    (sub) => sub.id !== id
  );
  saveState();
  render();
}

function renderSubscriptionsList(hourlyRate) {
  const hasSubscriptions = appState.subscriptions.length > 0;

  if (!hasSubscriptions) {
    subscriptionsEmptyState.classList.remove("hidden");
    subscriptionsList.classList.add("hidden");
    subscriptionsList.innerHTML = "";
    return;
  }

  subscriptionsEmptyState.classList.add("hidden");
  subscriptionsList.classList.remove("hidden");
  subscriptionsList.innerHTML = "";

  appState.subscriptions.forEach((subscription) => {
    const node = subscriptionRowTemplate.content
      .cloneNode(true)
      .querySelector("[data-subscription-row]");

    const nameEl = node.querySelector("[data-subscription-name]");
    const costEl = node.querySelector("[data-subscription-cost]");
    const hoursEl = node.querySelector("[data-subscription-hours]");
    const deleteButton = node.querySelector("[data-subscription-delete]");

    nameEl.textContent = subscription.name;
    costEl.textContent = formatCurrency(subscription.cost);

    if (hourlyRate) {
      const hours = subscription.cost / hourlyRate;
      hoursEl.textContent = `${subscription.name} te cuesta ${formatHoursAndMinutes(
        hours
      )} de tu vida al mes.`;
    } else {
      hoursEl.textContent =
        "Introduce tu sueldo y horas trabajadas para ver cuántas horas de trabajo representa.";
    }

    deleteButton.addEventListener("click", () => {
      deleteSubscription(subscription.id);
    });

    subscriptionsList.appendChild(node);
  });
}

function updateChart(hourlyRate) {
  const hasSubscriptions = appState.subscriptions.length > 0;
  if (!chartCanvas) return;

  if (!hasSubscriptions || !hourlyRate) {
    if (donutChart) {
      donutChart.destroy();
      donutChart = null;
    }
    const context = chartCanvas.getContext("2d");
    context.save();
    context.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    context.restore();
    return;
  }

  const labels = appState.subscriptions.map((s) => s.name);
  const values = appState.subscriptions.map((s) => s.cost / hourlyRate);

  const baseColors = [
    "#38bdf8",
    "#22c55e",
    "#f97316",
    "#eab308",
    "#a855f7",
    "#ec4899",
    "#2dd4bf",
    "#f43f5e",
  ];

  const colors = labels.map(
    (_, index) => baseColors[index % baseColors.length]
  );

  const borderColors = colors.map((color) => color);

  const config = {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          label: "Horas de trabajo al mes",
          data: values,
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 1,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#e5e7eb",
            font: {
              size: 11,
            },
            padding: 16,
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              const label = context.label || "";
              const value = context.parsed;
              const hoursText = formatHoursAndMinutes(value);
              return `${label}: ${hoursText}`;
            },
          },
        },
      },
      layout: {
        padding: 8,
      },
      cutout: "65%",
    },
  };

  if (donutChart) {
    donutChart.data = config.data;
    donutChart.options = config.options;
    donutChart.update();
  } else {
    donutChart = new Chart(chartCanvas, config);
  }
}

function updateSummary(hourlyRate) {
  const totalMonthlyCost = appState.subscriptions.reduce(
    (acc, sub) => acc + sub.cost,
    0
  );

  totalCostDisplay.innerHTML = `Total mensual: <span class="font-medium text-slate-100">${formatCurrency(
    totalMonthlyCost
  )}</span>`;

  if (hourlyRate) {
    const totalHours = totalMonthlyCost / hourlyRate;
    totalHoursDisplay.innerHTML = `Te cuestan <span class="font-semibold text-sky-300">${formatHoursAndMinutes(
      totalHours
    )}</span> de tu vida cada mes.`;

    if (!appState.subscriptions.length) {
      insightText.textContent =
        "Empieza añadiendo una suscripción. Verás cuánto tiempo de tu mes se esconde en cada pago recurrente.";
      return;
    }

    const sorted = [...appState.subscriptions].sort(
      (a, b) => b.cost - a.cost
    );

    const top = sorted[0];
    const topHours = top.cost / hourlyRate;

    if (sorted.length === 1) {
      insightText.textContent = `${
        top.name
      } te cuesta ${formatHoursAndMinutes(
        topHours
      )} de trabajo al mes. ¿Sigue aportando tanto como tiempo te roba?`;
    } else {
      const top2 = sorted[1];
      const top2Hours = top2.cost / hourlyRate;
      insightText.textContent = `${top.name} y ${top2.name} juntos suman aproximadamente ${formatHoursAndMinutes(
        topHours + top2Hours
      )} de tu vida cada mes.`;
    }
  } else {
    totalHoursDisplay.innerHTML =
      'Introduce tu sueldo y horas trabajadas para ver el tiempo que representan tus suscripciones.';
    insightText.textContent =
      "Introduce tu sueldo y tus horas de trabajo al día para transformar tus gastos en tiempo de vida.";
  }
}

function render() {
  if (typeof appState.netSalary === "number") {
    netSalaryInput.value = appState.netSalary;
  }
  if (typeof appState.dailyHours === "number") {
    dailyHoursInput.value = appState.dailyHours;
  }
  if (typeof appState.workingDays === "number") {
    workingDaysInput.value = appState.workingDays;
  }

  const derivedMonthlyHours = calculateMonthlyHours(
    appState.dailyHours,
    appState.workingDays
  );

  const hourlyRate = calculateHourlyRate(
    appState.netSalary,
    derivedMonthlyHours
  );

  if (hourlyRate) {
    hourlyRateDisplay.innerHTML = `Valor hora: <span class="font-semibold text-sky-300">${formatCurrency(
      hourlyRate
    )}</span>`;
  } else {
    hourlyRateDisplay.innerHTML =
      'Valor hora: <span class="text-slate-500">Introduce tu sueldo y horas trabajadas</span>';
  }

  renderSubscriptionsList(hourlyRate);
  updateChart(hourlyRate);
  updateSummary(hourlyRate);
}

salaryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const netSalary = parseFloat(netSalaryInput.value.replace(",", "."));
  const dailyHours = parseFloat(dailyHoursInput.value.replace(",", "."));
  const workingDaysRaw = workingDaysInput.value
    ? parseFloat(workingDaysInput.value.replace(",", "."))
    : null;

  if (!Number.isFinite(netSalary) || netSalary <= 0) {
    alert("Introduce un sueldo neto mensual válido.");
    return;
  }
  if (!Number.isFinite(dailyHours) || dailyHours <= 0) {
    alert("Introduce un número de horas trabajadas al día válido.");
    return;
  }
  if (
    workingDaysRaw !== null &&
    (!Number.isFinite(workingDaysRaw) || workingDaysRaw <= 0)
  ) {
    alert("Introduce un número de días trabajados al mes válido.");
    return;
  }

  const workingDays =
    workingDaysRaw !== null ? Math.round(workingDaysRaw) : null;

  const monthlyHours = calculateMonthlyHours(dailyHours, workingDays);

  if (!monthlyHours) {
    alert(
      "No se han podido calcular las horas mensuales. Revisa las horas al día y los días al mes."
    );
    return;
  }

  appState.netSalary = netSalary;
  appState.dailyHours = dailyHours;
  appState.workingDays = workingDays;
  saveState();
  render();
});

subscriptionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = subscriptionNameInput.value.trim();
  const rawCost = subscriptionCostInput.value.replace(",", ".");
  const cost = parseFloat(rawCost);

  if (!name) {
    alert("Introduce un nombre para la suscripción.");
    return;
  }
  if (!Number.isFinite(cost) || cost < 0) {
    alert("Introduce un coste mensual válido.");
    return;
  }

  const subscription = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
    name,
    cost,
  };

  appState.subscriptions.push(subscription);
  subscriptionNameInput.value = "";
  subscriptionCostInput.value = "";

  saveState();
  render();
});

window.addEventListener("load", () => {
  loadState();
  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((error) =>
        console.warn("No se pudo registrar el service worker", error)
      );
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  if (installButton) {
    installButton.classList.remove("hidden");
    installButton.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        deferredPrompt = null;
        installButton.classList.add("hidden");
      }
    });
  }
});

