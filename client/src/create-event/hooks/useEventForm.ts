// @ts-nocheck
import { useState, useEffect, useMemo, useRef } from 'react';
import { addOneHour } from '../utils/time';
import { DEFAULT_FREE_ENTITLEMENTS, ACCESS_TREE } from '../constants';
import { useCapacity } from './useCapacity';
import { useQuestionnaire } from './useQuestionnaire';
import { useLocation } from './useLocation';
import { useTicketManager } from './useTicketManager';
import { formStateToApiPayload } from '../services/eventMapper';

export function useEventForm({ go, st, editEv, hostGroupId }: any) {
  const apiBase = window.location.port === '8080' ? 'http://localhost:3000' : '';
  const draftKey = 'sg_draft_event';
  const savedDraft = useMemo(() => JSON.parse(localStorage.getItem(draftKey) || '{}'), []);
  const draft = editEv && editEv.__draft ? editEv.__draft : null;
  const isNewEvent = !editEv?.id || editEv.id === 'new';

  const entitlements = st?.entitlements || DEFAULT_FREE_ENTITLEMENTS;
  const allowedVisibilities = entitlements.event_allowed_visibility || ['unlisted', 'custom'];
  const allowedJoinModes = entitlements.event_allowed_join_modes || ['restricted', 'invite'];
  const eventMaxParticipants = entitlements.event_max_participants ?? 100;
  const canCreatePaidTickets = entitlements.event_can_create_paid_tickets ?? false;
  const allowedRegistrationModes = entitlements.event_allowed_registration_modes || ['free'];
  const canUseCash = allowedRegistrationModes.includes('cash');

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const triggerUpgrade = (feat: string) => {
    setUpgradeFeature(feat);
    setUpgradeModalOpen(true);
  };

  const [hostEntityId, setHostEntityId] = useState(
    draft?.hostEntityId || savedDraft.hostEntityId || hostGroupId || 'standalone'
  );
  const [hostGroups, setHostGroups] = useState<any[]>([]);
  const [dbGroups, setDbGroups] = useState<any[]>([]);
  const [accessTreeUpdated, setAccessTreeUpdated] = useState(0);

  // Load hosting groups and populate access control tree
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        fetch(`${apiBase}/api/groups/mine/as-host`, { headers })
          .then(r => r.json())
          .then(d => {
            if (d.success) {
              setHostGroups(d.data);
              if (editEv?.hosted_by_entity_id) {
                const isGroupHost = d.data.some((g: any) => g.entity_id === editEv.hosted_by_entity_id);
                setHostEntityId(isGroupHost ? editEv.hosted_by_entity_id : 'standalone');
              }
            }
          })
          .catch(console.error);

        const res = await fetch(`${apiBase}/api/groups`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success && data.data) {
          setDbGroups(data.data);
          // Mutate constant tree to load live db groups
          while (ACCESS_TREE.length > 0) ACCESS_TREE.pop();
          data.data.forEach((g: any) => {
            ACCESS_TREE.push({ id: g.id, name: g.name, type: 'group' });
          });
          setAccessTreeUpdated(prev => prev + 1);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchGroups();
  }, [apiBase, editEv]);

  const [title, setTitle] = useState(draft?.title ?? savedDraft?.title ?? editEv?.title ?? '');
  const [slug, setSlug] = useState(draft?.slug ?? editEv?.venue_raw?.meta?.slug ?? editEv?.venue?.meta?.slug ?? '');
  const [cover, setCover] = useState(draft?.cover ?? savedDraft?.cover ?? editEv?.cover ?? editEv?.venue_raw?.meta?.cover ?? editEv?.venue?.meta?.cover ?? '');
  const [visibility, setVisibility] = useState(
    draft?.visibility
    ?? savedDraft?.visibility
    ?? editEv?.venue_raw?.visibility
    ?? editEv?.venue?.visibility
    ?? (allowedVisibilities.includes('public') ? 'public' : (allowedVisibilities.includes('unlisted') ? 'unlisted' : (allowedVisibilities[0] || 'unlisted')))
  );
  const [calendar, setCalendar] = useState(draft?.calendar ?? 'Main Calendar');

  const initDT = useMemo(() => {
    const now = new Date();
    const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let hr = now.getHours();
    let min = Math.round(now.getMinutes() / 5) * 5;
    if (min === 60) { min = 0; hr = (hr + 1) % 24; }
    const time = `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    let endHr = (hr + 1) % 24;
    const endTime = `${String(endHr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    let endDate = ymd;
    if (hr === 23) {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      endDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    }
    return { currentDate: ymd, currentTime: time, endDateStr: endDate, currentEndTime: endTime };
  }, []);

  const startsAt = editEv?.starts_at ? new Date(editEv.starts_at) : null;
  const endsAt   = editEv?.ends_at ? new Date(editEv.ends_at) : null;

  const padTwo = (n: number) => String(n).padStart(2, '0');
  const editStartDate = startsAt ? `${startsAt.getFullYear()}-${padTwo(startsAt.getMonth() + 1)}-${padTwo(startsAt.getDate())}` : '';
  const editStartTime = startsAt ? `${padTwo(startsAt.getHours())}:${padTwo(startsAt.getMinutes())}` : '';
  const editEndDate   = endsAt ? `${endsAt.getFullYear()}-${padTwo(endsAt.getMonth() + 1)}-${padTwo(endsAt.getDate())}` : '';
  const editEndTime   = endsAt ? `${padTwo(endsAt.getHours())}:${padTwo(endsAt.getMinutes())}` : '';

  const [startDate, setStartDate] = useState(draft?.startDate ?? (editEv ? editStartDate : savedDraft.startDate) ?? initDT.currentDate);
  const [startTime, setStartTime] = useState(draft?.startTime ?? (editEv ? editStartTime : savedDraft.startTime) ?? initDT.currentTime);
  const [endDate, setEndDate] = useState(draft?.endDate ?? (editEv ? editEndDate : savedDraft.endDate) ?? initDT.endDateStr);
  const [endTime, setEndTime] = useState(draft?.endTime ?? (editEv ? editEndTime : savedDraft.endTime) ?? initDT.currentEndTime);

  // Enforce dates/times are not in past
  useEffect(() => {
    if (editEv?.id && editEv.id !== 'new') return;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${padTwo(now.getMonth() + 1)}-${padTwo(now.getDate())}`;

    if (startDate && startDate < todayStr) setStartDate(todayStr);
    if (endDate && endDate < todayStr) setEndDate(todayStr);

    if (startDate === todayStr && startTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      if (sh < now.getHours() || (sh === now.getHours() && sm < now.getMinutes())) {
        let hr = now.getHours(); let min = Math.round(now.getMinutes() / 5) * 5;
        if (min === 60) { min = 0; hr = (hr + 1) % 24; }
        setStartTime(`${padTwo(hr)}:${padTwo(min)}`);
      }
    }
    if (endDate === todayStr && endTime) {
      const [eh, em] = endTime.split(':').map(Number);
      if (eh < now.getHours() || (eh === now.getHours() && em < now.getMinutes())) {
        let hr = now.getHours(); let min = Math.round(now.getMinutes() / 5) * 5;
        if (min === 60) { min = 0; hr = (hr + 1) % 24; }
        let endHr = (hr + 1) % 24;
        setEndTime(`${padTwo(endHr)}:${padTwo(min)}`);
      }
    }
    if (startDate && endDate) {
      if (endDate < startDate) setEndDate(startDate);
      else if (startDate === endDate && startTime && endTime && endTime < startTime) {
        setEndTime(addOneHour(startTime));
      }
    }
  }, [startDate, startTime, endDate, endTime, editEv]);

  const [timezone, setTimezone] = useState(draft?.timezone ?? editEv?.venue_timezone ?? 'UTC +05:30 India');
  const [desc, setDesc] = useState(draft?.desc ?? savedDraft?.desc ?? editEv?.description ?? editEv?.desc ?? '');
  const [instructions, setInstructions] = useState(draft?.instructions ?? editEv?.venue_raw?.meta?.instructions ?? editEv?.venue?.meta?.instructions ?? editEv?.instructions ?? '');

  const [tzModalOpen, setTzModalOpen] = useState(false);
  const [tzSearchQuery, setTzSearchQuery] = useState('');

  const [calModalOpen, setCalModalOpen] = useState(false);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [instModalOpen, setInstModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiInstModalOpen, setAiInstModalOpen] = useState(false);
  const [joinEligibility, setJoinEligibility] = useState(draft?.joinEligibility ?? editEv?.venue_raw?.meta?.joinEligibility ?? editEv?.venue?.meta?.joinEligibility ?? 'public');
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [hostModalOpen, setHostModalOpen] = useState(false);
  const [hostSearchQuery, setHostSearchQuery] = useState('');
  const [hostFilterType, setHostFilterType] = useState('all');

  const [selectedAccess, setSelectedAccess] = useState(draft?.selectedAccess ?? editEv?.venue_raw?.meta?.selectedAccess ?? editEv?.venue?.meta?.selectedAccess ?? {
    restricted: { communities: [], subCommunities: [], groups: [] },
    selectedMembers: [],
  });

  const [tags, setTags] = useState(draft?.tags ?? editEv?.venue_raw?.meta?.tags ?? editEv?.venue?.meta?.tags ?? ['Startup', 'Technology']);
  const [tagInput, setTagInput] = useState('');
  const [cat, setCat] = useState(draft?.cat ?? savedDraft?.cat ?? editEv?.venue_raw?.meta?.category ?? editEv?.venue?.meta?.category ?? '');
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [seoExpanded, setSeoExpanded] = useState(false);

  // Categories loading
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${apiBase}/api/public/categories`);
        const data = await res.json();
        if (data.success && data.data) {
          const active = data.data.filter((c: any) => c.status === 'active' && !c.is_deleted);
          setCategoriesList(active);
          setCat(prev => prev || (active[0]?.name ?? ''));
        }
      } catch (e) {
        console.error('Failed to fetch categories', e);
      }
    };
    fetchCategories();
  }, [apiBase]);

  // Dynamic slug generator
  useEffect(() => {
    if (title && (!slug || slug === title.slice(0, -1).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  }, [title]);

  // Sponsors
  const [enableSponsors, setEnableSponsors] = useState(draft?.enableSponsors ?? editEv?.venue_raw?.meta?.enableSponsors ?? editEv?.venue?.meta?.enableSponsors ?? false);
  const [selectedSponsorIds, setSelectedSponsorIds] = useState(draft?.selectedSponsorIds ?? editEv?.venue_raw?.meta?.selectedSponsorIds ?? editEv?.venue?.meta?.selectedSponsorIds ?? ['sp-1', 'sp-3']);
  const [sponsorSearchQuery, setSponsorSearchQuery] = useState('');
  const [debouncedSponsorQuery, setDebouncedSponsorQuery] = useState('');
  const [sponsorVisibility, setSponsorVisibility] = useState(draft?.sponsorVisibility ?? editEv?.venue_raw?.meta?.sponsorVisibility ?? editEv?.venue?.meta?.sponsorVisibility ?? 'public');
  const [sponsorPage, setSponsorPage] = useState(1);
  const SPONSORS_PER_PAGE = 3;

  const ALL_SPONSORS = useMemo(() => [
    { id: 'sp-1', name: 'Google Cloud', org: 'Google Inc.', email: 'sponsorship@google.com' },
    { id: 'sp-2', name: 'Vercel', org: 'Vercel Inc.', email: 'sponsor@vercel.com' },
    { id: 'sp-3', name: 'GitHub Enterprise', org: 'GitHub Inc.', email: 'partner@github.com' },
    { id: 'sp-4', name: 'Stripe India', org: 'Stripe', email: 'stripe-sponsorship@stripe.com' },
    { id: 'sp-5', name: 'Figma India', org: 'Figma', email: 'sponsors@figma.com' },
  ], []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSponsorQuery(sponsorSearchQuery);
      setSponsorPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [sponsorSearchQuery]);

  // Registration options
  const [registrationStatus, setRegistrationStatus] = useState(
    draft?.registrationStatus ?? savedDraft?.registrationStatus ?? editEv?.registration_status ?? 'OPEN'
  );
  const editRegOpensAt  = editEv?.registration_opens_at ? new Date(editEv.registration_opens_at) : null;
  const editRegClosesAt = editEv?.registration_closes_at ? new Date(editEv.registration_closes_at) : null;

  const [regStartDate, setRegStartDate] = useState(
    draft?.regStartDate ?? (editRegOpensAt ? `${editRegOpensAt.getFullYear()}-${padTwo(editRegOpensAt.getMonth() + 1)}-${padTwo(editRegOpensAt.getDate())}` : '')
  );
  const [regStartTime, setRegStartTime] = useState(
    draft?.regStartTime ?? (editRegOpensAt ? `${padTwo(editRegOpensAt.getHours())}:${padTwo(editRegOpensAt.getMinutes())}` : '')
  );
  const [regEndDate, setRegEndDate] = useState(
    draft?.regEndDate ?? (editRegClosesAt ? `${editRegClosesAt.getFullYear()}-${padTwo(editRegClosesAt.getMonth() + 1)}-${padTwo(editRegClosesAt.getDate())}` : '')
  );
  const [regEndTime, setRegEndTime] = useState(
    draft?.regEndTime ?? (editRegClosesAt ? `${padTwo(editRegClosesAt.getHours())}:${padTwo(editRegClosesAt.getMinutes())}` : '')
  );

  const [approval, setApproval] = useState(draft?.approval ?? savedDraft?.approval ?? editEv?.approval_required ?? false);

  // Sub-hooks invocation
  const capacityState = useCapacity({ draft, editEv, isNewEvent, entitlements, savedDraft });
  const questionnaireState = useQuestionnaire({ draft, editEv, savedDraft });
  const locationState = useLocation({ draft, editEv, savedDraft });
  const ticketManager = useTicketManager({
    draft, editEv, canCreatePaidTickets,
    locType: locationState.locType,
    savedDraft,
  });

  // Banner drag & drop
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [showBannerMenu, setShowBannerMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<any>(null);

  const validateAndProcessFile = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setBannerError('Client Validation Error: Invalid format. Please use JPG, PNG, or WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBannerError('Client Validation Error: File size exceeds 5MB limit.');
      return;
    }
    setBannerError('');
    setIsUploadingBanner(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const reader = new FileReader();
      reader.onload = () => {
        setCover(reader.result as string);
        setIsUploadingBanner(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setBannerError(err.message);
      setIsUploadingBanner(false);
    }
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) validateAndProcessFile(file);
  };

  // Publish / Save Event Draft or Live
  const handlePublish = async (isDraft = false) => {
    if (!title.trim()) { setSubmitError('Event name is required.'); return; }
    if (!startDate) { setSubmitError('Start date is required.'); return; }
    setSubmitError('');
    setLoading(true);

    const token = localStorage.getItem('token');
    let finalCover = cover;

    if (cover && (cover.startsWith('data:') || cover.startsWith('blob:'))) {
      try {
        const blob = await (await fetch(cover)).blob();
        const form = new FormData();
        form.append('file', blob, 'event-banner.jpg');
        const up = await fetch(`${apiBase}/api/upload-group-media`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        const upData = await up.json();
        if (upData.success && upData.imageUrl) finalCover = upData.imageUrl;
      } catch (err) {
        console.error('Banner upload failed', err);
      }
    }

    const payload = formStateToApiPayload({
      hostEntityId, title, description: desc, cover: finalCover,
      status: isDraft ? 'draft' : 'published',
      startDate, startTime, endDate, endTime, timezone,
      locType: locationState.locType, venue: locationState.venue,
      visibility, slug, tags, cat, instructions, joinEligibility,
      selectedAccess, enableRegForm: questionnaireState.enableRegForm,
      formFields: questionnaireState.formFields, enableSponsors,
      selectedSponsorIds, sponsorVisibility,
      type: ticketManager.type, tickets: ticketManager.tickets,
      paymentInstructions: ticketManager.paymentInstructions,
      paymentHoldHours: ticketManager.paymentHoldHours,
      registrationStatus, regStartDate, regStartTime, regEndDate, regEndTime,
      approval, capacityEnabled: capacityState.capacityEnabled,
      capacity: capacityState.capacity, waitlist: capacityState.waitlist,
      allowImageProof: ticketManager.allowImageProof,
      offlineEntryType: locationState.offlineEntryType,
      existingSettings: editEv?.settings,
      existingMeta: editEv?.venue_raw?.meta || editEv?.venue?.meta,
    });

    try {
      const isEditing = editEv?.id && editEv.id !== 'new';
      const url = isEditing ? `${apiBase}/api/events/${editEv.id}` : `${apiBase}/api/events`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to publish event');

      const eventObj = isEditing ? data.data : data.data.event;

      localStorage.removeItem(draftKey);
      if (st && st.addCreatedEvent) {
        st.addCreatedEvent(eventObj);
      }
      if (st && st.fetchEvents) {
        st.fetchEvents();
      }
      go('event', eventObj);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    // Basic states
    loading, setLoading, submitError, setSubmitError,
    hostEntityId, setHostEntityId, hostGroups, dbGroups, accessTreeUpdated,
    title, setTitle, slug, setSlug, cover, setCover, visibility, setVisibility,
    calendar, setCalendar, startDate, setStartDate, startTime, setStartTime,
    endDate, setEndDate, endTime, setEndTime, timezone, setTimezone,
    desc, setDesc, instructions, setInstructions,
    joinEligibility, setJoinEligibility, selectedAccess, setSelectedAccess,
    tags, setTags, tagInput, setTagInput, cat, setCat, categoriesList, seoExpanded, setSeoExpanded,

    // Modal control flags
    tzModalOpen, setTzModalOpen, tzSearchQuery, setTzSearchQuery,
    upgradeModalOpen, setUpgradeModalOpen, upgradeFeature, setUpgradeFeature, triggerUpgrade,
    calModalOpen, setCalModalOpen, descModalOpen, setDescModalOpen, instModalOpen, setInstModalOpen,
    aiModalOpen, setAiModalOpen, aiInstModalOpen, setAiInstModalOpen, accessModalOpen, setAccessModalOpen,
    hostModalOpen, setHostModalOpen, hostSearchQuery, setHostSearchQuery, hostFilterType, setHostFilterType,

    // Sub-hooks consolidated
    capacityState, questionnaireState, locationState, ticketManager,

    // Banner logic
    isDraggingBanner, setIsDraggingBanner, bannerError, setBannerError,
    isUploadingBanner, setIsUploadingBanner, showBannerMenu, setShowBannerMenu,
    fileInputRef, searchInputRef, handleFileUpload, validateAndProcessFile,

    // Sponsors
    enableSponsors, setEnableSponsors, selectedSponsorIds, setSelectedSponsorIds,
    sponsorSearchQuery, setSponsorSearchQuery, debouncedSponsorQuery, sponsorVisibility, setSponsorVisibility,
    sponsorPage, setSponsorPage, SPONSORS_PER_PAGE, ALL_SPONSORS,

    // Registration options
    registrationStatus, setRegistrationStatus, regStartDate, setRegStartDate,
    regStartTime, setRegStartTime, regEndDate, setRegEndDate, regEndTime, setRegEndTime,
    approval, setApproval,

    // Submission
    handlePublish,
  };
}
