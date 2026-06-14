import MedicineDetailClient from "./MedicineDetailClient";

interface PageProps {
  params: Promise<{ medicineId: string }>;
}

export default async function MedicineDetailPage({ params }: PageProps) {
  const { medicineId } = await params;
  return <MedicineDetailClient medicineId={medicineId} />;
}
