// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react';
import { GroupCard } from '../home-cards';
import { COVERS, ME, copyText } from '../home-data';
import { Discover } from '../home-feed';
import { Grain } from '../home-icons';
import { apiBase } from '../home-subscription';
import { Waitlist } from '../home-waitlist';
import { Footer } from '../landing-activity';
import { I } from '../home-icons';
import { Communities } from '../landing-features';

// Constants
import { DEFAULT_FREE_ENTITLEMENTS } from './constants/covers';

// Reusable Components
import { CoverPicker } from './components/common/CoverPicker';
import { Toggle } from './components/common/Toggle';

// Chips
import { CategorySummaryChip } from './components/chips/CategorySummaryChip';
import { RuleSummaryChip } from './components/chips/RuleSummaryChip';

// Modals
import { UpgradePlanModal } from './components/modals/UpgradePlanModal';
import { LocationModal } from './components/modals/LocationModal';
import { QuestionnaireBuilderModal } from './components/modals/QuestionnaireBuilderModal';
import { CapacitySettingsModal } from './components/modals/CapacitySettingsModal';
import { AccessControlModal } from './components/modals/AccessControlModal';
import { ForumSettingsModal } from './components/modals/ForumSettingsModal';
import { GallerySettingsModal } from './components/modals/GallerySettingsModal';
import { DescriptionModal } from './components/modals/DescriptionModal';
import { IconPickerModal } from './components/modals/IconPickerModal';

