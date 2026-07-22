import { SiteLayout } from "@/components/layout/SiteLayout";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}
