import { AlertTriangleIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DataUnavailable({ label }: { label: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangleIcon />
      <AlertTitle>{label} couldn't load</AlertTitle>
      <AlertDescription>
        We couldn't reach the PlantBrain service. Please check your connection and refresh the page.
      </AlertDescription>
    </Alert>
  )
}
