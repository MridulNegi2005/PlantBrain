"use client"

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center">
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>Something went wrong loading this page</AlertTitle>
        <AlertDescription className="flex flex-col gap-4">
          <p>We couldn't reach PlantBrain just now. Please check your connection and try again.</p>
          <Button variant="outline" onClick={reset} className="w-fit">
            <RefreshCwIcon data-icon="inline-start" />
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
