
const Header = () => {

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Roles', href: '#roles' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
  ]

  return (
    <header className="sticky top-0 z-100 bg-white backdrop-blur-sm border-b border-gray-200 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-6xl mx-auto  h-17 flex items-center gap-10">
        {/* Logo */}
        <button className="flex items-center gap-2.5 bg-none border-none cursor-pointer shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
            <span className="text-white text-lg font-extrabold">ER</span>
          </div>
          <div className="text-left">
            <div className="text-base font-extrabold text-slate-800 leading-none">EduRit</div>
            <div className="text-[9px] text-slate-400 font-['JetBrains_Mono',monospace] uppercase tracking-widest">School ERP</div>
          </div>
        </button>

        {/* Nav */}
        <nav className="flex gap-1 flex-1">
          {navLinks.map(l => (
            <a key={l.label} href={l.href} className="px-3.5 py-1.5 rounded-lg text-sm text-gray-700 no-underline font-medium transition-all duration-150 hover:bg-slate-50 hover:text-slate-800">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button className="px-5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold cursor-pointer font-['Outfit',sans-serif] transition-all duration-150 hover:border-slate-400">
            Log In
          </button>
          <button className="px-5 py-2 rounded-lg border-none bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold cursor-pointer font-['Outfit',sans-serif] shadow-[0_2px_8px_rgba(37,99,235,0.3)] transition-opacity duration-150 hover:opacity-90">
            Get Started Free
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header