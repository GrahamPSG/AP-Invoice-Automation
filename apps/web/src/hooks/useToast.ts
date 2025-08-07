import { useState, useCallback } from 'react'

interface ToastState {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const showToast = useCallback((
    message: string,
    type: ToastState['type'] = 'info',
    duration?: number
  ) => {
    const id = Math.random().toString(36).substring(2, 15)
    const newToast: ToastState = {
      id,
      message,
      type,
      duration,
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove toast after duration
    const timeout = duration || (type === 'error' ? 7000 : 5000)
    setTimeout(() => {
      removeToast(id)
    }, timeout)

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    return showToast(message, 'success', duration)
  }, [showToast])

  const error = useCallback((message: string, duration?: number) => {
    return showToast(message, 'error', duration)
  }, [showToast])

  const warning = useCallback((message: string, duration?: number) => {
    return showToast(message, 'warning', duration)
  }, [showToast])

  const info = useCallback((message: string, duration?: number) => {
    return showToast(message, 'info', duration)
  }, [showToast])

  const clear = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clear,
  }
}