'use client';


const menuItems = [
  {
    section: 'General',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊', badge: 3 },
      { id: 'blocks', label: 'Blocks', icon: '⛏️' },
      { id: 'charts', label: 'Charts', icon: '📈' },
      { id: 'rewards', label: 'Rewards', icon: '💰' },
    ],
  },
  {
    section: 'Analytics',
    items: [
      { id: 'fees', label: 'Fee Analysis', icon: '💸' },
      { id: 'miners', label: 'Miners', icon: '👷' },
      { id: 'settings', label: 'Settings', icon: '⚙️' },
    ],
  },
];

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="sidebar w-64 h-full flex flex-col p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
          ₿
        </div>
        <div>
          <div className="font-semibold text-white">CryptoView</div>
          <div className="text-xs text-[var(--text-secondary)]">Block Explorer</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">🔍</span>
        <input
          type="text"
          placeholder="Search"
          className="search-input"
        />
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto">
        {menuItems.map((section) => (
          <div key={section.section} className="mb-6">
            <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider px-2 mb-2">
              {section.section}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="badge">{item.badge}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom stats */}
      <div className="glass-card p-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--text-secondary)]">Blocks Loaded</span>
          <span className="text-xs text-[var(--accent-green)]">Live</span>
        </div>
        <div className="text-2xl font-bold text-white">∞</div>
        <div className="text-xs text-[var(--text-secondary)] mt-1">Real-time sync enabled</div>
      </div>
    </aside>
  );
}
