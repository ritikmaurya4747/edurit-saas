"use client"
import { useState, useTransition } from 'react'
import { useParams } from 'next/navigation' // <-- 1. Ye naya import add karein
import type { ReactNode, FormEvent, ChangeEvent } from 'react'
import { tenantLoginAction } from './actions/tenant-auth'

interface FieldProps {
    label: string
    type: string
    value: string
    onChange: (v: string) => void
    placeholder: string
    right?: ReactNode
    disabled?: boolean
}

const Field = ({ label, type, value, onChange, placeholder, right, disabled }: FieldProps) => (
    <div className="mb-4.5">
        <label className="text-sm font-semibold text-gray-700 block mb-1.5">{label}</label>
        <div className="relative">
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                className={`w-full px-4 py-2.5 border-[1.5px] border-gray-200 rounded-xl text-sm text-slate-800 outline-none font-['Outfit',sans-serif] transition-colors duration-150 box-border focus:border-blue-600 disabled:opacity-60 disabled:bg-gray-50 ${right ? 'pr-11' : 'pr-4'}`}
            />
            {right &&
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {right}
                </div>}
        </div>
    </div>
)

// 2. Yahan se props hata diye hain
const Login = () => {
    // 3. useParams hook ka use karke direct URL se tenant nikal liya
    const params = useParams()
    const tenantSlug = (params?.tenant as string) || ''

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [remember, setRemember] = useState(false)
    const [error, setError] = useState('')

    const [isPending, startTransition] = useTransition()

    // URL slug ko proper readable Name me convert karna (e.g., 'lavkush-school' -> 'Lavkush School')
    const schoolName = tenantSlug
        ? tenantSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : 'School';

    const schoolInitial = schoolName.charAt(0).toUpperCase();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!email || !password) {
            setError('Please fill in all fields.')
            return
        }

        setError('')

        startTransition(async () => {
            const result = await tenantLoginAction({
                email,
                password,
                tenantSlug
            })

            if (!result?.success && result?.message) {
                setError(result.message)
            }
        })
    }

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-['Outfit',sans-serif]">
            {/* Left — brand panel (Dynamic Content) */}
            <div className="bg-linear-to-br from-blue-900 via-purple-900 to-blue-900 flex flex-col justify-between p-10 md:p-13 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-75 h-75 rounded-full bg-white/5" />
                <div className="absolute bottom-15 -left-15 w-50 h-50 rounded-full bg-white/5" />

                <div>
                    <button className="flex items-center gap-2.5 bg-none border-none cursor-pointer p-0">
                        <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                            <span className="text-white text-lg font-extrabold">{schoolInitial}</span>
                        </div>
                        <span className="text-white text-lg font-extrabold">
                            {schoolName} ERP
                        </span>
                    </button>
                </div>

                <div>
                    <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-5">
                        Welcome to {schoolName} Command Center
                    </h2>
                    <p className="text-sm md:text-base text-blue-200 leading-relaxed mb-10">
                        Everything {schoolName} needs — students, teachers, parents, and administrators — working in perfect sync.
                    </p>

                    <div className="flex flex-col gap-4">
                        {[
                            { icon: '🛡️', text: 'Secure role-based access for staff & parents' },
                            { icon: '📊', text: 'Real-time academic and fee dashboards' },
                            { icon: '🔒', text: 'End-to-end encrypted school data' },
                        ].map(f => (
                            <div key={f.text} className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-base shrink-0">{f.icon}</div>
                                <span className="text-sm text-blue-200">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/10 border border-white/15 rounded-xl p-5">
                    <p className="text-sm text-blue-200 italic mb-3 leading-relaxed">
                        &quot;EduRit empowers our institution with seamless operations. Attendance, fees, and report cards just work.&quot;
                    </p>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">ER</div>
                        <div>
                            <div className="text-xs font-bold text-slate-200">EduRit Systems</div>
                            <div className="text-xs text-slate-500">School Management Platform</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right — login form */}
            <div className="flex items-center justify-center bg-slate-50 p-10">
                <div className="w-full max-w-md">
                    <div className="mb-9">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">Sign in to your account</h1>
                        <p className="text-sm text-slate-500 m-0">Enter your credentials to access {schoolName} dashboard.</p>
                    </div>

                    {error && (
                        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-5">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Field
                            label="Email address"
                            type="email"
                            value={email}
                            onChange={setEmail}
                            placeholder={"mohit@gmil.com"}
                            disabled={isPending}
                        />

                        <Field
                            label="Password"
                            type={showPass ? 'text' : 'password'}
                            value={password}
                            onChange={setPassword}
                            placeholder="Enter your password"
                            disabled={isPending}
                            right={
                                <button type="button" onClick={() => setShowPass(v => !v)} className="bg-none border-none cursor-pointer text-base text-slate-400 p-0 disabled:opacity-50" disabled={isPending}>
                                    {showPass ? '🙈' : '👁️'}
                                </button>
                            }
                        />

                        <div className="flex items-center justify-between mb-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} disabled={isPending} className="accent-blue-600 w-3.5 h-3.5 disabled:opacity-60" />
                                <span className="text-sm text-slate-500">Remember me</span>
                            </label>
                            <button type="button" disabled={isPending} className="bg-none border-none text-sm text-blue-600 cursor-pointer font-['Outfit',sans-serif] font-semibold disabled:opacity-60">
                                Forgot password?
                            </button>
                        </div>

                        <button type="submit" disabled={isPending} className={`w-full flex items-center justify-center py-3.5 rounded-xl border-none text-sm font-bold font-['Outfit',sans-serif] transition-all duration-200 ${isPending ? 'bg-slate-400 cursor-not-allowed' : 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] cursor-pointer'}`}>
                            {isPending ? (
                                <svg className="h-5 w-5 animate-spin text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            {isPending ? 'Signing in…' : 'Sign In →'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login