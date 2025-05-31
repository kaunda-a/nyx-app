import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { NumberDetails } from '../types'

type NumberDialogType = 'acquire' | 'edit' | 'delete' | 'verify' | 'refresh'

interface NumbersContextType {
  open: NumberDialogType | null
  setOpen: (str: NumberDialogType | null) => void
  currentNumber: NumberDetails | null
  setCurrentNumber: React.Dispatch<React.SetStateAction<NumberDetails | null>>
}

const NumbersContext = React.createContext<NumbersContextType | null>(null)

interface Props {
  children: React.ReactNode
}

export function NumbersProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<NumberDialogType>(null)
  const [currentNumber, setCurrentNumber] = useState<NumberDetails | null>(null)

  return (
    <NumbersContext.Provider value={{ open, setOpen, currentNumber, setCurrentNumber }}>
      {children}
    </NumbersContext.Provider>
  )
}

export const useNumbers = () => {
  const context = React.useContext(NumbersContext)
  if (!context) {
    throw new Error('useNumbers must be used within NumbersProvider')
  }
  return context
}