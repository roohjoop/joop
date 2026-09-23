import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import rawConfig from '../../firebase-applet-config.json';

// Use firebase-applet-config.json as the authoritative configuration source
const firebaseConfig = {
  projectId: rawConfig.projectId || "gen-lang-client-0028535414",
  appId: rawConfig.appId || "1:54158908506:web:bb22734289e1239488cc63",
  apiKey: rawConfig.apiKey || "AIzaSyDsh3MyPdlGGcly2woFtjkQigfm8CnPvys",
  authDomain: rawConfig.authDomain || "gen-lang-client-0028535414.firebaseapp.com",
  firestoreDatabaseId: rawConfig.firestoreDatabaseId || "ai-studio-65fe2e47-86e3-4f46-8e5a-fb620e6eea4e",
  storageBucket: rawConfig.storageBucket || "gen-lang-client-0028535414.firebasestorage.app",
  messagingSenderId: rawConfig.messagingSenderId || "54158908506",
};

// Initialize Firebase App instance
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Must use firestoreDatabaseId when initializing getFirestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as mandated by Firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline or network is limited.");
    }
    return false;
  }
}

// Non-blocking connection test
testConnection().catch(() => {});
