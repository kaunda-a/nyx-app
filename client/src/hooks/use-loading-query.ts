import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { useLoading } from '@/provider/loading-context'
import { useEffect } from 'react'

export function useLoadingQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData>
) {
  const { setIsLoading } = useLoading()
  const query = useQuery(options)

  useEffect(() => {
    setIsLoading(query.isLoading || query.isFetching)
  }, [query.isLoading, query.isFetching, setIsLoading])

  return query
}