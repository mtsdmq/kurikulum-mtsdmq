import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, collection, addDoc, getDocs, doc, 
  deleteDoc, onSnapshot, query, where 
} from "firebase/firestore";
import { 
  Home, Calendar as CalendarIcon, FileSignature, Menu, X, Bell, ChevronDown, 
  UserCircle, Users, Download, PlusCircle, Trash2, ChevronLeft, ChevronRight, 
  BookOpen, FileText, Loader2, CheckCircle2, FileCheck, Clock, 
  CalendarDays, BookMarked, CheckSquare, AlertTriangle, UserCheck, UserX, LogIn, LogOut
} from 'lucide-react';

// =====================================================================
// 1. FIREBASE CONFIGURATION (Konfigurasi Asli MTs Daarul Muqorrobin)
// =====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyC5gr9JknZxHgSGeeuCPQxAGK3CqqsZKI4",
  authDomain: "mts-daarul-muqorrobin-355e4.firebaseapp.com",
  projectId: "mts-daarul-muqorrobin-355e4",
  storageBucket: "mts-daarul-muqorrobin-355e4.firebasestorage.app",
  messagingSenderId: "753840048150",
  appId: "1:753840048150:web:b63ff8cd0fde28a1834d37"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Aplikasi Sekunder agar Wakamad bisa mendaftarkan guru tanpa ter-logout
const secondaryApp = initializeApp(firebaseConfig, "SecondaryAppName");
const secondaryAuth = getAuth(secondaryApp);

