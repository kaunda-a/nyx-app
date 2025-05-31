import { api } from '@/lib/api'
import { NumberDetails, Message, NumberCreateData } from '../types'

interface ExportOptions {
  format: 'csv' | 'json'
  numbers: NumberDetails[]
}

interface VerifyOptions {
  service?: string
}

export const numbersApi = {
  list: () => 
    api.get<NumberDetails[]>('/api/numbers'),
  
  getMessages: (numberId: string) => 
    api.get<Message[]>(`/api/numbers/${numberId}/messages`),
  
  release: (numberId: string) => 
    api.delete(`/api/numbers/${numberId}`),
  
  export: ({ format, numbers }: ExportOptions) => 
    api.post('/api/numbers/export', 
      { format, numbers }, 
      { responseType: 'blob' }
    ),

  verify: (numberId: string, options: VerifyOptions = {}) =>
    api.post(`/api/numbers/${numberId}/verify`, {
      service: options.service || 'default'
    }),

  refresh: (numberId: string) =>
    api.post(`/api/numbers/${numberId}/refresh`),

  acquire: (data: NumberCreateData) =>
    api.post<NumberDetails>('/api/numbers/acquire', data)
}
