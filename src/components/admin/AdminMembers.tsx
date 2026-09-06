import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Member, User } from '../../types';
import { GUIMBA_BARANGAYS } from '../../data/mockData';
import { 
  Users, 
  Search, 
  Plus, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  QrCode, 
  Filter, 
  X, 
  Check, 
  Eye,
  Shield,
  FileSpreadsheet,
  Camera,
  Mail,
  Copy,
  LogIn,
  Sparkles,
  UserCheck,
  ExternalLink,
  Lock,
  Key,
  AlertCircle,
  Clock,
  ShieldAlert,
  Power,
  Calendar,
  MapPin,
  Phone,
  User as UserIcon,
  EyeOff,
  ChevronDown,
  ChevronUp,
  FileText,
  RefreshCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ChangeProfilePictureModal } from '../common/ChangeProfilePictureModal';

export const AdminMembers: React.FC = () => {
  const { 
    members, 
    addMember, 
    updateMember, 
    deleteMember, 
    assignMemberPassword,
    toggleMemberActivation,
    selectedMemberId, 
    setSelectedMemberId,
    switchRole,
    setCurrentPage,
    addToast,
    confirmAction,
    fetchLatestMembers,
    joinSubmissions
  } = useApp();

  // Filters & Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'NEW' | 'NEEDS_PASSWORD' | 'ACTIVE'>('ALL');
  const [showJoinOrgSection, setShowJoinOrgSection] = useState(true);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [isFetchingSubmissions, setIsFetchingSubmissions] = useState(false);
  const [lastFetchedTime, setLastFetchedTime] = useState('Just now');

  const handleFetchSubmissions = async () => {
    setIsFetchingSubmissions(true);
    try {
      const res = await fetchLatestMembers();
      setLastFetchedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      addToast(res.message || 'Updated Member Directory and Join Organization credentials from database.', 'success');
    } catch (err) {
      addToast('Member records synchronized.', 'info');
    } finally {
      setIsFetchingSubmissions(false);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [photoTargetMember, setPhotoTargetMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(
    selectedMemberId ? members.find(m => m.id === selectedMemberId) || null : null
  );

  // Password Assignment Modal State
  const [passwordTargetMember, setPasswordTargetMember] = useState<Member | null>(null);
  const [assignPasswordInput, setAssignPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Form State for Create / Edit Member
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formBarangay, setFormBarangay] = useState(GUIMBA_BARANGAYS[0]);
  const [formBirthdate, setFormBirthdate] = useState('2004-01-01');
  const [formGender, setFormGender] = useState<'Male' | 'Female' | 'Prefer not to say' | 'Other'>('Male');
  const [formEducation, setFormEducation] = useState<any>('College / University');
  const [formStatus, setFormStatus] = useState<'Active' | 'Pending' | 'Inactive'>('Active');
  const [formPosition, setFormPosition] = useState('Youth Member');
  const [formCommittee, setFormCommittee] = useState('General Youth Volunteer');
  const [formAddress, setFormAddress] = useState('');

  // Filtered members list
  const filteredMembers = members.filter(m => {
    const matchesBarangay = selectedBarangay === 'ALL' || m.barangay === selectedBarangay;
    
    let matchesTab = true;
    if (activeTab === 'NEW') {
      matchesTab = m.membershipStatus === 'Pending' || !m.isAccountActivated;
    } else if (activeTab === 'NEEDS_PASSWORD') {
      matchesTab = !m.passwordAssigned && !m.portalPassword;
    } else if (activeTab === 'ACTIVE') {
      matchesTab = m.isAccountActivated === true || m.membershipStatus === 'Active';
    }

    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return matchesBarangay && matchesTab;

    const matchesSearch = 
      (m.fullName || '').toLowerCase().includes(q) ||
      (m.memberId || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.address || '').toLowerCase().includes(q) ||
      (m.barangay || '').toLowerCase().includes(q) ||
      (m.contactNumber || '').toLowerCase().includes(q);

    return matchesBarangay && matchesTab && matchesSearch;
  });

  const activeCount = members.filter(m => m.isAccountActivated === true || m.membershipStatus === 'Active').length;
  const newlyRegisteredCount = members.filter(m => m.membershipStatus === 'Pending' || !m.isAccountActivated).length;
  const needsPasswordCount = members.filter(m => !m.passwordAssigned && !m.portalPassword).length;
  // Submissions from Join Organization (explicitly tagged, credentials submitted, or pending activation)
  const joinOrgSubmissions = members.filter(m => 
    m.registrationSource === 'JOIN_ORGANIZATION_FORM' || 
    Boolean(m.submittedCredentials) ||
    m.membershipStatus === 'Pending' || 
    !m.isAccountActivated || 
    !m.portalPassword
  );

  const handleOpenPasswordModal = (m: Member) => {
    setPasswordTargetMember(m);
    setAssignPasswordInput(m.portalPassword || '');
    setConfirmPasswordInput(m.portalPassword || '');
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetMember) return;

    setPasswordError('');
    setPasswordSuccess('');

    if (!assignPasswordInput || assignPasswordInput.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (assignPasswordInput !== confirmPasswordInput) {
      setPasswordError('Assign Password and Confirm Password do not match.');
      return;
    }

    const result = assignMemberPassword(passwordTargetMember.id, assignPasswordInput);
    if (result.success) {
      setPasswordSuccess(result.message);
      // Update local object
      setPasswordTargetMember(prev => prev ? {
        ...prev,
        portalPassword: assignPasswordInput,
        passwordAssigned: true
      } : null);
    } else {
      setPasswordError(result.message);
    }
  };

  const handleToggleActivation = (m: Member) => {
    const willActivate = !m.isAccountActivated && m.membershipStatus !== 'Active';
    
    if (willActivate && !m.portalPassword && !m.passwordAssigned) {
      handleOpenPasswordModal(m);
      setPasswordError('Please assign a password for this member before activating the account.');
      return;
    }

    const result = toggleMemberActivation(m.id, willActivate);
    if (result.success && passwordTargetMember && passwordTargetMember.id === m.id) {
      setPasswordTargetMember(prev => prev ? {
        ...prev,
        isAccountActivated: willActivate,
        membershipStatus: willActivate ? 'Active' : 'Inactive'
      } : null);
    }
  };

  const handleOpenCreate = () => {
    setEditingMember(null);
    setFormName('');
    setFormEmail('');
    setFormContact('+63 9');
    setFormBarangay(GUIMBA_BARANGAYS[0]);
    setFormBirthdate('2004-01-01');
    setFormGender('Male');
    setFormEducation('College / University');
    setFormStatus('Active');
    setFormPosition('Youth Member');
    setFormCommittee('General Youth Volunteer');
    setFormAddress('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setFormName(m.fullName);
    setFormEmail(m.email);
    setFormContact(m.contactNumber);
    setFormBarangay(m.barangay);
    setFormBirthdate(m.birthdate);
    setFormGender(m.gender);
    setFormEducation(m.educationalStatus);
    setFormStatus(m.membershipStatus);
    setFormPosition(m.organizationPosition || 'Youth Member');
    setFormCommittee(m.committee || 'General Youth Volunteer');
    setFormAddress(m.address);
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    const birthYear = new Date(formBirthdate).getFullYear();
    const age = Math.max(15, 2026 - birthYear);
    const cleanedEmail = formEmail.trim().toLowerCase();

    if (editingMember) {
      updateMember(editingMember.id, {
        fullName: formName.trim(),
        email: cleanedEmail,
        contactNumber: formContact,
        barangay: formBarangay,
        birthdate: formBirthdate,
        age,
        gender: formGender,
        educationalStatus: formEducation,
        membershipStatus: formStatus,
        isAccountActivated: formStatus === 'Active',
        organizationPosition: formPosition,
        committee: formCommittee,
        address: formAddress
      });
      addToast(`Member record for ${formName} updated.`, 'success');
    } else {
      const newMember = addMember({
        fullName: formName.trim(),
        email: cleanedEmail,
        contactNumber: formContact,
        birthdate: formBirthdate,
        age,
        gender: formGender,
        address: formAddress || `Purok 1, Brgy. ${formBarangay}, Guimba`,
        barangay: formBarangay,
        educationalStatus: formEducation,
        occupation: 'Youth Member / Student',
        profilePicture: formGender === 'Female' 
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
          : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
        membershipStatus: formStatus,
        isAccountActivated: formStatus === 'Active',
        passwordAssigned: false,
        organizationPosition: formPosition,
        committee: formCommittee,
        emergencyContact: {
          name: 'Family Contact',
          relationship: 'Parent / Guardian',
          contactNumber: formContact
        }
      });
      addToast(`Added member ${formName} (${newMember.memberId}). You can now assign their password.`, 'success');
    }

    setIsCreateModalOpen(false);
  };

  const handleCopyCredentials = (m: Member) => {
    const message = `PAGASA GUIMBA YOUTH MEMBER CREDENTIALS\n` +
      `-----------------------------------------\n` +
      `Full Name: ${m.fullName}\n` +
      `Member ID: ${m.memberId}\n` +
      `Complete Address: ${m.address}\n` +
      `Barangay: Brgy. ${m.barangay}, Guimba\n` +
      `Birthday: ${m.birthdate} (${m.age} years old)\n` +
      `Cellphone Number: ${m.contactNumber || 'N/A'}\n` +
      `Gmail Account: ${m.email}\n` +
      `Assigned Password: ${m.portalPassword || '[Pending Admin Password Assignment]'}\n` +
      `Account Status: ${m.isAccountActivated ? 'Active & Activated' : 'Pending Activation'}\n` +
      `-----------------------------------------\n` +
      `Log in to the PAGASA Youth Portal at: ${window.location.origin}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message);
      addToast(`Copied registration details and credentials for ${m.fullName}!`, 'success');
    }
  };

  const handleTestLoginAsMember = (m: Member) => {
    const userPayload: User = {
      id: m.id,
      name: m.fullName,
      email: m.email,
      role: 'MEMBER',
      avatar: m.profilePicture,
      memberId: m.memberId
    };
    switchRole('MEMBER', userPayload);
  };

  const handleExportCSV = () => {
    const headers = ['Member ID', 'Full Name', 'Gmail', 'Cellphone', 'Address', 'Barangay', 'Age', 'Status', 'Account Activated', 'Password Assigned', 'Date Registered'];
    const rows = filteredMembers.map(m => [
      `"${m.memberId}"`,
      `"${m.fullName}"`,
      `"${m.email}"`,
      `"${m.contactNumber || ''}"`,
      `"${m.address || ''}"`,
      `"${m.barangay}"`,
      m.age,
      `"${m.membershipStatus}"`,
      m.isAccountActivated ? 'YES' : 'NO',
      m.passwordAssigned ? 'YES' : 'NO',
      `"${m.registrationDate || m.membershipDate || '2026-01-01'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PAGASA_Guimba_Members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Member directory exported to CSV.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-slate-900">
              Member Directory & Join Organization Management
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              Admin Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin Member Directory: Review live inputs submitted via Join Organization, assign portal passwords, manage credentials, and activate accounts ({filteredMembers.length} records).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* JOIN ORGANIZATION - NEW USER CREDENTIALS & INPUTS REVIEW  */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-display">
                  Join Organization — Live Submissions & Credentials Review
                </h2>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {joinOrgSubmissions.length} Submissions
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Review user inputs submitted from the public Join Organization form and assign credentials.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleFetchSubmissions}
              disabled={isFetchingSubmissions}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Sync latest registrations from Firestore database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSubmissions ? 'animate-spin' : ''}`} />
              <span>{isFetchingSubmissions ? 'Fetching...' : 'Fetch Latest Submissions'}</span>
            </button>

            <span className="hidden sm:inline-block text-[11px] text-blue-200 bg-white/10 px-2 py-1 rounded-lg">
              Synced: {lastFetchedTime}
            </span>

            <button
              type="button"
              onClick={() => setShowJoinOrgSection(!showJoinOrgSection)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{showJoinOrgSection ? 'Hide Submissions' : 'Show Submissions'}</span>
              {showJoinOrgSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showJoinOrgSection && (
          <div className="p-4 sm:p-5 bg-slate-50/60 border-t border-slate-200">
            {joinOrgSubmissions.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-200 p-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">All Join Organization Registrations Processed</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Every member currently has an assigned password and an activated account. When new members submit the "Join Organization" form on the public portal, they will instantly appear here for credentials review.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {joinOrgSubmissions.map((m) => {
                    const isPassRevealed = Boolean(revealedPasswords[m.id]);
                    const hasPassword = Boolean(m.portalPassword || m.passwordAssigned);
                    const isActivated = Boolean(m.isAccountActivated || m.membershipStatus === 'Active');

                    return (
                      <div 
                        key={`join-org-${m.id}`}
                        className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden"
                      >
                        {/* Top banner */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="relative cursor-pointer group"
                              onClick={() => setPhotoTargetMember(m)}
                              title="Click to update photo"
                            >
                              <img 
                                src={m.profilePicture} 
                                alt="" 
                                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow-xs group-hover:brightness-90 transition-all"
                              />
                              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base font-display">
                                  {m.fullName}
                                </h3>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono font-bold text-[10px] rounded border border-blue-200">
                                  {m.memberId}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>Registered: {m.registrationDate || m.membershipDate || '2026-03-01'}</span>
                              </p>
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isActivated 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {isActivated ? 'Activated' : 'Pending Activation'}
                          </span>
                        </div>

                        {/* Join Organization Submitted Input Fields */}
                        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 text-xs mb-3 space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-1 mb-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider flex items-center gap-1">
                              <FileText className="w-3 h-3 text-blue-600" />
                              Join Organization Form Inputs:
                            </span>
                            <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                              Brgy. {m.barangay}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                            {/* 1. Full Name */}
                            <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">1. Full Name</span>
                              <span className="font-semibold text-slate-900">{m.fullName}</span>
                            </div>

                            {/* 2. Complete Address */}
                            <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">2. Complete Address</span>
                              <span className="font-semibold text-slate-900 truncate block" title={m.address}>
                                {m.address}
                              </span>
                            </div>

                            {/* 3. Birthday */}
                            <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">3. Birthday</span>
                              <span className="font-semibold text-slate-900">{m.birthdate}</span>
                            </div>

                            {/* 4. Age */}
                            <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">4. Age</span>
                              <span className="font-semibold text-slate-900">{m.age} years old</span>
                            </div>

                            {/* 5. Gmail Account */}
                            <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">5. Gmail Account</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(m.email);
                                    addToast(`Copied ${m.email} to clipboard`, 'success');
                                  }}
                                  className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                  title="Copy Gmail"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="font-mono font-bold text-blue-700 truncate block mt-0.5" title={m.email}>
                                {m.email}
                              </span>
                            </div>

                            {/* 6. Cellphone Number */}
                            <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">6. Cellphone Number</span>
                                {m.contactNumber && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(m.contactNumber);
                                      addToast(`Copied ${m.contactNumber} to clipboard`, 'success');
                                    }}
                                    className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                    title="Copy phone"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <span className="font-mono font-semibold text-slate-800 block mt-0.5">
                                {m.contactNumber || 'Not provided'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Credentials & Password Section */}
                        <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-200/70 text-xs mb-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider flex items-center gap-1">
                              <Key className="w-3 h-3 text-blue-600" />
                              User Credentials & Access
                            </span>
                            {hasPassword ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Password Assigned
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                                Needs Password
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-medium">Assigned Password:</span>
                              {hasPassword ? (
                                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-300">
                                  <span className="font-mono font-bold text-xs text-slate-900">
                                    {isPassRevealed ? m.portalPassword : '••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(m.id)}
                                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer ml-1"
                                    title={isPassRevealed ? 'Hide Password' : 'Show Password'}
                                  >
                                    {isPassRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  {m.portalPassword && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(m.portalPassword || '');
                                        addToast(`Copied password for ${m.fullName}`, 'success');
                                      }}
                                      className="text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer"
                                      title="Copy Password"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-rose-600 italic font-medium">
                                  Not set yet (Admin must assign)
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenPasswordModal(m)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <Lock className="w-3 h-3" />
                              <span>{hasPassword ? 'Change Password' : 'Assign Password'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            {isActivated ? (
                              <button
                                type="button"
                                onClick={() => handleToggleActivation(m)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-rose-200"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleActivation(m)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Activate Account</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(m)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Copy user credentials to clipboard"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Details</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingMember(m)}
                              className="px-2.5 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Pass / QR</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(m)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Member Details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Metrics Bar & Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">All Members</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-display">{members.length}</p>
          <span className="text-[10px] text-slate-500">Full municipal registry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('NEW')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'NEW'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-amber-200 bg-amber-50/30 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Newly Registered</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 font-display">{newlyRegisteredCount}</p>
          <span className="text-[10px] text-amber-600 font-medium">Pending activation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('NEEDS_PASSWORD')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'NEEDS_PASSWORD'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Needs Password</span>
            <Key className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700 font-display">{needsPasswordCount}</p>
          <span className="text-[10px] text-rose-600 font-medium">Awaiting Admin password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'ACTIVE'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Activated Accounts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 font-display">{activeCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Can sign in with Gmail</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, Gmail, cellphone, address..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Quick tab indicator */}
          <span className="text-xs font-semibold text-slate-500 mr-1">
            Filter: {activeTab === 'ALL' ? 'All' : activeTab === 'NEW' ? 'Newly Registered' : activeTab === 'NEEDS_PASSWORD' ? 'Needs Password' : 'Active'}
          </span>

          {/* Barangay Dropdown */}
          <select
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Barangays ({GUIMBA_BARANGAYS.length})</option>
            {GUIMBA_BARANGAYS.map((b) => (
              <option key={b} value={b}>Brgy. {b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                <th className="py-3.5 px-4">Member & Gmail Account</th>
                <th className="py-3.5 px-4">Address & Contact</th>
                <th className="py-3.5 px-4">Age / Birthday</th>
                <th className="py-3.5 px-4">Password Status</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600 text-sm">No members match your criteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try changing the filter or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const isActivated = m.isAccountActivated === true || m.membershipStatus === 'Active';
                  const hasPassword = Boolean(m.portalPassword || m.passwordAssigned);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Member & Gmail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="relative group cursor-pointer flex-shrink-0"
                            onClick={() => setPhotoTargetMember(m)}
                            title="Click to change member photo"
                          >
                            <img
                              src={m.profilePicture}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:brightness-90 transition-all"
                            />
                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">{m.fullName}</p>
                              {m.registrationSource === 'JOIN_ORGANIZATION_FORM' && (
                                <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-indigo-200 flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>Join Form</span>
                                </span>
                              )}
                              {m.membershipStatus === 'Pending' && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-200">
                                  Pending
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 font-mono">
                              <Mail className="w-3 h-3 text-red-500 flex-shrink-0" />
                              <span className="text-blue-700 font-semibold">{m.email}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {m.memberId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Address & Contact */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="font-semibold text-slate-800 truncate" title={m.address}>
                          {m.address}
                        </p>
                        <p className="text-[11px] text-slate-500">Brgy. {m.barangay}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {m.contactNumber || 'No phone'}
                        </p>
                      </td>

                      {/* Age / Birthday */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-800">{m.age} yrs old</p>
                        <p className="text-[11px] text-slate-500">{m.birthdate}</p>
                      </td>

                      {/* Password Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasPassword ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {revealedPasswords[m.id] ? m.portalPassword : '••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(m.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              title={revealedPasswords[m.id] ? 'Hide password' : 'Show password'}
                            >
                              {revealedPasswords[m.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            {m.portalPassword && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(m.portalPassword || '');
                                  addToast(`Copied password for ${m.fullName}`, 'success');
                                }}
                                className="text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer"
                                title="Copy password"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenPasswordModal(m)}
                              className="text-blue-600 hover:text-blue-800 p-0.5 cursor-pointer"
                              title="Change password"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(m)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer animate-pulse"
                            title="Click to assign password"
                          >
                            <Key className="w-3 h-3 text-rose-600" />
                            <span>Assign Password</span>
                          </button>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActivation(m)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              isActivated
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                            title={isActivated ? 'Click to deactivate account' : 'Click to activate account'}
                          >
                            <Power className={`w-3 h-3 ${isActivated ? 'text-emerald-600' : 'text-amber-600'}`} />
                            <span>{isActivated ? 'Active (Activated)' : 'Pending Activation'}</span>
                          </button>
                        </div>
                      </td>

                      {/* Admin Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Password Assignment / Reset Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(m)}
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Assign / Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Activate / Deactivate Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleActivation(m)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isActivated ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isActivated ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {isActivated ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>

                          {/* Copy Credentials */}
                          <button
                            onClick={() => handleCopyCredentials(m)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Copy Credentials & Login Info"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Test Login As Member */}
                          <button
                            onClick={() => handleTestLoginAsMember(m)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Preview Member Portal as this user"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>

                          {/* View QR Pass */}
                          <button
                            onClick={() => setViewingMember(m)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Digital QR Pass"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Edit Member Info */}
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Member Information"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Member */}
                          <button
                            type="button"
                            onClick={() => {
                              confirmAction({
                                title: 'Delete Member Account',
                                message: `Are you sure you want to permanently delete the account for ${m.fullName}? They will no longer be able to log in or access the portal.`,
                                confirmText: 'Delete Member',
                                cancelText: 'Cancel',
                                variant: 'danger',
                                itemDetails: {
                                  label: 'Member Record',
                                  value: `${m.fullName} (${m.memberId})`,
                                  subValue: `Gmail: ${m.email} • Barangay: ${m.barangay}`
                                },
                                onConfirm: () => {
                                  deleteMember(m.id);
                                  addToast(`Member ${m.fullName} deleted.`, 'info');
                                }
                              });
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ADMIN PASSWORD ASSIGNMENT & ACCOUNT ACTIVATION MODAL       */}
      {/* ========================================================= */}
      {passwordTargetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 my-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={passwordTargetMember.profilePicture}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-600 shadow-sm"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">
                    {passwordTargetMember.fullName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-blue-700">
                      {passwordTargetMember.memberId}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-600">
                      {passwordTargetMember.email}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setPasswordTargetMember(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Details Summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Address</span>
                  <span className="font-medium">{passwordTargetMember.address}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Birthday & Age</span>
                  <span className="font-medium">{passwordTargetMember.birthdate} ({passwordTargetMember.age} yrs old)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Cellphone</span>
                  <span className="font-mono font-medium">{passwordTargetMember.contactNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Registered On</span>
                  <span className="font-medium">{passwordTargetMember.registrationDate || passwordTargetMember.membershipDate}</span>
                </div>
              </div>
            </div>

            {/* Password Feedback Alerts */}
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Password Input Form */}
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>Admin Password Assignment</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Enter and confirm the password for this member. After saving, the member can use this password to log in once their account is activated.
                </p>
              </div>

              {/* Assign Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Password:
                </label>
                <input
                  type="text"
                  required
                  value={assignPasswordInput}
                  onChange={(e) => setAssignPasswordInput(e.target.value)}
                  placeholder="Enter member's password (e.g. pagasa2026)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password:
                </label>
                <input
                  type="text"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Confirm password exactly"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              {/* Save Password Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Save Password</span>
              </button>
            </form>

            {/* Account Activation Section */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Power className="w-4 h-4 text-emerald-600" />
                    <span>Account Activation Status</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    {passwordTargetMember.isAccountActivated || passwordTargetMember.membershipStatus === 'Active'
                      ? 'Account is currently activated. Member can log in immediately.'
                      : 'Account is pending activation. Activate to allow member login.'}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  passwordTargetMember.isAccountActivated || passwordTargetMember.membershipStatus === 'Active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {passwordTargetMember.isAccountActivated || passwordTargetMember.membershipStatus === 'Active'
                    ? 'Activated'
                    : 'Pending Activation'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {passwordTargetMember.isAccountActivated || passwordTargetMember.membershipStatus === 'Active' ? (
                  <button
                    type="button"
                    onClick={() => handleToggleActivation(passwordTargetMember)}
                    className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Deactivate Account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleActivation(passwordTargetMember)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Activate Member Account</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleCopyCredentials(passwordTargetMember)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Copy credentials for sending to member"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Details & Join Organization Inputs Modal */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-6 relative">
            <button
              onClick={() => setViewingMember(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
              <img
                src={viewingMember.profilePicture}
                alt=""
                className="w-14 h-14 rounded-full object-cover border-2 border-blue-600 shadow-md flex-shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 font-display">{viewingMember.fullName}</h3>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {viewingMember.memberId}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Brgy. {viewingMember.barangay}, Guimba, Nueva Ecija
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    viewingMember.isAccountActivated || viewingMember.membershipStatus === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {viewingMember.isAccountActivated || viewingMember.membershipStatus === 'Active' ? 'Activated' : 'Pending Activation'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Registered: {viewingMember.registrationDate || viewingMember.membershipDate || '2026-03-01'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submitted Inputs from Join Organization */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Join Organization Form Submission:
                </span>
                <span className="text-[10px] text-blue-700 font-bold bg-blue-100/60 px-2 py-0.5 rounded">
                  Official Record
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">1. Full Name</span>
                  <span className="font-bold text-slate-900">{viewingMember.fullName}</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">2. Complete Address</span>
                  <span className="font-semibold text-slate-900 block truncate" title={viewingMember.address}>
                    {viewingMember.address}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">3. Birthday</span>
                  <span className="font-semibold text-slate-900">{viewingMember.birthdate}</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">4. Age</span>
                  <span className="font-semibold text-slate-900">{viewingMember.age} years old</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">5. Gmail Account</span>
                  <span className="font-mono font-bold text-blue-700 block truncate" title={viewingMember.email}>
                    {viewingMember.email}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">6. Cellphone Number</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {viewingMember.contactNumber || 'Not provided'}
                  </span>
                </div>
              </div>

              {/* Password & Credentials Summary */}
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-900 block">Admin-Assigned Password</span>
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {viewingMember.portalPassword ? (
                      revealedPasswords[viewingMember.id] ? viewingMember.portalPassword : '••••••••'
                    ) : (
                      <span className="text-rose-600 font-sans italic font-normal">Not assigned yet</span>
                    )}
                  </span>
                </div>

                {viewingMember.portalPassword && (
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(viewingMember.id)}
                    className="p-1 text-blue-700 hover:text-blue-900 cursor-pointer"
                    title={revealedPasswords[viewingMember.id] ? 'Hide password' : 'Show password'}
                  >
                    {revealedPasswords[viewingMember.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* QR Pass */}
            <div className="flex justify-center p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <QRCodeSVG value={viewingMember.qrCode || viewingMember.memberId} size={130} />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenPasswordModal(viewingMember);
                    setViewingMember(null);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Key className="w-4 h-4" />
                  <span>Manage Password & Activation</span>
                </button>
                
                <button
                  onClick={() => handleCopyCredentials(viewingMember)}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy full credentials to clipboard"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>

              <button
                onClick={() => setViewingMember(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Member Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {editingMember ? 'Edit Member Profile' : 'Add New Youth Member'}
                </h3>
                <p className="text-xs text-slate-500">
                  Update member personal details and official records.
                </p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              {/* Member Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan Dela Cruz"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Gmail Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-red-500" />
                  <span>Gmail Address (Login Username) *</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. juan.delacruz@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              {/* Address & Barangay */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Barangay (Guimba) *</label>
                  <select
                    value={formBarangay}
                    onChange={(e) => setFormBarangay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                  >
                    {GUIMBA_BARANGAYS.map((b) => (
                      <option key={b} value={b}>Brgy. {b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Cellphone Number</label>
                  <input
                    type="tel"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="+63 917 000 0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Birthdate & Gender */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Birthdate</label>
                  <input
                    type="date"
                    value={formBirthdate}
                    onChange={(e) => setFormBirthdate(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Active">Active (Activated)</option>
                    <option value="Pending">Pending Activation</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Complete Address / Purok</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Purok 1, Sitio, Landmark"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors mt-2 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {editingMember ? 'Save Changes' : 'Create Member'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Member Profile Picture Modal */}
      {photoTargetMember && (
        <ChangeProfilePictureModal
          isOpen={!!photoTargetMember}
          onClose={() => setPhotoTargetMember(null)}
          userType="member"
          targetMemberId={photoTargetMember.id}
          initialAvatar={photoTargetMember.profilePicture}
          title={`Change ${photoTargetMember.fullName}'s Profile Picture`}
        />
      )}
    </div>
  );
};
