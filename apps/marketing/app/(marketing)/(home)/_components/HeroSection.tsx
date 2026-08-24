"use client"
const FEATURES = [
  { icon: '👥', title: 'Student Management', desc: 'Enroll, track, and manage every student. Full profiles, academic history, and behavior records in one place.' },
  { icon: '✅', title: 'Attendance Tracking', desc: 'Real-time attendance marking with automated parent notifications. Daily and monthly analytics at a glance.' },
  { icon: '📝', title: 'Grade & Assessment', desc: 'Gradebooks, rubrics, and report cards. Teachers enter scores once — students and parents see results instantly.' },
  { icon: '💰', title: 'Fee Management', desc: 'Automated invoicing, online payment gateway, and detailed financial reports. Reduce overdue accounts by 60%.' },
  { icon: '📅', title: 'Smart Timetabling', desc: 'Conflict-free timetable generation for all classes, teachers, and rooms — built in minutes, not days.' },
  { icon: '📊', title: 'Analytics & Reports', desc: 'Board-ready reports, at-risk student alerts, and subject-level performance trends with one-click export.' },
]

const STATS = [
  { value: '500+', label: 'Schools Trust EduRit' },
  { value: '250k', label: 'Active Students' },
  { value: '18k', label: 'Educators' },
  { value: '99.9%', label: 'Uptime SLA' },
]

const ROLES = [
  {
    id: 'superadmin',
    title: 'Super Admin',
    color: '#7c3aed', bg: '#f5f3ff', icon: '🛡️',
    features: ['Manage entire school', 'Full financial oversight', 'Staff & class management', 'System configuration', 'School-wide reports'],
  },
  {
    id: 'teacher',
    title: 'Teacher',
    color: '#2563eb', bg: '#eff6ff', icon: '📚',
    features: ['Mark attendance in seconds', 'Digital gradebook', 'Publish assignments', 'Message parents & students', 'Personal schedule view'],
  },
  {
    id: 'student',
    title: 'Student',
    color: '#0d9488', bg: '#f0fdfa', icon: '🎓',
    features: ['View all grades & GPA', 'Class timetable', 'Assignment submissions', 'Attendance calendar', 'Fee payment status'],
  },
  {
    id: 'parent',
    title: 'Parent',
    color: '#d97706', bg: '#fffbeb', icon: '👨‍👩‍👧',
    features: ["Child's live progress", 'Attendance alerts', 'Pay fees online', 'Direct teacher messaging', 'School event calendar'],
  },
]

const PRICING = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    desc: 'Perfect for small schools getting started.',
    color: '#64748b',
    features: ['Up to 100 students', '5 teacher accounts', 'Basic attendance', 'Grade entry', 'Email support'],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Standard',
    price: '$49',
    period: 'per month',
    desc: 'Everything a growing school needs.',
    color: '#2563eb',
    features: ['Up to 1,000 students', 'Unlimited teachers', 'Fee management', 'Parent portal', 'Advanced reports', 'SMS notifications', 'Priority support'],
    cta: 'Start 30-Day Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'tailored pricing',
    desc: 'For large institutions and school networks.',
    color: '#7c3aed',
    features: ['Unlimited students', 'Multi-school management', 'Custom integrations', 'Dedicated success manager', 'On-premise option', 'SSO & SAML', 'SLA guarantee'],
    cta: 'Contact Sales',
    highlight: false,
  },
]

const TESTIMONIALS = [
  {
    quote: "EduRit transformed how we run Westbrook Academy. Attendance, grades, and fees used to take our admin team all day — now it's done before morning assembly.",
    name: 'Dr. Patricia Harris',
    role: 'Principal, Westbrook Academy',
    initials: 'PH',
    color: '#7c3aed',
  },
  {
    quote: "As a teacher managing four classes, the gradebook and assignment tools save me hours every week. Parents actually love getting real-time updates on their children.",
    name: 'Mr. James Okonkwo',
    role: 'Science Teacher, Grade 9–11',
    initials: 'JO',
    color: '#2563eb',
  },
  {
    quote: "I can see my daughter's grades, attendance, and even pay her fees from my phone. It gives me peace of mind and keeps me involved without having to call the school.",
    name: 'Mr. Kwame Osei',
    role: 'Parent, Westbrook Academy',
    initials: 'KO',
    color: '#d97706',
  },
]

