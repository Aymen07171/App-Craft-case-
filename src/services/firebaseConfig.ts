/**
 * Firebase Applet and Google OAuth Configuration.
 * Loads configuration safely from Vite environment variables with built-in defaults,
 * preventing build errors in CI/CD environments (like Render or Vercel) where 
 * local root config JSON files may not be present in Git.
 */

export interface FirebaseAppletConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  oAuthClientId?: string;
}

export const USER_PROVIDED_CLIENT_ID =
  '458826575164-b6jhkrudbd8ribltergiuiafpb1vhjrr.apps.googleusercontent.com';

const getEnv = (key: string): string => {
  try {
    return (import.meta.env?.[key] as string) || '';
  } catch {
    return '';
  }
};

export const firebaseConfig: FirebaseAppletConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  oAuthClientId: getEnv('VITE_GOOGLE_CLIENT_ID') || USER_PROVIDED_CLIENT_ID,
};

export default firebaseConfig;
