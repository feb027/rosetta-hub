import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Server,
  Users,
  Search,
  FolderTree,
  User,
  Building2,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Simulated AD data
interface ADUser {
  dn: string;
  cn: string;
  sAMAccountName: string;
  mail: string;
  department: string;
  title: string;
  manager?: string;
  memberOf: string[];
  ou: string;
}

interface OUNode {
  name: string;
  dn: string;
  children: OUNode[];
  users: ADUser[];
}

// Generate mock AD structure
const generateADData = (): { root: OUNode; allUsers: ADUser[] } => {
  const departments = [
    { name: 'Engineering', titles: ['Software Engineer', 'Senior Engineer', 'Tech Lead', 'DevOps Engineer'] },
    { name: 'Sales', titles: ['Sales Rep', 'Account Manager', 'Sales Director', 'Business Dev'] },
    { name: 'HR', titles: ['HR Specialist', 'Recruiter', 'HR Manager', 'Benefits Admin'] },
    { name: 'Finance', titles: ['Accountant', 'Financial Analyst', 'Controller', 'CFO'] },
    { name: 'Marketing', titles: ['Marketing Specialist', 'Content Writer', 'SEO Manager', 'CMO'] },
  ];

  const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

  const allUsers: ADUser[] = [];
  const root: OUNode = {
    name: 'corp.example.com',
    dn: 'DC=corp,DC=example,DC=com',
    children: [],
    users: [],
  };

  departments.forEach((dept) => {
    const ouNode: OUNode = {
      name: dept.name,
      dn: `OU=${dept.name},DC=corp,DC=example,DC=com`,
      children: [],
      users: [],
    };

    // Generate 3-5 users per department
    const userCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < userCount; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const title = dept.titles[Math.floor(Math.random() * dept.titles.length)];
      const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

      const user: ADUser = {
        dn: `CN=${firstName} ${lastName},OU=${dept.name},DC=corp,DC=example,DC=com`,
        cn: `${firstName} ${lastName}`,
        sAMAccountName: username,
        mail: `${username}@corp.example.com`,
        department: dept.name,
        title,
        memberOf: [`CN=${dept.name} Team,OU=Groups,DC=corp,DC=example,DC=com`],
        ou: dept.name,
      };

      ouNode.users.push(user);
      allUsers.push(user);
    }

    root.children.push(ouNode);
  });

  return { root, allUsers };
};

type ConnectionState = 'disconnected' | 'connecting' | 'authenticating' | 'connected' | 'error';

