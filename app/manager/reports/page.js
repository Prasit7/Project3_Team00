'use client'
import { useEffect, useState } from 'react'

export default function ReportsPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error(err))
  }, [])

  if (!data) return <p>Loading...</p>

  return (
    <div>
      <h1>Reports</h1>
      <p>Total Orders: {data.total_orders}</p>
    </div>
  )
}