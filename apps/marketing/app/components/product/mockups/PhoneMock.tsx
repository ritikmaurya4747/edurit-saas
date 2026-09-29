import { CalendarCheck, Wallet, BookOpen, Bell } from "lucide-react";

/** Parent's view on a phone: one child's day at a glance. */
export function PhoneMock() {
  return (
    <div className="mx-auto w-[270px] rounded-[44px] border-[10px] border-night-deep bg-night-deep shadow-[0_40px_70px_-30px_rgba(15,23,43,0.7)]">
      <div className="overflow-hidden rounded-[34px] bg-paper">
        <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[0.62rem] font-semibold text-ink">
          <span>8:15</span>
          <span className="h-4 w-16 rounded-full bg-night-deep" aria-hidden />
          <span>100%</span>
        </div>
        <div className="bg-brand px-5 pb-6 pt-4 text-white">
          <p className="text-[0.68rem] opacity-80">Good morning</p>
          <p className="font-display text-lg font-bold">Sara&apos;s day</p>
          <p className="text-[0.68rem] opacity-80">Class 7-B · Roll 14</p>
        </div>
        <div className="-mt-3 space-y-2.5 px-3.5 pb-5 text-[0.72rem] text-ink">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-meadow-soft text-meadow"><CalendarCheck size={16} aria-hidden /></span>
            <span className="flex-1"><span className="block font-semibold">Present today</span><span className="text-ink-faint">Marked 8:04 am</span></span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-soft text-[#0F766E]"><BookOpen size={16} aria-hidden /></span>
            <span className="flex-1"><span className="block font-semibold">Maths unit test: 88</span><span className="text-ink-faint">Published yesterday</span></span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sun-soft text-[#B45309]"><Wallet size={16} aria-hidden /></span>
            <span className="flex-1"><span className="block font-semibold">Term 3 fee due</span><span className="text-ink-faint">₹8,400 · 15 Feb</span></span>
            <span className="rounded-full bg-accent px-2.5 py-1 text-[0.62rem] font-bold text-white">Pay</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft text-accent-deep"><Bell size={16} aria-hidden /></span>
            <span className="flex-1"><span className="block font-semibold">Sports Day, Saturday</span><span className="text-ink-faint">Report by 7:30 am</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