export default function ActiveDirectoryVisualization() {
  const [adData] = useState(() => generateADData());
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [serverUrl, setServerUrl] = useState('ldap://dc01.corp.example.com:389');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('********');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'name' | 'email' | 'department' | 'all'>('all');
  const [searchResults, setSearchResults] = useState<ADUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ADUser | null>(null);
  const [expandedOUs, setExpandedOUs] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [connectionLog, setConnectionLog] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);

  // --- Audio ---
  const playSound = useCallback(
    (type: 'connect' | 'disconnect' | 'search' | 'found' | 'error' | 'click') => {
      if (!soundEnabled) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'connect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'disconnect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'search') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'found') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    },
    [soundEnabled]
  );

  const addLog = (message: string) => {
    setConnectionLog((prev) => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Simulate connection
  const connect = async () => {
    if (connectionState === 'connected') {
      setConnectionState('disconnected');
      setConnectionLog([]);
      setSearchResults([]);
      setSelectedUser(null);
      playSound('disconnect');
      return;
    }

    setConnectionState('connecting');
    addLog(`Connecting to ${serverUrl}...`);

    await new Promise((r) => setTimeout(r, 800));
    addLog('TCP connection established');

    setConnectionState('authenticating');
    addLog(`Authenticating as ${username}@corp.example.com...`);

    await new Promise((r) => setTimeout(r, 600));
    addLog('LDAP bind successful');

    setConnectionState('connected');
    addLog('Connected to Active Directory');
    addLog(`Base DN: DC=corp,DC=example,DC=com`);
    addLog(`${adData.allUsers.length} users in directory`);
    playSound('connect');
  };

  // Search users
  const searchUsers = useCallback(() => {
    if (!searchQuery.trim() || connectionState !== 'connected') return;

    setIsSearching(true);
    playSound('search');
    addLog(`Searching: (${searchFilter}=${searchQuery}*)`);

    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const results = adData.allUsers.filter((user) => {
        if (searchFilter === 'name' || searchFilter === 'all') {
          if (user.cn.toLowerCase().includes(query)) return true;
        }
        if (searchFilter === 'email' || searchFilter === 'all') {
          if (user.mail.toLowerCase().includes(query)) return true;
        }
        if (searchFilter === 'department' || searchFilter === 'all') {
          if (user.department.toLowerCase().includes(query)) return true;
        }
        if (searchFilter === 'all') {
          if (user.sAMAccountName.toLowerCase().includes(query)) return true;
        }
        return false;
      });

      setSearchResults(results);
      setIsSearching(false);
      addLog(`Found ${results.length} result(s)`);
      if (results.length > 0) playSound('found');
    }, 400);
  }, [searchQuery, searchFilter, connectionState, adData.allUsers, playSound]);

  // Toggle OU expansion
  const toggleOU = (dn: string) => {
    playSound('click');
    setExpandedOUs((prev) => {
      const next = new Set(prev);
      if (next.has(dn)) {
        next.delete(dn);
      } else {
        next.add(dn);
      }
      return next;
    });
  };

  // Reset
  const reset = () => {
    setConnectionState('disconnected');
    setConnectionLog([]);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setExpandedOUs(new Set());
    playSound('disconnect');
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
        if (connectionState === 'connected') searchUsers();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [searchUsers, connectionState]);

  const getConnectionColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'text-emerald-400';
      case 'connecting':
      case 'authenticating':
        return 'text-amber-400';
      case 'error':
        return 'text-rose-400';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 via-blue-950/10 to-slate-950 rounded-xl border border-blue-900/30 font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-blue-800/30 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Server className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-blue-300 tracking-wide">CORPORATE DIRECTORY EXPLORER</h2>
              <p className="text-xs text-blue-500/70">Active Directory / LDAP Simulation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${connectionState === 'connected' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
              <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className={`text-xs font-medium ${getConnectionColor()}`}>
                {connectionState === 'disconnected' && 'Disconnected'}
                {connectionState === 'connecting' && 'Connecting...'}
                {connectionState === 'authenticating' && 'Authenticating...'}
                {connectionState === 'connected' && 'Connected'}
                {connectionState === 'error' && 'Error'}
              </span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${soundEnabled ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Connection Panel */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-blue-400" size={18} />
            <span className="text-sm font-bold text-blue-300">LDAP Connection</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Server URL</label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                disabled={connectionState !== 'disconnected'}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={connectionState !== 'disconnected'}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={connectionState !== 'disconnected'}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={connect}
              disabled={connectionState === 'connecting' || connectionState === 'authenticating'}
              className={`flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                connectionState === 'connected'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500/30'
              } disabled:opacity-50`}
            >
              {(connectionState === 'connecting' || connectionState === 'authenticating') && <Loader2 size={16} className="animate-spin" />}
              {connectionState === 'connected' ? 'Disconnect' : connectionState === 'disconnected' ? 'Connect' : 'Connecting...'}
            </button>
            <button onClick={reset} className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Search Panel - Only when connected */}
        <AnimatePresence>
          {connectionState === 'connected' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Search className="text-cyan-400" size={18} />
                <span className="text-sm font-bold text-cyan-300">Search Directory</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                    placeholder="Search users..."
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <select
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value as typeof searchFilter)}
                  className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-cyan-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Fields</option>
                  <option value="name">Name (cn)</option>
                  <option value="email">Email (mail)</option>
                  <option value="department">Department</option>
                </select>
                <button
                  onClick={searchUsers}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 py-2.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 rounded-lg hover:bg-cyan-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Search
                </button>
              </div>

              {/* LDAP Filter Preview */}
              <div className="mt-3 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <span className="text-xs text-slate-500">LDAP Filter: </span>
                <span className="text-xs font-mono text-cyan-400">
                  {searchFilter === 'all'
                    ? `(|(cn=*${searchQuery}*)(mail=*${searchQuery}*)(department=*${searchQuery}*))`
                    : searchFilter === 'name'
                      ? `(cn=*${searchQuery}*)`
                      : searchFilter === 'email'
                        ? `(mail=*${searchQuery}*)`
                        : `(department=*${searchQuery}*)`}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content - Two Column Layout */}
        {connectionState === 'connected' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Directory Tree */}
            <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-4">
                <FolderTree className="text-amber-400" size={18} />
                <span className="text-sm font-bold text-amber-300">Directory Structure</span>
              </div>

              <div className="space-y-1 font-mono text-sm">
                {/* Root */}
                <div className="flex items-center gap-2 text-slate-300">
                  <Server size={14} className="text-blue-400" />
                  <span>{adData.root.name}</span>
                </div>

                {/* OUs */}
                {adData.root.children.map((ou) => (
                  <div key={ou.dn} className="ml-4">
                    <button onClick={() => toggleOU(ou.dn)} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors w-full text-left py-1">
                      {expandedOUs.has(ou.dn) ? <ChevronDown size={14} className="text-amber-400" /> : <ChevronRight size={14} className="text-amber-400" />}
                      <Building2 size={14} className="text-amber-400" />
                      <span>OU={ou.name}</span>
                      <span className="text-slate-600 text-xs">({ou.users.length})</span>
                    </button>

                    {/* Users in OU */}
                    <AnimatePresence>
                      {expandedOUs.has(ou.dn) && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="ml-6 space-y-1 overflow-hidden">
                          {ou.users.map((user) => (
                            <button
                              key={user.dn}
                              onClick={() => {
                                setSelectedUser(user);
                                playSound('click');
                              }}
                              className={`flex items-center gap-2 py-1 px-2 rounded w-full text-left transition-all ${
                                selectedUser?.dn === user.dn ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                              }`}
                            >
                              <User size={12} />
                              <span className="truncate">{user.cn}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Results / User Details */}
            <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
              {selectedUser ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <User className="text-emerald-400" size={18} />
                      <span className="text-sm font-bold text-emerald-300">User Details</span>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-slate-300 text-xs">
                      ✕ Close
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                        {selectedUser.cn
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-200">{selectedUser.cn}</div>
                        <div className="text-sm text-slate-500">{selectedUser.title}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {[
                        { label: 'Distinguished Name', value: selectedUser.dn, icon: FolderTree },
                        { label: 'Username', value: selectedUser.sAMAccountName, icon: User },
                        { label: 'Email', value: selectedUser.mail, icon: Mail },
                        { label: 'Department', value: selectedUser.department, icon: Building2 },
                        { label: 'Member Of', value: selectedUser.memberOf[0], icon: Users },
                      ].map((item) => (
                        <div key={item.label} className="flex items-start gap-2 p-2 bg-slate-800/30 rounded border border-slate-700/50">
                          <item.icon size={14} className="text-slate-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs text-slate-500">{item.label}</div>
                            <div className="text-slate-300 font-mono text-xs break-all">{item.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="text-cyan-400" size={18} />
                    <span className="text-sm font-bold text-cyan-300">Search Results ({searchResults.length})</span>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.dn}
                        onClick={() => {
                          setSelectedUser(user);
                          playSound('click');
                        }}
                        className="w-full flex items-center gap-3 p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg border border-slate-700/50 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {user.cn
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-200 truncate">{user.cn}</div>
                          <div className="text-xs text-slate-500 truncate">{user.mail}</div>
                        </div>
                        <div className="ml-auto text-xs text-slate-600">{user.department}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-slate-600">
                  <Search size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">Search for users or select from tree</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connection Log */}
        {connectionLog.length > 0 && (
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Play className="text-slate-400" size={14} />
              <span className="text-xs font-bold text-slate-400">Connection Log</span>
            </div>
            <div className="font-mono text-xs space-y-1 max-h-[120px] overflow-y-auto">
              {connectionLog.map((log, i) => (
                <div key={i} className={`${log.includes('successful') || log.includes('Connected') || log.includes('Found') ? 'text-emerald-400' : log.includes('Error') ? 'text-rose-400' : 'text-slate-500'}`}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Icons */}
        <div className="flex flex-wrap gap-4 justify-center">
          {[
            { icon: Server, label: 'Server', active: connectionState !== 'disconnected' },
            { icon: Shield, label: 'Auth', active: connectionState === 'connected' || connectionState === 'authenticating' },
            { icon: FolderTree, label: 'Directory', active: connectionState === 'connected' },
            { icon: Search, label: 'Search', active: connectionState === 'connected' && searchResults.length > 0 },
          ].map((item) => (
            <div key={item.label} className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${item.active ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-800/30 border-slate-700/30'}`}>
              <item.icon size={20} className={item.active ? 'text-blue-400' : 'text-slate-600'} />
              <span className={`text-xs ${item.active ? 'text-blue-300' : 'text-slate-600'}`}>{item.label}</span>
              {item.active ? <CheckCircle2 size={12} className="text-emerald-400" /> : <XCircle size={12} className="text-slate-600" />}
            </div>
          ))}
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50">
            <kbd className="text-slate-400">Enter</kbd> Search
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <details className="mx-6 mb-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <summary className="px-4 py-3 cursor-pointer text-sm text-blue-400 hover:text-blue-300 transition-colors">What is Active Directory / LDAP?</summary>
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
          <p>
            <span className="text-blue-300">Active Directory (AD)</span> is Microsoft's directory service for Windows domain networks. It uses <span className="text-cyan-300">LDAP</span> (Lightweight Directory Access Protocol) for
            querying and modifying directory data.
          </p>
          <p>Key concepts:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <span className="text-amber-300">DN (Distinguished Name)</span>: Unique identifier for each entry
            </li>
            <li>
              <span className="text-amber-300">OU (Organizational Unit)</span>: Container for organizing objects
            </li>
            <li>
              <span className="text-amber-300">CN (Common Name)</span>: Human-readable name
            </li>
            <li>
              <span className="text-amber-300">LDAP Bind</span>: Authentication process
            </li>
          </ul>
          <p className="mt-2">This visualization simulates AD operations - no actual network connections are made.</p>
        </div>
      </details>
    </div>
  );
}
