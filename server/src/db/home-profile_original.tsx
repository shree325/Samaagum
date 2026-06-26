// @ts-nocheck
/**
 * home-profile.tsx
 * Standalone Samaagum Profile Dashboard with Shadcn UI Aesthetics
 */

const { useState, useEffect, useRef, useCallback } = React;

// ─────────────────────────────────────────────
// Icons (lucide-react replacements)
// ─────────────────────────────────────────────
const User = (p) => <svg viewBox="0 0 24 24" fill="none" width="24" height="24" {...p}><circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2" /><path d="M20 21a8 8 0 10-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
const LinkIcon = (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const QrCodeIcon = (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /><path d="M14 14h2v2M21 14v7M14 21h7M18 17v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
const Mail = (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const CreditCard = (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M2 10h20" stroke="currentColor" strokeWidth="2" /><path d="M6 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
const ExternalLink = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const ChevronDown = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const ChevronRight = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Share2 = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" /><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" /><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Download = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Copy = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Check = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const UploadIcon = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const X = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Plus = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Trash2 = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Folder = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const GripVertical = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="9" cy="5" r="1" fill="currentColor" /><circle cx="9" cy="19" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="5" r="1" fill="currentColor" /><circle cx="15" cy="19" r="1" fill="currentColor" /></svg>;
const ImageFile = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" /><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

// ─────────────────────────────────────────────
// Shadcn UI Components
// ─────────────────────────────────────────────
function Card({ children, className = "" }) {
  return <div className={`rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm overflow-hidden ${className}`}>{children}</div>;
}
function CardHeader({ children, className = "" }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
}
function CardTitle({ children }) {
  return <h3 className="text-xl font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100">{children}</h3>;
}
function CardDescription({ children }) {
  return <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{children}</p>;
}
function CardContent({ children, className = "" }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}

function FormLabel({ children, className = "" }) {
  return <label className={`text-sm font-medium leading-none text-gray-900 dark:text-gray-100 mb-2 block ${className}`}>{children}</label>;
}
function FormItem({ children, className = "" }) {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
}
function Input({ className = "", ...props }) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
function Textarea({ className = "", rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`flex w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${className}`}
      {...props}
    />
  );
}
function Select({ value, onChange, children, className = "" }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`flex h-10 w-full appearance-none items-center justify-between rounded-md border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 dark:text-gray-300 pointer-events-none" />
    </div>
  );
}
function Switch({ checked, onCheckedChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"}`}
    >
      <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}
function Slider({ value, onChange, min, max, step }) {
  return (
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
    />
  )
}
function Button({ children, onClick, type = "button", variant = "default", size = "default", disabled = false, className = "" }) {
  const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white dark:ring-offset-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-indigo-600 text-white hover:bg-indigo-600/90",
    outline: "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 text-gray-900 dark:text-gray-100",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 text-gray-700 dark:text-gray-300",
    secondary: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-800/80",
    destructive: "bg-red-500 text-white hover:bg-red-500/90",
    ghostDestructive: "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
}

// Simple Toast
function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  return { toasts, toast };
}
function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="bg-gray-950 text-white text-sm px-4 py-3 rounded-lg shadow-lg border border-gray-800 animate-in slide-in-from-bottom-2">
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Empty Default Profile (fetched from DB)
// ─────────────────────────────────────────────
const DEFAULT_PROFILE = {
  id: "", firstName: "", lastName: "", displayName: "",
  headline: "",
  bio: "",
  email: "", mobile: "", whatsapp: "",
  website: "", profilePhoto: "",
  coverBanner: null, visibility: "public", status: "published", contactVisibility: "everyone",
  profileUrl: "", gender: "", dob: "", location: ""
};
const DEMO_SECTIONS = [
  { id: 1, title: "Social Links", icon: "link", visible: true, links: [] }
];

// Helper to handle image uploads locally via Base64
const handleImageUpload = (e, callback) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onloadend = () => callback(reader.result);
  reader.readAsDataURL(file);
};

