import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { FoundersNote } from "@/components/home/FoundersNote";
import { BookingDrawerWrapper } from "@/components/booking/BookingDrawerWrapper";

type SiteLayoutProps = {
  children: React.ReactNode;
};

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 pt-24">{children}</div>
        <Footer />
      </div>
      <FoundersNote />
      <BookingDrawerWrapper />
    </>
  );
}
