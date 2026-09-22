"use client"
import { useState } from 'react'
import type { ReactNode, FormEvent, ChangeEvent, CSSProperties } from 'react'

interface FieldProps {
    label: string
    type: string
    value: string
    onChange: (v: string) => void
    placeholder: string
    right?: ReactNode
}

const Field = ({ label, type, value, onChange, placeholder, right }: FieldProps) => (
    <div className="mb-4.5">
        <label className="text-sm font-semibold text-gray-700 block mb-1.5">{label}</label>
        <div className="relative">
            <input
                type={type} value={value} placeholder={placeholder}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                className={`w-full px-4 py-2.5 border-[1.5px] border-gray-200 rounded-xl text-sm text-slate-800 outline-none font-['Outfit',sans-serif] transition-colors duration-150 box-border focus:border-blue-600 ${right ? 'pr-11' : 'pr-4'}`}
            />
            {right && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{right}</div>}
        </div>
    </div>
)

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [remember, setRemember] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!email || !password) { setError('Please fill in all fields.'); return }
        setError('')
        setLoading(true)
        setTimeout(() => { setLoading(false) }, 1200)
    }

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-['Outfit',sans-serif]">
            {/* Left — brand panel */}
            <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 flex flex-col justify-between p-10 md:p-13 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-20 -right-20 w-75 h-75 rounded-full bg-white/5" />
                <div className="absolute bottom-15 -left-15 w-50 h-50 rounded-full bg-white/5" />

                {/* Logo */}
                <div>
                    <button className="flex items-center gap-2.5 bg-none border-none cursor-pointer p-0">
                        <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                            <span className="text-white text-lg font-extrabold">S</span>
                        </div>
                        <span className="text-white text-lg font-extrabold">EduRit ERP</span>
                    </button>
                </div>

                {/* Center content */}
                <div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-5">
                        Welcome back to your school&apos;s command center
                    </h2>
                    <p className="text-sm md:text-base text-blue-200 leading-relaxed mb-10">
                        Everything your school needs — students, teachers, parents, and administrators — working in perfect sync.
                    </p>

                    {/* Feature highlights */}
                    <div className="flex flex-col gap-4">
                        {[
                            { icon: '🛡️', text: 'Role-based access for every user type' },
                            { icon: '📊', text: 'Real-time dashboards and live reports' },
                            { icon: '🔒', text: 'SOC 2 Type II security certified' },
                        ].map(f => (
                            <div key={f.text} className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-base shrink-0">{f.icon}</div>
                                <span className="text-sm text-blue-200">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Testimonial */}
                <div className="bg-white/10 border border-white/15 rounded-xl p-5">
                    <p className="text-sm text-blue-200 italic mb-3 leading-relaxed">
                        &quot;EduRit cut our admin workload by 40%. Everything from attendance to fee collection just works.&quot;
                    </p>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">PH</div>
                        <div>
                            <div className="text-xs font-bold text-slate-200">Dr. Patricia Harris</div>
                            <div className="text-xs text-slate-500">Principal, Westbrook Academy</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right — login form */}
            <div className="flex items-center justify-center bg-slate-50 p-10">
                <div className="w-full max-w-md">
                    <div className="mb-9">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">Sign in to your account</h1>
                        <p className="text-sm text-slate-500 m-0">Enter your credentials to access your dashboard.</p>
                    </div>

                    {/* Social login */}
                    <div className="grid grid-cols-2 gap-2.5 mb-6">
                        {[['G', 'Continue with Google', '#ea4335'], ['M', 'Microsoft', '#0078d4']].map(([icon, label, color]) => (
                            <button key={label as string} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-[1.5px] border-gray-200 bg-white text-sm font-semibold cursor-pointer text-gray-700 font-['Outfit',sans-serif] transition-all duration-150 hover:border-[#ea4335] hover:bg-gray-50" style={{ '--hover-color': color } as CSSProperties}>
                                <span className="text-sm font-extrabold" style={{ color: color as string }}>{icon}</span>
                                <span className="text-xs">{label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-slate-400 whitespace-nowrap">or sign in with email</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {error && (
                        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-5">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@school.edu" />
                        <Field label="Password" type={showPass ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="Enter your password"
                            right={
                                <button type="button" onClick={() => setShowPass(v => !v)} className="bg-none border-none cursor-pointer text-base text-slate-400 p-0">
                                    {showPass ? '🙈' : '👁️'}
                                </button>
                            }
                        />

                        <div className="flex items-center justify-between mb-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-blue-600 w-3.5 h-3.5" />
                                <span className="text-sm text-slate-500">Remember me</span>
                            </label>
                            <button type="button" className="bg-none border-none text-sm text-blue-600 cursor-pointer font-['Outfit',sans-serif] font-semibold">
                                Forgot password?
                            </button>
                        </div>

                        <button type="submit" disabled={loading} className={`w-full py-3.5 rounded-xl border-none text-sm font-bold font-['Outfit',sans-serif] transition-all duration-200 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] cursor-pointer'}`}>
                            {loading ? 'Signing in…' : 'Sign In →'}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <span className="text-sm text-slate-500">Don&apos;t have an account? </span>
                        <button className="bg-none border-none text-sm text-blue-600 cursor-pointer font-['Outfit',sans-serif] font-bold">Sign up free</button>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="text-xs font-bold text-blue-800 mb-1.5">Demo Access</div>
                        <div className="text-xs text-blue-500 mb-1.5">Use any email and password to sign in, then select your role on the next screen.</div>
                        <button className="text-xs text-blue-600 font-bold bg-none border-none cursor-pointer p-0 font-['Outfit',sans-serif]">→ Go directly to role selection</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login