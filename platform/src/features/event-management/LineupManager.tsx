import { useLanguage } from "../../contexts/LanguageContext";
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import Dropdown from '../../components/Dropdown';
export default function LineupManager({
  eventId,
  availableArtists,
  eventArtists,
  setEventArtists
}: {
  eventId: string;
  availableArtists: any[];
  eventArtists: any[];
  setEventArtists: any;
}) {
  const {
    t
  } = useLanguage();
  const {
    showToast
  } = useToast();
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const handleAddArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtistId) return;
    const {
      error
    } = await supabase.from('event_artists').insert([{
      event_id: eventId,
      artist_id: selectedArtistId
    }]);
    if (!error) {
      const addedArtist = availableArtists.find(a => a.id === selectedArtistId);
      if (addedArtist) {
        setEventArtists([...eventArtists, {
          event_id: eventId,
          artist_id: selectedArtistId,
          artists: addedArtist
        }]);
      }
      setSelectedArtistId('');
    } else {
      showToast('Failed to add artist', 'error');
    }
  };
  const removeArtist = async (artistId: string) => {
    const {
      error
    } = await supabase.from('event_artists').delete().match({
      event_id: eventId,
      artist_id: artistId
    });
    if (!error) {
      setEventArtists(eventArtists.filter(ea => ea.artist_id !== artistId));
    }
  };
  return <div className="glass-panel" style={{
    padding: '24px',
    gridColumn: '1 / -1'
  }}>
      <h3>{t("lineupArtists")}</h3>
      
      <div style={{
      display: 'flex',
      gap: '16px',
      marginTop: '16px',
      overflowX: 'auto',
      paddingBottom: '16px'
    }}>
        {eventArtists.length === 0 ? <p style={{
        color: 'var(--text-secondary)'
      }}>{t("noArtistsAddedYet")}</p> : eventArtists.map(ea => <div key={ea.artist_id} style={{
        minWidth: '150px',
        padding: '16px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '8px',
        position: 'relative'
      }}>
            <button onClick={() => removeArtist(ea.artist_id)} style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'transparent',
          border: 'none',
          color: '#ef4444',
          cursor: 'pointer',
          fontSize: '1.2rem'
        }}>×</button>
            <h4 style={{
          margin: '0 0 8px 0'
        }}>{ea.artists?.name}</h4>
            <p style={{
          margin: 0,
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>{ea.stage_name || 'Main Stage'}</p>
          </div>)}
      </div>

      <form onSubmit={handleAddArtist} style={{
      display: 'flex',
      gap: '12px',
      marginTop: '16px',
      alignItems: 'flex-end'
    }}>
        <div style={{
        flexGrow: 1
      }}>
          <Dropdown value={selectedArtistId} onChange={val => setSelectedArtistId(val)} placeholder={t("selectAnArtist")} options={availableArtists.filter(a => !eventArtists.some(ea => ea.artist_id === a.id)).map(a => ({
          value: a.id,
          label: a.name
        }))} />
        </div>
        <button type="submit" className="btn-secondary">{t("AddToLineup")}</button>
      </form>
      {availableArtists.length === 0 && <p style={{
      fontSize: '0.85rem',
      color: 'var(--text-secondary)',
      marginTop: '8px'
    }}>{t("youDonTHaveAnyArtistProf")}<Link to="/organizer/artists" style={{
        color: 'var(--accent)'
      }}>{t("artists")}</Link>{t("toCreateSome")}</p>}
    </div>;
}