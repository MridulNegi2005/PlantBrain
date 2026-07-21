import { PageHeader } from "@/components/page-header"
import { UploadWorkbench } from "@/components/upload-workbench"

export const metadata = { title: "Add documents" }

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Add documents"
        title="Add a document and let PlantBrain read it."
        description="Upload a manual, work order, inspection, or report. PlantBrain reads it and makes it instantly searchable — you can watch each step as it happens."
        status="20 MB MAX"
      />
      <UploadWorkbench />
    </div>
  )
}
