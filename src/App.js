import React, { useState } from 'react';
import { 
  Home, Calendar as CalendarIcon, FileSignature, Menu, X, Bell, ChevronDown, 
  UserCircle, Users, Download, PlusCircle, Trash2, ChevronLeft, ChevronRight, 
  BookOpen, FileText, Settings, Loader2, CheckCircle2, FileCheck, Clock, 
  CalendarDays, BookMarked, CheckSquare, AlertTriangle, UserCheck, UserX
} from 'lucide-react';

// =====================================================================
// APLIKASI KOSONG (Siap Diisi oleh Admin melalui Dasbor)
// =====================================================================
export default function App() {
  const [currentUser, setCurrentUser] = useState({ id: 'a1', role: 'admin', name: 'Admin Kurikulum' });
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data State Kosong (Admin akan mengisi ini via form di web)
  const [guruList, setGuruList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);
  const [jurnalList, setJurnalList] = useState([]);
  const [events, setEvents] = useState([]);

  // Fungsi Tambah Data Master (Contoh untuk Guru)
  const addGuru = (data) => setGuruList([...guruList, { id: Date.now(), ...data }]);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar - Menu Navigasi */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div className="mb-8">
            <h1 className="font-black text-xl text-emerald-600">Kurikulum MTs</h1>
            <p className="text-[10px] uppercase font-bold text-slate-400">Daarul Muqorrobin</p>
        </div>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('dashboard')} className="w-full text-left p-3 rounded-xl bg-slate-100 font-bold text-sm">Dashboard</button>
          <button onClick={() => setActiveTab('master')} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 font-bold text-sm">Data Master (Guru/Siswa)</button>
          <button onClick={() => setActiveTab('kaldik')} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 font-bold text-sm">Kalender & Jurnal</button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Selamat Datang, Admin</h2>
            <div className="grid grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl border shadow-sm">
                 <p className="text-sm font-bold text-slate-400">Total Guru</p>
                 <p className="text-3xl font-black">{guruList.length}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl border shadow-sm">
                 <p className="text-sm font-bold text-slate-400">Total Siswa</p>
                 <p className="text-3xl font-black">{siswaList.length}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
                 <p className="text-sm font-bold text-emerald-600">Jadwal Terpasang</p>
                 <p className="text-3xl font-black">{jadwalList.length}</p>
               </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-emerald-900 text-sm">
              <p><strong>Status Sistem:</strong> Bersih. Silakan navigasi ke <strong>Data Master</strong> untuk mulai menginput data Dewan Guru dan Siswa sebagai langkah awal operasional.</p>
            </div>
          </div>
        )}

        {activeTab === 'master' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Manajemen Data Master</h2>
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold mb-4">Tambah Guru Baru</h3>
              {/* Form Tambah Guru akan dibuat di sini */}
              <button onClick={() => addGuru({name: 'Contoh Guru', nip: '12345', mapel: 'Fikih'})} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Simulasi Tambah Guru</button>
              <ul className="mt-4 space-y-2">
                {guruList.map(g => <li key={g.id} className="p-2 border rounded">{g.name} - {g.mapel}</li>)}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'kaldik' && (
           <div className="bg-white p-10 rounded-2xl border border-dashed text-center">
              <p className="text-slate-500">Modul Kalender & Jurnal dalam keadaan kosong. Admin dapat menambahkan agenda kegiatan melalui panel ini.</p>
           </div>
        )}
      </main>
    </div>
  );
}