export function CreateGroup({ mode, editGroup, go, mobile, st }) {
  const entitlements = st?.entitlements || DEFAULT_FREE_ENTITLEMENTS;
  const allowedVisibilities = entitlements.group_allowed_visibility || ['unlisted'];
  const allowedJoinModes = entitlements.group_allowed_join_modes || ['open', 'invite_only'];
  const entitlementMaxCap = entitlements.group_max_capacity ?? 25;
  const canJoinRestricted = allowedJoinModes.includes('restricted_access');
  const canJoinOpen = allowedJoinModes.includes('open');
  const canJoinInvite = allowedJoinModes.includes('invite_only');
  const canPublic = allowedVisibilities.includes('public');
  const canUnlisted = allowedVisibilities.includes('unlisted');
  const canRestricted = allowedVisibilities.includes('restricted');

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const triggerUpgrade = (feat) => {
    setUpgradeFeature(feat);
    setUpgradeModalOpen(true);
  };

  const isEdit = mode === "edit" && editGroup;

  const draftKey = "sg_draft_group";
  
  // Removed draft clearing on mount to allow AI drafts to be read.
  // The draft will be cleared after successful group creation.

  useEffect(() => {
    if (isEdit && editGroup) {
      setName(editGroup.name || "");
      setIcon(editGroup.icon || "✺");
      setCover(editGroup.cover || COVERS.violet);
      setBanner(editGroup.banner || "");
      setCat(editGroup.category || "Design");
      setDesc(editGroup.description || "");

      const s = editGroup.settings || {};

      if (s.location) {
        setCity(s.location.city || s.city || "");
        setLocationState(s.location.state || "");
        setLocationCountry(s.location.country || "");
      } else if (s.city) {
        setCity(s.city || "");
      }

      if (s.capacity) {
        setLimitCap(s.capacity.limit || false);
        setMaxCap(s.capacity.max ? s.capacity.max.toString() : "");
        setWaitlist(s.capacity.waitlist || false);
      }

      if (s.forums) {
        setForums(s.forums.enabled || false);
        setForumsThreadRoles(s.forums.threadRoles || { public: true, roles: [] });
        setForumsReplyRoles(s.forums.replyRoles || { public: true, roles: [] });
        setForumsApprove(s.forums.approve || false);
      }

      if (s.gallery) {
        setGallery(s.gallery.enabled || false);
        setGalleryAllow(s.gallery.allow !== false);
        setGalleryImageOnly(s.gallery.imageOnly || false);
        setGalleryVideoOnly(s.gallery.videoOnly || false);
        setGalleryApprove(s.gallery.approve || false);
        setGalleryUploadRoles(s.gallery.uploadRoles || { public: false, roles: ['group_owner', 'group_admin', 'group_moderator'] });
        setGalleryViewRoles(s.gallery.viewRoles || { public: true, roles: [] });
      }

      if (s.questionnaires && s.questionnaires.length > 0) {
        setQuestionnaire(true);
        setQuestions(s.questionnaires);
      }

      let je = "anyone";
      if (s.joinElig === 'restricted' || s.joinElig === 'communities' || editGroup.joinMode === 'restricted') je = 'restricted';
      else if (s.joinElig === 'invite' || editGroup.joinMode === 'invite_only') je = 'invite';
      setJoinElig(je);

      setApproval(editGroup.joinMode === 'approval');

      if (s.originalVisibility) {
        setVisibility(s.originalVisibility);
      } else if (editGroup.visibility) {
        let v = editGroup.visibility;
        if (v === 'private') {
           const vis = s.restrictedAccess?.visibility || {};
           if ((vis.communities && vis.communities.length > 0) || 
               (vis.groups && vis.groups.length > 0) || 
               (vis.subCommunities && vis.subCommunities.length > 0)) {
             v = 'hidden';
           }
        }
        setVisibility(v);
      }

      if (s.restrictedAccess) {
        if (s.restrictedAccess.join) setSelectedAccess(s.restrictedAccess.join);
        if (s.restrictedAccess.visibility) setVisibilityAccess(s.restrictedAccess.visibility);
      }
    }
  }, [editGroup]);

  const savedDraft = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(draftKey) || "{}");
    } catch {
      return {};
    }
  }, [draftKey]);

  const [name, setName] = useState(isEdit ? (editGroup.name || "") : (savedDraft.name || ""));
  const [icon, setIcon] = useState(isEdit ? (editGroup.icon || "✺") : (savedDraft.icon || "✺"));
  const [cover, setCover] = useState(isEdit ? (editGroup.cover || COVERS.violet) : (savedDraft.cover || COVERS.violet));
  const [banner, setBanner] = useState(isEdit ? (editGroup.banner || "") : (savedDraft.banner || ""));
  const [cat, setCat] = useState(isEdit ? (editGroup.category || "Design") : (savedDraft.cat || "Design"));
  const [desc, setDesc] = useState(isEdit ? (editGroup.description || "") : (savedDraft.desc || ""));

  const [categoriesList, setCategoriesList] = useState([]);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiBaseUrl = window.location.port === "8080" ? "http://localhost:3000" : "";
        const res = await fetch(`${apiBaseUrl}/api/public/categories`);
        const data = await res.json();
        if (data.success && data.data) {
          setCategoriesList(data.data.filter(c => c.status === 'active' && !c.is_deleted));
        }
      } catch (e) {
        console.error("Failed to fetch categories", e);
      }
    };
    fetchCategories();
  }, []);

  const [locationType, setLocationType] = useState(savedDraft.locationType || "");
  const [venueName, setVenueName] = useState(savedDraft.venueName || "");
  const [address, setAddress] = useState(savedDraft.address || "");
  const [city, setCity] = useState(isEdit ? (editGroup.settings?.location?.city || editGroup.settings?.city || "") : (savedDraft.city || ""));
  const [locationState, setLocationState] = useState(isEdit ? (editGroup.settings?.location?.state || "") : (savedDraft.locationState || ""));
  const [locationCountry, setLocationCountry] = useState(isEdit ? (editGroup.settings?.location?.country || "") : (savedDraft.locationCountry || ""));
  const [platform, setPlatform] = useState(savedDraft.platform || "zoom");
  const [meetingLink, setMeetingLink] = useState(savedDraft.meetingLink || "");

  // Popups & Drawers State
  const [themeDrawer, setThemeDrawer] = useState(false);
  const [iconDrawer, setIconDrawer] = useState(false);
  const [descModal, setDescModal] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Options Modals
  const [visibility, setVisibility] = useState(isEdit ? (editGroup.visibility || "public") : (savedDraft.visibility || (canPublic ? "public" : (canUnlisted ? "private" : "hidden"))));

  const [joinElig, setJoinElig] = useState(isEdit ? (() => {
    const sje = editGroup.settings?.joinElig;
    if (sje === 'restricted' || sje === 'communities' || editGroup.joinMode === 'restricted') return 'restricted';
    if (sje === 'invite' || editGroup.joinMode === 'invite_only') return 'invite';
    return 'anyone';
  })() : (savedDraft.joinElig || (canJoinOpen ? "anyone" : (canJoinRestricted ? "restricted" : "invite")))); // anyone, restricted, invite

  const [accessModal, setAccessModal] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState(() => {
    const d = isEdit ? (editGroup.settings?.restrictedAccess?.join || {}) : (savedDraft.selectedAccess || {});
    let restrictedData = { communities: [], subCommunities: [], groups: [] };
    if (d.restricted && !Array.isArray(d.restricted)) {
      restrictedData = {
        communities: Array.isArray(d.restricted.communities) ? d.restricted.communities : [],
        subCommunities: Array.isArray(d.restricted.subCommunities) ? d.restricted.subCommunities : [],
        groups: Array.isArray(d.restricted.groups) ? d.restricted.groups : []
      };
    } else if (Array.isArray(d.restricted)) {
      const comms = [];
      const subComms = [];
      const grps = [];
      d.restricted.forEach(rule => {
        if (rule.community) comms.push(rule.community);
        if (rule.subCommunity) subComms.push(rule.subCommunity);
        if (Array.isArray(rule.groups)) {
          rule.groups.forEach(g => {
            if (!grps.includes(g)) grps.push(g);
          });
        }
      });
      restrictedData = { communities: comms, subCommunities: subComms, groups: grps };
    }

    let selectedMembersRules = [];
    if (Array.isArray(d.selectedMembers)) {
      selectedMembersRules = d.selectedMembers;
    } else if (d.selectedMembers && (d.selectedMembers.communities || d.selectedMembers.groups)) {
      const comms = d.selectedMembers.communities || [];
      const grps = d.selectedMembers.groups || [];
      if (comms.length > 0) {
        selectedMembersRules = comms.map((comm, idx) => ({
          id: "r-migrated-sm-" + idx,
          community: comm,
          groups: grps
        }));
      }
    }

    return {
      restricted: restrictedData,
      selectedMembers: selectedMembersRules
    };
  });

  const [visibilityAccess, setVisibilityAccess] = useState(() => {
    const d = isEdit ? (editGroup.settings?.restrictedAccess?.visibility || {}) : savedDraft.visibilityAccess;
    if (d) {
      return {
        communities: Array.isArray(d.communities) ? d.communities : [],
        subCommunities: Array.isArray(d.subCommunities) ? d.subCommunities : [],
        groups: Array.isArray(d.groups) ? d.groups : []
      };
    }
    const currentRestricted = isEdit ? {} : ((savedDraft.selectedAccess && savedDraft.selectedAccess.restricted) || {});
    return {
      communities: Array.isArray(currentRestricted.communities) ? [...currentRestricted.communities] : [],
      subCommunities: Array.isArray(currentRestricted.subCommunities) ? [...currentRestricted.subCommunities] : [],
      groups: Array.isArray(currentRestricted.groups) ? [...currentRestricted.groups] : []
    };
  });
  const [accessModalTarget, setAccessModalTarget] = useState("join");

  const [capModal, setCapModal] = useState(false);
  const [limitCap, setLimitCap] = useState(isEdit ? (editGroup.settings?.capacity?.limit || false) : (savedDraft.limitCap || false));
  const [maxCap, setMaxCap] = useState(isEdit ? (editGroup.settings?.capacity?.max?.toString() || "") : (savedDraft.maxCap || ""));
  const [waitlist, setWaitlist] = useState(isEdit ? (editGroup.settings?.capacity?.waitlist || false) : (savedDraft.waitlist || false));

  const [approval, setApproval] = useState(isEdit ? (editGroup.joinMode === 'approval') : (savedDraft.approval || false));

  // Advanced Settings Toggles
  const [questionnaire, setQuestionnaire] = useState(isEdit ? (editGroup.settings?.questionnaires?.length > 0) : (savedDraft.questionnaire || false));
  const [questions, setQuestions] = useState(isEdit ? (editGroup.settings?.questionnaires || []) : (savedDraft.questions || []));
  const [qModal, setQModal] = useState(false);

  const [forums, setForums] = useState(isEdit ? (editGroup.settings?.forums?.enabled || false) : (savedDraft.forums || false));
  const [forumsThreadRoles, setForumsThreadRoles] = useState(
    isEdit ? (editGroup.settings?.forums?.threadRoles || { public: true, roles: [] }) : (savedDraft.forumsThreadRoles || { public: true, roles: [] })
  );
  const [forumsReplyRoles, setForumsReplyRoles] = useState(
    isEdit ? (editGroup.settings?.forums?.replyRoles || { public: true, roles: [] }) : (savedDraft.forumsReplyRoles || { public: true, roles: [] })
  );
  const [forumsApprove, setForumsApprove] = useState(
    isEdit ? (editGroup.settings?.forums?.approve || false) : (savedDraft.forumsApprove || false)
  );
  const [forumModal, setForumModal] = useState(false);

  const [gallery, setGallery] = useState(isEdit ? (editGroup.settings?.gallery?.enabled || false) : (savedDraft.gallery || false));
  const [galleryModal, setGalleryModal] = useState(false);
  const [galleryAllow, setGalleryAllow] = useState(isEdit ? (editGroup.settings?.gallery?.allow !== false) : (savedDraft.galleryAllow !== undefined ? savedDraft.galleryAllow : true));
  const [galleryImageOnly, setGalleryImageOnly] = useState(isEdit ? (editGroup.settings?.gallery?.imageOnly || false) : (savedDraft.galleryImageOnly || false));
  const [galleryVideoOnly, setGalleryVideoOnly] = useState(isEdit ? (editGroup.settings?.gallery?.videoOnly || false) : (savedDraft.galleryVideoOnly || false));
  const [galleryApprove, setGalleryApprove] = useState(isEdit ? (editGroup.settings?.gallery?.approve || false) : (savedDraft.galleryApprove || false));
  const [galleryUploadRoles, setGalleryUploadRoles] = useState(
    isEdit ? (editGroup.settings?.gallery?.uploadRoles || { public: false, roles: ['group_owner', 'group_admin', 'group_moderator'] }) : (savedDraft.galleryUploadRoles || { public: false, roles: ['group_owner', 'group_admin', 'group_moderator'] })
  );
  const [galleryViewRoles, setGalleryViewRoles] = useState(
    isEdit ? (editGroup.settings?.gallery?.viewRoles || { public: true, roles: [] }) : (savedDraft.galleryViewRoles || { public: true, roles: [] })
  );

  const [inviteEmail, setInviteEmail] = useState("");
  const [pendingInviteEmails, setPendingInviteEmails] = useState([]);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [unlistedLink, setUnlistedLink] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLinkForModal, setShareLinkForModal] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);

  // Hierarchy from DB for access control
  const [hierarchy, setHierarchy] = useState(null);
  const [myManagedGroups, setMyManagedGroups] = useState([]);
  useEffect(() => {
    const apiBaseUrl = window.location.port === "8080" ? "http://localhost:3000" : "";
    const token = localStorage.getItem('token');
    fetch(`${apiBaseUrl}/api/public/groups-hierarchy`)
      .then(r => r.json())
      .then(d => { if (d.success) setHierarchy(d.data); })
      .catch(() => { });
    if (token) {
      fetch(`${apiBaseUrl}/api/groups/my-managed`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.success) setMyManagedGroups(d.data); })
        .catch(() => { });
    }
  }, []);



  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async (isDraftSubmit = false) => {
    if (!isDraftSubmit && !city) {
      if (window.toast) window.toast("Please select a location for the group.", "error");
      else alert("Please select a location for the group.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name,
        description: desc,
        category: cat,
        icon,
        cover,
        banner,
        joinMode: approval ? "approval" : joinElig === "invite" ? "invite_only" : joinElig === "communities" ? "restricted" : "open",
        visibility,
        listed: isDraftSubmit ? "unlisted" : (visibility === "public" ? "listed" : "unlisted"),
        settings: {
          originalVisibility: visibility,
          isDraft: isDraftSubmit,
          joinElig: joinElig === "communities" ? "restricted" : joinElig,
          location: { city, state: locationState, country: locationCountry },
          restrictedAccess: {
            join: selectedAccess,
            visibility: visibilityAccess
          },
          capacity: { limit: limitCap, max: Number(maxCap) || null, waitlist },
          questionnaires: questionnaire ? questions : [],
          forums: {
            enabled: forums,
            threadRoles: forumsThreadRoles,
            replyRoles: forumsReplyRoles,
            approve: forumsApprove
          },
          gallery: {
            enabled: gallery,
            allow: galleryAllow,
            imageOnly: galleryImageOnly,
            videoOnly: galleryVideoOnly,
            approve: galleryApprove,
            uploadRoles: galleryUploadRoles,
            viewRoles: galleryViewRoles
          }
        }
      };

      const apiBaseUrl = window.location.port === "8080" ? "http://localhost:3000" : "";
      const endpoint = isEdit ? `${apiBaseUrl}/api/groups/${editGroup.id}` : `${apiBaseUrl}/api/groups`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        if (!isEdit) localStorage.removeItem(draftKey);

        if (joinElig === "invite") {
          const groupId = data.data.id;
          if (!isEdit && pendingInviteEmails.length > 0) {
            for (const email of pendingInviteEmails) {
              try {
                await fetch(`${apiBaseUrl}/api/groups/${groupId}/invites`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                  body: JSON.stringify({ targets: [{ email }] })
                });
              } catch (err) {
                console.error(`Failed to invite ${email}:`, err);
              }
            }
            setPendingInviteEmails([]);
          } else {
            try {
              const linkRes = await fetch(`${apiBaseUrl}/api/groups/${groupId}/invites/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({ maxUses: null })
              });
              const linkData = await linkRes.json();
              if (linkData.success && linkData.data.token) {
                const inviteLink = `${window.location.origin}${window.location.pathname}#/groups/invite/${linkData.data.token}`;
                if (!isEdit) {
                  alert(`Group created successfully!\n\nHere is your invite link:\n${inviteLink}\n\nUsers can only join using this link. You can also find it in your Group Dashboard.`);
                }
              }
            } catch (err) {
              console.error("Failed to generate invite link", err);
            }
          }
        }

        const navDest = isDraftSubmit
          ? { view: "groups", param: { tab: "created", createdSub: "drafts" } }
          : isEdit
            ? { view: "group", param: { ...editGroup, name, category: cat, description: desc, icon, cover, banner, visibility, joinMode: approval ? "approval" : joinElig === "invite" ? "invite_only" : joinElig === "communities" ? "restricted" : "open" } }
            : { view: "group", param: { ...previewG, id: data.data.id, posts: 0, members: 1 } };

        if (visibility === "private" && !isDraftSubmit) {
          try {
            const linkRes = await fetch(`${apiBaseUrl}/api/groups/${data.data.id}/invites/link`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
              body: JSON.stringify({ maxUses: null })
            });
            const linkData = await linkRes.json();
            if (linkData.success && linkData.data.token) {
              const shareLink = `${window.location.origin}${window.location.pathname}#/groups/invite/${linkData.data.token}`;
              setUnlistedLink(shareLink);
              setShareLinkForModal(shareLink);
              setPendingNav(navDest);
              setShowShareModal(true);
              await copyText(shareLink);
              return;
            }
          } catch (err) {
            console.error("Failed to generate unlisted link", err);
          }
        }

        go(navDest.view, navDest.param);
      } else {
        alert(data.message || `Failed to ${isEdit ? "update" : "create"} group`);
      }
    } catch (e) {
      alert(`Error ${isEdit ? "updating" : "creating"} group`);
    } finally {
      setLoading(false);
    }
  };

  const renderChips = (mode, source = "join") => {
    if (mode === "selected_members") {
      const rules = selectedAccess.selectedMembers || [];
      if (!Array.isArray(rules) || rules.length === 0) return null;

      return (
        <div style={{ marginTop: 6, marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px", background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
          {rules.map((rule) => (
            <RuleSummaryChip
              key={rule.id}
              rule={rule}
              onEditClick={() => {
                setAccessModalTarget(source);
                setAccessModal(true);
              }}
            />
          ))}
        </div>
      );
    } else {
      const modeData = source === "visibility" ? visibilityAccess : (selectedAccess.restricted || {});
      const communities = modeData.communities || [];
      const subCommunities = modeData.subCommunities || [];
      const groups = modeData.groups || [];

      const hasAny = communities.length > 0 || subCommunities.length > 0 || groups.length > 0;
      if (!hasAny) return null;

      return (
        <div style={{ marginTop: 6, marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px", background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
          <CategorySummaryChip
            type="communities"
            items={communities}
            onEditClick={() => {
              setAccessModalTarget(source);
              setAccessModal(true);
            }}
          />
          <CategorySummaryChip
            type="subCommunities"
            items={subCommunities}
            onEditClick={() => {
              setAccessModalTarget(source);
              setAccessModal(true);
            }}
          />
          <CategorySummaryChip
            type="groups"
            items={groups}
            onEditClick={() => {
              setAccessModalTarget(source);
              setAccessModal(true);
            }}
          />
        </div>
      );
    }
  };

  const previewG = {
    name: name || "Your group name", icon, cover, banner, cat,
    location: city ? `${city}, India` : "Location TBD",
    desc: desc || "A short description of what your community is about and who it's for.",
    members: 1, online: 0, memberNames: [{ name: ME.name, role: "owner" }], owner: ME.name,
    visibility,
    joinMode: joinElig === "invite" ? "invite" : "approval"
  };

  return (
    <div className={`create ${mobile ? "single" : ""}`}>
      <LocationModal open={locationModalOpen} onClose={() => setLocationModalOpen(false)} selectedCity={city} onSelectCity={(selected, obj) => {
        setCity(selected);
        if (obj) {
          setLocationState(obj.state);
          setLocationCountry(obj.country);
        }
      }} />
      <AccessControlModal
        open={accessModal}
        onClose={() => setAccessModal(false)}
        hierarchyData={hierarchy}
        myManagedGroups={myManagedGroups}
        mode={accessModalTarget === "join" ? joinElig : "restricted"}
        selectedAccess={accessModalTarget === "join" ? selectedAccess : { restricted: visibilityAccess, selectedMembers: [] }}
        setSelectedAccess={accessModalTarget === "join" ? (val) => {
          const nextValue = typeof val === 'function' ? val(selectedAccess) : val;
          setSelectedAccess(nextValue);
          if (nextValue.restricted) {
            setVisibilityAccess(prev => {
              const union = (arr1, arr2) => Array.from(new Set([...arr1, ...arr2]));
              return {
                communities: union(prev.communities || [], nextValue.restricted.communities || []),
                subCommunities: union(prev.subCommunities || [], nextValue.restricted.subCommunities || []),
                groups: union(prev.groups || [], nextValue.restricted.groups || [])
              };
            });
          }
        } : (val) => {
          const nextValue = typeof val === 'function' ? val({ restricted: visibilityAccess, selectedMembers: [] }) : val;
          setVisibilityAccess(nextValue.restricted);
        }}
      />
      <CapacitySettingsModal open={capModal} onClose={() => setCapModal(false)} limitCap={limitCap} setLimitCap={setLimitCap} maxCap={maxCap} setMaxCap={setMaxCap} waitlist={waitlist} setWaitlist={setWaitlist} entitlementMaxCap={entitlementMaxCap} triggerUpgrade={triggerUpgrade} />

      <DescriptionModal open={descModal} onClose={() => setDescModal(false)} desc={desc} setDesc={setDesc} />
      <QuestionnaireBuilderModal open={qModal} onClose={() => setQModal(false)} questions={questions} setQuestions={setQuestions} />
      <ForumSettingsModal open={forumModal} onClose={() => setForumModal(false)} forums={forums} setForums={setForums} forumsThreadRoles={forumsThreadRoles} setForumsThreadRoles={setForumsThreadRoles} forumsReplyRoles={forumsReplyRoles} setForumsReplyRoles={setForumsReplyRoles} forumsApprove={forumsApprove} setForumsApprove={setForumsApprove} />
      <GallerySettingsModal open={galleryModal} onClose={() => setGalleryModal(false)} gallery={gallery} setGallery={setGallery} galleryAllow={galleryAllow} setGalleryAllow={setGalleryAllow} galleryImageOnly={galleryImageOnly} setGalleryImageOnly={setGalleryImageOnly} galleryVideoOnly={galleryVideoOnly} setGalleryVideoOnly={setGalleryVideoOnly} galleryApprove={galleryApprove} setGalleryApprove={setGalleryApprove} galleryUploadRoles={galleryUploadRoles} setGalleryUploadRoles={setGalleryUploadRoles} galleryViewRoles={galleryViewRoles} setGalleryViewRoles={setGalleryViewRoles} />
      <IconPickerModal open={iconDrawer} onClose={() => setIconDrawer(false)} icon={icon} setIcon={setIcon} />

      {themeDrawer && (
        <div className="modal-backdrop" onClick={() => setThemeDrawer(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999 }}>
          <div className={`bottom-drawer open`} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Select Theme</h3>
              <button onClick={() => setThemeDrawer(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><I.x /></button>
            </div>
            <CoverPicker value={cover} onPick={(c) => { setCover(c); setThemeDrawer(false); }} />
          </div>
        </div>
      )}

      <div className="create-form">
        <div className="cf-inner">
          <div className="create-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => { localStorage.removeItem(draftKey); if (isEdit) { go('group', editGroup); } else { go('home'); } }} style={{ padding: '7px 11px', background: 'var(--surface)' }}><I.arrowL /></button>
              <div><div className="ck">New Group</div><h1 style={{ margin: 0 }}>Create a group</h1></div>
            </div>
          </div>

          <div className="form-card main-info-card">
            <div className="card-left">
              <label className="cfield" style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Header Image</label>
              <div className={`cover-up filled`}
                style={{
                  height: 140,
                  position: "relative",
                  marginBottom: 12,
                  borderRadius: "var(--r-md)",
                  border: banner ? "none" : "1.5px dashed var(--border)",
                  cursor: "pointer",
                  ...(banner ? { backgroundImage: `url("${banner.startsWith('/api/') ? (window.location.port === "8080" ? "http://localhost:3000" : "") + banner : banner}")`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "transparent" } : { background: cover })
                }}
                onClick={() => document.getElementById("banner-upload").click()}
              >
                <Grain />
                <div style={{ position: "absolute", left: 16, bottom: -18, width: 44, height: 44, borderRadius: 12, background: cover, border: "2px solid var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "var(--sh-md)", zIndex: 3, overflow: "hidden" }}>
                  {icon && (icon.startsWith("blob:") || icon.startsWith("http") || icon.startsWith("data:") || icon.includes("/")) ? (
                    <img src={icon.startsWith('/api/') ? (window.location.port === "8080" ? "http://localhost:3000" : "") + icon : icon} alt="icon" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : icon}
                </div>
                {banner ? (
                  <button type="button" className="hbtn reup" style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--border)", boxShadow: "var(--sh-md)", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); document.getElementById("banner-upload").click(); }}>
                    <I.edit style={{ width: 14 }} strokeWidth={2.6} />
                  </button>
                ) : (
                  <button type="button" className="hbtn hbtn--soft hbtn--sm reup" style={{ position: "absolute", top: 8, right: 8, padding: "4px 8px" }} disabled={bannerUploading} onClick={(e) => { e.stopPropagation(); document.getElementById("banner-upload").click(); }}>
                    <I.image style={{ width: 14 }} /> {bannerUploading ? "Uploading..." : "Upload"}
                  </button>
                )}
              </div>
              <input type="file" id="banner-upload" style={{ display: "none" }} accept="image/*" onChange={async e => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setBannerUploading(true);
                  try {
                    const token = localStorage.getItem('token');
                    const apiBaseUrl = window.location.port === "8080" ? "http://localhost:3000" : "";
                    const form = new FormData();
                    form.append('file', file);
                    const res = await fetch(`${apiBaseUrl}/api/upload-group-media`, {
                      method: 'POST',
                      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                      body: form
                    });
                    const data = await res.json();
                    if (data.success && data.imageUrl) {
                      setBanner(data.imageUrl);
                    } else {
                      alert("Banner upload failed. Please try again.");
                    }
                  } catch {
                    alert("Banner upload failed. Please check your connection.");
                  } finally {
                    setBannerUploading(false);
                  }
                }
              }} />

              <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Group Icon</label>
                  <button type="button" className="hbtn hbtn--soft hbtn--sm" style={{ width: "100%", justifyContent: "space-between", padding: "8px 12px", fontSize: 13, height: 36 }} onClick={() => setIconDrawer(true)}>
                    <span>Icon</span>
                    <span style={{ fontSize: 16, display: "flex", alignItems: "center" }}>
                      {icon && !icon.startsWith("blob:") && (icon.startsWith("http") || icon.startsWith("data:") || icon.includes("/")) ? (
                        <img src={icon.startsWith('/api/') ? (window.location.port === "8080" ? "http://localhost:3000" : "") + icon : icon} alt="icon" style={{ width: 20, height: 20, objectFit: "cover", borderRadius: 4 }} />
                      ) : icon && !icon.startsWith("blob:") ? icon : "✺"}
                    </span>
                  </button>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Category</label>
                  <select
                    className="cselect"
                    style={{ width: "100%", padding: "8px 12px", fontSize: 13, height: 36, border: "1.5px solid var(--border)", background: "var(--field)", borderRadius: "var(--r-sm)" }}
                    value={cat}
                    onChange={e => setCat(e.target.value)}
                  >
                    <option value="">Select category...</option>
                    {categoriesList.map(c => (
                      <option key={c.id} value={c.name}>{c.icon_value ? `${c.icon_value} ` : ""}{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Location</label>
                  <button
                    type="button"
                    className="hbtn hbtn--soft hbtn--sm"
                    style={{
                      width: "100%",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      fontSize: 13,
                      height: 36,
                      border: "1.5px solid var(--border)",
                      background: "var(--field)",
                      borderRadius: "var(--r-sm)"
                    }}
                    onClick={() => setLocationModalOpen(true)}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <I.pin style={{ width: 14, color: "var(--ink-2)" }} />
                      <span>{city || "Select city..."}</span>
                    </span>
                    <span style={{ fontSize: 9, opacity: 0.6, color: "var(--ink-3)" }}>▼</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="card-divider" />

            <div className="card-right">
              <div className="cfield">
                <label>Host Selector</label>
                <select className="cselect" style={{ padding: "8px 12px", fontSize: 13.5 }}>
                  <option>{ME.name}'s Group</option>
                </select>
              </div>

              <div className="cfield">
                <label>Visibility</label>
                <div className="vis-pills">
                  <button
                    type="button"
                    className={`vis-pill ${visibility === "public" ? "on" : ""}`}
                    onClick={() => {
                      if (!canPublic) {
                        triggerUpgrade("Public Group Visibility");
                        return;
                      }
                      setVisibility("public");
                    }}
                  >
                    {!canPublic && "🔒 "}Public
                  </button>
                  <button
                    type="button"
                    className={`vis-pill ${visibility === "private" ? "on" : ""}`}
                    onClick={() => {
                      if (!canUnlisted) {
                        triggerUpgrade("Unlisted Group Visibility");
                        return;
                      }
                      setVisibility("private");
                    }}
                  >
                    {!canUnlisted && "🔒 "}Unlisted
                  </button>
                  <button
                    type="button"
                    className={`vis-pill ${visibility === "hidden" ? "on" : ""}`}
                    onClick={() => {
                      if (!canRestricted) {
                        triggerUpgrade("Restricted-Access Group Visibility");
                        return;
                      }
                      setVisibility("hidden");
                      setAccessModalTarget("visibility");
                      setAccessModal(true);
                    }}
                  >
                    {!canRestricted && "🔒 "}Restricted-Access
                  </button>
                </div>
                {visibility === "private" && (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border-2)" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>Unlisted group</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.4 }}>Not shown in Discover. A shareable invite link will be generated after creation so you can share it with specific people.</div>
                    {unlistedLink && (
                      <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
                        <input readOnly value={unlistedLink} className="cinput" style={{ flex: 1, padding: "6px 10px", fontSize: 11 }} onClick={e => (e.target as HTMLInputElement).select()} />
                        <button type="button" className="hbtn hbtn--soft hbtn--sm" onClick={() => { copyText(unlistedLink); }}>Copy</button>
                      </div>
                    )}
                  </div>
                )}
                {visibility === "hidden" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-2)" }}>Restricted-Access Allowed</span>
                      <button
                        type="button"
                        className="hbtn hbtn--ghost hbtn--sm"
                        onClick={() => {
                          setAccessModalTarget("visibility");
                          setAccessModal(true);
                        }}
                        style={{ padding: "4px 8px", height: "auto", fontSize: "11.5px", display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <I.edit style={{ width: 12 }} /> Edit Selection
                      </button>
                    </div>
                    {renderChips("restricted", "visibility")}
                  </div>
                )}
              </div>

              <div className="cfield">
                <label>Group Name</label>
                <input className="cinput" placeholder="What's your group called?" value={name} onChange={e => setName(e.target.value)} />
                <span className="slug-preview">samaagum.co/{name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "your-group-slug"}</span>
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="cfield" style={{ marginBottom: 0 }}>
              <label>Description</label>
              <button type="button" className="hbtn hbtn--soft" style={{ width: "100%", justifyContent: "space-between", padding: "12px 16px" }} onClick={() => setDescModal(true)}>
                <span style={{ color: desc ? "var(--ink)" : "var(--ink-3)", fontWeight: 500 }}>
                  {desc ? "Edit Description" : "Add Description"}
                </span>
                <I.edit style={{ width: 16, color: "var(--ink-2)" }} />
              </button>
            </div>
          </div>

          <div className="form-card">
            <div className="cfield">
              <label>Join Eligibility</label>
              <select
                className="cselect"
                value={joinElig}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "anyone" && !canJoinOpen) {
                    triggerUpgrade("Public Join Eligibility");
                    return;
                  }
                  if (val === "restricted" && !canJoinRestricted) {
                    triggerUpgrade("Restricted Join Eligibility");
                    return;
                  }
                  if (val === "invite" && !canJoinInvite) {
                    triggerUpgrade("Invite Only Join Eligibility");
                    return;
                  }
                  setJoinElig(val);
                  if (val === "restricted") {
                    setAccessModalTarget("join");
                    setAccessModal(true);
                  }
                }}
                style={{ padding: "10px 14px", fontSize: 13.5, width: "100%", marginBottom: 12 }}
              >
                <option value="anyone">{!canJoinOpen && "🔒 "}Public</option>
                <option value="restricted">{!canJoinRestricted && "🔒 "}Restricted Access</option>
                <option value="invite">{!canJoinInvite && "🔒 "}Invite Only</option>
              </select>

              {joinElig === "anyone" && (
                <div className="type-pill sm on" style={{ padding: "12px 14px", flexDirection: "column", alignItems: "flex-start", gap: 2, height: "auto", textAlign: "left", cursor: "default" }}>
                  <span className="tpt">Public</span>
                  <span className="tpd">Open to everyone</span>
                </div>
              )}

              {joinElig === "restricted" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="type-pill sm on" style={{ padding: "12px 14px", flexDirection: "column", alignItems: "flex-start", gap: 2, height: "auto", textAlign: "left", cursor: "default" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <span className="tpt">Restricted Access</span>
                      <button
                        type="button"
                        className="hbtn hbtn--ghost hbtn--sm"
                        onClick={() => {
                          setAccessModalTarget("join");
                          setAccessModal(true);
                        }}
                        style={{ padding: "4px 8px", height: "auto", fontSize: "11.5px", display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <I.edit style={{ width: 12 }} /> Edit Selection
                      </button>
                    </div>
                    <span className="tpd">Only selected communities, sub-communities, or groups can join</span>
                  </div>
                  {renderChips("restricted", "join")}
                </div>
              )}

              {joinElig === "invite" && (
                <>
                  <div
                    className="type-pill sm on"
                    style={{
                      padding: "12px 14px",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 2,
                      height: "auto",
                      textAlign: "left",
                      cursor: "default",
                    }}
                  >
                    <span className="tpt">Invite Only</span>
                    <span className="tpd">Access by invitation only</span>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--ink-3)",
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      A shareable invite link will be automatically generated. Users can only
                      join using this link.
                    </span>

                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>Invite by Email</label>
                      {!isEdit && pendingInviteEmails.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, marginBottom: 6 }}>
                          {pendingInviteEmails.map((em, i) => (
                            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--surface-2)", borderRadius: 20, padding: "2px 10px", fontSize: 12, border: "1px solid var(--border)" }}>
                              {em}
                              <button type="button" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--ink-3)", fontSize: 16, padding: 0, lineHeight: 1 }} onClick={() => setPendingInviteEmails(pendingInviteEmails.filter((_, j) => j !== i))}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <input
                          className="cinput"
                          placeholder="email@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (inviteEmail && !isEdit) { setPendingInviteEmails([...pendingInviteEmails, inviteEmail]); setInviteEmail(""); } } }}
                        />
                        <button
                          type="button"
                          className="hbtn hbtn--primary"
                          onClick={async () => {
                            if (!inviteEmail) return;
                            if (!isEdit) {
                              setPendingInviteEmails([...pendingInviteEmails, inviteEmail]);
                              setInviteEmail("");
                              return;
                            }
                            try {
                              const tok = localStorage.getItem("token");
                              const res = await fetch(`${apiBaseUrl}/api/groups/${editGroup.id}/invites`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
                                body: JSON.stringify({ targets: [{ email: inviteEmail }] }),
                              });
                              const data = await res.json();
                              if (data.success && data.data[0]?.success) {
                                alert("Invitation email sent successfully!");
                                setInviteEmail("");
                              } else {
                                alert("Failed to send invite: " + (data.message || data.data?.[0]?.message));
                              }
                            } catch {
                              alert("Error sending invite");
                            }
                          }}
                        >
                          Invite
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="cfield">
              <label>Host Approval</label>
              <div className="toggle-row" style={{ padding: 0, background: "transparent", border: "none", margin: 0 }}>
                <div className="ti">
                  <div className="t" style={{ fontSize: 13.5, fontWeight: 600 }}>Require Approval</div>
                  <div className="d" style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>New members must be approved by host before joining.</div>
                </div>
                <Toggle on={approval} onClick={() => setApproval(!approval)} />
              </div>
            </div>

            <div className="cfield">
              <label>Capacity</label>
              <button type="button" className="hbtn hbtn--soft" style={{ width: "100%", justifyContent: "space-between", padding: "12px 16px" }} onClick={() => setCapModal(true)}>
                <span style={{ color: "var(--ink)", fontWeight: 500 }}>
                  {limitCap ? `Limit: ${maxCap} members ${waitlist ? "(Waitlist enabled)" : ""}` : "Unlimited Capacity"}
                </span>
                <I.edit style={{ width: 16, color: "var(--ink-2)" }} />
              </button>
            </div>
          </div>

          <div className="form-card">
            <div className="card-right">
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}><I.settings style={{ width: 18 }} /> Advanced Settings</h2>

              <div className="toggle-row" style={{ padding: "12px 0", background: "transparent", border: "none", margin: 0, borderBottom: "1px solid var(--border-2)" }}>
                <div className="ti">
                  <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Questionnaire</div>
                  <div className="d" style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Ask questions to applicants when requesting to join.</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {questionnaire && (
                    <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={() => setQModal(true)} style={{ padding: "4px 8px", height: "auto" }}>
                      <I.edit style={{ width: 12 }} /> {questions.length} questions
                    </button>
                  )}
                  <Toggle on={questionnaire} onClick={() => {
                    const next = !questionnaire;
                    setQuestionnaire(next);
                    if (next && questions.length === 0) setQModal(true);
                  }} />
                </div>
              </div>

              <div className="toggle-row" style={{ padding: "12px 0", background: "transparent", border: "none", margin: 0, borderBottom: "1px solid var(--border-2)" }}>
                <div className="ti">
                  <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Discussions Forum</div>
                  <div className="d" style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Provide a space for members to interact.</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {forums && (
                    <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={() => setForumModal(true)} style={{ padding: "4px 8px", height: "auto" }}>
                      <I.edit style={{ width: 12 }} /> Settings
                    </button>
                  )}
                  <Toggle on={forums} onClick={() => {
                    const next = !forums;
                    setForums(next);
                    if (next) setForumModal(true);
                  }} />
                </div>
              </div>

              <div className="toggle-row" style={{ padding: "12px 0", background: "transparent", border: "none", margin: 0 }}>
                <div className="ti">
                  <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Shared Gallery</div>
                  <div className="d" style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Allow members to upload images and videos.</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {gallery && (
                    <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={() => setGalleryModal(true)} style={{ padding: "4px 8px", height: "auto" }}>
                      <I.edit style={{ width: 12 }} /> Settings
                    </button>
                  )}
                  <Toggle on={gallery} onClick={() => {
                    const next = !gallery;
                    setGallery(next);
                    if (next) setGalleryModal(true);
                  }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            {!isEdit && (
              <button
                type="button"
                className="hbtn hbtn--ghost"
                style={{ flex: 1, padding: "12px", fontWeight: 600, fontSize: 14.5, justifyContent: "center" }}
                onClick={() => handleCreateGroup(true)}
              >
                Save as Draft
              </button>
            )}
            <button
              type="button"
              className="hbtn hbtn--primary"
              style={{ flex: 2, padding: "12px", fontWeight: 600, fontSize: 14.5, justifyContent: "center" }}
              disabled={loading}
              onClick={() => handleCreateGroup(false)}
            >
              {loading ? "Saving..." : (isEdit ? "Update Group" : "Publish Group")}
            </button>
          </div>
        </div>
      </div>

      <div className="create-preview">
        <div style={{ position: "sticky", top: 40, width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)" }}>Live Preview</div>
          <GroupCard g={previewG} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 20px", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", position: "relative" }}>
            <span style={{ fontSize: 20 }}>🎨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Choose visual theme</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.4 }}>Pick a solid brand color to style your group headers, cards, and primary buttons.</div>
              <CoverPicker value={cover} onPick={setCover} />
            </div>
          </div>
        </div>
      </div>

      {upgradeModalOpen && (
        <UpgradePlanModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          feature={upgradeFeature}
          go={go}
          currentPlanName={st?.plan_name}
        />
      )}

      {showShareModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 12000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface)", width: 440, borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-xl)", border: "1px solid var(--border)", position: "relative", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px 0", color: "var(--ink)" }}>Group Published!</h2>
            <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 24px 0", lineHeight: 1.6 }}>
              Your group is published as <strong>Unlisted</strong>. Only people with the secret link below can find and join it.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <input readOnly value={shareLinkForModal} className="cinput" style={{ flex: 1, padding: "10px 14px", fontSize: 13 }} onClick={e => (e.target as HTMLInputElement).select()} />
              <button
                className="hbtn hbtn--primary"
                style={{ padding: "0 16px" }}
                onClick={async () => {
                  await copyText(shareLinkForModal);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                }}
              >
                {shareCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              className="hbtn hbtn--primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 15, fontWeight: 600 }}
              onClick={() => {
                setShowShareModal(false);
                if (pendingNav) {
                  go(pendingNav.view, pendingNav.param);
                }
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
