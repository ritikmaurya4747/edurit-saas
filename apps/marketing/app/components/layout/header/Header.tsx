"use client"
import { useState } from 'react'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Roles', href: '#roles' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
  ]

  return (
    <header className="sticky top-0 z-100 bg-white backdrop-blur-sm border-b border-gray-200 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 h-17 flex items-center justify-between">
        {/* Logo */}
        <button className="flex items-center gap-2.5 bg-none border-none cursor-pointer shrink-0">
          <div className="w-9 h-9 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
            <span className="text-white text-lg font-extrabold">ER</span>
          </div>
          <div className="text-left">
            <div className="text-base font-extrabold text-slate-800 leading-none">EduRit</div>
            <div className="text-[9px] text-slate-400 font-['JetBrains_Mono',monospace] uppercase tracking-widest">School ERP</div>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-1 flex-1 justify-center">
          {navLinks.map(l => (
            <a key={l.label} href={l.href} className="px-3.5 py-1.5 rounded-lg text-sm text-gray-700 no-underline font-medium transition-all duration-150 hover:bg-slate-50 hover:text-slate-800">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          <button className="px-5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold cursor-pointer font-['Outfit',sans-serif] transition-all duration-150 hover:border-slate-400">
            Log In
          </button>
          <button className="px-5 py-2 rounded-lg border-none bg-linear-to-r from-blue-600 to-purple-600 text-white text-sm font-bold cursor-pointer font-['Outfit',sans-serif] shadow-[0_2px_8px_rgba(37,99,235,0.3)] transition-opacity duration-150 hover:opacity-90">
            Get Started Free
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-slate-50 transition-colors duration-150"
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-slate-600 transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-slate-600 transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-slate-600 transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 py-4 border-t border-gray-200 bg-white">
          <nav className="flex flex-col gap-1">
            {navLinks.map(l => (
              <a 
                key={l.label} 
                href={l.href} 
                className="px-4 py-3 rounded-lg text-sm text-gray-700 no-underline font-medium transition-all duration-150 hover:bg-slate-50 hover:text-slate-800"
                onClick={() => setIsOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2.5 mt-4 pt-4 border-t border-gray-200">
            <button className="w-full px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold cursor-pointer font-['Outfit',sans-serif] transition-all duration-150 hover:border-slate-400">
              Log In
            </button>
            <button className="w-full px-5 py-2.5 rounded-lg border-none bg-linear-to-r from-blue-600 to-purple-600 text-white text-sm font-bold cursor-pointer font-['Outfit',sans-serif] shadow-[0_2px_8px_rgba(37,99,235,0.3)] transition-opacity duration-150 hover:opacity-90">
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header