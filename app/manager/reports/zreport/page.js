'use client'
import { useEffect, useState } from 'react'

export default function ZReportPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/zreport')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setData(data)
      })
      .catch(() => setError('Failed to load z report'))
  }, [])

  if (error) return <p>{error}</p>
  if (!data) return <p>Loading...</p>

  const prettyDate = new Date(data.report_date).toLocaleDateString()

  return (
    <div>
      <h1>Z Report</h1>
      <p>Report Date: {prettyDate}</p>
      <p>Orders: {data.total_orders}</p>
    </div>
  )
}