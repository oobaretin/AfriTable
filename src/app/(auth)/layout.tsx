import { SiteLayout } from "@/components/layout/SiteLayout";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}
