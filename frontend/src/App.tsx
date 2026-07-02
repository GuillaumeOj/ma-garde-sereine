import { useQuery } from '@tanstack/react-query'
import { getHealth } from './api/client'

function App() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
  })

  const backendStatus = isLoading
    ? 'checking…'
    : isError
      ? 'unreachable'
      : (data?.status ?? 'unknown')

  return (
    <main>
      <h1>Nanny Hours Tracker</h1>
      <p>Track hours worked by a nanny across families.</p>
      <p>
        Backend: <strong>{backendStatus}</strong>
      </p>
    </main>
  )
}

export default App
