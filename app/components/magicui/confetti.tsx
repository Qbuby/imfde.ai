"use client"

import type { ReactNode } from "react"
import React, {
  createContext,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react"
import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from "canvas-confetti"
import confetti from "canvas-confetti"
import { cn } from "~/lib/cn"


export type ConfettiRef = {
  fire: (options?: ConfettiOptions) => Promise<void> | void
}

type Props = React.ComponentPropsWithRef<"canvas"> & {
  options?: ConfettiOptions
  globalOptions?: ConfettiGlobalOptions
  manualstart?: boolean
  children?: ReactNode
}

const ConfettiContext = createContext<ConfettiRef | null>(null)

const ConfettiComponent = forwardRef<ConfettiRef, Props>((props, ref) => {
  const {
    options,
    globalOptions = { resize: true, useWorker: true },
    manualstart = true,
    children,
    className,
    ...rest
  } = props

  const canvasNodeRef = useRef<HTMLCanvasElement | null>(null)
  const instanceRef = useRef<ConfettiInstance | null>(null)
  const optionsRef = useRef(options)
  const globalOptionsRef = useRef(globalOptions)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    globalOptionsRef.current = globalOptions
  }, [globalOptions])

  useEffect(() => {
    if (canvasNodeRef.current && !instanceRef.current) {
      instanceRef.current = confetti.create(canvasNodeRef.current, {
        resize: true,
        useWorker: true,
        ...globalOptionsRef.current,
      })
    }

    return () => {
      instanceRef.current?.reset()
      instanceRef.current = null
    }
  }, [])

  const fire = useCallback(async (opts: ConfettiOptions = {}) => {
    try {
      await instanceRef.current?.({
        ...optionsRef.current,
        ...opts,
      })
    } catch (error) {
      console.error("Confetti error:", error)
    }
  }, [])

  const api = useMemo<ConfettiRef>(() => ({ fire }), [fire])

  useImperativeHandle(ref, () => api, [api])

  useEffect(() => {
    if (!manualstart) {
      void fire()
    }
  }, [manualstart, fire])

  return (
    <ConfettiContext.Provider value={api}>
            <canvas
        ref={canvasNodeRef}
        className={cn("pointer-events-none fixed inset-0 z-[60] h-full w-full", className)}
        {...rest}
      />
      {children}
    </ConfettiContext.Provider>
  )
})

ConfettiComponent.displayName = "Confetti"

export const Confetti = ConfettiComponent

