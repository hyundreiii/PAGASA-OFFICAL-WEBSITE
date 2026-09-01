import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OfficialItem } from '../../types';
import { 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Search, 
  Filter, 
  Eye, 
  Upload, 
  Sparkles, 
  Check, 
  ExternalLink,
  Award,
  Layers
} from 'lucide-react';

const GUIMBA_BARANGAYS = [
  'Poblacion', 'Ayos Lomboy', 'Bacayao', 'Bagong Barrio', 'Balbalungao', 
  'Bantug', 'Bunol', 'Caballero', 'Cabaruan', 'Caingin Tabing Ilog', 
  'Calem', 'Camuning', 'Casongsong', 'Catimon', 'Cavite', 
  'Culao', 'Culong', 'Faigal', 'Galvan', 'Guiset', 
  'Lamorito', 'Lennec', 'Macamabang', 'Macatcatling', 'Manacsac', 
  'Manggang Marikit', 'Manggahan', 'Mataranoc', 'Maybubon', 'Naglabrahan', 
  'Nagpandayan', 'Narvacan I', 'Narvacan II', 'Pacac', 'Partida 1', 
  'Partida 2', 'Pasong Intsik', 'Saint John', 'San Agustin', 'San Andres', 
  'San Bernardino', 'San Marcelino', 'San Miguel', 'San Rafael', 'San Roque', 
  'Santa Ana', 'Santa Cruz', 'Santa Lucia', 'Santa Veronica', 'Santo Cristo', 
  'Saranay', 'Sinulatan', 'Subol', 'Tampac I', 'Tampac II & III', 
  'Tibag', 'Tinangnan', 'Triala', 'Victoria'
];

const COMMITTEES = [
  'Executive Board',
  'Youth Education & Skills',
  'Sports & Wellness',
  'Media & Public Relations',
  'Disaster Risk & Youth Safety',
  'Barangay Youth Relations',
  'Environmental Action',
  'Arts & Cultural Heritage',
  'Secretariat & Finance'
];

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80'
];

