import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { auth, functions } from '../lib/firebase';

interface BiometricDevice {
  id: string;
  deviceName: string;
  createdAt: Date;
  lastSeen: Date;
  revoked: boolean;
}

interface RegisterOptions {
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  challenge: string;
  pubKeyCredParams: Array<{ type: string; alg: number }>;
  timeout: number;
  excludeCredentials?: Array<any>;
  authenticatorSelection: {
    residentKey: string;
    userVerification: string;
    authenticatorAttachment?: string;
  };
  attestation: string;
}

interface AuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: Array<any>;
  userVerification: string;
  userId: string;
}

export const useBiometric = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBiometricAvailable = useCallback(async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) {
      return false;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  }, []);

  const base64ToBuffer = (base64: string): ArrayBuffer => {
    const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i);
    }
    return buffer;
  };

  const bufferToBase64 = (buffer: ArrayBuffer): string => {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const registerBiometric = useCallback(async (deviceName: string): Promise<string[]> => {
    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const available = await isBiometricAvailable();
      if (!available) {
        throw new Error('Biometric authentication not available on this device');
      }

      const idToken = await user.getIdToken();

      const registerBeginFn = httpsCallable(functions, 'registerBegin');
      const beginResult = await registerBeginFn({ idToken, deviceName });

      const options = beginResult.data as RegisterOptions;

      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64ToBuffer(options.challenge),
        rp: options.rp,
        user: {
          id: base64ToBuffer(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName
        },
        pubKeyCredParams: options.pubKeyCredParams.map(param => ({
          type: param.type as 'public-key',
          alg: param.alg
        })),
        timeout: options.timeout,
        excludeCredentials: options.excludeCredentials?.map(cred => ({
          id: base64ToBuffer(cred.id),
          type: cred.type as 'public-key',
          transports: cred.transports || []
        })),
        authenticatorSelection: {
          residentKey: options.authenticatorSelection.residentKey as ResidentKeyRequirement,
          userVerification: options.authenticatorSelection.userVerification as UserVerificationRequirement,
          authenticatorAttachment: options.authenticatorSelection.authenticatorAttachment as AuthenticatorAttachment
        },
        attestation: options.attestation as AttestationConveyancePreference
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      const credentialData = {
        id: credential.id,
        rawId: bufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToBase64(response.clientDataJSON),
          attestationObject: bufferToBase64(response.attestationObject),
          transports: response.getTransports ? response.getTransports() : []
        }
      };

      const registerCompleteFn = httpsCallable(functions, 'registerComplete');
      const completeResult = await registerCompleteFn({
        idToken,
        credential: credentialData
      });

      const result = completeResult.data as { success: boolean; backupCodes: string[] };

      localStorage.setItem('biometric_registered', 'true');

      return result.backupCodes;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to register biometric';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isBiometricAvailable]);

  const loginWithBiometric = useCallback(async (email: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const available = await isBiometricAvailable();
      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      const loginBeginFn = httpsCallable(functions, 'loginBegin');
      const beginResult = await loginBeginFn({ email });

      const options = beginResult.data as AuthenticationOptions;

      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64ToBuffer(options.challenge),
        timeout: options.timeout,
        rpId: options.rpId,
        allowCredentials: options.allowCredentials.map(cred => ({
          id: base64ToBuffer(cred.id),
          type: cred.type as 'public-key',
          transports: cred.transports || []
        })),
        userVerification: options.userVerification as UserVerificationRequirement
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('Authentication cancelled');
      }

      const response = assertion.response as AuthenticatorAssertionResponse;

      const credentialData = {
        id: assertion.id,
        rawId: bufferToBase64(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON: bufferToBase64(response.clientDataJSON),
          authenticatorData: bufferToBase64(response.authenticatorData),
          signature: bufferToBase64(response.signature),
          userHandle: response.userHandle ? bufferToBase64(response.userHandle) : null
        }
      };

      const loginCompleteFn = httpsCallable(functions, 'loginComplete');
      const completeResult = await loginCompleteFn({
        userId: options.userId,
        credential: credentialData
      });

      const result = completeResult.data as { success: boolean; customToken: string };

      await signInWithCustomToken(auth, result.customToken);

      localStorage.setItem('last_biometric_login', new Date().toISOString());
    } catch (err: any) {
      const errorMessage = err.message || 'Biometric authentication failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isBiometricAvailable]);

  const revokeDevice = useCallback(async (deviceId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const idToken = await user.getIdToken();

      const revokeDeviceFn = httpsCallable(functions, 'revokeDevice');
      await revokeDeviceFn({ idToken, deviceId });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to revoke device';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyBackupCode = useCallback(async (email: string, code: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const verifyBackupCodeFn = httpsCallable(functions, 'verifyBackupCode');
      const result = await verifyBackupCodeFn({ email, code });

      const data = result.data as { success: boolean; customToken: string };

      await signInWithCustomToken(auth, data.customToken);
    } catch (err: any) {
      const errorMessage = err.message || 'Invalid backup code';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    isBiometricAvailable,
    registerBiometric,
    loginWithBiometric,
    revokeDevice,
    verifyBackupCode
  };
};
