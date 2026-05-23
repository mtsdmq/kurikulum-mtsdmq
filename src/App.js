import React, { useState, useMemo } from 'react';
import { 
  Home, Calendar as CalendarIcon, FileSignature, Menu, X, Bell, ChevronDown, UserCircle, Users, Download, 
  PlusCircle, Trash2, ChevronLeft, ChevronRight, BookOpen, FileText, Settings, Loader2, CheckCircle2, FileCheck,
  Clock, CalendarDays, Filter, BookMarked, CheckSquare, AlertTriangle, UserCheck, UserX, Search
} from 'lucide-react';

const DUMMY_USER_ADMIN = { id: 'a1', role: 'admin', name: 'Wakamad Kurikulum' };
const DUMMY_USER_GURU = { id: 'g1', role: 'guru', name: 'Ahmad Syukri, S.Pd.I', nip: '198501012010011001' };

const INITIAL_EVENTS = [
  { id: 1, date: '2026-07-13', title: 'Hari Pertama Masuk Sekolah', type: 'akademik' },
  { id: 2, date: '2026-07-14', title: 'Masa Ta\'aruf Siswa (MATSAMA)', type: 'kegiatan' },
];

const GURU_LIST = [
  { id: 'g1', name: 'Ahmad Syukri, S.Pd.I', nip: '198501012010011001', mapel: 'Fikih', waliKelas: '8A' },
  { id: 'g2', name: 'Siti Aminah, M.Pd', nip: '198203122005012003', mapel: 'Matematika', waliKelas: null },
  { id: 'g3', name: 'Budi Santoso, S.Pd', nip: '199011222015031004', mapel: 'IPA Terpadu', waliKelas: '9A' },
];

const SISWA_LIST = [
  { id: 's1', nama: 'Aditya Pratama', kelas: '8A', nis: '112233' },
  { id: 's2', nama: 'Bunga Lestari', kelas: '8A', nis: '112234' },
  { id: 's3', nama: 'Citra Kirana', kelas: '8A', nis: '112235' },
  { id: 's4', nama: 'Deni Saputra', kelas: '8A', nis: '112236' },
  { id: 's5', nama: 'Eka Wijaya', kelas: '8A', nis: '112237' },
  { id: 's6', nama: 'Fahmi Reza', kelas: '8A', nis: '112238' },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(DUMMY_USER_ADMIN);
  const [activeTab, setActiveTab] = useState('kaldik');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [jurnalList, setJurnalList] = useState([]);
  const [skList, setSkList] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);

  const handleRoleSwitch = (role) => {
    setCurrentUser(role === 'admin' ? DUMMY_USER_ADMIN : DUMMY_USER_GURU);
    setActiveTab(role === 'admin' ? 'kaldik' : 'kaldik_guru');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      <aside className={`fixed md:sticky top-0 left-0 z-30 h-screen w-72 bg-white border-r border-slate-200 flex flex-col transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center space-x-3 border-b border-slate-100">
          <div className="bg-emerald-600 p-2 rounded-xl text-white"><BookOpen size={22} /></div>
          <div>
            <h1 className="font-black text-lg leading-tight text-slate-800">SIM-Kurik</h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">MTs Daarul Muqorrobin</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {currentUser.role === 'admin' ? (
            <>
              <button onClick={() => setActiveTab('kaldik')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold ${activeTab === 'kaldik' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><CalendarIcon size={18}/><span>Kaldik</span></button>
              <button onClick={() => setActiveTab('sk')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold ${activeTab === 'sk' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><FileSignature size={18}/><span>Generator SK</span></button>
              <button onClick={() => setActiveTab('pantau')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold ${activeTab === 'pantau' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><CheckSquare size={18}/><span>Pantauan Jurnal & BK</span></button>
            </>
          ) : (
            <>
              <button onClick={() => setActiveTab('kaldik_guru')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold ${activeTab === 'kaldik_guru' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><CalendarIcon size={18}/><span>Lihat Kaldik</span></button>
              <button onClick={() => setActiveTab('isi_jurnal')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold ${activeTab === 'isi_jurnal' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><BookMarked size={18}/><span>Isi Jurnal & Absen</span></button>
              <button onClick={() => setActiveTab('unduh')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold ${activeTab === 'unduh' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><Download size={18}/><span>Unduh SK & Jadwal</span></button>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-slate-100">
           <button onClick={() => handleRoleSwitch(currentUser.role === 'admin' ? 'guru' : 'admin')} className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider">Tukar Mode: {currentUser.role === 'admin' ? 'Guru' : 'Wakamad'}</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2"><Menu size={24}/></button>
           <h2 className="text-xl font-extrabold text-slate-800">MTs Daarul Muqorrobin</h2>
           <div className="flex items-center space-x-3">
             <span className="text-sm font-bold text-slate-600">{currentUser.name}</span>
             <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">{currentUser.name.charAt(0)}</div>
           </div>
        </header>
        
        <div className="p-8 overflow-y-auto h-[calc(100vh-64px)]">
           {activeTab === 'kaldik' && <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-sm"><CalendarIcon size={48} className="mx-auto mb-4 text-emerald-600"/><h2 className="text-2xl font-black">Kalender Pendidikan Interaktif</h2><p className="text-slate-500 mt-2">Wakamad dapat menentukan tanggal kegiatan di sini.</p></div>}
           {activeTab === 'sk' && <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-sm"><FileSignature size={48} className="mx-auto mb-4 text-blue-600"/><h2 className="text-2xl font-black">Generator SK & Jadwal</h2><p className="text-slate-500 mt-2">Input data dewan guru untuk mencetak PDF otomatis.</p></div>}
           {activeTab === 'pantau' && <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-sm"><CheckSquare size={48} className="mx-auto mb-4 text-red-600"/><h2 className="text-2xl font-black">Pantauan Jurnal & Laporan BK</h2><p className="text-slate-500 mt-2">Monitor absensi siswa yang melebihi batas.</p></div>}
           {activeTab === 'isi_jurnal' && <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-sm"><BookMarked size={48} className="mx-auto mb-4 text-emerald-600"/><h2 className="text-2xl font-black">Isi Jurnal & Presensi</h2><p className="text-slate-500 mt-2">Silakan input kegiatan KBM hari ini.</p></div>}
           {activeTab === 'kaldik_guru' && <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-sm"><CalendarIcon size={48} className="mx-auto mb-4 text-slate-400"/><h2 className="text-2xl font-black">Lihat Kaldik</h2><p className="text-slate-500 mt-2">Jadwal kegiatan madrasah semester ini.</p></div>}
           {activeTab === 'unduh' && <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-sm"><Download size={48} className="mx-auto mb-4 text-blue-600"/><h2 className="text-2xl font-black">Unduh Dokumen</h2><p className="text-slate-500 mt-2">Ambil file SK Mengajar dan Jadwal Anda.</p></div>}
        </div>
      </main>
    </div>
  );
}

