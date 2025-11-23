import { useState, useCallback } from 'react';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';

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

  const callSupabaseFunction = async (functionName: string, body: any) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Request failed');
    }

    return response.json();
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

      const firebaseToken = await user.getIdToken();

      // Call Supabase Edge Function for registration begin
      const options = await callSupabaseFunction('biometric-register-begin', {
        userId: user.uid,
        deviceName,
        firebaseToken,
      }) as RegisterOptions;

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

      // Call Supabase Edge Function for registration complete
      const result = await callSupabaseFunction('biometric-register-complete', {
        userId: user.uid,
        credential: credentialData,
        deviceName,
        firebaseToken,
      }) as { success: boolean; backupCodes: string[] };

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

  const loginWithBiometric = useCallback(async (userId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const available = await isBiometricAvailable();
      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      // Call Supabase Edge Function for login begin
      const options = await callSupabaseFunction('biometric-login-begin', {
        userId,
      }) as AuthenticationOptions;

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

      // Call Supabase Edge Function for login complete
      const result = await callSupabaseFunction('biometric-login-complete', {
        userId: options.userId,
        credential: credentialData,
      }) as { success: boolean; userId: string };

      if (result.success) {
        // Biometric verification succeeded
        // The client should handle Firebase authentication separately
        localStorage.setItem('last_biometric_login', new Date().toISOString());
        localStorage.setItem('biometric_verified_user', result.userId);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Biometric authentication failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isBiometricAvailable]);

  const revokeDevice = useCallback(async (credentialId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      // Delete credential from Supabase
      const { error } = await supabase
        .from('webauthn_credentials')
        .update({ revoked: true })
        .eq('credential_id', credentialId)
        .eq('user_id', user.uid);

      if (error) {
        throw new Error('Failed to revoke device');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to revoke device';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyBackupCode = useCallback(async (userId: string, code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Hash the code
      const encoder = new TextEncoder();
      const data = encoder.encode(code);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Check if code exists and is not used
      const { data: backupCode, error } = await supabase
        .from('backup_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code_hash', hash)
        .eq('used', false)
        .single();

      if (error || !backupCode) {
        throw new Error('Invalid or already used backup code');
      }

      // Mark code as used
      await supabase
        .from('backup_codes')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', backupCode.id);

      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Invalid backup code';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const listDevices = useCallback(async (): Promise<BiometricDevice[]> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const { data, error } = await supabase
        .from('webauthn_credentials')
        .select('*')
        .eq('user_id', user.uid)
        .eq('revoked', false)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(cred => ({
        id: cred.credential_id,
        deviceName: cred.device_name,
        createdAt: new Date(cred.created_at),
        lastSeen: cred.last_used ? new Date(cred.last_used) : new Date(cred.created_at),
        revoked: cred.revoked,
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to list devices');
      return [];
    }
  }, []);

  return {
    loading,
    error,
    isBiometricAvailable,
    registerBiometric,
    loginWithBiometric,
    revokeDevice,
    verifyBackupCode,
    listDevices,
  };
};
