import { createLazyFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

export const Route = createLazyFileRoute('/quotes')({
  component: Quotes,
})

function Quotes() {
  const { data, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8088'}/api/quotes`
      );
      return res.json()
    }
  })

  if (isLoading) return <div className="p-4">Loading quotes...</div>

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Community Quotes</h2>
      <div className="space-y-2">
        {data?.quotes?.map((quote: any) => (
          <div key={quote.id} className="p-3 bg-gray-100 rounded">
            "{quote.text}" - {quote.quotee.display_name}
          </div>
        ))}
      </div>
    </div>
  )
}
