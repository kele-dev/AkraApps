import { validateFirebaseEnv } from '../../../lib/firebaseConfig.ts';

export async function GET() {
  const { isValid, missingKeys } = validateFirebaseEnv(process.env);

  return Response.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      firebaseConfigured: isValid,
      demoModeEnabled: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true',
      missingFirebaseKeys: missingKeys,
    },
    { status: 200 }
  );
}
