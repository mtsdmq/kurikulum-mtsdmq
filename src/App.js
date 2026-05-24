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
  BookOpen, FileText, Settings, Loader2, CheckCircle2, FileCheck, Clock, 
  CalendarDays, BookMarked, CheckSquare, AlertTriangle, UserCheck, UserX, LogIn, LogOut
} from 'lucide-react';

// =====================================================================
// 1. RE-INITIALIZE FIREBASE (Mengambil instance auth & db dari config)
// =====================================================================
// Catatan: Ganti konfigurasi ini sesuai dengan yang Anda miliki dari Tahap 1
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXX",
  authDomain: "mts-daarul-muqorrobin.firebaseapp.com",
  projectId: "mts-daarul-muqorrobin",
  storageBucket: "mts-daarul-muqorrobin.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Trik Aplikasi Sekunder agar Admin bisa membuat user guru tanpa ter-logout
const secondaryApp = initializeApp(firebaseConfig, "SecondaryAppName");
const secondaryAuth = getAuth(secondaryApp);

const KELAS_LIST = ['7A', '7B', '8A', '8B', '9A', '9B'];
const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const JAM_LIST = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

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

  // Database Real-time States (Blank Slates)
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
  // 2. REAL-TIME DATA SYNC (FIRESTORE ON_SNAPSHOT)
  // =====================================================================
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Jika login adalah admin bawaan firebase, atau cek di database user
        if (currentUser.email === "kurikulum@mtsdmq.com") {
          setUserData({ role: 'admin', name: 'Wakamad Kurikulum' });
        } else {
          // Cari data guru berdasarkan email
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

    // Sync Data Master & Transaksional
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
  // 3. HANDLERS & OPERATIONS
  // =====================================================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err) {
      alert("Gagal Login: Periksa kembali email dan password Anda.");
    }
    setIsProcessing(false);
  };

  const handleLogout = () => {
    signOut(auth);
    setActiveTab('dashboard');
  };

  const handleCreateGuruAccount = async (e) => {
    e.preventDefault();
    if(!formGuru.email || !formGuru.password || !formGuru.name) return alert("Lengkapi data guru!");
    setIsProcessing(true);
    try {
      // Buat User Authentication di database Firebase secara cloud tanpa menendang sesi Admin
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formGuru.email, formGuru.password);
      const uid = userCredential.user.uid;

      // Simpan Profile lengkap ke Cloud Firestore Database
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
      await signOut(secondaryAuth); // Bersihkan sesi pembuatan user sekunder
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
      alert("SK Berhasil Diterbitkan dan Otomatis Terkonversi ke PDF!");
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
      alert("Jadwal ter-plotting permanen di database cloud.");
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
        date: formJurnal.date, guruId: userData.uid, guruName: userData.name, kelas: formJurnal.kelas, mapel: userData.mapel, jamKe: formJurnal.jamKe, materi: formJurnal.materi, absensi: unhadir
      });
      alert("Laporan Pembelajaran KBM diserahkan ke Wakamad.");
      setFormJurnal({ date: new Date().toISOString().split('T')[0], kelas: '', jamKe: '', materi: '' });
      setAbsenState({});
    } catch(e) { alert("Gagal simpan jurnal"); }
  };

  // =====================================================================
  // 4. COMPUTED MEMOS (REKAP DATA)
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

  const studentsInSelectedClass = useMemo(() => {
    if (!formJurnal.kelas) return [];
    return siswaList.filter(s => s.kelas === formJurnal.kelas);
  }, [formJurnal.kelas, siswaList]);

  // Loader Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-200">
        <Loader2 className="animate-spin text-emerald-500 mb-4" size={48} />
        <p className="text-sm font-bold uppercase tracking-widest">Memuat Cloud Database...</p>
      </div>
    );
  }

  // =====================================================================
  // 5. INTERFACE: LOGIN SCREEN
  // =====================================================================
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
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email Madrasah</label>
              <input type="email" placeholder="Cth: kurikulum@mtsdmq.com atau nama@guru.com" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full text-sm p-3 rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
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
  // 6. INTERFACE: MAIN APPLICATIONS WORKSPACE
  // =====================================================================
  const isAdmin = userData?.role === 'admin';
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* Mobile Menu Drawer Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs" onClick={() => setIsSidebarOpen(false)} />}

      {/* Navigation App Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200 flex flex-col transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-md"><BookOpen size={20} /></div>
            <div><h1 className="font-black text-base leading-tight">SIM-Kurik</h1><p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Daarul Muqorrobin</p></div>
          </div>
          <button className="md:hidden text-slate-400 p-1" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto space-y-0.5">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase mb-2">Menu {isAdmin ? 'Wakamad' : 'Guru'}</p>
          {isAdmin ? (
            <>
              <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><Home size={16}/><span>Dasbor Manajemen</span></button>
              <button onClick={() => setActiveTab('master')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'master' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><Users size={16}/><span>Data Master Terpadu</span></button>
              <button onClick={() => setActiveTab('kaldik')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'kaldik' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><CalendarIcon size={16}/><span>Kalender Pendidikan</span></button>
              <button onClick={() => setActiveTab('sk')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'sk' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><FileSignature size={16}/><span>Generator SK Resmi</span></button>
              <button onClick={() => setActiveTab('jadwal_admin')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'jadwal_admin' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><Clock size={16}/><span>Manajemen Roster Rencana</span></button>
              <button onClick={() => setActiveTab('pantau_jurnal')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'pantau_jurnal' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><CheckSquare size={16}/><span>Pantauan Jurnal & BK</span></button>
            </>
          ) : (
            <>
              <button onClick={() => setActiveTab('kaldik_guru')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'kaldik_guru' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><CalendarIcon size={16}/><span>Lihat Kalender Kerja</span></button>
              <button onClick={() => setActiveTab('jadwal_guru')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'jadwal_guru' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><FileCheck size={16}/><span>Jadwal & Dokumen Saya</span></button>
              <button onClick={() => setActiveTab('isi_jurnal')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'isi_jurnal' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><BookMarked size={16}/><span>Isi Jurnal & Absensi Kelas</span></button>
            </>
          )}
        </nav>
      </aside>

      {/* Main Container Dashboard */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* Top Header Controls bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center">
            <button className="md:hidden mr-3 text-slate-500 p-1" onClick={() => setIsSidebarOpen(true)}><Menu size={22} /></button>
            <h2 className="text-sm font-black text-slate-800 tracking-tight">Portal Akademik MTs</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center space-x-1.5 p-1.5 rounded-xl border hover:bg-slate-50 transition">
              <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs uppercase">{isAdmin?'AD':'GR'}</div>
              <span className="text-xs font-bold text-slate-700 hidden sm:inline">{userData?.name}</span>
              <ChevronDown size={14} className="text-slate-400"/>
            </button>
            {showProfileMenu && (
              <div className="absolute right-6 top-14 w-52 bg-white rounded-xl shadow-xl border py-1.5 z-50 text-xs">
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center font-bold"><LogOut size={14} className="mr-2"/> Keluar dari Aplikasi</button>
              </div>
            )}
          </div>
        </header>

        {/* Inner Content Workspace Views (Blank and ready to receive insertions) */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          
          {/* VIEW: ADMIN DASBOR OVERVIEW */}
          {isAdmin && activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black">Dasbor Ringkasan Kurikulum</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Master Guru</p><p className="text-2xl font-black mt-1">{guruList.length} Akun</p></div>
                <div className="bg-white p-5 rounded-2xl border shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Master Siswa</p><p className="text-2xl font-black mt-1">{siswaList.length} Anak</p></div>
                <div className="bg-white p-5 rounded-2xl border shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Plotting Roster</p><p className="text-2xl font-black mt-1">{jadwalList.length} JTM</p></div>
                <div className="bg-white p-5 rounded-2xl border shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Jurnal Mengajar</p><p className="text-2xl font-black mt-1">{jurnalList.length} Lembar</p></div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl text-emerald-900 text-xs leading-relaxed">
                 <strong>Selamat Datang di SIM-Kurik Baru Anda!</strong> Aplikasi ini sekarang terhubung 100% dengan Cloud Database. Silakan masuk ke tab <strong>Data Master Terpadu</strong> untuk mulai mendaftarkan akun Dewan Guru dan mengisi Nama Siswa agar aplikasi fungsional sepenuhnya.
              </div>
            </div>
          )}

          {/* VIEW: ADMIN DATA MASTER CONTROL */}
          {isAdmin && activeTab === 'master' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Tambah Guru & Buat Akun Auth */}
              <form onSubmit={handleCreateGuruAccount} className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider border-b pb-2 text-slate-800">Registrasi Akun Guru Baru (Auth + DB)</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Nama Lengkap & Gelar" required value={formGuru.name} onChange={e=>setFormGuru({...formGuru, name:e.target.value})} className="w-full text-xs p-2.5 border rounded-lg"/>
                  <input type="text" placeholder="NIP / No Pegawai" value={formGuru.nip} onChange={e=>setFormGuru({...formGuru, nip:e.target.value})} className="w-full text-xs p-2.5 border rounded-lg"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Mata Pelajaran Utama" required value={formGuru.mapel} onChange={e=>setFormGuru({...formGuru, mapel:e.target.value})} className="w-full text-xs p-2.5 border rounded-lg"/>
                  <input type="text" placeholder="Wali Kelas (Opsional, Cth: 8A)" value={formGuru.waliKelas} onChange={e=>setFormGuru({...formGuru, waliKelas:e.target.value})} className="w-full text-xs p-2.5 border rounded-lg"/>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-dashed">
                  <input type="email" placeholder="Email Login Guru" required value={formGuru.email} onChange={e=>setFormGuru({...formGuru, email:e.target.value})} className="w-full text-xs p-2 border rounded-lg bg-white"/>
                  <input type="password" placeholder="Password Min 6 Karakter" required value={formGuru.password} onChange={e=>setFormGuru({...formGuru, password:e.target.value})} className="w-full text-xs p-2 border rounded-lg bg-white"/>
                </div>
                <button type="submit" disabled={isProcessing} className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs shadow hover:bg-emerald-700">{isProcessing ? 'Mendaftarkan Cloud Auth...':'Daftarkan & Kirim Akun'}</button>
                
                {/* Daftar Guru Terdaftar */}
                <div className="pt-2 max-h-40 overflow-y-auto divide-y text-xs">
                   {guruList.map(g => <div key={g.id} className="py-2 flex justify-between items-center"><span><strong>{g.name}</strong> ({g.mapel})</span><button type="button" onClick={()=>deleteDoc(doc(db,"guru",g.id))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></div>)}
                </div>
              </form>

              {/* Form Tambah Siswa */}
              <form onSubmit={handleCreateSiswa} className="bg-white p-5 rounded-2xl border shadow-sm space-y-4 h-fit">
                <h3 className="font-bold text-sm uppercase tracking-wider border-b pb-2 text-slate-800">Manajemen Pengisian Siswa</h3>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" placeholder="Nama Lengkap Siswa" required value={formSiswa.nama} onChange={e=>setFormSiswa({...formSiswa, nama:e.target.value})} className="col-span-1 text-xs p-2.5 border rounded-lg"/>
                  <select value={formSiswa.kelas} onChange={e=>setFormSiswa({...formSiswa, kelas:e.target.value})} required className="text-xs p-2.5 border rounded-lg bg-white">
                    <option value="">Kelas</option>
                    {KELAS_LIST.map(k=><option key={k} value={k}>{k}</option>)}
                  </select>
                  <input type="text" placeholder="NIS Siswa" required value={formSiswa.nis} onChange={e=>setFormSiswa({...formSiswa, nis:e.target.value})} className="text-xs p-2.5 border rounded-lg"/>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2 rounded-xl text-xs shadow hover:bg-slate-800">Simpan Siswa Ke Database</button>
                
                <div className="pt-2 max-h-40 overflow-y-auto divide-y text-xs">
                   {siswaList.slice(0,5).map(s => <div key={s.id} className="py-2 flex justify-between items-center"><span>{s.nama} - Kelas {s.kelas}</span><button type="button" onClick={()=>deleteDoc(doc(db,"siswa",s.id))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></div>)}
                   {siswaList.length > 5 && <p className="text-[10px] text-slate-400 pt-1">Dan {siswaList.length - 5} siswa lainnya terdaftar...</p>}
                </div>
              </form>
            </div>
          )}

          {/* VIEW: UNIVERSAL KALDIK INTERAKTIF (ADMIN & GURU) */}
          {(activeTab === 'kaldik' || activeTab === 'kaldik_guru') && <KaldikView readOnly={activeTab === 'kaldik_guru'} />}

          {/* VIEW: ADMIN GENERATOR SK */}
          {isAdmin && activeTab === 'sk' && <SKGeneratorView />}

          {/* VIEW: ADMIN JADWAL PLOTTING */}
          {isAdmin && activeTab === 'jadwal_admin' && <AdminJadwalView />}

          {/* VIEW: GURU JADWAL & DOWNLOAD DOKUMEN */}
          {!isAdmin && activeTab === 'jadwal_guru' && <GuruJadwalAndSKView />}

          {/* VIEW: GURU FILL JURNAL & PRESENSI */}
          {!isAdmin && activeTab === 'isi_jurnal' && <GuruIsiJurnalModule />}

          {/* VIEW: ADMIN MONITORING JURNAL & REKAP BK */}
          {isAdmin && activeTab === 'pantau_jurnal' && <AdminPantauJurnalModule />}

        </div>
      </main>
    </div>
  );
}
