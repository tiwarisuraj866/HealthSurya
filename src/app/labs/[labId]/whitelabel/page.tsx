import LabWhiteLabelPortalClient from "./LabWhiteLabelPortalClient";

interface PageProps {
  params: Promise<{ labId: string }>;
}

export default async function LabWhiteLabelPortalPage({ params }: PageProps) {
  const { labId } = await params;
  return <LabWhiteLabelPortalClient labId={labId} />;
}
