import OrderTrackClient from "./OrderTrackClient";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderTrackPage({ params }: PageProps) {
  const { orderId } = await params;
  return <OrderTrackClient orderId={orderId} />;
}
