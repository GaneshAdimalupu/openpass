'use client'

import dynamic from 'next/dynamic'

export default dynamic(() => import('../new/EventMap'), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-2xl bg-[#1a1919] animate-pulse" />,
})
