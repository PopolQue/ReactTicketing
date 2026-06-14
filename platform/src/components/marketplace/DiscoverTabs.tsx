import type { TabType } from '../../hooks/useDiscoverData';

interface DiscoverTabsProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export default function DiscoverTabs({ activeTab, onChangeTab }: DiscoverTabsProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
      {(['events', 'artists', 'venues', 'organizers'] as const).map(tab => (
        <button
          key={tab}
          onClick={() => onChangeTab(tab)}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 16px',
            fontSize: '1.1rem',
            fontWeight: activeTab === tab ? 600 : 400,
            color: activeTab === tab ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
          {activeTab === tab && (
            <div style={{ position: 'absolute', bottom: '-17px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--accent)' }} />
          )}
        </button>
      ))}
    </div>
  );
}
