'use client'
import { useEffect, useState } from 'react'

export default function XReportPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/xreport')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setData(data)
      })
      .catch(() => setError('Failed to load x report'))
  }, [])

  if (error) return <p>{error}</p>
  if (!data) return <p>Loading...</p>

  const prettyDate = new Date(data.report_date).toLocaleDateString()

  return (
    <div>
      <h1>X Report</h1>
      <p>Report Date: {prettyDate}</p>
      <p>Orders: {data.orders_today}</p>
    </div>
  )
}