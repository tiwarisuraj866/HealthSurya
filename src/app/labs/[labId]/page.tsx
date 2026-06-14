import LabDetailClient from "./LabDetailClient";

interface PageProps {
  params: Promise<{ labId: string }>;
}

export default async function LabDetailPage({ params }: PageProps) {
  const { labId } = await params;
  return <LabDetailClient labId={labId} />;
}
