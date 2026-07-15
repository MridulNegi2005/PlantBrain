import { CopilotWorkbench } from "@/components/copilot-workbench"
import { PageHeader } from "@/components/page-header"

export const metadata = { title: "Cited copilot" }

export default function CopilotPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Cited operational reasoning"
        title="Ask the plant memory. Inspect the proof."
        description="Every supported response carries page-level evidence, confidence, unresolved gaps, and the graph path used to connect the facts."
        status="CITATIONS REQUIRED"
      />
      <CopilotWorkbench />
    </div>
  )
}
