export const getRealtimeBaseUrl = (): string => {
  const rawValue = import.meta.env.VITE_REALTIME_WS_URL?.trim();

  if (!rawValue) {
    return 'http://localhost:3005';
  }

  // Ignore placeholders such as <URL> that may come from copied templates.
  if (rawValue.includes('<') || rawValue.includes('>')) {
    return 'http://localhost:3005';
  }

  try {
    const parsed = new URL(rawValue);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'http://localhost:3005';
    }

    return rawValue.replace(/\/+$/, '');
  } catch {
    return 'http://localhost:3005';
  }
};