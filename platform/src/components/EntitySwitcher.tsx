import { useLanguage } from "../contexts/LanguageContext";
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DropdownMenu } from './DropdownMenu';
import { ChevronDown, Building2, User, MapPin, PenTool } from 'lucide-react';

export type Entity = {
  id: string;
  name: string;
  type: 'organizer' | 'artist' | 'venue' | 'writer';
};

export default React.memo(function EntitySwitcher({
  onEntityChange
}: {
  onEntityChange?: (e: Entity | null) => void;
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [activeEntity, setActiveEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (!isLoaded.current) {
        fetchEntities();
        isLoaded.current = true;
    }
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
      setActiveEntity(selectedEntity);
      if (onEntityChange) onEntityChange(selectedEntity);
    } else {
      if (onEntityChange) onEntityChange(null);
    }
    setLoading(false);
  };

  const handleSelect = (entity: Entity) => {
    setActiveEntity(entity);
    localStorage.setItem('active_entity_id', entity.id);
    
    // Update parent only after local state is updated to ensure stability
    if (onEntityChange) onEntityChange(entity);
    
    // Only navigate if the route type doesn't match the new entity type
    if (!location.pathname.startsWith(`/${entity.type}`)) {
      navigate(`/${entity.type}`);
    }
  };

  const getIcon = (type: Entity['type']) => {
    switch(type) {
      case 'organizer': return <Building2 size={16} />;
      case 'artist': return <User size={16} />;
      case 'venue': return <MapPin size={16} />;
      case 'writer': return <PenTool size={16} />;
    }
  };

  if (loading) return <span style={{ color: 'var(--text-secondary)' }}>{t("loadingProfiles")}</span>;
  if (entities.length === 0) return <span style={{ color: 'var(--text-secondary)' }}>{t("noClaimedProfiles")}</span>;

  return (
    <DropdownMenu 
      trigger={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          {activeEntity && getIcon(activeEntity.type)}
          <span>{activeEntity?.name || t("selectProfile")}</span>
          <ChevronDown size={16} />
        </div>
      }
    >
      {['organizer', 'artist', 'venue', 'writer'].map(type => {
        const typeEntities = entities.filter(e => e.type === type);
        if (typeEntities.length === 0) return null;
        
        return (
          <div key={type} style={{ marginBottom: '16px' }}>
            <h4 style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t(type + "s")}</h4>
            {typeEntities.map(e => (
              <button 
                key={e.id} 
                onClick={() => handleSelect(e)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', background: 'none', border: 'none', padding: '8px', cursor: 'pointer', textAlign: 'left', borderRadius: '4px', color: activeEntity?.id === e.id ? 'var(--accent)' : 'var(--text-primary)' }}
              >
                {getIcon(e.type)}
                {e.name}
              </button>
            ))}
          </div>
        );
      })}
    </DropdownMenu>
  );
});
