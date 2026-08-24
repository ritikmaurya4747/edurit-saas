"use client"
import { useState } from 'react'

type PayStep = 'checkout' | 'processing' | 'success'

const PLANS = [
    { id: 'standard', name: 'Standard Plan', price: 49, period: 'month', color: '#2563eb', popular: true },
    { id: 'enterprise', name: 'Enterprise Plan', price: 199, period: 'month', color: '#7c3aed', popular: false },
]

const ORDER = {
    plan: 'Standard Plan',
    billing: 'Monthly',
    price: 49,
    tax: 4.41,
    subtotal: 49,
    total: 53.41,
    seats: 'Unlimited teachers',
    students: 'Up to 1,000 students',
    trial: '30-day free trial included',
}

const Payment = () => {
    const [step, setStep] = useState<PayStep>('checkout')
    const [selectedPlan, setSelectedPlan] = useState('standard')
    const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
    const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' })
    const [method, setMethod] = useState<'card' | 'bank'>('card')
    const [coupon, setCoupon] = useState('')
    const [couponApplied, setCouponApplied] = useState(false)

    const plan = PLANS.find(p => p.id === selectedPlan)!
    const annualPrice = Math.round(plan.price * 12 * 0.8)
    const effectivePrice = billing === 'annual' ? Math.round(annualPrice / 12) : plan.price
    const discount = couponApplied ? Math.round(effectivePrice * 0.15) : 0
    const tax = Math.round((effectivePrice - discount) * 0.09 * 100) / 100
    const total = (effectivePrice - discount + tax).toFixed(2)

    const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
    const formatExpiry = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d }

    const handlePay = () => {
        setStep('processing')
        setTimeout(() => setStep('success'), 2000)
    }

    if (step === 'processing') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-['Outfit',sans-serif]">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-6" />
                    <div className="text-xl font-bold text-slate-800">Processing your payment…</div>
                    <div className="text-sm text-slate-500 mt-2">Please don't close this window.</div>
                </div>
            </div>
        )
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-['Outfit',sans-serif] p-8">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 border-3 border-emerald-300 flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
                    <h1 className="text-3xl font-extrabold text-slate-800 mb-3">Payment Successful!</h1>
                    <p className="text-sm md:text-base text-slate-500 mb-2 leading-relaxed">
                        Welcome to EduRit {plan.name}. Your 30-day free trial has started.
                    </p>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 my-7 text-left">
                        <div className="text-sm font-bold text-slate-800 mb-3.5 font-['JetBrains_Mono',monospace] uppercase tracking-wide">Order Summary</div>
                        {[
                            ['Plan', `${plan.name} · ${billing === 'annual' ? 'Annual' : 'Monthly'}`],
                            ['Amount', `$${total}`],
                            ['Next billing', billing === 'annual' ? 'Aug 17, 2027' : 'Sep 17, 2026'],
                            ['Receipt sent to', 'admin@westbrook.edu'],
                            ['Order ID', `ORD-${Date.now().toString().slice(-8)}`],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between py-2 border-b border-slate-100 text-sm">
                                <span className="text-slate-500">{k}</span>
                                <span className={`font-semibold text-slate-800 ${k === 'Amount' || k === 'Order ID' ? "font-['JetBrains_Mono',monospace]" : ''}`}>{v}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 justify-center">
                        <button className="px-7 py-3 rounded-xl border-none bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold cursor-pointer font-['Outfit',sans-serif] shadow-[0_4px_14px_rgba(37,99,235,0.3)]">Go to Dashboard →</button>
                        <button className="px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold cursor-pointer font-['Outfit',sans-serif]">Download Receipt</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 font-['Outfit',sans-serif]">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                <button className="flex items-center gap-2.5 bg-none border-none cursor-pointer">
                    <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm font-extrabold">S</span>
                    </div>
                    <span className="text-sm font-extrabold text-slate-800">EduRit Checkout</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">🔒</span>
                    <span className="text-xs text-slate-500 font-['JetBrains_Mono',monospace]">Secured by Stripe · 256-bit SSL</span>
                </div>
                <button className="text-sm text-slate-500 bg-none border-none cursor-pointer">← Back</button>
            </div>

            <div className="max-w-6xl mx-auto my-10 px-6 grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-8 items-start">
                {/* Left — form */}
                <div>
                    {/* Plan selector */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
                        <div className="text-sm font-bold text-slate-800 mb-4">Select your plan</div>
                        <div className="flex gap-3 mb-4">
                            {PLANS.map(p => (
                                <label key={p.id} className={`flex-1 flex gap-3 p-4 rounded-xl border-[1.5px] ${selectedPlan === p.id ? `border-[${p.color}] bg-[#fafbff]` : 'border-gray-200 bg-white'} cursor-pointer relative`}>
                                    <input type="radio" name="plan" checked={selectedPlan === p.id} onChange={() => setSelectedPlan(p.id)} className="accent-purple-600 mt-0.5" style={{ accentColor: p.color }} />
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">{p.name}</div>
                                        <div className={`text-xl font-extrabold font-['JetBrains_Mono',monospace] mt-0.5`} style={{ color: p.color }}>
                                            ${billing === 'annual' ? Math.round(p.price * 12 * 0.8 / 12) : p.price}<span className="text-xs text-slate-400 font-normal">/mo</span>
                                        </div>
                                        {p.popular && <div className="text-xs font-bold uppercase font-['JetBrains_Mono',monospace]" style={{ color: p.color }}>Most popular</div>}
                                    </div>
                                </label>
                            ))}
                        </div>

                        {/* Billing toggle */}
                        <div className="flex gap-0 bg-slate-100 rounded-lg p-0.5">
                            {(['monthly', 'annual'] as const).map(b => (
                                <button key={b} onClick={() => setBilling(b)} className={`flex-1 py-2 rounded-md border-none text-sm font-['Outfit',sans-serif] transition-all duration-150 ${billing === b ? 'bg-white text-slate-800 font-bold shadow-[0_1px_4px_rgba(0,0,0,0.1)]' : 'bg-transparent text-slate-500 font-normal'}`}>
                                    {b.charAt(0).toUpperCase() + b.slice(1)}
                                    {b === 'annual' && <span className="ml-1.5 text-xs text-emerald-600 font-bold">Save 20%</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Payment method */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
                        <div className="text-sm font-bold text-slate-800 mb-4">Payment method</div>

                        <div className="flex gap-2.5 mb-5">
                            {[['card', '💳 Credit / Debit Card'], ['bank', '🏦 Bank Transfer']].map(([m, label]) => (
                                <button key={m} onClick={() => setMethod(m as typeof method)} className={`flex-1 py-2.5 rounded-lg border-[1.5px] text-sm font-['Outfit',sans-serif] ${method === m ? 'border-blue-600 bg-blue-50 text-blue-600 font-bold' : 'border-gray-200 bg-white text-slate-500 font-normal'}`}>{label}</button>
                            ))}
                        </div>

                        {method === 'card' && (
                            <div className="flex flex-col gap-3.5">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Cardholder Name</label>
                                    <input placeholder="Dr. Patricia Harris" value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none box-border focus:border-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Card Number</label>
                                    <div className="relative">
                                        <input placeholder="4242 4242 4242 4242" value={card.number}
                                            onChange={e => setCard(c => ({ ...c, number: formatCard(e.target.value) }))}
                                            className="w-full px-3.5 py-2.5 pr-11 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none box-border font-['JetBrains_Mono',monospace] focus:border-blue-600"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl">💳</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold text-gray-700 block mb-1">Expiry Date</label>
                                        <input placeholder="MM/YY" value={card.expiry}
                                            onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                                            className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none box-border font-['JetBrains_Mono',monospace] focus:border-blue-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-700 block mb-1">CVV</label>
                                        <input placeholder="···" type="password" maxLength={4} value={card.cvv}
                                            onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                            className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none box-border font-['JetBrains_Mono',monospace] focus:border-blue-600"
                                        />
                                    </div>
                                </div>
                                {/* Card brand logos */}
                                <div className="flex gap-2 pt-1">
                                    {['VISA', 'MC', 'AMEX', 'DISC'].map(b => (
                                        <div key={b} className="px-2.5 py-1 rounded border border-gray-200 text-xs font-bold text-slate-400 font-['JetBrains_Mono',monospace]">{b}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {method === 'bank' && (
                            <div className="bg-slate-50 rounded-xl p-5 border border-gray-200">
                                <div className="text-sm font-semibold text-slate-800 mb-3">Bank Transfer Details</div>
                                {[['Bank', 'Silicon Valley Bank'], ['Account Name', 'EduRit Technologies Inc.'], ['Account Number', '****-****-4400'], ['Routing Number', '****-0047'], ['Reference', `INV-${Date.now().toString().slice(-6)}`]].map(([k, v]) => (
                                    <div key={k} className="flex justify-between py-2 border-b border-slate-100 text-xs">
                                        <span className="text-slate-500">{k}</span>
                                        <span className="font-semibold text-slate-800 font-['JetBrains_Mono',monospace]">{v}</span>
                                    </div>
                                ))}
                                <div className="mt-3.5 text-xs text-amber-600 bg-amber-50 px-3 py-2.5 rounded-lg border border-amber-200">
                                    ⚠️ Send payment within 3 business days to activate your plan. Include your reference number.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Billing address */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="text-sm font-bold text-slate-800 mb-4">Billing information</div>
                        <div className="grid grid-cols-2 gap-3">
                            {[['Organization Name', 'col-span-2', 'Westbrook Academy'], ['Tax ID / VAT Number', 'col-span-2', 'Optional', false], ['Address', 'col-span-1', '400 Westbrook Drive'], ['City', 'col-span-1', 'San Francisco']].map(([label, col, placeholder, req = true]) => (
                                <div key={label as string} className={col as string}>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">{label as string}</label>
                                    <input placeholder={placeholder as string}
                                        className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none box-border focus:border-blue-600"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right — order summary */}
                <div className="sticky top-6">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {/* Plan header */}
                        <div className="bg-gradient-to-br from-blue-900 to-purple-900 p-6 text-white">
                            <div className="text-xs text-blue-300 mb-1 uppercase tracking-widest font-['JetBrains_Mono',monospace]">Order summary</div>
                            <div className="text-xl font-extrabold">{plan.name}</div>
                            <div className="text-sm text-blue-200 mt-0.5">{billing === 'annual' ? 'Annual billing (20% off)' : 'Monthly billing'}</div>
                            <div className="mt-3 flex gap-2 flex-wrap">
                                {[ORDER.seats, ORDER.students, ORDER.trial].map(t => (
                                    <div key={t} className="text-xs px-2 py-0.5 bg-white/15 rounded-full text-blue-200">✓ {t}</div>
                                ))}
                            </div>
                        </div>

                        <div className="p-5">
                            {/* Coupon */}
                            <div className="mb-5">
                                <div className="text-xs font-semibold text-gray-700 mb-1.5">Promo code</div>
                                <div className="flex gap-2">
                                    <input placeholder="SCHOOL30" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                                        className="flex-1 px-3 py-2 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none font-['JetBrains_Mono',monospace] focus:border-blue-600"
                                    />
                                    <button onClick={() => coupon && setCouponApplied(true)} className="px-3.5 py-2 rounded-lg border-none bg-blue-600 text-white text-xs font-bold cursor-pointer whitespace-nowrap">Apply</button>
                                </div>
                                {couponApplied && <div className="text-xs text-emerald-600 mt-1.5">✓ SCHOOL30 applied — 15% off!</div>}
                            </div>

                            {/* Line items */}
                            <div className="border-t border-slate-100 pt-4">
                                {[
                                    ['Subtotal', `$${effectivePrice}.00`],
                                    couponApplied ? ['Discount (15%)', `-$${discount}.00`, '#059669'] : null,
                                    ['Tax (9%)', `$${tax}`],
                                ].filter(Boolean).map(row => (
                                    <div key={row![0]} className="flex justify-between py-1.5 text-sm">
                                        <span className="text-slate-500">{row![0]}</span>
                                        <span className={`font-['JetBrains_Mono',monospace] font-medium ${row![2] ? `text-[${row![2]}]` : 'text-slate-800'}`}>{row![1]}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-3.5 border-t border-gray-200 mt-2 text-base font-extrabold">
                                    <span className="text-slate-800">Total due today</span>
                                    <span className="text-slate-800 font-['JetBrains_Mono',monospace]">${total}</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1 text-right">First charge on Sep 17, 2026</div>
                            </div>

                            <button onClick={handlePay} className="w-full mt-5 py-3.5 rounded-xl border-none bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-extrabold cursor-pointer font-['Outfit',sans-serif] shadow-[0_4px_16px_rgba(37,99,235,0.35)]">
                                Pay ${total} →
                            </button>

                            <div className="mt-4 flex flex-col gap-1.5">
                                {[['🔒', 'SSL encrypted & PCI-DSS compliant'], ['🔁', 'Cancel or downgrade anytime'], ['⭐', '30-day free trial — no charge today']].map(([icon, text]) => (
                                    <div key={text} className="flex gap-2 items-center">
                                        <span className="text-sm">{icon}</span>
                                        <span className="text-xs text-slate-500">{text}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 p-3 bg-slate-50 rounded-lg text-center">
                                <div className="text-xs text-slate-400 mb-1">Powered by</div>
                                <div className="flex justify-center gap-3 items-center">
                                    {['STRIPE', 'VISA', 'MC', 'AMEX'].map(b => (
                                        <div key={b} className="text-xs font-extrabold text-slate-300 font-['JetBrains_Mono',monospace]">{b}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-4 text-xs text-slate-400">
                        Questions? <a href="#" className="text-blue-600 no-underline font-semibold">Contact support →</a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Payment