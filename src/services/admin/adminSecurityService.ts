import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase/firebase';
import {
  hashAdminPassword,
  type AdminSecurityRecord,
} from '../../utils/adminSecurity';

const ADMIN_CONFIG_COLLECTION = 'adminConfig';
const SECURITY_DOC_ID = 'security';

export async function fetchAdminSecurityConfig(): Promise<AdminSecurityRecord | null> {
  try {
    const snap = await getDoc(doc(db, ADMIN_CONFIG_COLLECTION, SECURITY_DOC_ID));
    if (!snap.exists()) return null;
    return snap.data() as AdminSecurityRecord;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.GET,
      `${ADMIN_CONFIG_COLLECTION}/${SECURITY_DOC_ID}`
    );
  }
}

export async function saveAdminPasswordInFirestore(newPassword: string): Promise<void> {
  const trimmed = newPassword;
  if (trimmed.length < 6 || trimmed.length > 128) {
    throw new Error('INVALID_ADMIN_PASSWORD_LENGTH');
  }

  const currentEmail = auth.currentUser?.email?.trim().toLowerCase();
  if (!currentEmail) {
    throw new Error('ADMIN_NOT_AUTHENTICATED');
  }

  const { passwordHash, salt } = await hashAdminPassword(trimmed);
  try {
    await setDoc(doc(db, ADMIN_CONFIG_COLLECTION, SECURITY_DOC_ID), {
      email: currentEmail,
      passwordHash,
      salt,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `${ADMIN_CONFIG_COLLECTION}/${SECURITY_DOC_ID}`
    );
  }
}
