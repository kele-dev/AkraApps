export interface FirebaseModeResolution {
  hasFirebaseConfig: boolean;
  isDemoMode: boolean;
  configError: string | null;
}

export function isPlaceholderFirebaseKey(apiKey: string | undefined): boolean {
  if (!apiKey) return true;
  const trimmed = apiKey.trim();
  return (
    trimmed.length === 0 ||
    trimmed === 'undefined' ||
    trimmed.startsWith('MASUKKAN_') ||
    trimmed.startsWith('YOUR_')
  );
}

export function resolveFirebaseMode(
  env: Record<string, string | undefined>
): FirebaseModeResolution {
  const hasFirebaseConfig = !isPlaceholderFirebaseKey(env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const isProduction = env.NODE_ENV === 'production';
  const demoOptIn = env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true';

  if (hasFirebaseConfig) {
    return {
      hasFirebaseConfig: true,
      isDemoMode: false,
      configError: null,
    };
  }

  if (isProduction) {
    return {
      hasFirebaseConfig: false,
      isDemoMode: false,
      configError: 'Firebase authentication is not configured for production.',
    };
  }

  if (demoOptIn) {
    return {
      hasFirebaseConfig: false,
      isDemoMode: true,
      configError: null,
    };
  }

  return {
    hasFirebaseConfig: false,
    isDemoMode: false,
    configError:
      'Firebase config missing. Set NEXT_PUBLIC_FIREBASE_* or NEXT_PUBLIC_ENABLE_DEMO_MODE=true for local development.',
  };
}
