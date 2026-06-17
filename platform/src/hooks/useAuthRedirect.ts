import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useAuthRedirect() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = state?.from?.pathname || '/';

  const redirectAfterLogin = async () => {
    console.log('DEBUG: redirectAfterLogin, from path:', from);

    // If there is a "from" path (other than /auth), prioritize that
    if (from !== '/' && from !== '/auth') {
        console.log('DEBUG: Redirecting to previous page:', from);
        navigate(from);
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    console.log('DEBUG: User found for portal redirect:', !!user);
    if (user) {
      const { data: profile } = await supabase.from('organizers').select('id').eq('claimed_by_user_id', user.id).limit(1).single();
      console.log('DEBUG: Is organizer:', !!profile);
      if (profile) {
         navigate('/organizer');
         return;
      }
      
      const { data: artistClaim } = await supabase.from('entity_claims').select('id').eq('user_id', user.id).eq('entity_type', 'artist').limit(1).single();
      console.log('DEBUG: Is artist:', !!artistClaim);
      if (artistClaim) {
         navigate('/artist');
         return;
      }
    }
    navigate('/');
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
