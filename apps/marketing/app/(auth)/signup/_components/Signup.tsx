"use client"
import { useState } from 'react'

type Step = 1 | 2 | 3

const ROLES = [
    { id: 'superadmin', label: 'School Administrator', desc: 'I manage the school — admin, principal, or director.', icon: '🛡️', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    { id: 'teacher', label: 'Teacher', desc: 'I teach classes and manage student grades and attendance.', icon: '📚', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    { id: 'student', label: 'Student', desc: 'I am enrolled at a school and want to access my portal.', icon: '🎓', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
    { id: 'parent', label: 'Parent / Guardian', desc: "I want to monitor my child's academic progress.", icon: '👨‍👩‍👧', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
]

const PLAN_MAP: Record<string, string> = {
    superadmin: 'Standard Plan ($49/month)',
    teacher: 'Free (Invited by school)',
    student: 'Free (Enrolled by school)',
    parent: 'Free (Linked by school)',
}

const Signup = () => {
    const [step, setStep] = useState<Step>(1)
    const [role, setRole] = useState('')
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', schoolName: '', schoolCode: '', phone: '' })
    const [loading, setLoading] = useState(false)
    const [agree, setAgree] = useState(false)

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const handleFinish = (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setTimeout(() => { setLoading(false) }, 1400)
    }

    const InputField = ({ label, id, type = 'text', placeholder, required = true }: { label: string; id: keyof typeof form; type?: string; placeholder: string; required?: boolean }) => (
        <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
                {label}{required && <span className="text-red-600 ml-1">*</span>}
            </label>
            <input
                type={type} value={form[id]} placeholder={placeholder}
                onChange={e => set(id, e.target.value)}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm text-slate-800 outline-none font-['Outfit',sans-serif] box-border transition-colors duration-100 focus:border-purple-600"
            />
        </div>
    )

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-['Outfit',sans-serif]">
            {/* Left panel */}
            <div className="bg-gradient-to-br from-purple-900 to-blue-900 flex flex-col p-10 md:p-13 relative overflow-hidden justify-between">
                <div className="absolute -top-25 -right-25 w-88 h-88 rounded-full bg-white/5" />
                <div className="absolute bottom-20 -left-20 w-62 h-62 rounded-full bg-white/5" />

                <button className="flex items-center gap-2.5 bg-none border-none cursor-pointer p-0">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                        <span className="text-white text-lg font-extrabold">S</span>
                    </div>
                    <span className="text-white text-lg font-extrabold">EduRit ERP</span>
                </button>

                <div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">Start managing your school smarter.</h2>
                    <p className="text-sm md:text-base text-blue-200 leading-relaxed mb-10">Join 500+ schools. Free for 30 days — no credit card required.</p>

                    {/* Step progress */}
                    <div className="flex flex-col gap-3">
                        {[['01', 'Choose your role'], ['02', 'Your details'], ['03', 'All done!']].map(([n, label], i) => {
                            const s = (i + 1) as Step
                            const done = step > s
                            const active = step === s
                            return (
                                <div key={n} className="flex gap-3.5 items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-600' : active ? 'bg-white' : 'bg-white/10'}`}>
                                        {done ? <span className="text-white text-sm">✓</span>
                                            : <span className={`text-xs font-extrabold font-['JetBrains_Mono',monospace] ${active ? 'text-purple-600' : 'text-slate-500'}`}>{n}</span>}
                                    </div>
                                    <span className={`text-sm ${active ? 'font-bold text-white' : done ? 'text-emerald-300' : 'text-slate-400'}`}>{label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="text-xs text-indigo-300/70">© 2026 EduRit Technologies. All rights reserved.</div>
            </div>

            {/* Right — form */}
            <div className="flex items-center justify-center bg-slate-50 p-10">
                <div className="w-full max-w-md">
                    {/* STEP 1 — Role selection */}
                    {step === 1 && (
                        <>
                            <div className="mb-8">
                                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-1.5">Create your account</h1>
                                <p className="text-sm text-slate-500 m-0">Step 1 of 2 — How will you use EduRit?</p>
                            </div>

                            <div className="flex flex-col gap-3 mb-7">
                                {ROLES.map(r => (
                                    <label key={r.id} className={`flex items-start gap-3.5 p-4 rounded-xl border-[1.5px] ${role === r.id ? `border-[${r.color}] bg-[${r.bg}]` : 'border-gray-200 bg-white'} cursor-pointer transition-all duration-150`}>
                                        <input type="radio" name="role" value={r.id} checked={role === r.id} onChange={() => setRole(r.id)} className="accent-purple-600 mt-0.5 w-4 h-4" style={{ accentColor: r.color }} />
                                        <div className="text-2xl shrink-0">{r.icon}</div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">{r.label}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
                                            {role === r.id && (
                                                <div className={`text-xs font-['JetBrains_Mono',monospace] mt-1.5 bg-black/5 px-2 py-0.5 rounded inline-block`} style={{ color: r.color }}>
                                                    {PLAN_MAP[r.id]}
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <button onClick={() => role && setStep(2)} disabled={!role} className={`w-full py-3.5 rounded-xl border-none text-sm font-bold font-['Outfit',sans-serif] ${role ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_4px_14px_rgba(124,58,237,0.3)] cursor-pointer' : 'bg-gray-200 text-slate-400 cursor-not-allowed'}`}>
                                Continue →
                            </button>

                            <div className="text-center mt-5">
                                <span className="text-sm text-slate-500">Already have an account? </span>
                                <button className="bg-none border-none text-sm text-blue-600 cursor-pointer font-['Outfit',sans-serif] font-bold">Sign in</button>
                            </div>
                        </>
                    )}

                    {/* STEP 2 — Personal details */}
                    {step === 2 && (
                        <>
                            <div className="mb-7">
                                <button onClick={() => setStep(1)} className="bg-none border-none cursor-pointer text-sm text-slate-500 mb-4 p-0 font-['Outfit',sans-serif]">← Back</button>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-1.5">Your details</h1>
                                <p className="text-sm text-slate-500 m-0">Step 2 of 2 — Tell us about yourself.</p>
                            </div>

                            <form onSubmit={handleFinish} className="flex flex-col gap-3.5">
                                <div className="grid grid-cols-2 gap-3">
                                    <InputField label="First Name" id="firstName" placeholder="Patricia" />
                                    <InputField label="Last Name" id="lastName" placeholder="Harris" />
                                </div>
                                <InputField label="Email Address" id="email" type="email" placeholder="patricia@school.edu" />
                                <InputField label="Phone Number" id="phone" placeholder="+1 (555) 201-4400" required={false} />

                                {role === 'superadmin' && (
                                    <InputField label="School Name" id="schoolName" placeholder="Westbrook Academy" />
                                )}

                                {(role === 'teacher' || role === 'student' || role === 'parent') && (
                                    <InputField label="School Access Code" id="schoolCode" placeholder="e.g. WBA-2026" />
                                )}

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-1">Password <span className="text-red-600">*</span></label>
                                    <input type="password" placeholder="At least 8 characters" onChange={e => set('password', e.target.value)}
                                        className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm text-slate-800 outline-none font-['Outfit',sans-serif] box-border focus:border-purple-600"
                                    />
                                    {form.password.length > 0 && (
                                        <div className="flex gap-1 mt-1.5">
                                            {[1, 2, 3, 4].map(i => {
                                                const strength = form.password.length >= i * 3 ? 1 : 0
                                                return <div key={i} className={`flex-1 h-0.5 rounded-sm ${strength ? (form.password.length >= 12 ? 'bg-emerald-600' : form.password.length >= 8 ? 'bg-amber-600' : 'bg-red-500') : 'bg-gray-200'}`} />
                                            })}
                                        </div>
                                    )}
                                </div>

                                <label className="flex gap-2.5 items-start cursor-pointer">
                                    <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="accent-purple-600 mt-0.5 w-3.5 h-3.5 shrink-0" />
                                    <span className="text-xs text-slate-500 leading-relaxed">
                                        I agree to EduRit's <a href="#" className="text-purple-600 no-underline">Terms of Service</a> and <a href="#" className="text-purple-600 no-underline">Privacy Policy</a>. I understand my data will be processed in accordance with GDPR guidelines.
                                    </span>
                                </label>

                                <button type="submit" disabled={!agree || loading} className={`w-full py-3.5 rounded-xl border-none text-sm font-bold font-['Outfit',sans-serif] mt-1 ${(!agree || loading) ? 'bg-gray-200 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_4px_14px_rgba(124,58,237,0.3)] cursor-pointer'}`}>
                                    {loading ? 'Creating account…' : 'Create Account →'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
export default Signup;