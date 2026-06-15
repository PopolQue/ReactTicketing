import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import Dropdown from '../../components/Dropdown';
import { ArrowLeft, Download, Plus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function PromosFullPage() {
  const { t } = useLanguage();
  const { id: eventId } = useParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [promos, setPromos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'individual' | 'batches'>('individual');

  // Single Promo Form
  const [singleForm, setSingleForm] = useState({ code: '', discount_kind: 'percent_off', discount_value: '' });
  
  // Batch Promo Form
  const [batchForm, setBatchForm] = useState({ prefix: '', count: 50, discount_kind: 'percent_off', discount_value: '', batch_name: '' });

  useEffect(() => {
    if (eventId) {
      fetchPromos();
    }
  }, [eventId]);

  const fetchPromos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setPromos(data);
    }
    setLoading(false);
  };

  const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = singleForm.discount_kind !== 'free' ? parseInt(singleForm.discount_value) : null;
    
    const { error } = await supabase.from('promo_codes').insert([{
      event_id: eventId,
      code: singleForm.code.toUpperCase(),
      discount_kind: singleForm.discount_kind,
      discount_value: value,
      active: true
    }]);

    if (error) {
      showToast("Error creating promo: " + error.message, 'error');
    } else {
      showToast("Promo code created", "success");
      setSingleForm({ code: '', discount_kind: 'percent_off', discount_value: '' });
      await fetchPromos();
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingBatch(true);
    const value = batchForm.discount_kind !== 'free' ? parseInt(batchForm.discount_value) : null;
    
    const batchId = crypto.randomUUID();
    const prefix = batchForm.prefix ? batchForm.prefix.toUpperCase() + '-' : '';
    
    const newCodes = [];
    for (let i = 0; i < batchForm.count; i++) {
      newCodes.push({
        event_id: eventId,
        code: `${prefix}${generateRandomString(8)}`,
        discount_kind: batchForm.discount_kind,
        discount_value: value,
        active: true,
        batch_id: batchId,
      });
    }

    const { error } = await supabase.from('promo_codes').insert(newCodes);

    if (error) {
      showToast("Error creating batch: " + error.message, 'error');
    } else {
      showToast(`Successfully generated ${batchForm.count} codes!`, "success");
      setBatchForm({ prefix: '', count: 50, discount_kind: 'percent_off', discount_value: '', batch_name: '' });
      await fetchPromos();
    }
    setGeneratingBatch(false);
  };

  const deactivate = async (code: string) => {
    await supabase.from('promo_codes').update({ active: false }).eq('event_id', eventId).eq('code', code);
    await fetchPromos();
  };

  const exportCsv = (codesToExport: any[], filename: string) => {
    if (codesToExport.length === 0) return;
    
    const headers = ['Code', 'Discount Type', 'Value', 'Uses', 'Max Uses', 'Status', 'Created At'];
    const rows = codesToExport.map(p => [
      p.code,
      p.discount_kind,
      p.discount_kind === 'amount_off' ? (p.discount_value / 100).toFixed(2) : (p.discount_value || '0'),
      p.used_count,
      p.max_uses || 'unlimited',
      p.active ? 'Active' : 'Inactive',
      new Date(p.created_at).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const batchesMap = promos.reduce((acc, promo) => {
    if (promo.batch_id) {
      if (!acc[promo.batch_id]) acc[promo.batch_id] = [];
      acc[promo.batch_id].push(promo);
    }
    return acc;
  }, {} as Record<string, any[]>);

  // Sort batches by creation date (using the first code's date)
  const sortedBatches = Object.entries(batchesMap).sort((a, b) => {
    const dateA = new Date(a[1][0].created_at).getTime();
    const dateB = new Date(b[1][0].created_at).getTime();
    return dateB - dateA;
  });

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>{t("organizer.promos.loading")}</div>;

  return (
    <div className="manage-event-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to={`/organizer/events/${eventId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '16px' }}>
          <ArrowLeft size={16} /> {t("organizer.promos.backToEvent")}
        </Link>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>{t("organizer.promos.title")}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t("organizer.promos.description")}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        
        {/* Left Col: Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> {t("organizer.promos.createSingle")}</h3>
            <form onSubmit={handleCreateSingle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input required type="text" placeholder={t("organizer.promos.codePlaceholder")} className="input-field" value={singleForm.code} onChange={e => setSingleForm({...singleForm, code: e.target.value.toUpperCase()})} />
              
              <Dropdown 
                value={singleForm.discount_kind} 
                onChange={(val) => setSingleForm({...singleForm, discount_kind: val})}
                options={[
                  { value: 'percent_off', label: 'Percent Off (%)' },
                  { value: 'amount_off', label: 'Amount Off (€ cents)' },
                  { value: 'free', label: 'Free Ticket' }
                ]}
              />
              
              {singleForm.discount_kind !== 'free' && (
                <input required type="number" placeholder={t("organizer.promos.valuePlaceholder")} className="input-field" value={singleForm.discount_value} onChange={e => setSingleForm({...singleForm, discount_value: e.target.value})} />
              )}
              <button type="submit" className="btn-secondary">Create Single Code</button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(52, 96, 64, 0.3)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--accent)' }}>{t("organizer.promos.generateBatch")}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{t("organizer.promos.batchDesc")}</p>
            <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder={t("organizer.promos.prefixPlaceholder")} className="input-field" value={batchForm.prefix} onChange={e => setBatchForm({...batchForm, prefix: e.target.value})} style={{ flex: 1 }} />
                <input required type="number" min="1" max="1000" placeholder="Count" className="input-field" value={batchForm.count} onChange={e => setBatchForm({...batchForm, count: parseInt(e.target.value)})} style={{ width: '80px' }} title="Number of codes" />
              </div>
              
              <Dropdown 
                value={batchForm.discount_kind} 
                onChange={(val) => setBatchForm({...batchForm, discount_kind: val})}
                options={[
                  { value: 'percent_off', label: 'Percent Off (%)' },
                  { value: 'amount_off', label: 'Amount Off (€ cents)' },
                  { value: 'free', label: 'Free Ticket' }
                ]}
              />
              
              {batchForm.discount_kind !== 'free' && (
                <input required type="number" placeholder={t("organizer.promos.valuePlaceholder")} className="input-field" value={batchForm.discount_value} onChange={e => setBatchForm({...batchForm, discount_value: e.target.value})} />
              )}
              <button type="submit" className="btn-primary" disabled={generatingBatch}>
                {generatingBatch ? t("organizer.promos.generating") : `${t("organizer.promos.generateCodes")} ${batchForm.count}`}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Lists */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <button 
              className={activeTab === 'individual' ? 'btn-primary' : 'btn-secondary'} 
              onClick={() => setActiveTab('individual')}
              style={{ flex: 1 }}
            >
              All Individual Codes
            </button>
            <button 
              className={activeTab === 'batches' ? 'btn-primary' : 'btn-secondary'} 
              onClick={() => setActiveTab('batches')}
              style={{ flex: 1 }}
            >
              Code Batches
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '600px' }}>
            {activeTab === 'individual' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span>{promos.length} {t("organizer.promos.totalCodes")}</span>
                  <button onClick={() => exportCsv(promos, 'all_promos')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
                    <Download size={14} /> {t("organizer.promos.exportAll")}
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {promos.map((p: any) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>{p.code}</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {p.discount_kind === 'free' ? 'Free Ticket' : p.discount_kind === 'percent_off' ? `${p.discount_value}% Off` : `€${(p.discount_value / 100).toFixed(2)} Off`}
                          {' | '}Uses: {p.used_count}/{p.max_uses || '∞'} | {p.active ? <span style={{ color: '#10b981' }}>{t("organizer.promos.active")}</span> : <span style={{ color: '#ef4444' }}>{t("organizer.promos.inactive")}</span>}
                        </div>
                      </div>
                      {p.active && (
                        <button onClick={() => deactivate(p.code)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>{t("organizer.promos.deactivate")}</button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'batches' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sortedBatches.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>{t("organizer.promos.noBatches")}</p> : null}
                
                {sortedBatches.map(([batchId, batchCodes]) => {
                  const firstCode = batchCodes[0];
                  const prefixMatch = firstCode.code.match(/^(.*?)-/);
                  const displayPrefix = prefixMatch ? prefixMatch[1] : firstCode.code.substring(0, 4);

                  return (
                    <div key={batchId} style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <strong style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>{t("organizer.promos.batch")} {displayPrefix}***</strong>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {batchCodes.length} codes | {t("organizer.promos.generatedOn")} {new Date(firstCode.created_at).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '4px' }}>
                            {firstCode.discount_kind === 'free' ? 'Free Ticket' : firstCode.discount_kind === 'percent_off' ? `${firstCode.discount_value}% Off` : `€${(firstCode.discount_value / 100).toFixed(2)} Off`}
                          </div>
                        </div>
                        <button onClick={() => exportCsv(batchCodes, `batch_${batchId.substring(0,8)}`)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
                          <Download size={14} /> {t("organizer.promos.exportCsv")}
                        </button>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {t("organizer.promos.sample")} {batchCodes.slice(0, 3).map((c: any) => c.code).join(', ')}...
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
