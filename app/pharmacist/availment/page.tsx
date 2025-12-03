import { Suspense } from "react";
import PharmacistAvailmentClient from "./AvailmentClient";

export default function PharmacistAvailmentPage() {
  return (
    <Suspense fallback={<div>Loading availment…</div>}>
      <PharmacistAvailmentClient />
    </Suspense>
  );
}