const KELAS_LIST = ['7A', '7B', '8A', '8B', '9A', '9B'];
const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const JAM_LIST = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// =====================================================================
// 2. MAIN APP COMPONENT
// =====================================================================
export default function App() {
  // Authentication States
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Layout & Navigation States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Database Real-time States
  const [guruList, setGuruList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [events, setEvents] = useState([]);
  const [skList, setSkList] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);
  const [jurnalList, setJurnalList] = useState([]);

  // Form States - Admin Tambah Guru & Siswa
  const [formGuru, setFormGuru] = useState({ name: '', nip: '', mapel: '', waliKelas: '', email: '', password: '' });
  const [formSiswa, setFormSiswa] = useState({ nama: '', kelas: '', nis: '' });
  
  // Form States - Generator SK
  const [skType, setSkType] = useState('SK Mengajar');
  const [selectedGuruSK, setSelectedGuruSK] = useState('');
  const [skNomor, setSkNomor] = useState('');
  const [mapelRows, setMapelRows] = useState([{ mapel: '', kelas: '', jtm: '' }]);
  const [tugasTambahanText, setTugasTambahanText] = useState('');

  // Form States - Jadwal
  const [formJadwal, setFormJadwal] = useState({ hari: 'Senin', jamKe: '1', waktu: '', kelas: '7A', guruId: '' });

  // Form States - Kaldik
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState('akademik');
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  // Form States - Guru Input Jurnal
  const [formJurnal, setFormJurnal] = useState({ date: new Date().toISOString().split('T')[0], kelas: '', jamKe: '', materi: '' });
  const [absenState, setAbsenState] = useState({});

  // Form States - Filter Pantauan Admin
  const [pantauMode, setPantauMode] = useState('harian');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  // =====================================================================
  // 3. REAL-TIME DATA SYNC (FIRESTORE)
  // =====================================================================
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.email === "kurikulum@mtsdmq.com") {
          setUserData({ role: 'admin', name: 'Wakamad Kurikulum' });
        } else {
          const q = query(collection(db, "guru"), where("email", "==", currentUser.email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setUserData({ role: 'guru', ...querySnapshot.docs[0].data(), docId: querySnapshot.docs[0].id });
          } else {
            setUserData({ role: 'guru', name: currentUser.email });
          }
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setAuthLoading(false);
    });

    const unSubGuru = onSnapshot(collection(db, "guru"), (snap) => setGuruList(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unSubSiswa = onSnapshot(collection(db, "siswa"), (snap) => setSiswaList(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unSubEvents = onSnapshot(collection(db, "kaldik"), (snap) => setEvents(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unSubSK = onSnapshot(collection(db, "sk"), (snap) => setSkList(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unSubJadwal = onSnapshot(collection(db, "jadwal"), (snap) => setJadwalList(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unSubJurnal = onSnapshot(collection(db, "jurnal"), (snap) => setJurnalList(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => {
      unsubscribeAuth(); unSubGuru(); unSubSiswa(); unSubEvents(); unSubSK(); unSubJadwal(); unSubJurnal();
    };
  }, []);

  // =====================================================================
  // 4. HANDLERS (FUNGSI UTAMA)
  // =====================================================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setActiveTab('dashboard'); // Arahkan ke dashboard setelah login
    } catch (err) {
      alert("Gagal Login: Periksa kembali email dan password Anda.");
    }
    setIsProcessing(false);
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleCreateGuruAccount = async (e) => {
    e.preventDefault();
    if(!formGuru.email || !formGuru.password || !formGuru.name) return alert("Lengkapi data guru!");
    setIsProcessing(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formGuru.email, formGuru.password);
      const uid = userCredential.user.uid;

      await addDoc(collection(db, "guru"), {
        uid,
        name: formGuru.name,
        nip: formGuru.nip,
        mapel: formGuru.mapel,
        waliKelas: formGuru.waliKelas || null,
        email: formGuru.email
      });

      alert(`Sukses! Akun untuk guru ${formGuru.name} berhasil dibuat.`);
      setFormGuru({ name: '', nip: '', mapel: '', waliKelas: '', email: '', password: '' });
      await signOut(secondaryAuth);
    } catch (err) {
      alert("Gagal mendaftarkan akun guru: " + err.message);
    }
    setIsProcessing(false);
  };

  const handleCreateSiswa = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "siswa"), formSiswa);
      alert(`Siswa ${formSiswa.nama} berhasil dimasukkan ke database.`);
      setFormSiswa({ nama: '', kelas: '', nis: '' });
    } catch(e) { alert("Gagal input siswa"); }
  };

  const handleGenerateSK = async (e) => {
    e.preventDefault();
    if(!selectedGuruSK || !skNomor) return alert("Pilih guru dan masukkan nomor SK!");
    setIsProcessing(true);
    try {
      const gInfo = guruList.find(g => g.id === selectedGuruSK);
      const rincian = skType === 'SK Mengajar'
        ? mapelRows.map(m => `${m.mapel} (${m.kelas}) - ${m.jtm} JTM`).join(', ')
        : tugasTambahanText;

      await addDoc(collection(db, "sk"), {
        guruId: selectedGuruSK, guruName: gInfo.name, type: skType, noSK: skNomor, tanggal: new Date().toISOString().split('T')[0], rincian
      });
      alert("SK Berhasil Diterbitkan dan Terkonversi!");
      setSkNomor(''); setTugasTambahanText(''); setMapelRows([{ mapel: '', kelas: '', jtm: '' }]);
    } catch(e) { alert("Gagal generate"); }
    setIsProcessing(false);
  };

  const handleAddJadwal = async (e) => {
    e.preventDefault();
    if(!formJadwal.guruId || !formJadwal.waktu) return alert("Lengkapi isian jadwal!");
    try {
      const g = guruList.find(x => x.id === formJadwal.guruId);
      await addDoc(collection(db, "jadwal"), {
        hari: formJadwal.hari, jamKe: formJadwal.jamKe, waktu: formJadwal.waktu, kelas: formJadwal.kelas, guruId: formJadwal.guruId, mapel: g.mapel
      });
      alert("Jadwal ter-plotting permanen di database.");
      setFormJadwal({...formJadwal, waktu: ''});
    } catch(e) { alert("Gagal plotting"); }
  };

  const handleAddKaldikEvent = async (e) => {
    e.preventDefault();
    if (!selectedDate || !newEventTitle) return;
    try {
      const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
      await addDoc(collection(db, "kaldik"), { date: dateStr, title: newEventTitle, type: newEventType });
      setNewEventTitle(''); setSelectedDate(null);
    } catch(e) { alert("Gagal tambah agenda"); }
  };

  const handleAddJurnalGuru = async (e) => {
    e.preventDefault();
    if(!formJurnal.kelas || !formJurnal.materi) return alert("Lengkapi data!");
    try {
      const unhadir = Object.entries(absenState).filter(([_, v]) => v !== 'Hadir').map(([id, v]) => ({ studentId: id, status: v }));
      
      await addDoc(collection(db, "jurnal"), {
        date: formJurnal.date, guruId: userData.uid || userData.docId, guruName: userData.name, kelas: formJurnal.kelas, mapel: userData.mapel || '-', jamKe: formJurnal.jamKe, materi: formJurnal.materi, absensi: unhadir
      });
      alert("Laporan Pembelajaran KBM diserahkan ke Wakamad.");
      setFormJurnal({ date: new Date().toISOString().split('T')[0], kelas: '', jamKe: '', materi: '' });
      setAbsenState({});
    } catch(e) { alert("Gagal simpan jurnal"); }
  };

  const handleDownloadSimulation = (filename) => {
    alert(`[SUKSES DOWNLOAD]\nFile: ${filename}\nDokumen resmi berbasis PDF berhasil disiapkan.`);
  };

  // =====================================================================
  // 5. REKAP DATA (MEMO)
  // =====================================================================
  const rekapBKData = useMemo(() => {
    const map = {};
    siswaList.forEach(s => { map[s.id] = { ...s, s:0, i:0, a:0, b:0 }; });
    jurnalList.forEach(jl => {
      if(jl.absensi) {
        jl.absensi.forEach(ab => {
          if (map[ab.studentId]) {
            if (ab.status === 'Sakit') map[ab.studentId].s += 1;
            if (ab.status === 'Izin') map[ab.studentId].i += 1;
            if (ab.status === 'Alfa') map[ab.studentId].a += 1;
            if (ab.status === 'Bolos') map[ab.studentId].b += 1;
          }
        });
      }
    });
    return Object.values(map).sort((x, y) => (y.a + y.b) - (x.a + x.b));
  }, [siswaList, jurnalList]);

  // =====================================================================
  // 6. TAMPILAN LOADING & LOGIN
  // =====================================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-200">
        <Loader2 className="animate-spin text-emerald-500 mb-4" size={48} />
        <p className="text-sm font-bold uppercase tracking-widest">Memuat Cloud Database...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 border border-slate-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-900/20"><BookOpen size={32}/></div>
            <h2 className="text-xl font-black text-slate-900">SIM-Kurikulum Terpadu</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">MTs Daarul Muqorrobin</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label>
              <input type="email" placeholder="Cth: kurikulum@mtsdmq.com" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full text-sm p-3 rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Kata Sandi</label>
              <input type="password" placeholder="••••••••" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full text-sm p-3 rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
            </div>
          </div>
          <button type="submit" disabled={isProcessing} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-slate-800 transition shadow flex justify-center items-center">
            {isProcessing ? <Loader2 className="animate-spin mr-2" size={16}/> : <LogIn size={16} className="mr-2"/>}
            Masuk ke Aplikasi
          </button>
        </form>
      </div>
    );
  }

  // =====================================================================
  // 7. TAMPILAN UTAMA (SETELAH LOGIN)
  // =====================================================================
  const isAdmin = userData?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* Mobile Drawer */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out shadow-sm ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-md shadow-emerald-700/10"><BookOpen size={20} /></div>
            <div>
              <h1 className="font-black text-base text-slate-800 tracking-tight">SIM-Kurik</h1>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Daarul Muqorrobin</p>
            </div>
          </div>
          <button className="md:hidden text-slate-400 p-1" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto space-y-0.5">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase mb-2">Menu {isAdmin ? 'Wakamad' : 'Guru'}</p>
          {isAdmin ? (
            <>
              <button onClick={() => {setActiveTab('dashboard'); setIsSidebarOpen(false);}} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><Home size={16}/><span>Dasbor Manajemen</span></button>
              <button onClick={() => {setActiveTab('master'); setIsSidebarOpen(false);}} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'master' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><Users size={16}/><span>Data Master Terpadu</span></button>
              <button onClick={() => {setActiveTab('kaldik'); setIsSidebarOpen(false);}} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'kaldik' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><CalendarIcon size={16}/><span>Kalender Pendidikan</span></button>
              <button onClick={() => {setActiveTab('sk'); setIsSidebarOpen(false);}} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'sk' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><FileSignature size={16}/><span>Generator SK Resmi</span></button>
              <button onClick={() => {setActiveTab('jadwal_admin'); setIsSidebarOpen(false);}} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'jadwal_admin' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><Clock size={16}/><span>Manajemen Roster</span></button>
              <button onClick={() => {setActiveTab('pantau_jurnal'); setIsSidebarOpen(false);}} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'pantau_jurnal' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><CheckSquare size={16}/><span>Pantauan Jurnal & BK</span></button>
            </>
          ) : (
            <>
              <button onClick={() => {setActiveTab('kaldik_guru'); setIsSidebarOpen(false);}} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'kaldik_guru' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><CalendarIcon size={16}/><span>Lihat Kalender Kerja</span></button>
              <button onClick={() => {setActiveTab('jadwal_guru'); setIsSidebarOpen(false);}} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'jadwal_guru' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><FileCheck size={16}/><span>Jadwal & Dokumen Saya</span></button>
              <button onClick={() => {setActiveTab('isi_jurnal'); setIsSidebarOpen(false);}} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'isi_jurnal' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><BookMarked size={16}/><span>Isi Jurnal & Absensi Kelas</span></button>
            </>
          )}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-xs border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center">
            <button className="md:hidden mr-3 text-slate-500 p-1" onClick={() => setIsSidebarOpen(true)}><Menu size={22} /></button>
            <h2 className="text-sm font-black text-slate-800 tracking-tight hidden sm:block">Sistem Informasi Kurikulum Terpadu</h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${isAdmin ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{isAdmin ? 'Admin' : 'Guru'}</div>
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center space-x-1.5 p-1 rounded-xl border hover:bg-slate-50 transition">
                <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-white font-extrabold text-xs">{isAdmin ? 'WK' : userData?.name?.charAt(0) || 'U'}</div>
                <span className="text-xs font-bold text-slate-700 hidden sm:inline">{userData?.name || 'User'}</span>
                <ChevronDown size={14} className="text-slate-400"/>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                    <p className="font-bold text-slate-800 truncate">{userData?.name || 'User'}</p>
                    <p className="text-[10px] text-slate-400 font-medium capitalize">Email: {user.email}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center font-bold"><LogOut size={14} className="mr-2"/> Keluar dari Aplikasi</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Views */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          
          {/* TAB: ADMIN DASHBOARD */}
          {isAdmin && activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black">Dasbor Ringkasan Kurikulum</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Master Guru</p><p className="text-2xl font-black mt-1">{guruList.length} Akun</p></div>
                <div className="bg-white p-5 rounded-2xl border shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Master Siswa</p><p className="text-2xl font-black mt-1">{siswaList.length} Anak</p></div>
                <div className="bg-white p-5 rounded-2xl border shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Plotting Roster</p><p className="text-2xl font-black mt-1">{jadwalList.length} JTM</p></div>
                <div className="bg-white p-5 rounded-2xl border shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Jurnal Mengajar</p><p className="text-2xl font-black mt-1">{jurnalList.length} Lembar</p></div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl text-emerald-900 text-xs leading-relaxed">
                 <strong>Selamat Datang di SIM-Kurik!</strong> Database Anda telah berhasil di-reset. Silakan menuju tab <strong>Data Master Terpadu</strong> untuk membuat akun login bagi Bapak/Ibu dewan guru.
              </div>
            </div>
          )}

          {/* TAB: ADMIN DATA MASTER */}
          {isAdmin && activeTab === 'master' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form onSubmit={handleCreateGuruAccount} className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider border-b pb-2 text-slate-800">Registrasi Akun Guru Baru</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Nama Lengkap & Gelar" required value={formGuru.name} onChange={e=>setFormGuru({...formGuru, name:e.target.value})} className="w-full text-xs p-2.5 border rounded-lg"/>
                  <input type="text" placeholder="NIP / No Pegawai" value={formGuru.nip} onChange={e=>setFormGuru({...formGuru, nip:e.target.value})} className="w-full text-xs p-2.5 border rounded-lg"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Mata Pelajaran Utama" required value={formGuru.mapel} onChange={e=>setFormGuru({...formGuru, mapel:e.target.value})} className="w-full text-xs p-2.5 border rounded-lg"/>
                  <input type="text" placeholder="Wali Kelas (Ops. Cth: 8A)" value={formGuru.waliKelas} onChange={e=>setFormGuru({...formGuru, waliKelas:e.target.value})} className="w-full text-xs p-2.5 border rounded-lg"/>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-dashed">
                  <input type="email" placeholder="Email Login Guru" required value={formGuru.email} onChange={e=>setFormGuru({...formGuru, email:e.target.value})} className="w-full text-xs p-2 border rounded-lg bg-white"/>
                  <input type="password" placeholder="Password Min 6 Karakter" required value={formGuru.password} onChange={e=>setFormGuru({...formGuru, password:e.target.value})} className="w-full text-xs p-2 border rounded-lg bg-white"/>
                </div>
                <button type="submit" disabled={isProcessing} className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs shadow hover:bg-emerald-700">{isProcessing ? 'Memproses...':'Daftarkan Guru'}</button>
                <div className="pt-2 max-h-40 overflow-y-auto divide-y text-xs">
                   {guruList.map(g => <div key={g.id} className="py-2 flex justify-between items-center"><span><strong>{g.name}</strong> ({g.mapel})</span><button type="button" onClick={()=>deleteDoc(doc(db,"guru",g.id))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></div>)}
                </div>
              </form>

              <form onSubmit={handleCreateSiswa} className="bg-white p-5 rounded-2xl border shadow-sm space-y-4 h-fit">
                <h3 className="font-bold text-sm uppercase tracking-wider border-b pb-2 text-slate-800">Manajemen Data Siswa</h3>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" placeholder="Nama Siswa" required value={formSiswa.nama} onChange={e=>setFormSiswa({...formSiswa, nama:e.target.value})} className="col-span-1 text-xs p-2.5 border rounded-lg"/>
                  <select value={formSiswa.kelas} onChange={e=>setFormSiswa({...formSiswa, kelas:e.target.value})} required className="text-xs p-2.5 border rounded-lg bg-white">
                    <option value="">Kelas</option>
                    {KELAS_LIST.map(k=><option key={k} value={k}>{k}</option>)}
                  </select>
                  <input type="text" placeholder="NIS" required value={formSiswa.nis} onChange={e=>setFormSiswa({...formSiswa, nis:e.target.value})} className="text-xs p-2.5 border rounded-lg"/>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2 rounded-xl text-xs shadow hover:bg-slate-800">Simpan Siswa</button>
                <div className="pt-2 max-h-40 overflow-y-auto divide-y text-xs">
                   {siswaList.slice(0,10).map(s => <div key={s.id} className="py-2 flex justify-between items-center"><span>{s.nama} - Kelas {s.kelas}</span><button type="button" onClick={()=>deleteDoc(doc(db,"siswa",s.id))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></div>)}
                   {siswaList.length > 10 && <p className="text-[10px] text-slate-400 pt-1">Dan {siswaList.length - 10} siswa lainnya...</p>}
                </div>
              </form>
            </div>
          )}

          {/* TAB: KALDIK (ADMIN & GURU) */}
          {(activeTab === 'kaldik' || activeTab === 'kaldik_guru') && (() => {
             const daysInMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate();
             const firstDayOfMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1).getDay();
             const totalSlots = [...Array(firstDayOfMonth).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
             const isReadonly = !isAdmin;

             return (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
                   <div className="flex items-center justify-between p-4 bg-slate-50 border-b">
                     <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-200 rounded-lg"><ChevronLeft size={18}/></button>
                     <h3 className="font-bold text-slate-800">{monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}</h3>
                     <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-200 rounded-lg"><ChevronRight size={18}/></button>
                   </div>
                   <div className="p-4">
                     <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-500 mb-2 py-1">
                       <div className="text-red-500">Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
                     </div>
                     <div className="grid grid-cols-7 gap-1.5">
                       {totalSlots.map((day, idx) => {
                         if (!day) return <div key={`b-${idx}`} className="h-20 bg-slate-50/40 rounded-xl"></div>;
                         const isSelected = selectedDate === day;
                         const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                         const dayEvents = events.filter(e => e.date === dateStr);
                         return (
                           <div key={day} onClick={() => !isReadonly && setSelectedDate(day)} className={`h-22 p-1.5 border rounded-xl flex flex-col relative transition select-none ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20' : 'border-slate-100 bg-white hover:border-slate-300'} ${idx % 7 === 0 ? 'bg-red-50/20' : ''}`}>
                             <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isSelected ? 'bg-emerald-600 text-white' : idx % 7 === 0 ? 'text-red-500' : 'text-slate-700'}`}>{day}</span>
                             <div className="flex-1 overflow-y-auto space-y-0.5 mt-1 max-h-12 hide-scrollbar">
                               {dayEvents.map(e => <div key={e.id} className={`text-[9px] px-1 py-0.5 rounded truncate border leading-tight ${e.type === 'libur' ? 'bg-red-100 text-red-700' : e.type === 'ujian' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{e.title}</div>)}
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 </div>
                 <div className="lg:col-span-1 space-y-4">
                   {!isReadonly && selectedDate && (
                     <form onSubmit={handleAddKaldikEvent} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
                       <div className="flex justify-between items-center mb-3">
                         <h4 className="font-bold text-emerald-900 text-xs">Tambah Agenda</h4>
                         <button type="button" onClick={() => setSelectedDate(null)} className="text-emerald-700"><X size={16}/></button>
                       </div>
                       <div className="space-y-3">
                         <input type="text" required placeholder="Judul Kegiatan..." value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} className="w-full text-xs p-2 rounded-lg border focus:ring-1 focus:ring-emerald-500"/>
                         <select value={newEventType} onChange={e => setNewEventType(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white">
                           <option value="akademik">Kegiatan Akademik</option>
                           <option value="ujian">Ujian / Asesmen</option>
                           <option value="kegiatan">Kegiatan Siswa</option>
                           <option value="libur">Hari Libur Madrasah</option>
                         </select>
                         <button type="submit" className="w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg">Simpan</button>
                       </div>
                     </form>
                   )}
                   <div className="bg-white rounded-2xl border p-4 shadow-sm">
                     <h4 className="font-bold text-slate-800 text-sm mb-3">Agenda Bulan Ini</h4>
                     <div className="space-y-2 max-h-72 overflow-y-auto">
                       {events.filter(e => e.date.startsWith(`${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth()+1).padStart(2,'0')}`)).map(e => (
                         <div key={e.id} className="flex justify-between p-2.5 bg-slate-50 rounded-xl border">
                           <div>
                             <p className="text-xs font-bold text-slate-800">{e.title}</p>
                             <p className="text-[10px] text-slate-500">{e.date.split('-')[2]} | {e.type}</p>
                           </div>
                           {!isReadonly && <button onClick={() => deleteDoc(doc(db, "kaldik", e.id))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14}/></button>}
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               </div>
             );
          })()}

          {/* TAB: ADMIN GENERATOR SK */}
          {isAdmin && activeTab === 'sk' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <form onSubmit={handleGenerateSK} className="xl:col-span-2 bg-white rounded-2xl border p-6 shadow-sm space-y-5">
                <h3 className="font-bold text-slate-800 text-lg border-b pb-3">Penerbitan SK Digital</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Guru Penerima</label>
                    <select value={selectedGuruSK} onChange={e => setSelectedGuruSK(e.target.value)} className="w-full text-xs p-2.5 border rounded-lg bg-white">
                      <option value="">Pilih Guru...</option>
                      {guruList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Jenis SK</label>
                    <select value={skType} onChange={e => setSkType(e.target.value)} className="w-full text-xs p-2.5 border rounded-lg bg-white">
                      <option value="SK Mengajar">SK Mengajar</option>
                      <option value="SK Tugas Tambahan">SK Tugas Tambahan</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nomor SK</label>
                  <input type="text" value={skNomor} onChange={e => setSkNomor(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg"/>
                </div>

                {skType === 'SK Mengajar' ? (
                  <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                    <div className="flex justify-between">
                      <h4 className="text-xs font-bold uppercase">Rincian JTM</h4>
                      <button type="button" onClick={() => setMapelRows([...mapelRows, { mapel: '', kelas: '', jtm: '' }])} className="text-xs text-emerald-600 font-bold">+ Baris</button>
                    </div>
                    {mapelRows.map((row, i) => (
                      <div key={i} className="flex gap-2">
                        <input type="text" placeholder="Mapel" required value={row.mapel} onChange={e => { const r = [...mapelRows]; r[i].mapel = e.target.value; setMapelRows(r); }} className="flex-1 text-xs p-2 border rounded-lg"/>
                        <select value={row.kelas} onChange={e => { const r = [...mapelRows]; r[i].kelas = e.target.value; setMapelRows(r); }} required className="w-24 text-xs p-2 border rounded-lg bg-white">
                          <option value="">Kelas</option>
                          {KELAS_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                        <input type="number" placeholder="JTM" required value={row.jtm} onChange={e => { const r = [...mapelRows]; r[i].jtm = e.target.value; setMapelRows(r); }} className="w-20 text-xs p-2 border rounded-lg"/>
                        {mapelRows.length > 1 && <button type="button" onClick={() => setMapelRows(mapelRows.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 size={16}/></button>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Tugas</label>
                    <input type="text" placeholder="Contoh: Wali Kelas 8A" value={tugasTambahanText} onChange={e => setTugasTambahanText(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg"/>
                  </div>
                )}
                <button type="submit" disabled={isProcessing} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs">{isProcessing?'Memproses...':'Terbitkan SK'}</button>
              </form>

              <div className="bg-white rounded-2xl border shadow-sm flex flex-col h-[480px]">
                <div className="p-4 bg-slate-50 border-b font-bold text-sm">Arsip SK Terbit</div>
                <div className="p-4 overflow-y-auto space-y-3">
                  {skList.map(sk => (
                    <div key={sk.id} className="bg-white p-3 border rounded-xl shadow-sm">
                      <div className="flex justify-between"><span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">{sk.type}</span><button onClick={() => deleteDoc(doc(db,"sk",sk.id))} className="text-red-400"><Trash2 size={12}/></button></div>
                      <h4 className="font-bold text-xs text-slate-800 mt-1">{sk.guruName}</h4>
                      <p className="text-[10px] text-slate-500">{sk.noSK}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ADMIN MANAJEMEN JADWAL */}
          {isAdmin && activeTab === 'jadwal_admin' && (() => {
            const rosterHariIni = jadwalList.filter(j => j.kelas === formJadwal.kelas && j.hari === formJadwal.hari).sort((a, b) => parseInt(a.jamKe) - parseInt(b.jamKe));
            return (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <form onSubmit={handleAddJadwal} className="bg-white p-5 rounded-2xl border shadow-sm h-fit space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm border-b pb-2 uppercase">Plotting Roster</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={formJadwal.hari} onChange={e => setFormJadwal({...formJadwal, hari: e.target.value})} className="w-full text-xs p-2 border rounded-lg bg-white">
                      {HARI_LIST.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <select value={formJadwal.kelas} onChange={e => setFormJadwal({...formJadwal, kelas: e.target.value})} className="w-full text-xs p-2 border rounded-lg bg-white">
                      {KELAS_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={formJadwal.jamKe} onChange={e => setFormJadwal({...formJadwal, jamKe: e.target.value})} className="w-full text-xs p-2 border rounded-lg bg-white">
                      {JAM_LIST.map(j => <option key={j} value={j}>Jam Ke-{j}</option>)}
                    </select>
                    <input type="text" placeholder="07:15 - 07:55" value={formJadwal.waktu} onChange={e => setFormJadwal({...formJadwal, waktu: e.target.value})} required className="w-full text-xs p-2 border rounded-lg"/>
                  </div>
                  <select value={formJadwal.guruId} onChange={e => setFormJadwal({...formJadwal, guruId: e.target.value})} required className="w-full text-xs p-2 border rounded-lg bg-white">
                    <option value="">Pilih Guru Pengampu</option>
                    {guruList.map(g => <option key={g.id} value={g.id}>{g.name} ({g.mapel})</option>)}
                  </select>
                  <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2 rounded-xl text-xs">Simpan Roster</button>
                </form>

                <div className="xl:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                    <h4 className="font-bold text-xs uppercase text-slate-800">Roster Kelas {formJadwal.kelas} ({formJadwal.hari})</h4>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b">
                      <tr><th className="p-3 text-center">Jam</th><th className="p-3">Mata Pelajaran</th><th className="p-3">Guru</th><th className="p-3 text-center">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {rosterHariIni.map(j => (
                        <tr key={j.id}>
                          <td className="p-3 text-center font-bold text-emerald-700 bg-emerald-50/20">{j.jamKe}</td>
                          <td className="p-3 font-bold text-slate-800">{j.mapel}</td>
                          <td className="p-3 text-slate-600">{guruList.find(x => x.id === j.guruId)?.name}</td>
                          <td className="p-3 text-center"><button onClick={() => deleteDoc(doc(db,"jadwal",j.id))} className="text-red-400"><Trash2 size={14}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* TAB: ADMIN PANTAU JURNAL & BK */}
          {isAdmin && activeTab === 'pantau_jurnal' && (
            <div className="space-y-5">
              <div className="flex justify-between">
                <h2 className="text-xl font-black">Sistem Monitoring Jurnal & BK</h2>
                <div className="flex space-x-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                  <button onClick={() => setPantauMode('harian')} className={`px-3 py-1.5 rounded-lg ${pantauMode === 'harian' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Log Jurnal</button>
                  <button onClick={() => setPantauMode('bk')} className={`px-3 py-1.5 rounded-lg ${pantauMode === 'bk' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>Rekap BK</button>
                </div>
              </div>
              
              {pantauMode === 'harian' ? (
                <div className="bg-white border rounded-2xl shadow-sm overflow-hidden text-xs">
                  <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                    <span className="font-bold">Daftar Jurnal Masuk</span>
                    <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="p-1.5 border rounded-lg bg-white"/>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 border-b"><tr><th className="p-3">Guru</th><th className="p-3">Kelas & Jam</th><th className="p-3">Materi</th><th className="p-3">Absensi</th></tr></thead>
                    <tbody className="divide-y">
                      {jurnalList.filter(x => x.date === targetDate).map(j => (
                        <tr key={j.id}>
                          <td className="p-3 font-bold">{j.guruName}</td>
                          <td className="p-3 font-bold text-blue-700">{j.kelas} (Jam {j.jamKe})</td>
                          <td className="p-3">{j.materi}</td>
                          <td className="p-3">
                            {j.absensi?.length ? j.absensi.map((a,i) => <div key={i} className="text-[10px] text-red-600">• {siswaList.find(s=>s.id===a.studentId)?.nama} ({a.status})</div>) : <span className="text-emerald-600">Nihil</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white border rounded-2xl shadow-sm overflow-hidden text-xs">
                  <table className="w-full text-center">
                    <thead className="bg-slate-50 border-b text-[10px] uppercase">
                      <tr><th className="p-3 text-left">Nama Siswa</th><th className="p-3">Kelas</th><th className="p-3">Sakit</th><th className="p-3">Izin</th><th className="p-3 text-red-600">Alfa</th><th className="p-3 text-red-600">Bolos</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {rekapBKData.map(s => {
                        const danger = (s.a + s.b) >= 3;
                        if(s.s+s.i+s.a+s.b === 0) return null;
                        return (
                          <tr key={s.id} className={danger ? 'bg-red-50' : ''}>
                            <td className="p-3 text-left font-bold">{s.nama} <br/><span className="text-[10px] font-normal text-slate-400">NIS: {s.nis}</span></td>
                            <td className="p-3">{s.kelas}</td><td className="p-3">{s.s}</td><td className="p-3">{s.i}</td>
                            <td className="p-3 font-bold text-red-600">{s.a}</td><td className="p-3 font-bold text-red-600">{s.b}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: GURU ISI JURNAL & PRESENSI */}
          {!isAdmin && activeTab === 'isi_jurnal' && (() => {
            const students = siswaList.filter(s => s.kelas === formJurnal.kelas);
            const handleSubmit = (e) => {
              e.preventDefault();
              if(!formJurnal.kelas || !formJurnal.materi) return alert("Pilih kelas dan isi materi!");
              const unhadir = Object.entries(absenState).filter(([_, v]) => v !== 'Hadir').map(([id, v]) => ({ studentId: id, status: v }));
              addDoc(collection(db, "jurnal"), {
                date: formJurnal.date, guruId: userData.uid || userData.docId, guruName: userData.name, kelas: formJurnal.kelas, mapel: userData.mapel || '-', jamKe: formJurnal.jamKe, materi: formJurnal.materi, absensi: unhadir
              });
              alert("Laporan Berhasil Diserahkan!");
              setFormJurnal({ date: new Date().toISOString().split('T')[0], kelas: '', jamKe: '', materi: '' });
              setAbsenState({});
            };
            return (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <form onSubmit={handleSubmit} className="xl:col-span-2 bg-white rounded-2xl border p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Pengisian Jurnal Mengajar</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="date" value={formJurnal.date} onChange={e => setFormJurnal({...formJurnal, date: e.target.value})} className="w-full text-xs p-2 border rounded-md"/>
                    <select value={formJurnal.kelas} onChange={e => {setFormJurnal({...formJurnal, kelas: e.target.value}); setAbsenState({});}} required className="w-full text-xs p-2 border rounded-md bg-white">
                      <option value="">-- Kelas --</option>{KELAS_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <input type="text" placeholder="Jam Ke (Cth: 1)" value={formJurnal.jamKe} onChange={e => setFormJurnal({...formJurnal, jamKe: e.target.value})} required className="w-full text-xs p-2 border rounded-md"/>
                  </div>
                  <textarea rows="3" placeholder="Uraian Materi..." value={formJurnal.materi} onChange={e => setFormJurnal({...formJurnal, materi: e.target.value})} required className="w-full text-xs p-3 border rounded-md"></textarea>

                  {formJurnal.kelas && (
                    <div className="border rounded-xl mt-2 overflow-hidden">
                      <div className="bg-slate-50 p-2 font-bold text-xs border-b">Presensi Kelas {formJurnal.kelas}</div>
                      <div className="max-h-60 overflow-y-auto divide-y text-xs">
                        {students.map((s, idx) => (
                          <div key={s.id} className="p-2 flex items-center justify-between">
                            <span className="font-bold">{idx+1}. {s.nama}</span>
                            <div className="flex bg-slate-100 p-0.5 rounded gap-0.5">
                              {['Hadir', 'Sakit', 'Izin', 'Alfa', 'Bolos'].map(st => {
                                const active = (absenState[s.id] || 'Hadir') === st;
                                let color = active ? (st === 'Hadir' ? 'bg-emerald-600 text-white' : (st==='Alfa'||st==='Bolos' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white')) : 'text-slate-500';
                                return <button key={st} type="button" onClick={() => setAbsenState({...absenState, [s.id]: st})} className={`px-2 py-1 text-[10px] rounded uppercase font-bold ${color}`}>{st.charAt(0)}</button>
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button type="submit" className="w-full bg-slate-900 text-white text-xs font-bold py-3 rounded-xl">Kirim Laporan</button>
                </form>

                <div className="bg-white rounded-2xl border shadow-sm p-4 h-[450px] overflow-y-auto">
                  <h4 className="font-bold text-xs border-b pb-2 mb-2">Riwayat Jurnal</h4>
                  <div className="space-y-3">
                    {jurnalList.filter(x => x.guruId === (userData.uid || userData.docId)).map(j => (
                      <div key={j.id} className="border p-3 rounded-xl shadow-sm text-xs">
                        <div className="flex justify-between font-bold text-emerald-700"><span>Kelas {j.kelas}</span><span className="text-slate-400 font-normal">{j.date}</span></div>
                        <p className="text-slate-700 font-medium my-1">{j.materi}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB: GURU JADWAL & SK */}
          {!isAdmin && activeTab === 'jadwal_guru' && (() => {
            const mySKs = skList.filter(x => x.guruId === (userData.uid || userData.docId));
            const myRoster = jadwalList.filter(x => x.guruId === (userData.uid || userData.docId)).sort((a,b) => HARI_LIST.indexOf(a.hari) - HARI_LIST.indexOf(b.hari));
            const isWali = userData.waliKelas;
            const waliRoster = isWali ? jadwalList.filter(x => x.kelas === userData.waliKelas).sort((a,b) => HARI_LIST.indexOf(a.hari) - HARI_LIST.indexOf(b.hari)) : [];

            return (
              <div className="space-y-6 max-w-5xl mx-auto">
                <div className="bg-white border rounded-2xl p-5 flex flex-wrap justify-between items-center gap-3">
                  <div><h3 className="font-extrabold text-lg text-slate-800">{userData.name}</h3><p className="text-xs text-slate-500 font-medium">{userData.mapel} {isWali && `| Wali: ${userData.waliKelas}`}</p></div>
                  <div className="flex gap-2">
                    {mySKs.length > 0 && <button onClick={() => handleDownloadSimulation('SK_Mengajar.pdf')} className="bg-slate-900 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center"><Download size={14} className="mr-1"/> Unduh SK</button>}
                    {isWali && <button onClick={() => handleDownloadSimulation('Roster_Kelas.pdf')} className="bg-emerald-600 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center"><Download size={14} className="mr-1"/> Jadwal Kelas {userData.waliKelas}</button>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border overflow-hidden">
                    <div className="p-4 bg-slate-50 font-bold text-xs uppercase border-b">Jadwal Pribadi</div>
                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                      {HARI_LIST.map(hari => {
                        const hl = myRoster.filter(x => x.hari === hari).sort((a,b) => parseInt(a.jamKe) - parseInt(b.jamKe));
                        if(hl.length===0) return null;
                        return (
                          <div key={hari} className="border rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs">{hari}</div>
                            <div className="divide-y text-xs">
                              {hl.map(j => (
                                <div key={j.id} className="p-3 flex justify-between bg-white">
                                  <div><p className="font-bold">Jam Ke-{j.jamKe}</p><p className="text-slate-500">Kelas: {j.kelas}</p></div>
                                  <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded h-fit">{j.mapel}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border overflow-hidden">
                    <div className="p-4 bg-slate-50 font-bold text-xs uppercase border-b">Roster Kelas {isWali ? userData.waliKelas : ''}</div>
                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                      {isWali ? HARI_LIST.map(hari => {
                        const hl = waliRoster.filter(x => x.hari === hari).sort((a,b) => parseInt(a.jamKe) - parseInt(b.jamKe));
                        if(hl.length===0) return null;
                        return (
                          <div key={hari} className="border border-emerald-100 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800 text-xs">{hari}</div>
                            <div className="divide-y text-xs">
                              {hl.map(j => (
                                <div key={j.id} className="p-3 bg-white flex justify-between">
                                  <p className="font-bold text-emerald-900">Jam {j.jamKe}</p>
                                  <div className="text-right"><p className="font-bold">{j.mapel}</p><p className="text-[10px] text-slate-500">{guruList.find(x => x.id === j.guruId)?.name}</p></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }) : <div className="text-center text-xs text-slate-400 py-10">Bukan Wali Kelas.</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </main>
    </div>
  );
}
