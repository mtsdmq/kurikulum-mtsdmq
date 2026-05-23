import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, Calendar as CalendarIcon, FileSignature, Menu, X, Bell, ChevronDown, 
  UserCircle, Users, Download, PlusCircle, Trash2, ChevronLeft, ChevronRight, 
  BookOpen, FileText, Loader2, CheckCircle2, FileCheck, Clock, 
  CalendarDays, BookMarked, CheckSquare, AlertTriangle, UserCheck, UserX, KeyRound, Database
} from 'lucide-react';

// =====================================================================
// KONSTANTA SISTEM (TIDAK BISA DIHAPUS ADMIN)
// =====================================================================
const KELAS_LIST = ['7A', '7B', '8A', '8B', '9A', '9B'];
const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const JAM_LIST = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// Akun Default Admin Pertama Kali
const DEFAULT_ADMIN = { id: 'admin1', role: 'admin', username: 'admin', password: '123', name: 'Wakamad Kurikulum' };

// Custom Hook untuk LocalStorage (Penyimpan Data Otomatis)
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) { return initialValue; }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(storedValue));
  }, [key, storedValue]);
  return [storedValue, setStoredValue];
}

// =====================================================================
// MAIN APP COMPONENT
// =====================================================================
export default function App() {
  // STATE AUTENTIKASI
  const [loggedInUser, setLoggedInUser] = useLocalStorage('sim_logged_user', null);
  
  // STATE DATABASE (KOSONG SECARA DEFAULT)
  const [users, setUsers] = useLocalStorage('sim_users', [DEFAULT_ADMIN]);
  const [gurus, setGurus] = useLocalStorage('sim_gurus', []);
  const [siswas, setSiswas] = useLocalStorage('sim_siswas', []);
  const [events, setEvents] = useLocalStorage('sim_events', []);
  const [skList, setSkList] = useLocalStorage('sim_sks', []);
  const [jadwalList, setJadwalList] = useLocalStorage('sim_jadwals', []);
  const [jurnalList, setJurnalList] = useLocalStorage('sim_jurnals', []);

  // STATE UI NAVIGATION
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Set default tab on login
  useEffect(() => {
    if (loggedInUser) setActiveTab(loggedInUser.role === 'admin' ? 'master' : 'jadwal_guru');
  }, [loggedInUser]);

  const handleLogout = () => {
    setLoggedInUser(null);
    setShowProfileMenu(false);
  };

  // =====================================================================
  // A. HALAMAN LOGIN
  // =====================================================================
  if (!loggedInUser) {
    const LoginScreen = () => {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const [error, setError] = useState('');

      const handleLogin = (e) => {
        e.preventDefault();
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
          setLoggedInUser(user);
          setError('');
        } else {
          setError('Username atau Password salah!');
        }
      };

      return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-emerald-600 p-8 text-center text-white">
              <BookOpen size={48} className="mx-auto mb-4 text-emerald-200"/>
              <h1 className="text-2xl font-black tracking-tight">SIM-Kurik</h1>
              <p className="text-sm text-emerald-100 font-medium uppercase tracking-widest mt-1">MTs Daarul Muqorrobin</p>
            </div>
            <form onSubmit={handleLogin} className="p-8 space-y-5">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center animate-pulse">{error}</div>}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Username</label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-3 text-slate-400" size={18}/>
                  <input type="text" value={username} onChange={e=>setUsername(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm bg-slate-50 focus:bg-white" placeholder="Masukkan username..."/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 text-slate-400" size={18}/>
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm bg-slate-50 focus:bg-white" placeholder="••••••••"/>
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md">Masuk ke Sistem</button>
            </form>
          </div>
          <p className="text-xs text-slate-400 mt-8 font-medium">Sistem Informasi Manajemen Kurikulum Terpadu &copy; 2026</p>
        </div>
      );
    };
    return <LoginScreen />;
  }

  // =====================================================================
  // B. MODUL DATA MASTER (KHUSUS ADMIN) - INPUT GURU & SISWA
  // =====================================================================
  const MasterDataModule = () => {
    // State form Guru
    const [gNama, setGNama] = useState(''); const [gNip, setGNip] = useState(''); const [gMapel, setGMapel] = useState('');
    const [gWali, setGWali] = useState(''); const [gUser, setGUser] = useState(''); const [gPass, setGPass] = useState('');
    // State form Siswa
    const [sNama, setSNama] = useState(''); const [sNis, setSNis] = useState(''); const [sKelas, setSKelas] = useState('');

    const handleAddGuru = (e) => {
      e.preventDefault();
      const newId = 'g' + Date.now();
      setGurus([...gurus, { id: newId, name: gNama, nip: gNip, mapel: gMapel, waliKelas: gWali || null }]);
      setUsers([...users, { id: newId, role: 'guru', name: gNama, username: gUser, password: gPass }]);
      alert(`Akun Guru ${gNama} berhasil dibuat!`);
      setGNama(''); setGNip(''); setGMapel(''); setGWali(''); setGUser(''); setGPass('');
    };

    const handleAddSiswa = (e) => {
      e.preventDefault();
      setSiswas([...siswas, { id: 's' + Date.now(), nama: sNama, nis: sNis, kelas: sKelas }]);
      alert(`Siswa ${sNama} berhasil dimasukkan ke kelas ${sKelas}!`);
      setSNama(''); setSNis(''); setSKelas('');
    };

    return (
      <div className="space-y-6">
        <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-sm">
          <h2 className="text-2xl font-black mb-1 flex items-center"><Database className="mr-2"/> Pusat Data Master</h2>
          <p className="text-emerald-100 text-sm">Tambahkan data Tenaga Pendidik (beserta akun login) dan Siswa di sini.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Input Guru & Akun */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-4 border-b font-bold text-slate-800 flex items-center"><Users className="text-blue-600 mr-2" size={18}/> Tambah Dewan Guru & Akun</div>
            <form onSubmit={handleAddGuru} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] font-bold text-slate-600">Nama Lengkap & Gelar</label><input type="text" value={gNama} onChange={e=>setGNama(e.target.value)} required className="w-full p-2 text-xs border rounded-lg bg-slate-50"/></div>
                <div><label className="text-[11px] font-bold text-slate-600">NIP / NPK</label><input type="text" value={gNip} onChange={e=>setGNip(e.target.value)} required className="w-full p-2 text-xs border rounded-lg bg-slate-50"/></div>
                <div><label className="text-[11px] font-bold text-slate-600">Mata Pelajaran Utama</label><input type="text" value={gMapel} onChange={e=>setGMapel(e.target.value)} required className="w-full p-2 text-xs border rounded-lg bg-slate-50"/></div>
                <div><label className="text-[11px] font-bold text-slate-600">Wali Kelas (Kosongkan jika tidak)</label>
                  <select value={gWali} onChange={e=>setGWali(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-slate-50">
                    <option value="">-- Bukan Wali --</option>{KELAS_LIST.map(k=><option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div className="border-t pt-3 mt-3">
                <p className="text-[10px] font-black uppercase text-emerald-600 mb-2">Buat Kredensial Login Guru</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[11px] font-bold text-slate-600">Username</label><input type="text" value={gUser} onChange={e=>setGUser(e.target.value)} required className="w-full p-2 text-xs border rounded-lg bg-emerald-50"/></div>
                  <div><label className="text-[11px] font-bold text-slate-600">Password</label><input type="text" value={gPass} onChange={e=>setGPass(e.target.value)} required className="w-full p-2 text-xs border rounded-lg bg-emerald-50"/></div>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-blue-700 transition shadow">Simpan Guru & Akun</button>
            </form>
            <div className="p-4 border-t bg-slate-50 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Daftar Guru Terdaftar ({gurus.length})</p>
              <div className="space-y-2">
                {gurus.map(g => (
                  <div key={g.id} className="flex justify-between items-center bg-white p-2 border rounded-lg text-[10px]">
                    <span className="font-bold">{g.name} <span className="font-normal text-slate-400">({g.mapel})</span></span>
                    <button onClick={() => { setGurus(gurus.filter(x=>x.id!==g.id)); setUsers(users.filter(x=>x.id!==g.id)); }} className="text-red-500"><Trash2 size={12}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Input Siswa */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-50 p-4 border-b font-bold text-slate-800 flex items-center"><UserCheck className="text-emerald-600 mr-2" size={18}/> Tambah Data Siswa</div>
            <form onSubmit={handleAddSiswa} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] font-bold text-slate-600">Nama Siswa</label><input type="text" value={sNama} onChange={e=>setSNama(e.target.value)} required className="w-full p-2 text-xs border rounded-lg bg-slate-50"/></div>
                <div><label className="text-[11px] font-bold text-slate-600">NIS</label><input type="text" value={sNis} onChange={e=>setSNis(e.target.value)} required className="w-full p-2 text-xs border rounded-lg bg-slate-50"/></div>
              </div>
              <div><label className="text-[11px] font-bold text-slate-600">Kelas Penempatan</label>
                <select value={sKelas} onChange={e=>setSKelas(e.target.value)} required className="w-full p-2 text-xs border rounded-lg bg-slate-50">
                  <option value="">-- Pilih Kelas --</option>{KELAS_LIST.map(k=><option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-emerald-700 transition shadow">Simpan Data Siswa</button>
            </form>
            <div className="p-4 border-t bg-slate-50 flex-1 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Daftar Siswa ({siswas.length})</p>
              <div className="space-y-2">
                {siswas.map(s => (
                  <div key={s.id} className="flex justify-between items-center bg-white p-2 border rounded-lg text-[10px]">
                    <span className="font-bold">{s.nama} <span className="bg-emerald-100 text-emerald-700 px-1 rounded ml-1">{s.kelas}</span></span>
                    <button onClick={() => setSiswas(siswas.filter(x=>x.id!==s.id))} className="text-red-500"><Trash2 size={12}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =====================================================================
  // MODUL LAINNYA (DIPERTAHANKAN DAN DISESUAIKAN DENGAN STATE BARU)
  // =====================================================================
  
  // 1. Kaldik Interaktif
  const KaldikView = ({ readOnly }) => {
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventType, setNewEventType] = useState('akademik');

    const handleAddEvent = (e) => {
      e.preventDefault();
      if (selectedDate && newEventTitle) {
        const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
        setEvents([...events, { id: Date.now(), date: dateStr, title: newEventTitle, type: newEventType }]);
        setNewEventTitle(''); setSelectedDate(null);
      }
    };
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const daysInMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1).getDay();
    const totalSlots = [...Array(firstDayOfMonth).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border shadow-sm">
          <div><h2 className="text-xl font-bold text-slate-800">Kalender Pendidikan</h2><p className="text-xs text-slate-500">TP. 2026/2027</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b">
              <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-200 rounded-lg"><ChevronLeft size={18}/></button>
              <h3 className="font-bold text-slate-800">{monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}</h3>
              <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-200 rounded-lg"><ChevronRight size={18}/></button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-500 mb-2"><div className="text-red-500">Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div></div>
              <div className="grid grid-cols-7 gap-1.5">
                {totalSlots.map((day, idx) => {
                  if (!day) return <div key={`b-${idx}`} className="h-20 bg-slate-50/40 rounded-xl"></div>;
                  const isSelected = selectedDate === day;
                  const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = events.filter(e => e.date === dateStr);
                  return (
                    <div key={day} onClick={() => !readOnly && setSelectedDate(day)} className={`h-22 p-1.5 border rounded-xl flex flex-col relative transition cursor-pointer ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'} ${idx%7===0?'bg-red-50/20':''}`}>
                      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isSelected?'bg-emerald-600 text-white':(idx%7===0?'text-red-500':'text-slate-700')}`}>{day}</span>
                      <div className="flex-1 overflow-y-auto mt-1 space-y-0.5">
                        {dayEvents.map(e=><div key={e.id} className="text-[9px] px-1 bg-blue-100 text-blue-700 truncate rounded">{e.title}</div>)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-4">
            {!readOnly && selectedDate && (
              <form onSubmit={handleAddEvent} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <input type="text" required placeholder="Judul Kegiatan..." value={newEventTitle} onChange={e=>setNewEventTitle(e.target.value)} className="w-full text-xs p-2 rounded-lg border mb-2"/>
                <button type="submit" className="w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg">Simpan Agenda</button>
              </form>
            )}
            <div className="bg-white rounded-2xl border p-4 shadow-sm">
              <h4 className="font-bold text-sm mb-3">Agenda Bulan Ini</h4>
              <div className="space-y-2">
                {events.filter(e=>e.date.startsWith(`${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth()+1).padStart(2,'0')}`)).map(e=>(
                  <div key={e.id} className="flex justify-between p-2 bg-slate-50 border rounded-lg text-xs">
                    <div><p className="font-bold">{e.title}</p><p className="text-[10px] text-slate-500">Tgl: {e.date}</p></div>
                    {!readOnly && <button onClick={()=>setEvents(events.filter(x=>x.id!==e.id))} className="text-red-500"><Trash2 size={14}/></button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. Generator SK (Menggunakan List Guru yang dibuat Admin)
  const SKGeneratorView = () => {
    const [skType, setSkType] = useState('SK Mengajar'); const [selGuru, setSelGuru] = useState('');
    const [skNomor, setSkNomor] = useState(''); const [mapelRows, setMapelRows] = useState([{ mapel: '', kelas: '', jtm: '' }]);
    const [tugasTambahan, setTugasTambahan] = useState('');

    const handleGenerate = (e) => {
      e.preventDefault();
      if(!selGuru) return alert('Pilih guru penerima SK!');
      const gInfo = gurus.find(g => g.id === selGuru);
      const rincian = skType === 'SK Mengajar' ? mapelRows.map(m => `${m.mapel} (${m.kelas}) - ${m.jtm} JTM`).join(', ') : tugasTambahan;
      setSkList([{ id: Date.now(), guruId: selGuru, guruName: gInfo.name, type: skType, noSK: skNomor, tanggal: new Date().toISOString().split('T')[0], rincian }, ...skList]);
      alert('SK Berhasil Diterbitkan!');
    };

    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form onSubmit={handleGenerate} className="xl:col-span-2 bg-white rounded-2xl border p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">Penerbitan SK Digital</h3>
          {gurus.length === 0 ? ( <div className="text-red-500 text-sm font-bold p-4 bg-red-50 rounded-lg">Harap tambahkan data Tenaga Pendidik di menu Data Master terlebih dahulu!</div> ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <select value={selGuru} onChange={e=>setSelGuru(e.target.value)} required className="text-xs p-2 border rounded-lg"><option value="">-- Pilih Guru --</option>{gurus.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select>
                <select value={skType} onChange={e=>setSkType(e.target.value)} className="text-xs p-2 border rounded-lg"><option value="SK Mengajar">SK Mengajar</option><option value="SK Tugas Tambahan">SK Tugas Tambahan</option></select>
              </div>
              <input type="text" placeholder="Nomor Surat..." value={skNomor} onChange={e=>setSkNomor(e.target.value)} required className="w-full text-xs p-2 border rounded-lg"/>
              {skType === 'SK Mengajar' ? (
                <div className="bg-slate-50 p-3 rounded-lg border space-y-2">
                  <p className="text-xs font-bold">Rincian JTM <button type="button" onClick={()=>setMapelRows([...mapelRows, {mapel:'',kelas:'',jtm:''}])} className="text-emerald-600 float-right">+ Baris</button></p>
                  {mapelRows.map((r, i) => (
                    <div key={i} className="flex gap-2"><input type="text" placeholder="Mapel" required value={r.mapel} onChange={e=>{let m=[...mapelRows]; m[i].mapel=e.target.value; setMapelRows(m);}} className="flex-1 text-xs p-2 border rounded"/><select required value={r.kelas} onChange={e=>{let m=[...mapelRows]; m[i].kelas=e.target.value; setMapelRows(m);}} className="w-20 text-xs p-2 border rounded"><option value="">Kelas</option>{KELAS_LIST.map(k=><option key={k} value={k}>{k}</option>)}</select><input type="number" placeholder="JTM" required value={r.jtm} onChange={e=>{let m=[...mapelRows]; m[i].jtm=e.target.value; setMapelRows(m);}} className="w-16 text-xs p-2 border rounded"/></div>
                  ))}
                </div>
              ) : ( <input type="text" placeholder="Deskripsi Tugas Tambahan..." value={tugasTambahan} onChange={e=>setTugasTambahan(e.target.value)} required className="w-full text-xs p-2 border rounded-lg"/> )}
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs shadow">Terbitkan SK</button>
            </>
          )}
        </form>
        <div className="bg-white rounded-2xl border p-4 shadow-sm flex flex-col h-[400px]">
          <h4 className="font-bold text-sm border-b pb-2 mb-2">Arsip SK</h4>
          <div className="flex-1 overflow-y-auto space-y-2">
            {skList.map(sk=>(<div key={sk.id} className="border p-2 rounded-lg text-[10px] shadow-sm"><span className="font-bold text-blue-700">{sk.type}</span> - {sk.guruName}<p className="text-slate-500 truncate">{sk.rincian}</p></div>))}
          </div>
        </div>
      </div>
    );
  };

  // 3. Manajemen Jadwal
  const AdminJadwalView = () => {
    const [nj, setNj] = useState({ hari: 'Senin', jamKe: '1', waktu: '07:15 - 07:55', kelas: '8A', guruId: '' });
    const handleAdd = (e) => {
      e.preventDefault(); if(!nj.guruId) return alert('Pilih Guru!');
      const g = gurus.find(x=>x.id===nj.guruId);
      setJadwalList([...jadwalList, { id: Date.now(), ...nj, mapel: g.mapel }]);
    };
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form onSubmit={handleAdd} className="bg-white p-5 rounded-2xl border shadow-sm space-y-3 h-fit">
          <h3 className="font-bold text-sm border-b pb-2">Plotting Jadwal</h3>
          {gurus.length === 0 ? <div className="text-red-500 text-xs">Isi Data Guru dahulu!</div> : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <select value={nj.hari} onChange={e=>setNj({...nj, hari:e.target.value})} className="text-xs p-2 border rounded">{HARI_LIST.map(h=><option key={h} value={h}>{h}</option>)}</select>
                <select value={nj.kelas} onChange={e=>setNj({...nj, kelas:e.target.value})} className="text-xs p-2 border rounded">{KELAS_LIST.map(k=><option key={k} value={k}>{k}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={nj.jamKe} onChange={e=>setNj({...nj, jamKe:e.target.value})} className="text-xs p-2 border rounded">{JAM_LIST.map(j=><option key={j} value={j}>Jam {j}</option>)}</select>
                <input type="text" value={nj.waktu} onChange={e=>setNj({...nj, waktu:e.target.value})} placeholder="Waktu" className="text-xs p-2 border rounded"/>
              </div>
              <select value={nj.guruId} onChange={e=>setNj({...nj, guruId:e.target.value})} required className="w-full text-xs p-2 border rounded"><option value="">Pilih Guru...</option>{gurus.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select>
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg text-xs">Simpan Jadwal</button>
            </>
          )}
        </form>
        <div className="xl:col-span-2 bg-white rounded-2xl border shadow-sm p-4 overflow-auto">
          <h4 className="font-bold text-sm mb-3">Database Jadwal Kelas</h4>
          <table className="w-full text-left text-xs"><thead className="bg-slate-100 border-b"><tr><th className="p-2">Hari</th><th className="p-2">Kls</th><th className="p-2">Jam</th><th className="p-2">Guru</th><th className="p-2">Aksi</th></tr></thead>
          <tbody className="divide-y">{jadwalList.map(j=><tr key={j.id}><td className="p-2">{j.hari}</td><td className="p-2 font-bold">{j.kelas}</td><td className="p-2">Ke-{j.jamKe}</td><td className="p-2">{gurus.find(x=>x.id===j.guruId)?.name}</td><td className="p-2"><button onClick={()=>setJadwalList(jadwalList.filter(x=>x.id!==j.id))} className="text-red-500"><Trash2 size={14}/></button></td></tr>)}</tbody></table>
        </div>
      </div>
    );
  };

  // 4. Guru View Jadwal
  const GuruJadwalView = () => {
    const mySKs = skList.filter(x => x.guruId === loggedInUser.id);
    const myRoster = jadwalList.filter(x => x.guruId === loggedInUser.id).sort((a,b) => parseInt(a.jamKe) - parseInt(b.jamKe));
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold">Selamat Datang, {loggedInUser.name}</h2>
          <p className="text-sm text-emerald-100">Cek SK dan Roster Jadwal Anda di sini.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-2xl border"><h4 className="font-bold border-b pb-2 mb-2 text-sm">Dokumen SK Anda</h4>
            {mySKs.map(sk=><div key={sk.id} className="p-2 border rounded-lg mb-2 text-xs"><p className="font-bold text-blue-700">{sk.type}</p><p>{sk.noSK}</p><p className="text-slate-500 mt-1">{sk.rincian}</p></div>)}
            {mySKs.length===0 && <p className="text-xs text-slate-400">Belum ada SK.</p>}
          </div>
          <div className="bg-white p-4 rounded-2xl border"><h4 className="font-bold border-b pb-2 mb-2 text-sm">Jadwal Mengajar Anda</h4>
            {myRoster.map(j=><div key={j.id} className="p-2 border bg-slate-50 rounded-lg mb-2 text-xs flex justify-between"><span className="font-bold">{j.hari}, Jam {j.jamKe}</span><span className="bg-emerald-100 text-emerald-800 px-1 rounded font-bold">Kelas {j.kelas}</span></div>)}
            {myRoster.length===0 && <p className="text-xs text-slate-400">Belum ada Jadwal.</p>}
          </div>
        </div>
      </div>
    );
  }

  // 5. Guru Isi Jurnal & Absen Siswa
  const GuruIsiJurnalModule = () => {
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], kelas: '', jamKe: '', materi: '' });
    const [absenState, setAbsenState] = useState({});
    
    // Tarik daftar siswa dari database yang dikelola Admin berdasarkan kelas
    const studentsInClass = useMemo(() => {
      if(!form.kelas) return [];
      const res = siswas.filter(s => s.kelas === form.kelas);
      const def = {}; res.forEach(s => def[s.id] = 'Hadir');
      setAbsenState(def); return res;
    }, [form.kelas, siswas]);

    const handleSubmit = (e) => {
      e.preventDefault(); if(!form.kelas) return alert('Pilih Kelas!');
      const unhadir = Object.entries(absenState).filter(([_,v])=>v!=='Hadir').map(([id,v])=>({studentId:id, status:v}));
      setJurnalList([{ id: Date.now(), ...form, guruId: loggedInUser.id, guruName: loggedInUser.name, absensi: unhadir }, ...jurnalList]);
      alert('Jurnal berhasil disimpan ke database!');
      setForm({...form, materi: '', jamKe: ''});
    };

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center"><BookMarked size={16} className="mr-2"/> Input Jurnal KBM</h3>
          {siswas.length === 0 ? <div className="text-red-500 text-xs bg-red-50 p-3 rounded-lg font-bold">Admin belum memasukkan satupun data siswa. Anda tidak bisa melakukan presensi.</div> : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} className="text-xs p-2 border rounded"/>
                <select value={form.kelas} onChange={e=>setForm({...form, kelas: e.target.value})} required className="text-xs p-2 border rounded bg-white">
                  <option value="">-Pilih Kelas-</option>{KELAS_LIST.map(k=><option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <input type="text" placeholder="Jam Ke (cth: 1-2)" value={form.jamKe} onChange={e=>setForm({...form, jamKe: e.target.value})} required className="w-full text-xs p-2 border rounded"/>
              <textarea rows="3" placeholder="Materi yang diajarkan..." value={form.materi} onChange={e=>setForm({...form, materi: e.target.value})} required className="w-full text-xs p-2 border rounded resize-none"></textarea>
              
              {form.kelas && (
                <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
                  <p className="text-xs font-bold mb-2">Presensi Kelas {form.kelas}</p>
                  {studentsInClass.length === 0 ? <p className="text-xs text-red-500">Belum ada siswa di kelas ini.</p> : studentsInClass.map((s, i) => (
                    <div key={s.id} className="flex justify-between items-center p-1.5 border-b text-xs hover:bg-slate-50">
                      <span>{i+1}. {s.nama}</span>
                      <div className="flex gap-1 bg-slate-100 p-0.5 rounded">
                        {['Hadir','Sakit','Izin','Alfa','Bolos'].map(st => (
                          <button key={st} type="button" onClick={()=>setAbsenState({...absenState, [s.id]:st})} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${absenState[s.id]===st?(st==='Hadir'?'bg-emerald-500 text-white':st==='Alfa'||st==='Bolos'?'bg-red-500 text-white':'bg-orange-500 text-white'):'text-slate-400'}`}>{st.charAt(0)}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button type="submit" className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-lg">Kirim Laporan</button>
            </>
          )}
        </form>
        <div className="bg-white rounded-2xl border p-4 h-[500px] overflow-y-auto"><h4 className="font-bold text-sm border-b pb-2 mb-3">Riwayat Jurnal Anda</h4>
          {jurnalList.filter(x=>x.guruId===loggedInUser.id).map(j=>(
            <div key={j.id} className="border p-3 rounded-xl mb-3 text-xs shadow-sm"><div className="flex justify-between font-bold text-emerald-700"><span>Kelas {j.kelas} (Jam {j.jamKe})</span><span className="text-slate-400">{j.date}</span></div><p className="mt-1 bg-slate-50 p-2 rounded">{j.materi}</p></div>
          ))}
        </div>
      </div>
    );
  };

  // 6. Admin Pantau Jurnal & BK
  const AdminPantauJurnalModule = () => {
    const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0]);
    const filteredJurnals = jurnalList.filter(x => x.date === tDate);
    const rekapBK = useMemo(() => {
      const map = {}; siswas.forEach(s => { map[s.id] = { ...s, s:0, i:0, a:0, b:0 }; });
      jurnalList.forEach(jl => jl.absensi.forEach(ab => {
        if (map[ab.studentId]) {
          if (ab.status === 'Sakit') map[ab.studentId].s++; if (ab.status === 'Izin') map[ab.studentId].i++;
          if (ab.status === 'Alfa') map[ab.studentId].a++; if (ab.status === 'Bolos') map[ab.studentId].b++;
        }
      }));
      return Object.values(map).sort((x, y) => (y.a + y.b) - (x.a + x.b));
    }, [jurnalList, siswas]);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border p-4 shadow-sm">
          <div className="flex justify-between items-center border-b pb-2 mb-2">
            <h3 className="font-bold text-sm flex items-center"><FileText size={16} className="mr-1 text-blue-600"/> Laporan Masuk Harian</h3>
            <input type="date" value={tDate} onChange={e=>setTDate(e.target.value)} className="text-xs p-1 border rounded bg-slate-50"/>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredJurnals.length === 0 ? <p className="text-xs text-center text-slate-400 p-4">Nihil Laporan</p> : filteredJurnals.map(j => (
              <div key={j.id} className="border p-2 rounded-lg text-xs flex flex-col md:flex-row gap-4 bg-slate-50">
                <div className="w-48"><p className="font-bold text-blue-700">{j.guruName}</p><p>Kelas {j.kelas} - Jam {j.jamKe}</p></div>
                <div className="flex-1"><p className="font-semibold text-slate-700">{j.materi}</p></div>
                <div className="w-48 bg-white border p-1 rounded"><p className="font-bold text-[10px] border-b mb-1 text-red-600">Absen:</p>{j.absensi.length===0?<span className="text-[10px] text-emerald-600 font-bold">Semua Hadir</span>:j.absensi.map((a,i)=><div key={i} className="text-[10px]">• {siswas.find(s=>s.id===a.studentId)?.nama} ({a.status})</div>)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-xs">
          <div className="p-3 bg-red-50 border-b border-red-100 font-bold text-red-700 flex items-center"><AlertTriangle size={16} className="mr-2"/> Peringatan Dini Bimbingan Konseling (BK)</div>
          <table className="w-full text-center"><thead className="bg-slate-100 border-b"><tr><th className="p-2 text-left">Nama Siswa</th><th className="p-2">Kelas</th><th className="p-2">S</th><th className="p-2">I</th><th className="p-2 text-red-600">A</th><th className="p-2 text-red-600">B</th><th className="p-2">Status</th></tr></thead>
          <tbody className="divide-y">{rekapBK.map(s => {
            if((s.s+s.i+s.a+s.b)===0) return null;
            const isDanger = (s.a+s.b) >= 3;
            return <tr key={s.id} className={isDanger?'bg-red-50/50':''}><td className="p-2 text-left font-bold">{s.nama}</td><td className="p-2">{s.kelas}</td><td className="p-2">{s.s}</td><td className="p-2">{s.i}</td><td className="p-2 font-bold text-red-600">{s.a}</td><td className="p-2 font-bold text-red-600">{s.b}</td><td className="p-2">{isDanger?<span className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-bold">Panggil Ortu</span>:'Aman'}</td></tr>
          })}</tbody></table>
        </div>
      </div>
    );
  };

  // =====================================================================
  // STRUKTUR NAVIGASI UTAMA SETELAH LOGIN
  // =====================================================================
  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
      <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r flex flex-col transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl text-white"><BookOpen size={20}/></div>
          <div><h1 className="font-black text-slate-800 leading-tight">SIM-Kurik</h1><p className="text-[9px] font-bold text-emerald-600 uppercase">MTs Daarul Muqorrobin</p></div>
          <button className="md:hidden ml-auto text-slate-400" onClick={() => setIsSidebarOpen(false)}><X size={18}/></button>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase mb-2">Menu {loggedInUser.role === 'admin' ? 'Administrator' : 'Guru'}</p>
          {loggedInUser.role === 'admin' ? (
            <>
              <button onClick={()=>setActiveTab('master')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab==='master'?'bg-emerald-100 text-emerald-800':'text-slate-600 hover:bg-slate-50'}`}><Database size={16} className="mr-3"/> Master Data</button>
              <button onClick={()=>setActiveTab('kaldik')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab==='kaldik'?'bg-emerald-100 text-emerald-800':'text-slate-600 hover:bg-slate-50'}`}><CalendarIcon size={16} className="mr-3"/> Kaldik</button>
              <button onClick={()=>setActiveTab('sk')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab==='sk'?'bg-emerald-100 text-emerald-800':'text-slate-600 hover:bg-slate-50'}`}><FileSignature size={16} className="mr-3"/> Buat SK</button>
              <button onClick={()=>setActiveTab('jadwal_admin')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab==='jadwal_admin'?'bg-emerald-100 text-emerald-800':'text-slate-600 hover:bg-slate-50'}`}><Clock size={16} className="mr-3"/> Roster Kelas</button>
              <button onClick={()=>setActiveTab('pantau_jurnal')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab==='pantau_jurnal'?'bg-emerald-100 text-emerald-800':'text-slate-600 hover:bg-slate-50'}`}><CheckSquare size={16} className="mr-3"/> Pantau Jurnal & BK</button>
            </>
          ) : (
            <>
              <button onClick={()=>setActiveTab('jadwal_guru')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab==='jadwal_guru'?'bg-emerald-100 text-emerald-800':'text-slate-600 hover:bg-slate-50'}`}><Home size={16} className="mr-3"/> Dasbor & Jadwal</button>
              <button onClick={()=>setActiveTab('isi_jurnal')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab==='isi_jurnal'?'bg-emerald-100 text-emerald-800':'text-slate-600 hover:bg-slate-50'}`}><BookMarked size={16} className="mr-3"/> Isi Jurnal & Absen</button>
              <button onClick={()=>setActiveTab('kaldik_guru')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab==='kaldik_guru'?'bg-emerald-100 text-emerald-800':'text-slate-600 hover:bg-slate-50'}`}><CalendarIcon size={16} className="mr-3"/> Lihat Kaldik</button>
            </>
          )}
        </nav>
        <div className="p-4 border-t"><button onClick={handleLogout} className="w-full text-center text-xs font-bold text-red-600 bg-red-50 py-2 rounded-lg hover:bg-red-100">Logout Sistem</button></div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b h-14 flex items-center justify-between px-4 lg:px-6 z-30">
          <div className="flex items-center"><button className="md:hidden mr-3 text-slate-500" onClick={() => setIsSidebarOpen(true)}><Menu size={20} /></button><h2 className="text-sm font-black text-slate-800 hidden sm:block">Kurikulum App</h2></div>
          <div className="flex items-center gap-3">
            <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full text-[10px] border">Login as: {loggedInUser.name}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {loggedInUser.role === 'admin' && activeTab === 'master' && <MasterDataModule />}
          {loggedInUser.role === 'admin' && activeTab === 'kaldik' && <KaldikView readOnly={false}/>}
          {loggedInUser.role === 'admin' && activeTab === 'sk' && <SKGeneratorView/>}
          {loggedInUser.role === 'admin' && activeTab === 'jadwal_admin' && <AdminJadwalView/>}
          {loggedInUser.role === 'admin' && activeTab === 'pantau_jurnal' && <AdminPantauJurnalModule/>}
          
          {loggedInUser.role === 'guru' && activeTab === 'jadwal_guru' && <GuruJadwalView/>}
          {loggedInUser.role === 'guru' && activeTab === 'isi_jurnal' && <GuruIsiJurnalModule/>}
          {loggedInUser.role === 'guru' && activeTab === 'kaldik_guru' && <KaldikView readOnly={true}/>}
        </div>
      </main>
    </div>
  );
}
