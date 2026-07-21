import { ComplianceWorkbench } from "@/components/compliance-workbench"
import { PageHeader } from "@/components/page-header"

export const metadata = { title: "Compliance" }

export default function CompliancePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Compliance"
        title="Find the missing paperwork before the auditor does."
        description="PlantBrain checks each piece of equipment for the certificates, procedures, and readings it should have on file — and flags what's missing."
        status="EVIDENCE MATCHING"
      />
      <ComplianceWorkbench />
    </div>
  )
}
