import { PageHeader } from "@/components/page-header"
import { UploadWorkbench } from "@/components/upload-workbench"

export const metadata = { title: "Ingestion" }

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Document intelligence pipeline"
        title="Turn a plant record into connected evidence."
        description="Upload an operational document and follow every processing state until it is searchable, cited, and linked into the asset graph."
        status="20 MB MAX"
      />
      <UploadWorkbench />
    </div>
  )
}
