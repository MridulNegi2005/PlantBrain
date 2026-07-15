import { ComplianceWorkbench } from "@/components/compliance-workbench"
import { PageHeader } from "@/components/page-header"

export const metadata = { title: "Compliance" }

export default function CompliancePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Compliance evidence agent"
        title="Find the missing proof before the auditor does."
        description="Check inspection certificates, SOP revisions, closure readings, and audit packets while keeping gaps distinct from verified evidence."
        status="EVIDENCE MATCHING"
      />
      <ComplianceWorkbench />
    </div>
  )
}
