'use client'

import dynamic from 'next/dynamic'

export default dynamic(() => import('../new/EventMap'), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-2xl bg-[#25343F] animate-pulse" />,
})
