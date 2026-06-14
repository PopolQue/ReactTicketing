import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Entity } from '../components/EntitySwitcher';
import { useNavigate } from 'react-router-dom';

export function useEventForm(activeEntity: Entity | null) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    venue_id: '',
    city: '',
    country: '',
    description: '',
    category: 'other',
    is_external: false,
    external_ticket_url: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleVenueChange = (id: string, data: any) => {
    setFormData(prev => ({ 
      ...prev, 
      venue_id: id,
      city: data?.city || prev.city,
      country: data?.country || prev.country
    }));
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!activeEntity) {
        throw new Error("Authentication Required: You must have an active Organizer profile to create an event.");
      }

      const { data, error: insertError } = await supabase
        .from('events')
        .insert([
          {
            id: crypto.randomUUID(),
            name: formData.title,
            organizer_name: activeEntity.name,
            start_date: new Date(formData.start_date).toISOString(),
            venue_id: formData.venue_id || null,
            city: formData.city,
            country: formData.country,
            description: formData.description,
            organizer_id: activeEntity.id,
            timezone_id: 'gmt1_berlin',
            category: formData.category,
            published: false,
            is_external: formData.is_external,
            external_ticket_url: formData.is_external ? formData.external_ticket_url : null
          }
        ])
        .select();

      if (insertError) throw insertError;

      navigate('/organizer/events');
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return { formData, handleChange, handleVenueChange, createEvent, loading, error };
}
