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
  User as UserIcon
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
    confirmAction
  } = useApp();

  // Filters & Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'NEW' | 'NEEDS_PASSWORD' | 'ACTIVE'>('ALL');

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
    const message = `MABUHAY! You have been registered in the PAGASA Guimba Youth MIS.\n\nName: ${m.fullName}\nMember ID: ${m.memberId}\nGmail: ${m.email}\nAssigned Password: ${m.portalPassword || '[Pending Admin Assignment]'}\nAccount Status: ${m.isAccountActivated ? 'Activated' : 'Pending Activation'}\n\nLogin to your Member Portal at: ${window.location.origin}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message);
      addToast(`Copied login credentials for ${m.fullName}!`, 'success');
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
              Youth Member Management & Password Control
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              Admin Controlled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage registrations, assign/reset portal passwords, and activate member accounts ({filteredMembers.length} records).
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
                              {m.membershipStatus === 'Pending' && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-200">
                                  Newly Registered
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
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(m)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Click to view, change, or reset password"
                          >
                            <Lock className="w-3 h-3 text-emerald-600" />
                            <span>Password Set</span>
                          </button>
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

      {/* Member QR / Detail Modal */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center relative">
            <button
              onClick={() => setViewingMember(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={viewingMember.profilePicture}
              alt=""
              className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-blue-600 shadow-md"
            />
            <div>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {viewingMember.memberId}
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-display mt-1">{viewingMember.fullName}</h3>
              <p className="text-xs text-slate-500">Brgy. {viewingMember.barangay}, Guimba</p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                <Mail className="w-3.5 h-3.5 text-red-500" />
                <span className="font-mono">{viewingMember.email}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl inline-block">
              <QRCodeSVG value={viewingMember.qrCode || viewingMember.memberId} size={150} />
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  handleOpenPasswordModal(viewingMember);
                  setViewingMember(null);
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Manage Password & Activation</span>
              </button>
              
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
