import { UseMutationOptions, useMutation } from '@tanstack/react-query'
import { useLoading } from '@/provider/loading-context'

export function useLoadingMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
) {
  const { setIsLoading } = useLoading()

  return useMutation({
    ...options,
    onMutate: async (variables) => {
      setIsLoading(true)
      if (options.onMutate) {
        return await options.onMutate(variables)
      }
    },
    onSettled: (data, error, variables, context) => {
      setIsLoading(false)
      if (options.onSettled) {
        options.onSettled(data, error, variables, context)
      }
    },
  })
}