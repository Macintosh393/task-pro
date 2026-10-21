import { useEffect, useState } from 'react'
import { getStatusMessage } from './health'

function App() {
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    async function checkBackend() {
      try {
        const response = await fetch('/api/health')

        if (!response.ok) {
          throw new Error('Backend error')
        }

        const data: { status: string } = await response.json()
        setStatus(getStatusMessage(data.status))
      } catch {
        setStatus(getStatusMessage('error'))
      }
    }

    void checkBackend()
  }, [])

  return (
    <main>
      <h1>TaskPro Training</h1>
      <p>Backend status: {status}</p>
    </main>
  )
}

export default App
