import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export type Entity = {
  id: string;
  name: string;
  type: 'organizer' | 'artist' | 'venue' | 'writer';
};

export default function EntitySwitcher({ onEntityChange }: { onEntityChange?: (e: Entity | null) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [activeEntityId, setActiveEntityId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchedEntities: Entity[] = [];

    // Fetch Organizers
    const { data: orgs } = await supabase.from('organizers').select('id, name').eq('claimed_by_user_id', user.id);
    if (orgs) orgs.forEach(o => fetchedEntities.push({ ...o, type: 'organizer' }));

    // Fetch Artists
    const { data: artists } = await supabase.from('artists').select('id, name').eq('claimed_by_user_id', user.id);
    if (artists) artists.forEach(a => fetchedEntities.push({ ...a, type: 'artist' }));

    // Fetch Venues
    const { data: venues } = await supabase.from('venues').select('id, name').eq('claimed_by_user_id', user.id);
    if (venues) venues.forEach(v => fetchedEntities.push({ ...v, type: 'venue' }));

    // Fetch Writers
    const { data: writers } = await supabase.from('writer_profiles').select('id, pen_name').eq('id', user.id);
    if (writers) writers.forEach(w => fetchedEntities.push({ id: w.id, name: w.pen_name, type: 'writer' }));

    setEntities(fetchedEntities);

    const storedId = localStorage.getItem('active_entity_id');
    let selectedEntity = fetchedEntities.find(e => e.id === storedId);

    // If no valid stored entity, default to the first one available
    if (!selectedEntity && fetchedEntities.length > 0) {
      selectedEntity = fetchedEntities[0];
      localStorage.setItem('active_entity_id', selectedEntity.id);
    }

    if (selectedEntity) {
      setActiveEntityId(selectedEntity.id);
      if (onEntityChange) onEntityChange(selectedEntity);
      
      // Auto-route if the user is in a portal but the entity type doesn't match the portal
      if (location.pathname.startsWith('/organizer') && selectedEntity.type !== 'organizer') {
        navigate(`/${selectedEntity.type}`);
      } else if (location.pathname.startsWith('/artist') && selectedEntity.type !== 'artist') {
        navigate(`/${selectedEntity.type}`);
      } else if (location.pathname.startsWith('/venue') && selectedEntity.type !== 'venue') {
        navigate(`/${selectedEntity.type}`);
      } else if (location.pathname.startsWith('/writer') && selectedEntity.type !== 'writer') {
        navigate(`/${selectedEntity.type}`);
      }
    } else {
      if (onEntityChange) onEntityChange(null);
    }
    
    setLoading(false);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const entity = entities.find(ent => ent.id === id);
    if (entity) {
      setActiveEntityId(entity.id);
      localStorage.setItem('active_entity_id', entity.id);
      if (onEntityChange) onEntityChange(entity);
      navigate(`/${entity.type}`);
    }
  };

  if (loading) return <span style={{ color: 'var(--text-secondary)' }}>Loading profiles...</span>;

  if (entities.length === 0) {
    return <span style={{ color: 'var(--text-secondary)' }}>No claimed profiles</span>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Managing:</span>
      <select 
        value={activeEntityId} 
        onChange={handleSelect}
        className="input-field"
        style={{ padding: '6px 12px', minWidth: '200px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <optgroup label="Organizers">
          {entities.filter(e => e.type === 'organizer').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </optgroup>
        <optgroup label="Artists">
          {entities.filter(e => e.type === 'artist').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </optgroup>
        <optgroup label="Venues">
          {entities.filter(e => e.type === 'venue').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </optgroup>
        <optgroup label="Writers">
          {entities.filter(e => e.type === 'writer').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </optgroup>
      </select>
    </div>
  );
}
