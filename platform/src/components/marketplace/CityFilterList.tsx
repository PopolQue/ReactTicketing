import { useLanguage } from '../../contexts/LanguageContext';
interface CityFilterListProps {
  uniqueCities: string[];
  selectedCity: string | null;
  onSelectCity: (city: string | null) => void;
}
export default function CityFilterList({
  uniqueCities,
  selectedCity,
  onSelectCity,
}: CityFilterListProps) {
  const { t } = useLanguage();
  if (uniqueCities.length === 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '40px',
        justifyContent: 'center',
      }}
    >
      <button
        onClick={() => onSelectCity(null)}
        style={{
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          fontWeight: 500,
          backgroundColor: selectedCity === null ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
          color: selectedCity === null ? 'white' : 'var(--text-primary)',
        }}
      >
        {t('allCities')}
      </button>
      {uniqueCities.map((city) => (
        <button
          key={city}
          onClick={() => onSelectCity(city)}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            fontWeight: 500,
            backgroundColor: selectedCity === city ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
            color: selectedCity === city ? 'white' : 'var(--text-primary)',
          }}
        >
          {city}
        </button>
      ))}
    </div>
  );
}
