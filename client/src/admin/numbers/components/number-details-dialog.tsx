import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NumberDetails, Message } from '../types'
import { DetailsView } from './details-view'
import { MessagesView } from './messages-view'
import { numbersApi } from '../api/numbers-api'

interface NumberDetailsDialogProps {
  open: boolean
  onClose: () => void
  number: NumberDetails | null
}

export function NumberDetailsDialog({ open, onClose, number }: NumberDetailsDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (number?.id) {
      numbersApi.getMessages(number.id)
        .then(response => setMessages(response.data))
        .catch(console.error)
    }
  }, [number?.id])

  if (!number) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Number Details</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <DetailsView number={number} />
          </TabsContent>
          
          <TabsContent value="messages">
            <MessagesView messages={messages} numberId={number.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
