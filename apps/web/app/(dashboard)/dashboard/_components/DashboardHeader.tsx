import ArrowRightIcon from '@repo/ui/icons/ArrowRightIcon'
import SearchIcon from '@repo/ui/icons/SearchIcon'
import Link from 'next/link'

const DashboardHeader = () => {
  return (
    <div className="hidden md:flex items-center justify-between px-5 lg:pl-20 py-2.5 mt-15 lg:mt-0">
      <div className='text-primary flex gap-2 text-sm font-semibold leading-5'>
        <h2 className='text-xs'>My Events</h2>
        <ArrowRightIcon />
        <h2 className='text-xs'>The Business Revival Series 2023 </h2>
        <ArrowRightIcon />
        <h2 className='text-xs'>Dashboard</h2>
      </div>
      <div className="flex gap-4 items-center">
        {/* search input  */}
        <div className="relative">
          <input
            name=""
            type="search"
            className="bg-white pl-4 w-52 appearance-none rounded-4xl border border-gray-300 px-7 py-2.5 leading-5 text-[#7E7E7E] backdrop-blur-2xl placeholder:text-[#7E7E7E] focus:outline-none  text-base placeholder:text-base"
            placeholder="Search Business..."
          />
          <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center">
            <SearchIcon className="text-gray-400" />
          </div>
        </div>
        <div className="px-5 py-2 border border-gray-300 rounded-full flex items-center justify-center">
          <p>i</p>
        </div>

        <Link
          href="https://www.businessrevivalseries.co.uk/"
          target='_blank'
          className="block w-full bg-[#ef5980] hover:bg-[#e94d76] text-white font-semibold py-3 px-4 rounded-full transition-colors duration-300 shadow-lg text-center text-sm"
        >
          View Website
        </Link>
      </div>
    </div>
  )
}

export default DashboardHeader