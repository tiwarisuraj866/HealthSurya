import DoctorDetailClient from "./DoctorDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DoctorDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <DoctorDetailClient slug={slug} />;
}
