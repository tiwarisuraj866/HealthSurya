import { notFound } from "next/navigation";
import { getPolicyById, POLICIES } from "@/lib/policies";
import { PolicyDocument } from "@/components/PolicyDocument";

interface PageProps {
  params: Promise<{ policyId: string }>;
}

// Generate static params for all policies so they load instantly and can be statically optimized
export async function generateStaticParams() {
  return POLICIES.map((p) => ({
    policyId: p.id,
  }));
}

export default async function LegalPolicyPage({ params }: PageProps) {
  const resolvedParams = await params;
  const policy = getPolicyById(resolvedParams.policyId);
  
  if (!policy) {
    notFound();
  }

  return <PolicyDocument policy={policy} />;
}
