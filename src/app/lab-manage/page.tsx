"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LabManageRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/lab");
  }, [router]);

  return null;
}