const STEPS = [
  { num: '01', title: 'Set up your school', desc: 'Enter your school details, create classes, and define your academic calendar in under 30 minutes.' },
  { num: '02', title: 'Invite your team', desc: 'Send bulk invitations to teachers, enroll students, and link parent accounts — all via CSV or email.' },
  { num: '03', title: 'Start managing', desc: 'Mark attendance, enter grades, collect fees, and communicate — everything from one clean dashboard.' },
]

const HeroSection = () => {
  return (
    <div className="font-['Outfit',sans-serif] bg-white text-slate-800">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-blue-50/50 to-white border-b border-slate-100 py-20 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-15 items-center">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3.5 py-1 mb-6">
              <span className="text-sm">✨</span>
              <span className="text-xs text-blue-600 font-semibold">New: AI-powered grade analytics</span>
              <span className="text-xs text-blue-600">→</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5 tracking-tight">
              The Complete{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                School Management
              </span>{' '}
              Platform
            </h1>

            <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-9 max-w-lg">
              EduRit unifies student management, attendance, grades, fees, and communication — giving every school stakeholder a personalized, role-based experience.
            </p>

            <div className="flex flex-wrap gap-3 mb-12">
              <button className="px-7 py-3.5 rounded-xl border-none bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold cursor-pointer shadow-[0_4px_16px_rgba(37,99,235,0.35)] font-['Outfit',sans-serif]">
                Get Started Free →
              </button>
              <button className="px-7 py-3.5 rounded-xl border-[1.5px] border-gray-200 bg-white text-gray-700 text-sm font-semibold cursor-pointer font-['Outfit',sans-serif]">
                View Demo Dashboards
              </button>
            </div>

            <div className="flex flex-wrap gap-8">
              {[['✓ Free 30-day trial'], ['✓ No credit card required'], ['✓ Setup in 30 min']].map(([t]) => (
                <div key={t} className="text-sm text-slate-500 flex items-center gap-1">{t}</div>
              ))}
            </div>
          </div>

          {/* Hero visual — stylized dashboard mockup */}
          <div className="relative">
            <div className="bg-white rounded-xl border border-gray-200 shadow-[0_24px_64px_rgba(0,0,0,0.12)] overflow-hidden">
              {/* Mock browser chrome */}
              <div className="bg-slate-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                <div className="flex-1 bg-gray-200 rounded h-5 ml-2 flex items-center pl-2.5">
                  <span className="text-[10px] text-slate-400 font-['JetBrains_Mono',monospace]">app.skolearn.io/dashboard</span>
                </div>
              </div>
              {/* Mock dashboard content */}
              <div className="p-5 bg-slate-50">
                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-2.5 mb-3.5">
                  {[['2,847', 'Students', '#2563eb'], ['183', 'Teachers', '#059669'], ['94.2%', 'Attendance', '#d97706'], ['$1.24M', 'Revenue', '#7c3aed']].map(([v, l, c]) => (
                    <div key={l} className="bg-white rounded-lg p-3 border-t-3" style={{ borderTopColor: c }}>
                      <div className="text-base font-extrabold text-slate-800 font-['JetBrains_Mono',monospace]">{v}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{l}</div>
                    </div>
                  ))}
                </div>
                {/* Mock table */}
                <div className="bg-white rounded-lg p-3 mb-2.5">
                  <div className="text-xs font-semibold text-slate-800 mb-2.5">Recent Students</div>
                  {[['Amara Osei', '10-A', '3.92', '98%', 'paid'], ['Liang Wei', '11-B', '3.75', '95%', 'paid'], ['Sofia Reyes', '9-C', '3.60', '89%', 'partial']].map(([n, g, gpa, att, f]) => (
                    <div key={n} className="flex gap-2 py-1.5 border-b border-slate-50 items-center">
                      <div className="w-5.5 h-5.5 rounded-full bg-blue-50 flex items-center justify-center text-[9px] font-bold text-blue-600">{n[0]}</div>
                      <div className="flex-1 text-[11px] font-medium text-gray-700">{n}</div>
                      <div className="text-[10px] text-slate-400 font-['JetBrains_Mono',monospace]">{g}</div>
                      <div className="text-[10px] font-['JetBrains_Mono',monospace] text-emerald-600">{gpa}</div>
                      <div className="text-[10px] font-['JetBrains_Mono',monospace] text-slate-500">{att}</div>
                      <div className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase font-['JetBrains_Mono',monospace] ${f === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{f}</div>
                    </div>
                  ))}
                </div>
                {/* Mini chart */}
                <div className="bg-white rounded-lg p-3 flex items-end gap-1.5 h-15">
                  {[60, 80, 70, 90, 85, 95].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `rgba(37,99,235,${0.3 + i * 0.1})` }} />
                  ))}
                </div>
              </div>
            </div>
            {/* Floating cards */}
            <div className="absolute -top-4 -right-6 bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
              <div className="text-[11px] text-slate-400 mb-0.5">Attendance Today</div>
              <div className="text-xl font-extrabold text-emerald-600 font-['JetBrains_Mono',monospace]">94.2%</div>
              <div className="text-[10px] text-slate-500">2,673 / 2,847 present</div>
            </div>
            <div className="absolute bottom-5 -left-6 bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-base">💰</div>
                <div>
                  <div className="text-[11px] text-slate-400">Fee Collected</div>
                  <div className="text-sm font-extrabold text-purple-600 font-['JetBrains_Mono',monospace]">$1.24M</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-slate-900 py-12 px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-extrabold text-white font-['JetBrains_Mono',monospace] mb-1.5">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full mb-4 uppercase tracking-widest font-['JetBrains_Mono',monospace]">Everything you need</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">One platform. Every school need.</h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto leading-relaxed">From student enrollment to graduation, EduRit covers every administrative and academic workflow your school depends on.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="p-7 rounded-xl border border-gray-200 bg-white transition-all duration-200 cursor-default hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:border-blue-200">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: `hsl(${220 + i * 20}, 80%, 95%)` }}>{f.icon}</div>
                <div className="text-base font-bold text-slate-800 mb-2">{f.title}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold text-purple-600 bg-purple-50 px-3.5 py-1 rounded-full mb-4 uppercase tracking-widest font-['JetBrains_Mono',monospace]">Simple setup</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">Up and running in under an hour</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.num} className="text-center p-8 bg-white rounded-xl border border-gray-200 relative">
                {i < 2 && <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 text-xl text-slate-300 font-light">→</div>}
                <div className="w-13 h-13 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
                  <span className="text-lg font-extrabold text-white font-['JetBrains_Mono',monospace]">{s.num}</span>
                </div>
                <div className="text-lg font-bold text-slate-800 mb-2.5">{s.title}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section id="roles" className="py-24 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold text-emerald-600 bg-emerald-50 px-3.5 py-1 rounded-full mb-4 uppercase tracking-widest font-['JetBrains_Mono',monospace]">Built for everyone</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">A tailored experience for every role</h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto leading-relaxed">Four distinct portals — each designed precisely for its users. No clutter, no confusion.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ROLES.map(r => (
              <div key={r.title} className="rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:-translate-y-1">
                <div className="px-6 pt-7 pb-5" style={{ background: r.bg }}>
                  <div className="text-3xl mb-2.5">{r.icon}</div>
                  <div className="text-lg font-extrabold text-slate-800">{r.title}</div>
                </div>
                <div className="px-6 py-5 pb-6 bg-white">
                  <ul className="list-none m-0 p-0">
                    {r.features.map(f => (
                      <li key={f} className="flex gap-2 items-start py-1.5 border-b border-slate-50 text-sm text-gray-700">
                        <span className="font-bold mt-0.5 shrink-0" style={{ color: r.color }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button className="mt-5 w-full py-2.5 rounded-lg border-[1.5px] bg-transparent text-sm font-bold cursor-pointer font-['Outfit',sans-serif] transition-all duration-150 hover:text-white" style={{ borderColor: r.color, color: r.color }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = r.color; el.style.color = '#fff' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'transparent'; el.style.color = r.color }}
                  >Try {r.title} Portal →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-8 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold text-slate-400 bg-slate-800 px-3.5 py-1 rounded-full mb-4 uppercase tracking-widest font-['JetBrains_Mono',monospace]">What they say</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">Loved by schools, teachers, and parents</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                <div className="text-3xl text-slate-700 font-extrabold leading-none mb-5">"</div>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold border-2" style={{ background: `${t.color}25`, borderColor: `${t.color}50`, color: t.color }}>{t.initials}</div>
                  <div>
                    <div className="text-sm font-bold text-slate-100">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full mb-4 uppercase tracking-widest font-['JetBrains_Mono',monospace]">Pricing</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">Simple, transparent pricing</h2>
            <p className="text-sm md:text-base text-slate-500">No hidden fees. Cancel anytime. Start with 30 days free on any plan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PRICING.map(p => (
              <div key={p.name} className={`rounded-xl p-8 bg-white relative ${p.highlight ? 'border-2 shadow-[0_12px_40px_rgba(37,99,235,0.15)]' : 'border border-gray-200'}`} style={{ borderColor: p.highlight ? p.color : undefined }}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap">Most Popular</div>
                )}
                <div className="text-sm font-bold uppercase tracking-wide font-['JetBrains_Mono',monospace]" style={{ color: p.color }}>{p.name}</div>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-4xl font-extrabold text-slate-800 font-['JetBrains_Mono',monospace]">{p.price}</span>
                  {p.price !== 'Custom' && <span className="text-sm text-slate-400">/{p.period}</span>}
                </div>
                <div className="text-sm text-slate-500 mb-6">{p.desc}</div>
                <button className={`w-full py-3 rounded-xl text-sm font-bold cursor-pointer mb-6 font-['Outfit',sans-serif] ${p.highlight ? 'border-none bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)]' : `border-[1.5px] bg-transparent`}`} style={{ borderColor: p.highlight ? undefined : p.color, color: p.highlight ? undefined : p.color }}>{p.cta}</button>
                <ul className="list-none m-0 p-0">
                  {p.features.map(f => (
                    <li key={f} className="flex gap-2.5 py-2 border-b border-slate-50 text-sm text-gray-700">
                      <span className="font-bold shrink-0" style={{ color: p.color }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-8 bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 tracking-tight leading-tight">Ready to transform your school?</h2>
          <p className="text-base md:text-lg text-blue-200 mb-10 leading-relaxed">Join 500+ schools already using EduRit to streamline operations and improve student outcomes. Start your free 30-day trial today.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button className="px-9 py-4 rounded-xl border-none bg-white text-blue-900 text-base font-extrabold cursor-pointer font-['Outfit',sans-serif] shadow-[0_4px_20px_rgba(0,0,0,0.2)]">Start Free Trial →</button>
            <button className="px-9 py-4 rounded-xl border-[1.5px] border-white/40 bg-transparent text-white text-base font-semibold cursor-pointer font-['Outfit',sans-serif]">Log In</button>
          </div>
          <div className="mt-7 text-sm text-blue-300">No setup fee · GDPR compliant · 24/7 support · Cancel anytime</div>
        </div>
      </section>

    </div>
  )
}

export default HeroSection