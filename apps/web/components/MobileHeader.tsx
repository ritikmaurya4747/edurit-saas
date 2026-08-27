import AlertIcon from '@repo/ui/icons/AlertIcon'
import ArrowLeftIcon from '@repo/ui/icons/ArrowLeftIcon'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const MobileHeader = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <div>{/* Mobile Header */}
            <div className='lg:hidden fixed bg-primary-text top-0 left-0 w-full  z-50 px-4 py-3'>
                <div className="flex items-center justify-between">
                    <Link href='/'>
                        <Image
                            src="/assets/svg/logo_showoff.svg"
                            alt='logo'
                            width={100}
                            height={40}
                            className='object-cover h-8 w-8'
                        />
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href="#"
                            className="bg-[#00a986] p-2 max-sm:px-4 px-5 sm:py-3 flex items-center gap-1.5 justify-center rounded-full"
                        >
                            <AlertIcon className="w-5 h-5" />
                            <span className='text-white text-sm font-semibold max-sm:hidden'>Get Help </span>
                        </Link>
                        <Link
                            href="/feedback"
                            className="bg-[#00a986] p-2 max-sm:px-4 px-5 sm:py-3 flex items-center gap-1.5 justify-center rounded-full"
                        >
                            <AlertIcon />
                            <span className='text-white text-sm font-semibold max-sm:hidden'>Feedback </span>
                        </Link>

                        <div className="relative">
                            <button className="flex items-center gap-1 px-0 py-0" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                <div className="bg-gray-200 rounded-full p-2 cursor-pointer">
                                    <AlertIcon className='text-gray-500 w-4 h-4' />
                                </div>
                                <ArrowLeftIcon
                                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {isMenuOpen && (
                                <>
                                    {/* Backdrop / overlay */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsMenuOpen(false)}
                                    />
                                    {/* Dropdown Menu */}
                                    <div className="absolute right-0 top-12 w-32 shadow-lg z-50 before:content-[''] before:absolute before:right-4 before:bottom-full before:border-8 before:border-transparent before:border-b-slate-700">
                                        <button
                                            className="text-left px-4 py-3 bg-slate-700 text-white rounded-t-lg flex items-center gap-2 mb-0.5 rounded-b-none w-full"
                                            onClick={() => {
                                                setIsMenuOpen(false)
                                            }}
                                        >
                                            <span className="text-xs">Edit Profile</span>
                                        </button>
                                        <button
                                            className="text-left px-4 py-3 bg-slate-700 text-white rounded-b-lg flex items-center gap-2 rounded-t-none w-full"
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                // signOut({ callbackUrl: '/login' });
                                            }}
                                        >
                                            <span className="text-xs">Sign Out</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div></div>
    )
}

export default MobileHeader