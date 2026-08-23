const LINKS = {
  Product: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'Status'],
  Solutions: ['For Schools', 'For Teachers', 'For Students', 'For Parents', 'Enterprise'],
  Resources: ['Documentation', 'API Reference', 'Help Center', 'Community', 'Blog'],
  Company: ['About Us', 'Careers', 'Press', 'Contact', 'Privacy Policy'],
}

const SOCIAL = [
  { name: 'Twitter / X', icon: '𝕏' },
  { name: 'LinkedIn', icon: 'in' },
  { name: 'GitHub', icon: '⌥' },
  { name: 'YouTube', icon: '▶' },
]

const Footer =()=> {
  return (
    <footer className="bg-slate-900 text-slate-400 font-['Outfit',sans-serif]">
      {/* Main footer */}
      <div className="max-w-6xl mx-auto px-8 py-16 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[280px_repeat(4,1fr)] gap-10">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white text-lg font-extrabold">S</span>
              </div>
              <div>
                <div className="text-base font-extrabold text-slate-100">Skolearn ERP</div>
                <div className="text-[9px] text-slate-600 font-['JetBrains_Mono',monospace] uppercase tracking-widest">School Management</div>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              The complete school management platform trusted by 500+ institutions worldwide. Streamline operations, empower educators, and enhance student outcomes.
            </p>
            <div className="flex gap-2.5">
              {SOCIAL.map(s => (
                <div key={s.name} title={s.name} className="w-8.5 h-8.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-400 cursor-pointer transition-all duration-150 hover:bg-blue-600 hover:text-white hover:border-blue-600">
                  {s.icon}
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <div className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-4 font-['JetBrains_Mono',monospace]">{title}</div>
              <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
                {links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm text-slate-600 no-underline transition-colors duration-150 hover:text-slate-200">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-14 pt-10 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <div className="text-sm font-bold text-slate-200 mb-1">Stay updated</div>
            <div className="text-sm text-slate-600">Get the latest news, product updates, and education insights.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input placeholder="your@email.com" className="px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-sm outline-none w-60 font-['Outfit',sans-serif]" />
            <button className="px-5 py-2.5 rounded-lg border-none bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold cursor-pointer whitespace-nowrap font-['Outfit',sans-serif]">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            © 2026 Skolearn Technologies Inc. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-6">
            {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'GDPR'].map(l => (
              <a key={l} href="#" className="text-xs text-slate-600 no-underline hover:text-slate-400">
                {l}
              </a>
            ))}
          </div>
          <div className="text-xs text-slate-600 font-['JetBrains_Mono',monospace]">
            v2.4.1 · SOC 2 Type II · ISO 27001
          </div>
        </div>
      </div>
    </footer>
  )
}
export default Footer