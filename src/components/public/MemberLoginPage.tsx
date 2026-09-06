import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  UserPlus, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

export const MemberLoginPage: React.FC = () => {
  const { 
    loginMemberWithGmailPassword, 
    loginAdminWithPassword, 
    setCurrentPage, 
    members 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'member' | 'admin'>('member');
  
  // Member Form State
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('admin@pagasaguimba.org');
  const [adminPassword, setAdminPassword] = useState('pagasa2026');
  const [adminError, setAdminError] = useState('');

  const handleMemberLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const result = loginMemberWithGmailPassword(gmail, password);
      setIsLoading(false);
      if (!result.success) {
        setErrorMessage(result.message);
      }
      // If success, AppContext will switch role and navigate to member-dashboard
    }, 400);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setIsLoading(true);

    setTimeout(() => {
      const result = loginAdminWithPassword(adminEmail, adminPassword);
      setIsLoading(false);
      if (!result.success) {
        setAdminError(result.message);
      }
    }, 400);
  };

  const fillCredentials = (emailVal: string, passVal: string) => {
    setGmail(emailVal);
    setPassword(passVal);
    setErrorMessage('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-1">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            {activeTab === 'member' ? 'Member Portal Login' : 'Administrator Sign In'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
            {activeTab === 'member' 
              ? 'Enter your registered Gmail account and Admin-assigned password.'
              : 'Sign in to access municipal youth records, member directory, and password assignment.'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="p-1 bg-slate-100 rounded-2xl flex border border-slate-200">
          <button
            type="button"
            onClick={() => { setActiveTab('member'); setErrorMessage(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'member'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Member Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setAdminError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin Sign In
          </button>
        </div>

        {/* Member Login Card */}
        {activeTab === 'member' ? (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            {/* Error Message Display */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs font-medium animate-shake">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-red-900">Authentication Notice</p>
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleMemberLogin} className="space-y-4">
              {/* Gmail Account Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-red-500" />
                  <span>Gmail Account</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={gmail}
                    onChange={(e) => { setGmail(e.target.value); setErrorMessage(''); }}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Must be your valid registered Gmail address.</p>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Password</span>
                  </label>
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    Admin Assigned
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                    placeholder="Enter assigned password"
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter the password assigned by the Administrator.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Helper for Testing & Verification */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Quick Test Accounts:</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => fillCredentials('juan.delacruz@gmail.com', 'pagasa2026')}
                  className="p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 group-hover:text-blue-700">Juan Dela Cruz (Activated)</span>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Active</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">juan.delacruz@gmail.com / pagasa2026</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('jasmine.reyes@gmail.com', 'pagasa2026')}
                  className="p-2 text-left bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 group-hover:text-amber-800">Jasmine Reyes (Not Activated)</span>
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Pending</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">jasmine.reyes@gmail.com (Tests activation notice)</p>
                </button>
              </div>
            </div>

            {/* Links */}
            <div className="pt-2 text-center space-y-2 text-xs">
              <p className="text-slate-500">
                Not registered yet?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentPage('join')}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Register as New Member
                </button>
              </p>
              <p className="text-slate-500">
                Want to check your registration?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentPage('directory')}
                  className="font-bold text-slate-700 hover:underline cursor-pointer"
                >
                  View Member Directory
                </button>
              </p>
            </div>
          </div>
        ) : (
          /* Admin Login Card */
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            {adminError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs font-medium">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p>{adminError}</p>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Admin Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Admin Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Enter Admin Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
