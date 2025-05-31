import { Message } from '../types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'

interface MessagesViewProps {
  messages: Message[]
  numberId: string
}

export function MessagesView({ messages }: MessagesViewProps) {
  return (
    <ScrollArea className="h-[400px] w-full pr-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <Card key={message.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {new Date(message.timestamp).toLocaleString()}
                </span>
                <span className="text-sm font-medium">
                  {message.sender}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
              <span className="text-xs text-muted-foreground mt-2 block">
                Type: {message.type}
              </span>
            </CardContent>
          </Card>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground">No messages found</p>
        )}
      </div>
    </ScrollArea>
  )
}
