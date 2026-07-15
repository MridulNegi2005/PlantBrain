"use client"

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center">
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>This view could not be loaded</AlertTitle>
        <AlertDescription className="flex flex-col gap-4">
          <p>Check that the PlantBrain backend is running and reachable at the configured API URL.</p>
          <Button variant="outline" onClick={reset} className="w-fit">
            <RefreshCwIcon data-icon="inline-start" />
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
