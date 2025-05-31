export type Provider = 'textnow' | 'google_voice' | '2ndline' | 'textfree'

export interface NumberDetails {
  id: string
  provider: Provider
  number: string
  status: string
  created_at: string
  tags: string[]
  capabilities?: string[]
}

export interface Message {
  id: string
  content: string
  type: string
  sender: string
  timestamp: string
}

export interface NumberCreateData {
  provider: Provider
  proxy_id?: string
  device_id?: string
  area_code?: string
  tags?: string[]
}