// ─────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────
function ProfileTab({ api, profile, onRefresh, toast }) {
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);

  const coverRef = useRef(null);
  const avatarRef = useRef(null);

  useEffect(() => { setForm(profile); }, [profile]);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        displayName: form.displayName,
        bio: form.bio,
        location: form.location,
        gender: form.gender,
        dob: form.dob,
        mobile: form.mobile,
        website: form.website,
        headline: form.headline,
        profilePhoto: form.profilePhoto,
        coverBanner: form.coverBanner
      };
      const res = await fetch(`${api}/admin/user/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) { toast("Profile saved to database!"); onRefresh(); }
      else {
        const err = await res.json().catch(() => null);
        toast(err?.message || "Failed to save profile");
      }
    } catch (e) {
      toast("Error saving profile: " + (e.message || "Network error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your digital identity and contact info.</p>
      </div>

      <Card>
        <div className="relative">
          <div
            onClick={() => coverRef.current?.click()}
            className="h-32 bg-gray-100 relative border-b border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer group"
          >
            {form.coverBanner ? (
              <img src={form.coverBanner} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <UploadIcon className="w-6 h-6 mb-2" />
                <span className="text-xs">Add Cover Banner</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Change Cover</span>
            </div>
            <input type="file" ref={coverRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, set("coverBanner"))} />
          </div>
          {form.coverBanner && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); set("coverBanner")(""); }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded transition-colors z-10"
            >
              Remove Cover
            </button>
          )}
        </div>
        <div className="px-6 pb-6 pt-4 relative">
          <div className="absolute -top-12 left-6">
            <div className="relative inline-block">
              <div
                onClick={() => avatarRef.current?.click()}
                className="w-24 h-24 rounded-full bg-white border-4 border-white overflow-hidden relative group flex items-center justify-center cursor-pointer shadow-sm"
              >
                {form.profilePhoto ? (
                  <img src={form.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <User className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <UploadIcon className="w-6 h-6 text-white" />
                </div>
                <input type="file" ref={avatarRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, set("profilePhoto"))} />
              </div>
              {form.profilePhoto && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); set("profilePhoto")(""); }}
                  className="absolute top-0 right-0 bg-gray-800 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow z-10"
                  title="Remove Photo"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              )}
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormItem><FormLabel>First Name</FormLabel><Input value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} /></FormItem>
            <FormItem><FormLabel>Last Name</FormLabel><Input value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} /></FormItem>
            <FormItem><FormLabel>Display Name</FormLabel><Input value={form.displayName} onChange={(e) => set("displayName")(e.target.value)} /></FormItem>
            <FormItem><FormLabel>Headline</FormLabel><Input value={form.headline} onChange={(e) => set("headline")(e.target.value)} placeholder="e.g. Software Engineer at Tech Corp" /></FormItem>

            {/* New Profile Fields */}
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select value={form.gender || ""} onChange={set("gender")}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </Select>
            </FormItem>
            <FormItem><FormLabel>Date of Birth</FormLabel><Input type="date" value={form.dob || ""} onChange={(e) => set("dob")(e.target.value)} /></FormItem>
            <FormItem><FormLabel>Location</FormLabel><Input value={form.location || ""} onChange={(e) => set("location")(e.target.value)} placeholder="e.g. Bengaluru" /></FormItem>

            <FormItem className="md:col-span-2"><FormLabel>Bio</FormLabel><Textarea value={form.bio} onChange={(e) => set("bio")(e.target.value)} rows={4} /></FormItem>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormItem><FormLabel>Email</FormLabel><Input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} /></FormItem>
          <FormItem><FormLabel>Mobile</FormLabel><Input value={form.mobile || ""} onChange={(e) => set("mobile")(e.target.value)} /></FormItem>
          <FormItem><FormLabel>WhatsApp</FormLabel><Input value={form.whatsapp || ""} onChange={(e) => set("whatsapp")(e.target.value)} /></FormItem>
          <FormItem><FormLabel>Website</FormLabel><Input value={form.website || ""} onChange={(e) => set("website")(e.target.value)} placeholder="https://" /></FormItem>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Privacy & Visibility</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormItem>
            <FormLabel>Profile Visibility</FormLabel>
            <Select value={form.visibility} onChange={set("visibility")}>
              <option value="public">Public</option>
              <option value="members">Members Only</option>
              <option value="private">Private</option>
            </Select>
          </FormItem>
          <FormItem>
            <FormLabel>Contact Info Visibility</FormLabel>
            <Select value={form.contactVisibility} onChange={set("contactVisibility")}>
              <option value="everyone">Everyone</option>
              <option value="connections">Connections Only</option>
              <option value="private">Private</option>
            </Select>
          </FormItem>
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select value={form.status} onChange={set("status")}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
            </Select>
          </FormItem>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full md:w-auto px-8">
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}

function LinksTab({ api, toast }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");

  const loadSections = useCallback(async () => {
    try {
      const res = await fetch(`${api}/sections`);
      if (res.ok) setSections(await res.json());
      else setSections(DEMO_SECTIONS);
    } catch {
      setSections(DEMO_SECTIONS);
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => { loadSections(); }, [loadSections]);

  const addSection = () => {
    toast("Section created");
    setSections([...sections, { id: Date.now(), title: newSectionTitle || "New Section", icon: "folder", visible: true, links: [] }]);
    setAddingSection(false); setNewSectionTitle("");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Links & Sections</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Organize your links into categories.</p>
        </div>
        <Button onClick={() => setAddingSection(true)}><Plus className="w-4 h-4 mr-2" /> Add Section</Button>
      </div>

      {addingSection && (
        <Card className="p-4 flex gap-3 items-end">
          <FormItem className="flex-1"><FormLabel>Section Title</FormLabel><Input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} placeholder="e.g. My Socials" /></FormItem>
          <Button onClick={addSection}>Create</Button>
          <Button variant="ghost" onClick={() => setAddingSection(false)}>Cancel</Button>
        </Card>
      )}

      <div className="space-y-4">
        {sections.map(s => (
          <Card key={s.id} className="mb-4">
            <div className="flex items-center justify-between p-4 bg-gray-50/50 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                <Folder className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{s.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={s.visible} onCheckedChange={(v) => { }} />
                <Button variant="ghostDestructive" size="icon"><Trash2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon"><ChevronDown className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {s.links?.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200/50 bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                    <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{l.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{l.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={l.visible} onCheckedChange={() => { }} />
                    <Button variant="ghostDestructive" size="icon"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2 border-dashed border-2 text-gray-500">
                <Plus className="w-4 h-4 mr-2" /> Add Link
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function QrCodeTab({ profile, toast }) {
  const [fg, setFg] = useState("#16a34a");
  const [bg, setBg] = useState("#f0fdf4");
  const [logoEnabled, setLogoEnabled] = useState(false);
  const [qrSize, setQrSize] = useState(280);
  const [frameStyle, setFrameStyle] = useState("shadow");
  const [activeTheme, setActiveTheme] = useState("Forest");

  const themes = [
    { name: "Classic", fg: "#000000", bg: "#ffffff" },
    { name: "Indigo", fg: "#4f46e5", bg: "#e0e7ff" },
    { name: "Midnight", fg: "#0f172a", bg: "#f1f5f9" },
    { name: "Ocean", fg: "#0ea5e9", bg: "#e0f2fe" },
    { name: "Forest", fg: "#16a34a", bg: "#f0fdf4" },
    { name: "Sunset", fg: "#ea580c", bg: "#ffedd5" },
    { name: "Rose", fg: "#e11d48", bg: "#ffe4e6" },
    { name: "Gold", fg: "#ca8a04", bg: "#fef9c3" }
  ];

  const handleThemeClick = (t) => {
    setActiveTheme(t.name);
    setFg(t.fg);
    setBg(t.bg);
  };

  const profileUrl = `https://${profile?.profileUrl || "samaagum.com/u/user"}`;
  const qrColor = fg.replace("#", "");
  const qrBg = bg.replace("#", "");
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(profileUrl)}&color=${qrColor}&bgcolor=${qrBg}`;

  const downloadQR = () => {
    fetch(qrImageUrl).then(r => r.blob()).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qrcode.png`;
      a.click();
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: Controls */}
        <div className="space-y-6">

          {/* Color Theme Card */}
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-indigo-500">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                  <circle cx="7" cy="10" r="1.5" fill="currentColor" />
                  <circle cx="10" cy="6" r="1.5" fill="currentColor" />
                  <circle cx="14" cy="6" r="1.5" fill="currentColor" />
                  <circle cx="17" cy="10" r="1.5" fill="currentColor" />
                  <path d="M7 16C7 16 8.5 17 12 17C15.5 17 17 16 17 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Color Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="grid grid-cols-4 gap-4">
                {themes.map(t => (
                  <div key={t.name} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => handleThemeClick(t)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${activeTheme === t.name ? 'ring-2 ring-indigo-500 ring-offset-2 bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700'}`}
                    >
                      <div className="w-8 h-8 rounded-lg shadow-sm" style={{ backgroundColor: t.fg }} />
                    </button>
                    <span className="text-[11px] text-gray-500 font-medium">{t.name}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">QR Color</label>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 border border-gray-100 dark:border-gray-800">
                    <div className="w-6 h-6 rounded-md shadow-sm border border-black/5" style={{ backgroundColor: fg }} />
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{fg}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Background</label>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 border border-gray-100 dark:border-gray-800">
                    <div className="w-6 h-6 rounded-md shadow-sm border border-black/5" style={{ backgroundColor: bg }} />
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{bg}</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Size & Frame Card */}
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6 space-y-8">

              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 font-medium">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-indigo-500"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Size
                  </div>
                  <span className="text-sm text-gray-500">{qrSize}px</span>
                </div>
                <Slider value={qrSize} onChange={setQrSize} min={200} max={400} step={20} />
                <div className="flex justify-between text-[11px] text-gray-400 mt-2 font-medium">
                  <span>Small</span>
                  <span>Medium</span>
                  <span>Large</span>
                </div>
              </div>

              <div>
                <div className="font-medium mb-3">Frame Style</div>
                <div className="grid grid-cols-4 bg-gray-100/50 dark:bg-gray-900/50 p-1 rounded-xl">
                  {['Flat', 'Shadow', 'Gradient', 'Border'].map(s => (
                    <button
                      key={s}
                      onClick={() => setFrameStyle(s.toLowerCase())}
                      className={`py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${frameStyle === s.toLowerCase() ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-700' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Center Logo Card */}
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">Center Logo</div>
                <div className="text-xs text-gray-500 mt-0.5">Show Samaagum branding in QR center</div>
              </div>
              <Switch checked={logoEnabled} onCheckedChange={setLogoEnabled} />
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: Preview & Actions */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className={`relative bg-white ${frameStyle === 'shadow' ? 'shadow-2xl rounded-[32px] p-8 border border-gray-100' : frameStyle === 'border' ? 'border-[8px] border-gray-100 rounded-3xl p-6' : frameStyle === 'gradient' ? 'rounded-3xl p-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500' : 'rounded-none border border-gray-200 p-8'} transition-all`}>

            <div className={`bg-white ${frameStyle === 'gradient' ? 'p-8 rounded-[22px]' : ''}`}>
              <img src={qrImageUrl} alt="QR Code" className="w-64 h-64 mx-auto" style={{ width: qrSize * 0.8, height: qrSize * 0.8 }} />
              {logoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-white rounded-md shadow-lg p-1 flex items-center justify-center">
                    <div className="w-full h-full bg-indigo-600 rounded text-white flex items-center justify-center font-bold text-xl">S</div>
                  </div>
                </div>
              )}
            </div>

            <div className={`mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 ${frameStyle === 'gradient' ? 'hidden' : ''}`}>
              Powered by <span className="text-indigo-600 font-bold tracking-tight">Samaagum</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button className="rounded-full px-6 py-5 text-[15px]" onClick={downloadQR}>
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
            <Button variant="outline" className="rounded-full px-6 py-5 text-[15px]" onClick={() => {
              navigator.clipboard.writeText(profileUrl);
              toast("Link copied to clipboard");
            }}>
              <Share2 className="w-4 h-4 mr-2" /> Share Link
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

function EmailSignatureTab({ profile, toast }) {
  const [template, setTemplate] = useState("professional");
  const [showPhoto, setShowPhoto] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [copied, setCopied] = useState(false);

  const name = profile?.displayName || `${profile?.firstName} ${profile?.lastName}` || "John Doe";
  const title = profile?.headline || "Professional Title";
  const email = profile?.email || "email@example.com";
  const phone = profile?.mobile || " ";
  const photoUrl = profile?.profilePhoto || "https://ui-avatars.com/api/?name=" + encodeURIComponent(name);

  const signatureHtml = `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
  <tr>
    ${showPhoto ? `<td style="padding-right: 15px;"><img src="${photoUrl}" width="80" height="80" style="border-radius: 50%; width: 80px; height: 80px; object-fit: cover;" alt="${name}"></td>` : ''}
    <td style="${showPhoto ? 'border-left: 2px solid ' + primaryColor + '; padding-left: 15px;' : ''}">
      <strong style="font-size: 16px; color: #111;">${name}</strong><br>
      <span style="color: ${primaryColor}; font-size: 13px;">${title}</span><br>
      <div style="margin-top: 8px; font-size: 12px; color: #666;">
        ${email} | ${phone}<br>
        <a href="https://${profile?.profileUrl || 'samaagum.com'}" style="color: ${primaryColor}; text-decoration: none;">View Digital Profile</a>
      </div>
    </td>
  </tr>
</table>
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(signatureHtml);
    setCopied(true);
    toast("HTML Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Email Signature</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Generate a professional HTML signature for your emails.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormItem>
              <FormLabel>Template Style</FormLabel>
              <Select value={template} onChange={setTemplate}>
                <option value="minimal">Minimal</option>
                <option value="professional">Professional</option>
                <option value="modern">Modern</option>
              </Select>
            </FormItem>
            <FormItem>
              <FormLabel>Accent Color</FormLabel>
              <div className="flex gap-2">
                <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 p-1 h-10" />
                <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 font-mono" />
              </div>
            </FormItem>
            <FormItem className="flex items-center justify-between rounded-lg border border-gray-200/50 p-4 bg-gray-50/50">
              <FormLabel className="mb-0">Show Profile Photo</FormLabel>
              <Switch checked={showPhoto} onCheckedChange={setShowPhoto} />
            </FormItem>
            <Button className="w-full" onClick={() => toast("Settings saved")}>Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Preview</CardTitle>
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy HTML"}
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="bg-white rounded-lg p-8 h-full min-h-[200px] border border-gray-200 flex items-center justify-center overflow-x-auto shadow-inner">
              <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WalletTab() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div><h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Wallet</h1></div>
      <Card><CardContent className="p-8 text-center text-gray-500 border-dashed">Feature coming soon.</CardContent></Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Application Wrapper
// ─────────────────────────────────────────────
const NAV = [
  { id: "profile", label: "Profile", icon: User },
  { id: "links", label: "Links", icon: LinkIcon },
  { id: "qr", label: "QR Code", icon: QrCodeIcon },
  { id: "email", label: "Email Signature", icon: Mail },
  { id: "wallet", label: "Wallet", icon: CreditCard },
];

function Profile({ st, go, apiBaseUrl = "/api", view = "dashboard", username }) {
  const resolvedApi = (typeof window !== "undefined" && window.location.port === "8080")
    ? "http://localhost:3000/api" : apiBaseUrl;

  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const { toasts, toast } = useToast();

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const pRes = await fetch(`${resolvedApi}/admin/user/profile`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (pRes.ok) {
        const json = await pRes.json();
        if (json.success && json.data) {
          const d = json.data;
          const p = d.profile || {};
          const links = d.links || [];
          const headlineLink = links.find(l => l.kind === 'headline');
          const websiteLink = links.find(l => l.kind === 'website');
          // Split display_name into firstName / lastName
          const nameParts = (p.display_name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          setProfile({
            ...DEFAULT_PROFILE,
            id: p.user_id || '',
            firstName,
            lastName,
            displayName: p.display_name || '',
            bio: p.bio || '',
            email: d.email || '',
            gender: p.gender || '',
            dob: p.dob ? p.dob.substring(0, 10) : '',
            mobile: d.phone || '',
            location: p.preferred_location || '',
            headline: headlineLink?.value || '',
            website: websiteLink?.value || '',
            profileUrl: firstName.toLowerCase() || '',
            profilePhoto: p.profilePhoto || '',
            coverBanner: p.coverBanner || '',
          });
        }
      }
    } catch (err) {
      console.warn('Could not load profile from DB:', err);
    } finally {
      setLoading(false);
    }
  }, [resolvedApi]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  return (
    <div className="scroll flex-1 overflow-y-auto">
      <div className="min-h-full bg-slate-50 dark:bg-gray-950 transition-colors">

        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/85 dark:bg-gray-950/85 backdrop-blur-md border-b border-slate-200 dark:border-gray-800 transition-colors">
          <div className="flex items-center justify-between pt-4 px-6">
            <div>
              <h1 className="m-0 text-xl font-bold text-slate-900 dark:text-gray-100 tracking-tight">Digital Profile</h1>
              <p className="m-0 mt-0.5 text-sm text-slate-500 dark:text-gray-400">{loading ? "Loading..." : (profile.displayName || profile.email || "Set up your profile")}{profile.profileUrl ? ` · @${profile.profileUrl}` : ""}</p>
            </div>
            <Button size="sm" onClick={() => go("public-profile", profile)}>
              <ExternalLink className="w-4 h-4 mr-2" /> View Profile
            </Button>
          </div>

          <div className="flex gap-2 pt-3 px-6 overflow-x-auto no-scrollbar">
            {NAV.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id} onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg border-b-2 font-medium text-sm transition-all whitespace-nowrap ${active
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300"
                    }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: "32px 24px 64px", maxWidth: 960, margin: "0 auto" }}>
          {activeTab === "profile" && <ProfileTab api={resolvedApi} profile={profile} onRefresh={loadProfile} toast={toast} />}
          {activeTab === "links" && <LinksTab api={resolvedApi} toast={toast} />}
          {activeTab === "qr" && <QrCodeTab profile={profile} toast={toast} />}
          {activeTab === "email" && <EmailSignatureTab profile={profile} toast={toast} />}
          {activeTab === "wallet" && <WalletTab />}
        </div>

        <ToastContainer toasts={toasts} />
      </div>
    </div>
  );
}

Object.assign(window, { Profile });
