import { useLanguage } from "../../contexts/LanguageContext";
import React from 'react';
export default function EventAboutSection({
  event,
  eventArtists,
  customAccentColor
}: {
  event: any;
  eventArtists: any[];
  customAccentColor: string;
}) {
  const {
    t
  } = useLanguage();
  return <>
      <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '24px',
      marginBottom: '40px',
      padding: '24px',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: '12px'
    }}>
        <div>
          <p style={{
          margin: '0 0 8px 0',
          color: 'rgba(255,255,255,0.6)'
        }}>{t("dateTime")}</p>
          <p style={{
          margin: 0,
          fontSize: '1.1rem'
        }}>{new Date(event.start_date).toLocaleString()}</p>
        </div>
        <div>
          <p style={{
          margin: '0 0 8px 0',
          color: 'rgba(255,255,255,0.6)'
        }}>{t("venue")}</p>
          <p style={{
          margin: 0,
          fontSize: '1.1rem'
        }}>{event.venue}</p>
          {(event.city || event.country) && <p style={{
          margin: '4px 0 0 0',
          fontSize: '0.9rem',
          color: 'rgba(255,255,255,0.7)'
        }}>
              {event.city}{event.city && event.country ? ', ' : ''}{event.country}
            </p>}
        </div>
      </div>

      <div style={{
      marginBottom: '40px'
    }}>
        <h3 style={{
        marginBottom: '16px'
      }}>{t("aboutThisEvent")}</h3>
        <p style={{
        color: 'rgba(255,255,255,0.8)',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap'
      }}>
          {event.description}
        </p>
      </div>

      {eventArtists.length > 0 && <div style={{
      marginBottom: '40px'
    }}>
          <h3 style={{
        marginBottom: '16px'
      }}>{t("lineup")}</h3>
          <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px'
      }}>
            {eventArtists.map((ea: any) => <div key={ea.artist_id} style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '16px',
          borderRadius: '12px'
        }}>
                <h4 style={{
            margin: '0 0 4px 0',
            fontSize: '1.2rem',
            color: customAccentColor
          }}>{ea.artists?.name}</h4>
                <p style={{
            margin: 0,
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.6)'
          }}>{ea.stage_name || 'Main Stage'}</p>
                {ea.artists?.bio && <p style={{
            margin: '8px 0 0 0',
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.8)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>{ea.artists.bio}</p>}
              </div>)}
          </div>
        </div>}
    </>;
}