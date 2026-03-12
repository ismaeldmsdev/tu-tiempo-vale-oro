export function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return "0,00 €";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatHoursAndMinutes(hours) {
  if (!Number.isFinite(hours) || hours <= 0) {
    return "0h 00min";
  }
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const paddedMinutes = String(m).padStart(2, "0");
  return `${h}h ${paddedMinutes}min`;
}

export function calculateMonthlyHours(dailyHours, workingDays) {
  if (!dailyHours || dailyHours <= 0) return null;
  const days = workingDays && workingDays > 0 ? workingDays : 22;
  const monthly = dailyHours * days;
  if (!Number.isFinite(monthly) || monthly <= 0) return null;
  return monthly;
}

export function calculateHourlyRate(netSalary, monthlyHours) {
  if (!netSalary || !monthlyHours || monthlyHours <= 0) {
    return null;
  }
  const rate = netSalary / monthlyHours;
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return rate;
}

