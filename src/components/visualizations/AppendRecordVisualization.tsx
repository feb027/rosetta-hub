import { useState, useCallback, useRef, useEffect } from 'react';
import { FileText, Plus, Save, FolderOpen, Trash2, Terminal, HardDrive, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface PasswdRecord {
  account: string;
  password: string;
  uid: number;
  gid: number;
  gecos: {
    fullname: string;
    office: string;
    extension: string;
    homephone: string;
    email: string;
  };
  directory: string;
  shell: string;
}

interface FileOperation {
  id: number;
  type: 'open' | 'write' | 'append' | 'close' | 'read';
  message: string;
  timestamp: Date;
}

// --- Component ---
export default function AppendRecordVisualization() {
  const [records, setRecords] = useState<PasswdRecord[]>([]);
  const [fileOpen, setFileOpen] = useState(false);
  const [fileMode, setFileMode] = useState<'closed' | 'write' | 'append' | 'read'>('closed');
  const [operations, setOperations] = useState<FileOperation[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newRecord, setNewRecord] = useState<PasswdRecord>({
    account: 'xyz',
    password: 'x',
    uid: 1003,
    gid: 1000,
    gecos: {
      fullname: 'X Yz',
      office: 'Room 1003',
      extension: '(234)555-8913',
      homephone: '(234)555-0033',
      email: 'xyz@rosettacode.org',
    },
    directory: '/home/xyz',
    shell: '/bin/bash',
  });
  const [showForm, setShowForm] = useState(false);
  const [highlightedRecord, setHighlightedRecord] = useState<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const opIdRef = useRef(0);

  // Initial records from the task
  const initialRecords: PasswdRecord[] = [
    {
      account: 'jsmith',
      password: 'x',
      uid: 1001,
      gid: 1000,
      gecos: {
        fullname: 'Joe Smith',
        office: 'Room 1007',
        extension: '(234)555-8917',
        homephone: '(234)555-0077',
        email: 'jsmith@rosettacode.org',
      },
      directory: '/home/jsmith',
      shell: '/bin/bash',
    },
    {
      account: 'jdoe',
      password: 'x',
      uid: 1002,
      gid: 1000,
      gecos: {
        fullname: 'Jane Doe',
        office: 'Room 1004',
        extension: '(234)555-8914',
        homephone: '(234)555-0044',
        email: 'jdoe@rosettacode.org',
      },
      directory: '/home/jdoe',
      shell: '/bin/bash',
    },
  ];

  // Initialize audio
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }, [soundEnabled]);

  // Play sounds
  const playSound = useCallback((type: 'open' | 'write' | 'close' | 'error' | 'success') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'open':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
        break;
      case 'write':
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, currentTime);
        gain.gain.setValueAtTime(0.03, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);
        break;
      case 'close':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
        break;
      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, currentTime);
        osc.frequency.setValueAtTime(659, currentTime + 0.1);
        osc.frequency.setValueAtTime(784, currentTime + 0.2);
        gain.gain.setValueAtTime(0.06, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.35);
        break;
      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, currentTime);
        gain.gain.setValueAtTime(0.06, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.2);
        break;
    }
    osc.start(currentTime);
    osc.stop(currentTime + 0.5);
  }, [soundEnabled]);

  const addOperation = (type: FileOperation['type'], message: string) => {
    const op: FileOperation = {
      id: opIdRef.current++,
      type,
      message,
      timestamp: new Date(),
    };
    setOperations(prev => [...prev.slice(-9), op]);
  };

  // Format record to passwd line
  const formatRecord = (r: PasswdRecord): string => {
    const gecos = `${r.gecos.fullname},${r.gecos.office},${r.gecos.extension},${r.gecos.homephone},${r.gecos.email}`;
    return `${r.account}:${r.password}:${r.uid}:${r.gid}:${gecos}:${r.directory}:${r.shell}`;
  };

  // File operations
  const openFileWrite = () => {
    setFileOpen(true);
    setFileMode('write');
    setRecords([]);
    addOperation('open', 'fopen("passwd", "w") - Opened for writing');
    playSound('open');
  };

  const writeInitialRecords = () => {
    if (fileMode !== 'write') return;
    setRecords(initialRecords);
    initialRecords.forEach((r, i) => {
      setTimeout(() => {
        addOperation('write', `fprintf(fp, "${r.account}:...") - Record ${i + 1} written`);
        playSound('write');
      }, i * 200);
    });
  };

  const closeFile = () => {
    setFileOpen(false);
    setFileMode('closed');
    addOperation('close', 'fclose(fp) - File closed');
    playSound('close');
  };

  const openFileAppend = () => {
    setFileOpen(true);
    setFileMode('append');
    addOperation('open', 'fopen("passwd", "a") - Opened for appending');
    playSound('open');
  };

  const appendRecord = () => {
    if (fileMode !== 'append') return;
    const newRec = { ...newRecord };
    setRecords(prev => [...prev, newRec]);
    setHighlightedRecord(records.length);
    addOperation('append', `fprintf(fp, "${newRec.account}:...") - Record appended`);
    playSound('write');
    setTimeout(() => setHighlightedRecord(null), 2000);
  };

  const openFileRead = () => {
    setFileOpen(true);
    setFileMode('read');
    addOperation('read', 'fopen("passwd", "r") - Opened for reading');
    playSound('open');
    playSound('success');
  };

  const resetDemo = () => {
    setRecords([]);
    setFileOpen(false);
    setFileMode('closed');
    setOperations([]);
    setHighlightedRecord(null);
    opIdRef.current = 0;
  };

  // Run full demo sequence
  const runFullDemo = async () => {
    resetDemo();
    await new Promise(r => setTimeout(r, 300));
    
    // Step 1: Open for write
    openFileWrite();
    await new Promise(r => setTimeout(r, 500));
    
    // Step 2: Write initial records
    setRecords(initialRecords);
    addOperation('write', 'fprintf(fp, "jsmith:...") - Record 1 written');
    playSound('write');
    await new Promise(r => setTimeout(r, 300));
    addOperation('write', 'fprintf(fp, "jdoe:...") - Record 2 written');
    playSound('write');
    await new Promise(r => setTimeout(r, 500));
    
    // Step 3: Close
    closeFile();
    await new Promise(r => setTimeout(r, 500));
    
    // Step 4: Open for append
    openFileAppend();
    await new Promise(r => setTimeout(r, 500));
    
    // Step 5: Append new record
    const newRec = { ...newRecord };
    setRecords(prev => [...prev, newRec]);
    setHighlightedRecord(2);
    addOperation('append', `fprintf(fp, "${newRec.account}:...") - Record appended`);
    playSound('write');
    await new Promise(r => setTimeout(r, 500));
    
    // Step 6: Close
    setFileOpen(false);
    setFileMode('closed');
    addOperation('close', 'fclose(fp) - File closed');
    playSound('close');
    await new Promise(r => setTimeout(r, 500));
    
    // Step 7: Open for read to verify
    setFileOpen(true);
    setFileMode('read');
    addOperation('read', 'fopen("passwd", "r") - Opened for reading');
    addOperation('read', '✓ Verified: 3 records in file');
    playSound('success');
    
    setTimeout(() => setHighlightedRecord(null), 2000);
  };

  const getFileStatusColor = () => {
    switch (fileMode) {
      case 'write': return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
      case 'append': return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
      case 'read': return 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10';
      default: return 'text-slate-500 border-slate-600/50 bg-slate-800/50';
    }
  };

  return (
    <div className="w-full min-h-[750px] bg-gradient-to-br from-slate-950 via-emerald-950/10 to-slate-950 rounded-xl border border-emerald-900/30 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-emerald-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Terminal className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-300 tracking-wide">FILE TERMINAL</h2>
              <p className="text-xs text-emerald-500/70">passwd Record Append Demo</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getFileStatusColor()}`}>
            <HardDrive size={14} />
            <span className="text-xs font-mono">
              /etc/passwd: {fileMode === 'closed' ? 'CLOSED' : fileMode.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        
        {/* Control Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <button
            onClick={runFullDemo}
            className="col-span-2 md:col-span-4 lg:col-span-1 py-2.5 px-4 rounded-lg font-bold text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            RUN DEMO
          </button>
          <button
            onClick={openFileWrite}
            disabled={fileOpen}
            className="py-2 px-3 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
          >
            <FolderOpen size={14} />
            Open(W)
          </button>
          <button
            onClick={writeInitialRecords}
            disabled={fileMode !== 'write'}
            className="py-2 px-3 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
          >
            <Save size={14} />
            Write
          </button>
          <button
            onClick={closeFile}
            disabled={!fileOpen}
            className="py-2 px-3 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
          >
            <FileText size={14} />
            Close
          </button>
          <button
            onClick={openFileAppend}
            disabled={fileOpen || records.length === 0}
            className="py-2 px-3 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
          >
            <Plus size={14} />
            Open(A)
          </button>
          <button
            onClick={appendRecord}
            disabled={fileMode !== 'append'}
            className="py-2 px-3 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
          >
            <Plus size={14} />
            Append
          </button>
          <button
            onClick={openFileRead}
            disabled={fileOpen || records.length === 0}
            className="py-2 px-3 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
          >
            <FolderOpen size={14} />
            Open(R)
          </button>
        </div>

        {/* File Content Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* File View */}
          <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-emerald-800/30 overflow-hidden">
            {/* Terminal Header */}
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              </div>
              <span className="text-xs text-slate-500 font-mono ml-2">cat /etc/passwd</span>
            </div>
            
            {/* File Content */}
            <div className="p-4 font-mono text-sm min-h-[200px] max-h-[300px] overflow-auto">
              {records.length === 0 ? (
                <div className="text-slate-600 italic">File is empty or not created yet...</div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {records.map((record, index) => (
                    <motion.div
                      key={`${record.account}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`py-1 px-2 rounded transition-all ${
                        highlightedRecord === index
                          ? 'bg-emerald-500/20 border-l-2 border-emerald-500'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="text-cyan-400">{record.account}</span>
                      <span className="text-slate-600">:</span>
                      <span className="text-slate-500">{record.password}</span>
                      <span className="text-slate-600">:</span>
                      <span className="text-amber-400">{record.uid}</span>
                      <span className="text-slate-600">:</span>
                      <span className="text-amber-400">{record.gid}</span>
                      <span className="text-slate-600">:</span>
                      <span className="text-emerald-400">{record.gecos.fullname}</span>
                      <span className="text-slate-500">,{record.gecos.office},{record.gecos.extension},{record.gecos.homephone},{record.gecos.email}</span>
                      <span className="text-slate-600">:</span>
                      <span className="text-sky-400">{record.directory}</span>
                      <span className="text-slate-600">:</span>
                      <span className="text-rose-400">{record.shell}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
            
            {/* Status Bar */}
            <div className="bg-slate-900 px-4 py-2 border-t border-slate-800 flex justify-between text-xs text-slate-500">
              <span>{records.length} record(s)</span>
              <span>{records.reduce((acc, r) => acc + formatRecord(r).length + 1, 0)} bytes</span>
            </div>
          </div>

          {/* Operations Log */}
          <div className="bg-slate-900/50 rounded-xl border border-emerald-800/30 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-300">OPERATIONS LOG</span>
              <button
                onClick={resetDemo}
                className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="p-3 space-y-2 max-h-[280px] overflow-auto font-mono text-xs">
              {operations.length === 0 ? (
                <div className="text-slate-600 italic">No operations yet...</div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {operations.map(op => (
                    <motion.div
                      key={op.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-2 rounded border ${
                        op.type === 'open' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                        op.type === 'write' || op.type === 'append' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                        op.type === 'close' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
                        'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{op.timestamp.toLocaleTimeString()}</span>
                        <span>{op.message}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* New Record Form */}
        <div className="bg-slate-900/50 rounded-xl border border-emerald-800/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Plus size={16} />
              RECORD TO APPEND
            </h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-xs text-slate-500 hover:text-emerald-400"
            >
              {showForm ? 'Hide' : 'Edit'}
            </button>
          </div>
          
          {showForm ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={newRecord.account}
                onChange={(e) => setNewRecord({ ...newRecord, account: e.target.value })}
                placeholder="account"
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
              />
              <input
                type="number"
                value={newRecord.uid}
                onChange={(e) => setNewRecord({ ...newRecord, uid: parseInt(e.target.value) || 0 })}
                placeholder="UID"
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
              />
              <input
                type="text"
                value={newRecord.gecos.fullname}
                onChange={(e) => setNewRecord({ ...newRecord, gecos: { ...newRecord.gecos, fullname: e.target.value } })}
                placeholder="Full Name"
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
              />
              <input
                type="text"
                value={newRecord.gecos.email}
                onChange={(e) => setNewRecord({ ...newRecord, gecos: { ...newRecord.gecos, email: e.target.value } })}
                placeholder="Email"
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          ) : (
            <div className="font-mono text-xs bg-slate-800/50 rounded p-3 text-emerald-300 overflow-x-auto">
              {formatRecord(newRecord)}
            </div>
          )}
        </div>

        {/* Format Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded-xl border border-emerald-800/30 p-4">
            <h3 className="text-sm font-bold text-emerald-300 mb-3">PASSWD FORMAT</h3>
            <div className="text-xs space-y-1 font-mono">
              <div><span className="text-cyan-400">account</span><span className="text-slate-600">:</span><span className="text-slate-500">password</span><span className="text-slate-600">:</span><span className="text-amber-400">UID</span><span className="text-slate-600">:</span><span className="text-amber-400">GID</span><span className="text-slate-600">:</span><span className="text-emerald-400">GECOS</span><span className="text-slate-600">:</span><span className="text-sky-400">directory</span><span className="text-slate-600">:</span><span className="text-rose-400">shell</span></div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              GECOS: fullname,office,extension,homephone,email
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl border border-emerald-800/30 p-4">
            <h3 className="text-sm font-bold text-emerald-300 mb-3">FILE MODES</h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-center">
                <div className="text-amber-400 font-bold">"w"</div>
                <div className="text-slate-500">Write</div>
              </div>
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-center">
                <div className="text-emerald-400 font-bold">"a"</div>
                <div className="text-slate-500">Append</div>
              </div>
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-center">
                <div className="text-cyan-400 font-bold">"r"</div>
                <div className="text-slate-500">Read</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sound Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              soundEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            Sound: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Explanation */}
        <details className="bg-slate-900/50 rounded-xl border border-emerald-800/30">
          <summary className="px-4 py-3 cursor-pointer text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            How does file appending work?
          </summary>
          <div className="px-4 pb-4 text-xs text-emerald-500 space-y-3">
            <p>
              When opening a file in <span className="text-emerald-300">append mode ("a")</span>, 
              the file pointer is positioned at the end of the file. Any writes will add data 
              after existing content, preserving what was already there.
            </p>
            <p>
              This is different from <span className="text-amber-300">write mode ("w")</span>, 
              which truncates the file (erases all content) before writing.
            </p>
            <p>
              The <span className="text-cyan-300">passwd file format</span> is a colon-separated 
              format used in Unix-like systems to store user account information. Each line 
              represents one user with fields for username, password placeholder, UID, GID, 
              GECOS info, home directory, and login shell.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
