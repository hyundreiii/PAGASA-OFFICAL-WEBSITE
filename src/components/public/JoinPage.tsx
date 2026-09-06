import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GUIMBA_BARANGAYS } from '../../data/mockData';
import { 
  Users, 
  ShieldCheck, 
  Award, 
  QrCode, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  ArrowRight,
  AlertCircle,
  Clock,
  Check,
  Eye,
  EyeOff,
  Copy,
  Key,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const JoinPage: React.FC = () => {
  const { registerMemberAccount, setCurrentPage, addToast } = useApp();

  // Required Fields
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [barangay, setBarangay] = useState(GUIMBA_BARANGAYS[0]);
  const [birthdate, setBirthdate] = useState('2004-05-14');
  const [age, setAge] = useState(21);
  const [gmail, setGmail] = useState('');
  const [cellphoneNumber, setCellphoneNumber] = useState('');
  const [password, setPassword] = useState('GuimbaYouth2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // UI States
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMember, setSubmittedMember] = useState<{
    id: string;
    memberId: string;
    fullName: string;
    email: string;
    password: string;
    address: string;
    contactNumber: string;
    barangay: string;
    age: number;
    birthdate: string;
  } | null>(null);

  // Auto-calculate age whenever birthdate changes
  useEffect(() => {
    if (birthdate) {
      const birthDateObj = new Date(birthdate);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDateObj.getFullYear();
      const m = today.getMonth() - birthDateObj.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge > 0 && calculatedAge < 120) {
        setAge(calculatedAge);
      }
    }
  }, [birthdate]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    if (addToast) {
      addToast(`Copied ${fieldName} to clipboard`, 'success');
    }
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCopyAllCredentials = () => {
    if (!submittedMember) return;
    const credText = 
      `==========================================\n` +
      `PAGASA GUIMBA YOUTH - NEW USER CREDENTIALS\n` +
      `Submitted via Join Organization Form\n` +
      `==========================================\n` +
      `Full Name: ${submittedMember.fullName}\n` +
      `Member ID: ${submittedMember.memberId}\n` +
      `Login Gmail (Username): ${submittedMember.email}\n` +
      `Portal Password: ${submittedMember.password}\n` +
      `Cellphone Number: ${submittedMember.contactNumber}\n` +
      `Address: ${submittedMember.address}\n` +
      `Barangay: Brgy. ${submittedMember.barangay}, Guimba\n` +
      `Birthday: ${submittedMember.birthdate} (${submittedMember.age} yrs old)\n` +
      `Account Status: Pending Admin Activation\n` +
      `Admin Directory: View in Admin Dashboard -> Member Directory\n` +
      `==========================================`;
    handleCopy(credText, 'Full Credentials');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Field validations
    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!address.trim()) {
      setFormError('Please enter your complete address.');
      return;
    }
    if (!birthdate) {
      setFormError('Please enter your birthday.');
      return;
    }
    if (age < 15 || age > 35) {
      setFormError('Youth membership is open to individuals aged 15 to 35.');
      return;
    }

    const trimmedGmail = gmail.trim().toLowerCase();
    if (!trimmedGmail.endsWith('@gmail.com') || trimmedGmail.length <= 10) {
      setFormError('Please provide a valid Gmail address ending in @gmail.com.');
      return;
    }

    if (!cellphoneNumber.trim()) {
      setFormError('Please enter your cellphone number.');
      return;
    }

    const finalPassword = password.trim() || 'GuimbaYouth2026!';
    if (finalPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    const fullAddressString = address.toLowerCase().includes(barangay.toLowerCase())
      ? address.trim()
      : `${address.trim()}, Brgy. ${barangay}, Guimba, Nueva Ecija`;

    const result = registerMemberAccount({
      fullName: fullName.trim(),
      address: fullAddressString,
      barangay,
      birthdate,
      age,
      email: trimmedGmail,
      contactNumber: cellphoneNumber.trim(),
      password: finalPassword
    });

    setIsSubmitting(false);

    if (result.success && result.member) {
      setSubmittedMember({
        id: result.member.id,
        memberId: result.member.memberId,
        fullName: result.member.fullName,
        email: result.member.email,
        password: result.member.portalPassword || finalPassword,
        address: result.member.address,
        contactNumber: result.member.contactNumber,
        barangay: result.member.barangay,
        age: result.member.age,
        birthdate: result.member.birthdate
      });
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch (_) {}
    } else {
      setFormError(result.message || 'Registration failed. Please check your inputs.');
    }
  };

  const handleResetForm = () => {
    setSubmittedMember(null);
    setFullName('');
    setAddress('');
    setGmail('');
    setCellphoneNumber('');
    setPassword('GuimbaYouth2026!');
    setFormError('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          Official Youth Membership
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-slate-900 tracking-tight">
          New Member Registration Form
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Fill out the official registration form to join PAGASA Guimba. Once submitted, your profile will appear in the Member Directory and an Administrator will assign your login password and activate your account.
        </p>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Col: Workflow Guide & Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 text-white p-8 rounded-3xl shadow-xl space-y-6">
            <h2 className="text-xl font-bold font-display text-white">
              Registration & Activation Workflow
            </h2>
            
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Fill Registration Form</h4>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">
                    Provide your complete legal name, address, birthday, age, valid Gmail account, and cellphone number.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Saved to Member Directory</h4>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">
                    Upon submission, your membership record is automatically saved and added to the official Member Directory.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Admin Password Assignment</h4>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">
                    The Administrator opens your record in the Admin Dashboard, inputs/assigns your secure password, and activates your account.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-300">Login to Member Portal</h4>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">
                    Once activated, log in using your Gmail account and the Admin-assigned password to view events, certificates, and your digital QR pass.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Already Registered?</h3>
            <p className="text-slate-600 leading-relaxed">
              If you have already submitted your registration or your account has been activated:
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCurrentPage('directory')}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Browse Member Directory</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage('login')}
                className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Member Portal Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Registration Form / Submission Result */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm">
            {submittedMember ? (
              /* Success Card with Full Credentials Display */
              <div className="space-y-6 py-2">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 font-display">
                    Registration Submitted Successfully!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Mabuhay, <span className="font-bold text-slate-900">{submittedMember.fullName}</span>! Your registration and credentials have been recorded and sent to the <strong className="text-blue-700">Admin Dashboard Member Directory</strong>.
                  </p>
                </div>

                {/* Prominent User Credentials Card */}
                <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-blue-900/50 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                        Official New User Credentials
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Pending Admin Activation
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Member ID */}
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Member ID</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(submittedMember.memberId, 'Member ID')}
                          className="text-blue-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                        >
                          {copiedField === 'Member ID' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'Member ID' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="font-mono font-bold text-blue-300 text-sm mt-0.5">{submittedMember.memberId}</p>
                    </div>

                    {/* Full Name */}
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Name</span>
                      <p className="font-bold text-white text-sm mt-0.5">{submittedMember.fullName}</p>
                    </div>

                    {/* Gmail Account (Username) */}
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-red-400" />
                          <span>Login Gmail (Username)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(submittedMember.email, 'Gmail Account')}
                          className="text-blue-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                        >
                          {copiedField === 'Gmail Account' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'Gmail Account' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="font-mono font-bold text-white text-sm mt-0.5 truncate">{submittedMember.email}</p>
                    </div>

                    {/* Portal Password */}
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Account Password</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                          >
                            {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showPassword ? 'Hide' : 'Show'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(submittedMember.password, 'Password')}
                            className="text-blue-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                          >
                            {copiedField === 'Password' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'Password' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                      <p className="font-mono font-bold text-amber-300 text-sm mt-0.5">
                        {showPassword ? submittedMember.password : '••••••••••••'}
                      </p>
                    </div>

                    {/* Contact & Location */}
                    <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Cellphone Number</span>
                      <p className="font-mono text-slate-200 mt-0.5">{submittedMember.contactNumber}</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Barangay</span>
                      <p className="text-slate-200 mt-0.5">Brgy. {submittedMember.barangay}, Guimba</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyAllCredentials}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Credentials to Clipboard</span>
                  </button>
                </div>

                {/* Admin Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 text-left space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Live Synchronization with Admin Dashboard</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    Your credentials have been securely stored in the database. The Administrator can view your inputs in the <strong>Admin Dashboard Member Directory</strong> to activate your account and grant full portal access.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage('directory')}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>View in Member Directory</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage('login')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <span>Go to Member Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Register Another Member
                  </button>
                </div>
              </div>
            ) : (
              /* The New Member Registration Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 font-display">
                    Member Registration Form
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Please provide accurate information. All credentials will be saved and reviewed in the Admin Member Directory.
                  </p>
                </div>

                {formError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-800 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p>{formError}</p>
                  </div>
                )}

                {/* 1. Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Juan P. Dela Cruz"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* 2. Complete Address & Barangay */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Complete Address (Purok, Street, House No.) *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Purok 3, Rizal Street"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Barangay (Guimba) *
                    </label>
                    <select
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {GUIMBA_BARANGAYS.map((b) => (
                        <option key={b} value={b}>Brgy. {b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Birthday and 4. Age */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Birthday *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Age (Years Old) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="15"
                        max="35"
                        value={age}
                        onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        Auto-calculated
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Gmail Account */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-red-500" />
                      <span>Gmail Account (Portal Username) *</span>
                    </label>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold border border-blue-200">
                      Must end in @gmail.com & unique
                    </span>
                  </div>
                  <input
                    type="email"
                    required
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value)}
                    placeholder="juan.delacruz@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This Gmail will serve as your permanent username to log in to the Member Portal.
                  </p>
                </div>

                {/* 6. Cellphone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cellphone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={cellphoneNumber}
                    onChange={(e) => setCellphoneNumber(e.target.value)}
                    placeholder="0917-000-0000 / +63 917 000 0000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>

                {/* 7. Portal Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Account Password (Credentials) *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setPassword('GuimbaYouth2026!')}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                    >
                      Use default (GuimbaYouth2026!)
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a secure password (min 6 characters)"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your password will be saved with your submission and can also be viewed or reset by an Administrator in the Member Directory.
                  </p>
                </div>

                {/* Submit Registration Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? (
                    <span>Submitting Registration & Credentials...</span>
                  ) : (
                    <>
                      <span>Submit Registration & Save Credentials</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
