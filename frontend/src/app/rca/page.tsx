import { PageHeader } from "@/components/page-header"
import { RcaWorkbench } from "@/components/rca-workbench"

export const metadata = { title: "Root cause analysis" }

export default function RcaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Root-cause agent"
        title="Investigate recurrence without skipping the unknowns."
        description="Generate a structured RCA from asset history, inspections, manuals, and similar failures—with confidence, evidence IDs, and missing checks kept visible."
        status="READ-ONLY AGENT"
      />
      <RcaWorkbench />
    </div>
  )
}
