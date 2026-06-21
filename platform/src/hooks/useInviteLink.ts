import { useState, useEffect } from 'react';
import { supabaseAdapter } from '../lib/supabase';
import { generateInviteToken } from '../lib/invites/token';

export function useInviteLink(rawToken: string) {
  const [validation, setValidation] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function validate() {
      setIsValidating(true);
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(rawToken);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const tokenHash = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        const result = await supabaseAdapter.validateInvite(tokenHash);
        setValidation(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsValidating(false);
      }
    }
    if (rawToken) {
      validate();
    }
  }, [rawToken]);

  const claim = async () => {
    setIsClaiming(true);
    setError(null);
    try {
      const result = await supabaseAdapter.claimInvite(rawToken);
      if (!result.success) {
        throw new Error(result.reason || 'Failed to claim invite.');
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsClaiming(false);
    }
  };

  return { validation, isValidating, isClaiming, claim, error };
}