export const AdminOfficials: React.FC = () => {
  const { 
    officials, 
    addOfficial, 
    updateOfficial, 
    deleteOfficial, 
    showToast, 
    confirmAction, 
    setCurrentPage 
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState<OfficialItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommitteeFilter, setSelectedCommitteeFilter] = useState('ALL');

  // Form states
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [committee, setCommittee] = useState('Executive Board');
  const [barangay, setBarangay] = useState('Poblacion');
  const [term, setTerm] = useState('2025–2027');
  const [contactEmail, setContactEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(AVATAR_PRESETS[0]);
  const [rank, setRank] = useState<number>(1);
  const [featuredOnLanding, setFeaturedOnLanding] = useState<boolean>(true);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleOpenCreate = () => {
    setEditingOfficial(null);
    setFullName('');
    setPosition('Youth Councilor / Officer');
    setCommittee('Executive Board');
    setBarangay('Poblacion');
    setTerm('2025–2027');
    setContactEmail('');
    setContactNumber('0917-000-0000');
    setBio('Dedicated youth leader advocating for education, civic service, and community empowerment in Guimba.');
    setProfilePicture(`https://api.dicebear.com/7.x/lorelei/svg?seed=PAGASA-${Date.now()}&backgroundColor=d1d4f9,c0aede`);
    setRank(officials.length + 1);
    setFeaturedOnLanding(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (o: OfficialItem) => {
    setEditingOfficial(o);
    setFullName(o.fullName || (o as any).name || '');
    setPosition(o.position || '');
    setCommittee(o.committee || 'Executive Board');
    setBarangay(o.barangay || 'Poblacion');
    setTerm(o.term || '2025–2027');
    setContactEmail(o.contactEmail || (o as any).email || '');
    setContactNumber(o.contactNumber || '');
    setBio(o.bio || '');
    setProfilePicture(o.profilePicture || (o as any).image || AVATAR_PRESETS[0]);
    setRank(o.rank || 1);
    setFeaturedOnLanding(o.featuredOnLanding !== false);
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('error', 'File Too Large', 'Please upload a photo under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setProfilePicture(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !position.trim()) {
      showToast('error', 'Required Fields Missing', 'Please enter official full name and position.');
      return;
    }

    const payload = {
      fullName: fullName.trim(),
      position: position.trim(),
      committee,
      barangay,
      term,
      contactEmail: contactEmail.trim(),
      contactNumber: contactNumber.trim(),
      bio: bio.trim(),
      profilePicture: profilePicture || `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(fullName)}`,
      rank: Number(rank) || 1,
      featuredOnLanding
    };

    if (editingOfficial) {
      updateOfficial(editingOfficial.id, payload);
    } else {
      addOfficial(payload);
    }
    setIsModalOpen(false);
  };

  const filteredOfficials = officials.filter((o) => {
    const name = (o.fullName || (o as any).name || '').toLowerCase();
    const pos = (o.position || '').toLowerCase();
    const bgy = (o.barangay || '').toLowerCase();
    const comm = o.committee || '';
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch = !q || name.includes(q) || pos.includes(q) || bgy.includes(q) || comm.toLowerCase().includes(q);
    const matchesComm = selectedCommitteeFilter === 'ALL' || comm === selectedCommitteeFilter;

    return matchesSearch && matchesComm;
  });

  return (
    <div className="space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h1 className="text-2xl font-display font-bold text-slate-900">
              Executive Directorate & Officials Roster
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, update, and manage youth leadership profiles visible on the public Landing Page and Officials Directory.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setCurrentPage('home')}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Preview how officials appear on the Landing Page"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Preview on Landing Page</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Official</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search official by name, position, or barangay..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <select
            value={selectedCommitteeFilter}
            onChange={(e) => setSelectedCommitteeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Committees ({officials.length})</option>
            {COMMITTEES.map((comm) => (
              <option key={comm} value={comm}>
                {comm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Officials Grid */}
      {filteredOfficials.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 font-display">No Officials Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery ? 'No official matches your search filter.' : 'The organization officials roster is currently empty.'}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Officer</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOfficials.map((o) => {
            const displayName = o.fullName || (o as any).name || 'Official Officer';
            const displayPic = o.profilePicture || (o as any).image || AVATAR_PRESETS[0];
            const displayEmail = o.contactEmail || (o as any).email || 'secretariat@pagasaguimba.org';
            const displayBarangay = o.barangay || 'Poblacion';

            return (
              <div
                key={o.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative"
              >
                {/* Card Top / Identity */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <img 
                      src={displayPic} 
                      alt={displayName} 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-100 shadow-xs group-hover:scale-105 transition-transform" 
                    />
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                          {o.term || '2025–2027'}
                        </span>
                        {o.featuredOnLanding !== false && (
                          <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-200">
                            ★ Landing Page
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm truncate font-display">{displayName}</h3>
                      <p className="text-xs text-blue-700 font-semibold truncate">{o.position}</p>
                      <p className="text-[11px] text-slate-500 truncate">{o.committee}</p>
                    </div>
                  </div>

                  {/* Barangay & Bio */}
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>Brgy. {displayBarangay}, Guimba</span>
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2 italic leading-relaxed">
                      "{o.bio || 'Youth leader serving the Municipality of Guimba.'}"
                    </p>
                  </div>
                </div>

                {/* Card Bottom / Contact & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{displayEmail}</span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEdit(o)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Official Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        confirmAction({
                          title: 'Remove Officer from Roster',
                          message: `Are you sure you want to remove ${displayName} from the official leadership roster and Landing Page?`,
                          confirmText: 'Remove Officer',
                          cancelText: 'Cancel',
                          variant: 'danger',
                          itemDetails: {
                            label: 'Official Profile',
                            value: displayName,
                            subValue: `Position: ${o.position} • Committee: ${o.committee}`
                          },
                          onConfirm: () => {
                            deleteOfficial(o.id);
                          }
                        });
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Officer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Official Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    {editingOfficial ? 'Edit Organization Official' : 'Add New Organization Official'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Updates will sync automatically to the public landing page.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Preview & Selection */}
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <img
                  src={profilePicture}
                  alt="Preview"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-600 shadow-xs flex-shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Profile Picture</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-600 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 shadow-2xs"
                    >
                      <Upload className="w-3 h-3 text-blue-600" />
                      <span>Upload Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfilePicture(`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(fullName || 'Officer')}-${Date.now()}&backgroundColor=d1d4f9,c0aede`)}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-600 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Generate Avatar</span>
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Juan De La Cruz"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Position and Term */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Position / Executive Title *</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Vice President for Internal Affairs"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Term of Office</label>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="e.g. 2025–2027"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Committee and Barangay */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Committee / Directorate</label>
                  <select
                    value={committee}
                    onChange={(e) => setCommittee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600"
                  >
                    {COMMITTEES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Home Barangay (Guimba)</label>
                  <select
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600"
                  >
                    {GUIMBA_BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        Brgy. {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email and Contact Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="officer@pagasaguimba.org"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="0917-xxx-xxxx"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Display Hierarchy Rank and Landing Page Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order (Rank)</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={rank}
                    onChange={(e) => setRank(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Lower numbers display first</span>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  <input
                    type="checkbox"
                    id="featuredToggle"
                    checked={featuredOnLanding}
                    onChange={(e) => setFeaturedOnLanding(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="featuredToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Show on Landing Page
                  </label>
                </div>
              </div>

              {/* Biography & Mandate */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Leadership Biography & Mandate</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Summarize the official's duties, background, and youth advocacy goals..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                >
                  {editingOfficial ? 'Save Official Changes' : 'Add Official to Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
