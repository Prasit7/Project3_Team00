'use client'
import { useEffect, useState } from 'react'

export default function UsagePage() {
  const [data, setData] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/reports/usage')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setData(data)
        } else {
          setError(data.error || 'Failed to load usage data')
        }
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load usage data')
      })
  }, [])

  return (
    <div>
      <h1>Top Products</h1>

      {error && <p>{error}</p>}

      {!error && (
        <ul>
          {data.map((item, index) => (
            <li key={index}>
              {item.name} - {item.total_sold}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}