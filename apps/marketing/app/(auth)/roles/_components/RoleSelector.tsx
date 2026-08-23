"use client"
import React from 'react'

const ROLES = [
    {
        id: 'superadmin',
        title: 'Super Admin',
        desc: 'Full system access — manage students, teachers, finances, classes, and system settings.',
        color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '🛡️',
        badge: 'Full Access',
        user: { name: 'Dr. Patricia Harris', sub: 'System Administrator' },
    },
    {
        id: 'teacher',
        title: 'Teacher',
        desc: 'Manage your classes, mark attendance, enter grades, create assignments, and message students.',
        color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '📚',
        badge: 'Class Access',
        user: { name: 'Mr. James Okonkwo', sub: 'Science & Biology · Gr. 9–11' },
    },
    {
        id: 'student',
        title: 'Student',
        desc: 'View your grades, attendance record, assignments, timetable, and fee payment status.',
        color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', icon: '🎓',
        badge: 'Student Portal',
        user: { name: 'Amara Osei', sub: 'Grade 10-A · ID: STU-0421' },
    },
    {
        id: 'parent',
        title: 'Parent',
        desc: "Monitor your child's academic progress, attendance, pay fees, and communicate with teachers.",
        color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '👨‍👩‍👧',
        badge: 'Parent Portal',
        user: { name: 'Mr. Kwame Osei', sub: 'Parent · Amara Osei (10-A)' },
    },
]

const RoleSelector = () => {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8">
            <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3.5 mb-4">
                    <div className="w-13 h-13 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-[0_4px_16px_rgba(124,58,237,0.25)]">
                        <span className="text-white text-2xl font-extrabold">S</span>
                    </div>
                    <div className="text-left">
                        <div className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">Skolearn ERP</div>
                        <div className="text-xs text-slate-500 font-['JetBrains_Mono',monospace]">Westbrook Academy · 2025–2026</div>
                    </div>
                </div>
                <div className="text-sm md:text-base text-slate-500">Select your role to access your personalized dashboard.</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
                {ROLES.map(r => (
                    <button key={r.id}
                        className="bg-white border-[1.5px] border-gray-200 rounded-2xl p-6 cursor-pointer text-left transition-all duration-200 ease-out shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] hover:-translate-y-1"
                        style={{ '--hover-color': r.color } as React.CSSProperties}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = r.color }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0' }}
                    >
                        <div className="flex items-start justify-between mb-3.5">
                            <div className="w-12.5 h-12.5 rounded-xl flex items-center justify-center text-2xl" style={{ background: r.bg, border: `1.5px solid ${r.border}` }}>{r.icon}</div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-widest font-['JetBrains_Mono',monospace]" style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}` }}>{r.badge}</span>
                        </div>
                        <div className="text-lg font-bold text-slate-800 mb-2">{r.title}</div>
                        <div className="text-sm text-slate-500 leading-relaxed mb-5 min-h-13">{r.desc}</div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: r.bg, border: `1.5px solid ${r.border}`, color: r.color }}>
                                    {r.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-800 leading-tight">{r.user.name}</div>
                                    <div className="text-[10px] text-slate-400">{r.user.sub}</div>
                                </div>
                            </div>
                            <span className="text-sm font-semibold" style={{ color: r.color }}>Enter →</span>
                        </div>
                    </button>
                ))}
            </div>
            <button className="mt-8 text-sm text-slate-400 bg-none border-none cursor-pointer">← Back to homepage</button>
        </div>
    )
}
export default RoleSelector;