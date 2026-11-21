/**
 * Format an ISO timestamp relative to `now` in Indonesian or English.
 */
export const formatRelativeTime = (
  dateStr: string,
  language: 'id' | 'en' = 'id',
  now: Date = new Date(),
  options: { compact?: boolean; fallbackToDateAfterHours?: number } = {}
): string => {
  const date = new Date(dateStr);
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (options.fallbackToDateAfterHours && hours >= options.fallbackToDateAfterHours) {
    return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  }

  if (mins <= 1) {
    return language === 'id' ? 'Baru saja' : 'Just now';
  }

  if (mins < 60) {
    if (language === 'id') {
      return options.compact ? `${mins}m lalu` : `${mins} menit lalu`;
    }
    return `${mins}m ago`;
  }

  if (hours < 24) {
    if (language === 'id') {
      return options.compact ? `${hours}j lalu` : `${hours} jam lalu`;
    }
    return `${hours}h ago`;
  }

  if (language === 'id') {
    return options.compact ? `${days}h lalu` : `${days} hari lalu`;
  }
  return `${days}d ago`;
};
