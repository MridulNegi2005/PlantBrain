import { AlertTriangleIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DataUnavailable({ label }: { label: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangleIcon />
      <AlertTitle>{label} is unavailable</AlertTitle>
      <AlertDescription>
        Start the FastAPI service on port 8000, then refresh this page. No fallback data is being shown.
      </AlertDescription>
    </Alert>
  )
}
