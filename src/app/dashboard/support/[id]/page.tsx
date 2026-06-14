import SupportTicketDetailClient from "./SupportTicketDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SupportTicketDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <SupportTicketDetailClient ticketId={id} />;
}
