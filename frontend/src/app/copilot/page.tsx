import { CopilotWorkbench } from "@/components/copilot-workbench"
import { PageHeader } from "@/components/page-header"

export const metadata = { title: "Ask a question" }

export default function CopilotPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Ask a question"
        title="Ask anything about your plant."
        description="Ask in plain English. Every answer shows the exact documents it came from, how confident it is, and anything it couldn't find."
        status="CITATIONS REQUIRED"
      />
      <CopilotWorkbench />
    </div>
  )
}
