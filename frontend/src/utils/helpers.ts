// BatteryX AI – Shared utility functions

export function getRiskColor(risk?: string | null) {
  switch (risk) {
    case 'LOW': return '#66CC99';
    case 'MODERATE': return '#FBC000';
    case 'HIGH': return '#FF633D';
    default: return '#8B949C';
  }
}

export function getRiskBadgeClass(risk?: string | null) {
  switch (risk) {
    case 'LOW': return 'badge badge-success';
    case 'MODERATE': return 'badge badge-warning';
    case 'HIGH': return 'badge badge-danger';
    default: return 'badge badge-muted';
  }
}

export function getSOHColor(soh?: number | null) {
  if (!soh) return '#8B949C';
  if (soh >= 85) return '#66CC99';
  if (soh >= 75) return '#7ED3A6';
  if (soh >= 65) return '#FBC000';
  if (soh >= 55) return '#FF9A62';
  return '#FF633D';
}

export function getHealthStatusLabel(soh?: number | null) {
  if (!soh) return 'Unknown';
  if (soh >= 90) return 'Excellent';
  if (soh >= 80) return 'Good';
  if (soh >= 70) return 'Fair';
  if (soh >= 60) return 'Poor';
  return 'Critical';
}

export function getHealthBadgeClass(soh?: number | null) {
  if (!soh) return 'badge badge-muted';
  if (soh >= 80) return 'badge badge-success';
  if (soh >= 70) return 'badge badge-warning';
  return 'badge badge-danger';
}

export function getSecondLifeBadgeClass(classification?: string | null) {
  switch (classification) {
    case 'Continue EV Use': return 'badge badge-success';
    case 'Second-Life Energy Storage': return 'badge badge-accent';
    case 'Refurbishment': return 'badge badge-warning';
    case 'Recycling': return 'badge badge-danger';
    default: return 'badge badge-muted';
  }
}

export function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatNumber(n?: number | null, decimals = 1) {
  if (n == null) return '—';
  return n.toFixed(decimals);
}
