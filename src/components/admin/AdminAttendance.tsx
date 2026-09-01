import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceSheetModal } from '../common/AttendanceSheetModal';
import { QRScannerCamera } from '../common/QRScannerCamera';
import { 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Clock, 
  Printer, 
  Volume2,
  VolumeX,
  Keyboard,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AdminAttendance: React.FC = () => {
  const { 
    attendanceSessions, 
    attendanceRecords, 
    members, 
    scanAttendanceQR, 
    manualCheckIn, 
    showToast,
    confirmAction
  } = useApp();

  const [selectedSessionId, setSelectedSessionId] = useState<string>(attendanceSessions[0]?.id || '');
  const [manualMemberQuery, setManualMemberQuery] = useState('');
  const [manualStatus, setManualStatus] = useState<'Present' | 'Late' | 'Excused'>('Present');
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scanner UI manual barcode input state
  const [scannedQRInput, setScannedQRInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'duplicate' | 'invalid' | 'idle';
    message: string;
    member?: any;
    time?: string;
  }>({ status: 'idle', message: 'Ready. Point device camera at a member QR pass or type Member ID.' });

  const activeSession = attendanceSessions.find(s => s.id === selectedSessionId) || attendanceSessions[0];
  const sessionRecords = attendanceRecords.filter(r => r.sessionId === activeSession?.id);

  const presentCount = sessionRecords.filter(r => r.status === 'Present').length;
  const lateCount = sessionRecords.filter(r => r.status === 'Late').length;
  const absentCount = sessionRecords.filter(r => r.status === 'Absent').length;

  const playFeedbackSound = (type: 'success' | 'duplicate' | 'error') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (type === 'duplicate') {
        osc.frequency.setValueAtTime(349.23, audioCtx.currentTime); // F4
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (_) {}
  };

  const handleProcessScan = (qrValue: string) => {
    if (!qrValue || !qrValue.trim() || !activeSession) return;

    const result = scanAttendanceQR(qrValue.trim(), activeSession.id);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (result.success && result.record) {
      playFeedbackSound('success');
      setScanResult({
        status: 'success',
        message: result.message || `Check-in recorded for ${result.record.memberName}!`,
        member: result.record,
        time: nowTime
      });
      try {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      } catch (_) {}
    } else if (result.isDuplicate || result.alreadyCheckedIn) {
      playFeedbackSound('duplicate');
      setScanResult({
        status: 'duplicate',
        message: result.message || 'Member is already checked in.',
        member: result.record,
        time: nowTime
      });
    } else {
      playFeedbackSound('error');
      setScanResult({
        status: 'invalid',
        message: result.message || 'QR code verification failed. Member record not found.',
        time: nowTime
      });
    }
    setScannedQRInput('');
  };

  const handleManualCheckInSubmit = (member: any) => {
    if (!activeSession) return;
    const ok = manualCheckIn(activeSession.id, member.memberId, manualStatus);
    if (ok) {
      playFeedbackSound('success');
      showToast('success', 'Checked In', `Checked in ${member.fullName} (${manualStatus})`);
      setManualMemberQuery('');
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setScanResult({
        status: 'success',
        message: `Manual check-in recorded for ${member.fullName}!`,
        time: nowTime,
        member: {
          memberName: member.fullName,
          memberId: member.memberId,
          memberBarangay: member.barangay,
          status: manualStatus
        }
      });
    }
  };

  const filteredSearchMembers = manualMemberQuery.trim()
    ? members.filter(m => (m.fullName || '').toLowerCase().includes(manualMemberQuery.toLowerCase().trim()) || (m.memberId || '').toLowerCase().includes(manualMemberQuery.toLowerCase().trim()))
    : [];

  return (
    <div className="space-y-8">
      {/* Header & Session Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-display font-bold text-slate-900">
              Live Camera QR Attendance Terminal
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time optical camera scanner with instant verification, duplicate prevention, and municipal attendance logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors"
            title={soundEnabled ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Session Switcher */}
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-600"
          >
            {attendanceSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.eventTitle} ({s.date})
              </option>
            ))}
          </select>

          {/* Print Attendance Sheet */}
          <button
            onClick={() => setIsSheetModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Attendance Sheet</span>
          </button>
        </div>
      </div>

      {/* Real-time Session Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 text-center text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Total Registered</span>
          <p className="text-2xl font-black text-slate-900 font-display">{activeSession?.totalRegistered || 0}</p>
        </div>
        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
          <span className="text-emerald-800 font-bold uppercase text-[10px]">Present</span>
          <p className="text-2xl font-black text-emerald-700 font-display">{presentCount}</p>
        </div>
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1">
          <span className="text-amber-800 font-bold uppercase text-[10px]">Late</span>
          <p className="text-2xl font-black text-amber-700 font-display">{lateCount}</p>
        </div>
        <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 shadow-xs space-y-1">
          <span className="text-rose-800 font-bold uppercase text-[10px]">Absent</span>
          <p className="text-2xl font-black text-rose-700 font-display">{absentCount}</p>
        </div>
        <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 shadow-xs space-y-1">
          <span className="text-blue-800 font-bold uppercase text-[10px]">Turnout Rate</span>
          <p className="text-2xl font-black text-blue-900 font-display">{activeSession?.attendanceRate || 0}%</p>
        </div>
      </div>

      {/* Main Terminal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 6 Cols: Live Camera QR Scanner */}
        <div className="lg:col-span-6 space-y-5">
          {/* Real Live Optical Camera Scanner Component */}
          <QRScannerCamera onScan={handleProcessScan} />

          {/* Feedback Status Box */}
          <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${
            scanResult.status === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' :
            scanResult.status === 'duplicate' ? 'bg-amber-50 border-amber-300 text-amber-950' :
            scanResult.status === 'invalid' ? 'bg-rose-50 border-rose-300 text-rose-950' :
            'bg-white border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-start gap-3">
              {scanResult.status === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />}
              {scanResult.status === 'duplicate' && <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />}
              {scanResult.status === 'invalid' && <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />}
              {scanResult.status === 'idle' && <Clock className="w-6 h-6 text-slate-400 flex-shrink-0" />}

              <div className="space-y-1 flex-1">
                <p className="font-bold text-sm leading-snug">{scanResult.message}</p>
                {scanResult.time && (
                  <p className="text-[11px] opacity-75 font-mono">Timestamp: {scanResult.time}</p>
                )}
                {scanResult.member && (
                  <p className="text-xs font-semibold text-emerald-800">
                    {scanResult.member.memberName || scanResult.member.fullName} ({scanResult.member.memberId}) • Brgy. {scanResult.member.memberBarangay || scanResult.member.barangay} • Status: {scanResult.member.status}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Barcode Scanner Gun / Hardware Input Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-blue-600" />
                <span>Barcode Gun / Manual Keypad Check-in</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">USB / BT Compatible</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessScan(scannedQRInput);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={scannedQRInput}
                onChange={(e) => setScannedQRInput(e.target.value)}
                placeholder="Scan with handheld gun or type Member ID (e.g. PG-2025-001)..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors whitespace-nowrap"
              >
                Log In
              </button>
            </form>

            {/* Quick 1-Click Member Badges Simulator */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                ⚡ Rapid Test Simulator (1-Click Test Badges):
              </span>
              <div className="grid grid-cols-2 gap-2">
                {members.slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleProcessScan(m.qrCode)}
                    className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-900 rounded-xl text-xs font-semibold text-left truncate flex items-center gap-2 border border-slate-200/80 transition-colors"
                  >
                    <img src={m.profilePicture} alt="" className="w-5 h-5 rounded-full object-cover" />
                    <span className="truncate">{m.fullName.split(' ')[0]} ({m.memberId})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Live Session Log & Manual Check-in */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Manual Member Search & Check-In */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 font-display flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Manual Member Lookup & Roster Check-In</span>
            </h3>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualMemberQuery}
                  onChange={(e) => setManualMemberQuery(e.target.value)}
                  placeholder="Search member by full name or ID..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <select
                value={manualStatus}
                onChange={(e) => setManualStatus(e.target.value as any)}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Excused">Excused</option>
              </select>
            </div>

            {/* Quick manual match list */}
            {filteredSearchMembers.length > 0 && (
              <div className="p-2 bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-200 max-h-48 overflow-y-auto">
                {filteredSearchMembers.map((m) => (
                  <div key={m.id} className="py-2 px-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img src={m.profilePicture} alt="" className="w-6 h-6 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-slate-900">{m.fullName} ({m.memberId})</p>
                        <p className="text-[10px] text-slate-500">Brgy. {m.barangay}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleManualCheckInSubmit(m)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Log Check-in
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Check-in Activity Stream */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 font-display">
                Live Attendance Stream ({sessionRecords.length})
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Auto-recorded</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {sessionRecords.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400">No attendees logged yet for this session.</p>
                </div>
              ) : (
                sessionRecords.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{r.memberName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {r.memberId} • Brgy. {r.memberBarangay} • {r.checkInTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        r.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'Late' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {r.status}
                      </span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">
                        {r.method === 'QR_SCAN' ? '📷 Optical Scan' : '✍ Manual'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Attendance Sheet Modal */}
      {isSheetModalOpen && (
        <AttendanceSheetModal
          isOpen={isSheetModalOpen}
          session={activeSession}
          records={attendanceRecords}
          onClose={() => setIsSheetModalOpen(false)}
        />
      )}
    </div>
  );
};
