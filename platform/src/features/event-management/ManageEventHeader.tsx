import { useLanguage } from "../../contexts/LanguageContext";
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';

export default function ManageEventHeader({
  event,
  eventId,
  updateEvent,
  subscriptionTier,
  tiersCount
}: {
  event: any;
  eventId: string;
  updateEvent: any;
  subscriptionTier: string;
  tiersCount: number;
}) {
  const {
    t
  } = useLanguage();
  const {
    showToast
  } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const togglePublish = async () => {
    setIsPublishing(true);
    if (!event.published && !event.is_external && tiersCount === 0) {
      showToast("You must add at least one ticket tier before publishing.", 'error');
      setIsPublishing(false);
      return;
    }
    const {
      error
    } = await supabase.from('events').update({
      published: !event.published
    }).eq('id', eventId);
    if (!error) updateEvent({
      published: !event.published
    });
    setIsPublishing(false);
  };
  const getButtonText = () => {
    if (isPublishing) return 'Updating...';
    if (event?.published) {
      if (event?.approval_status === 'approved') return '✓ Published (Live)';
      if (event?.approval_status === 'rejected') return 'Action Required (Rejected)';
      return '⏳ Admit Approval Requested';
    }
    return 'Publish Event';
  };
  const getButtonColor = () => {
    if (event?.published) {
      if (event?.approval_status === 'approved') return '#10b981';
      if (event?.approval_status === 'rejected') return '#ef4444';
      return '#f59e0b';
    }
    return 'var(--accent)';
  };
  return <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  }}>
      <div>
        <Link to="/organizer/events" className="btn-nav" style={{
        padding: '8px 0',
        color: 'var(--text-secondary)',
        display: 'inline-block',
        marginBottom: '8px'
      }}>{t("BackToEvents")}</Link>
        <h2 style={{
        margin: 0
      }}>{t("manage")}{event?.name}</h2>
        <span style={{
        fontSize: '0.8rem',
        backgroundColor: subscriptionTier === 'pro' ? '#8b5cf6' : '#4b5563',
        padding: '2px 8px',
        borderRadius: '12px',
        marginTop: '8px',
        display: 'inline-block'
      }}>
          {subscriptionTier.toUpperCase()}{t("plan")}</span>
      </div>
      <div style={{
      display: 'flex',
      gap: '12px'
    }}>
        <button 
          onClick={() => setIsPreviewOpen(true)} 
          className="btn-secondary"
        >
          {t("previewEventPage")}
        </button>
        <button onClick={togglePublish} disabled={isPublishing} className="btn-primary" style={{
        backgroundColor: getButtonColor()
      }}>
          {getButtonText()}
        </button>
      </div>

      <Modal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        maxWidth="1100px" 
        title="Event Preview"
      >
        <iframe 
          src={`/events/${eventId}`} 
          title="Event Preview" 
          style={{ width: '100%', height: '75vh', border: 'none', borderRadius: '12px', background: '#010f14' }}
        />
      </Modal>
    </div>;
}