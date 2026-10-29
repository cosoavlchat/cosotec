import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { WhatsAppButton } from "@/components/public/WhatsAppButton";
import { CookieConsent } from "@/components/public/CookieConsent";
import { adminDb, isFirestoreReady } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let analyticsSettings: { ga4Id?: string; metaPixelId?: string } = {};

  if (await isFirestoreReady()) {
    try {
      const snap = await adminDb.collection("settings").doc("analytics").get();
      if (snap.exists) {
        analyticsSettings = snap.data() || {};
      }
    } catch {}
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <WhatsAppButton />
      <CookieConsent
        ga4Id={analyticsSettings.ga4Id}
        metaPixelId={analyticsSettings.metaPixelId}
      />
    </div>
  );
}

