import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useAuthRedirect() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = state?.from?.pathname || '/';

  const redirectAfterLogin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('organizers').select('id').eq('claimed_by_user_id', user.id).limit(1).single();
      if (profile) {
         navigate('/organizer');
         return;
      }
      
      const { data: artistClaim } = await supabase.from('entity_claims').select('id').eq('user_id', user.id).eq('entity_type', 'artist').limit(1).single();
      if (artistClaim) {
         navigate('/artist');
         return;
      }
    }
    navigate(from === '/auth' ? '/' : from);
  };

  const redirectAfterSignup = (accountType: 'fan' | 'organizer' | 'artist') => {
    if (accountType === 'organizer') {
      navigate('/organizer');
      return;
    }
    if (accountType === 'artist') {
      navigate('/artist');
      return;
    }
    navigate(from === '/auth' ? '/' : from);
  };

  return { redirectAfterLogin, redirectAfterSignup };
}
