export const REQUIRED_FIREBASE_ENV_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

export interface FirebaseEnvValidation {
  isValid: boolean;
  missingKeys: string[];
}

export interface FirebaseModeResolution {
  hasFirebaseConfig: boolean;
  isDemoMode: boolean;
  configError: string | null;
  missingKeys: string[];
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

/** Validate all 6 NEXT_PUBLIC_FIREBASE_* client SDK keys. */
export function validateFirebaseEnv(
  env: Record<string, string | undefined>
): FirebaseEnvValidation {
  const missingKeys = REQUIRED_FIREBASE_ENV_KEYS.filter((key) =>
    isPlaceholderFirebaseKey(env[key])
  );
  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}

export function resolveFirebaseMode(
  env: Record<string, string | undefined>
): FirebaseModeResolution {
  const hasApiKey = !isPlaceholderFirebaseKey(env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const { missingKeys } = validateFirebaseEnv(env);
  const isProduction = env.NODE_ENV === 'production';
  const demoOptIn = env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true';

  if (hasApiKey) {
    return {
      hasFirebaseConfig: true,
      isDemoMode: false,
      configError: null,
      missingKeys,
    };
  }

  if (isProduction) {
    return {
      hasFirebaseConfig: false,
      isDemoMode: false,
      configError: 'Firebase authentication is not configured for production.',
      missingKeys,
    };
  }

  if (demoOptIn) {
    return {
      hasFirebaseConfig: false,
      isDemoMode: true,
      configError: null,
      missingKeys,
    };
  }

  return {
    hasFirebaseConfig: false,
    isDemoMode: false,
    configError:
      'Firebase config missing. Set NEXT_PUBLIC_FIREBASE_* or NEXT_PUBLIC_ENABLE_DEMO_MODE=true for local development.',
    missingKeys,
  };
}
