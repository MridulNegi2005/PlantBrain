import { PageHeader } from "@/components/page-header"
import { RcaWorkbench } from "@/components/rca-workbench"

export const metadata = { title: "Diagnose issue" }

export default function RcaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Diagnose an issue"
        title="Figure out why it keeps failing."
        description="Describe the problem and PlantBrain pulls together the equipment's history, inspections, manuals, and past similar failures to suggest likely causes — each backed by a source."
        status="READ-ONLY AGENT"
      />
      <RcaWorkbench />
    </div>
  )
}
