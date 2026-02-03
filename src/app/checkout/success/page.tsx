import { Suspense } from "react";
import { CheckoutSuccessContent } from "./content";
import { SeatherderLoading } from "@/components/seatherder-loading";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SeatherderLoading />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
