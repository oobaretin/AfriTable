import Image from "next/image";
import { ContactAndMap } from "@/components/home/ContactAndMap";

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            Our mission is to put <span className="text-orange-600">Culture</span> back at the center of the table.
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            AfriTable was born from a simple observation: African and Caribbean culinary excellence is world-class, but the platforms to discover it were missing.
          </p>
        </div>
      </section>

      {/* The Story Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="rounded-3xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
            <Image 
              src="/api/placeholder/600/800" 
              alt="Culinary tradition" 
              width={600}
              height={800}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">More Than Just a Reservation</h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              We started AfriTable because we were tired of &quot;hidden gems&quot; remaining hidden. We saw brilliant chefs, vibrant flavors, and generations of tradition being overlooked by mainstream booking apps.
            </p>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              AfriTable isn&apos;t just a software company. We are a digital home for the diaspora. We are the bridge between the diner craving the smoky jollof of Lagos or the jerk chicken of Kingston, and the hardworking restaurant owners who cook them.
            </p>
            
            <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-8">
              <div>
                <h4 className="text-orange-600 font-black text-3xl">20+</h4>
                <p className="text-sm text-slate-500 font-bold uppercase">Cities Covered</p>
              </div>
              <div>
                <h4 className="text-orange-600 font-black text-3xl">500+</h4>
                <p className="text-sm text-slate-500 font-bold uppercase">Verified Tables</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-6 bg-slate-900 text-white rounded-[40px] mx-4 mb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Our Values</h2>
            <div className="h-1 w-20 bg-orange-600 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-4xl mb-4">🥘</div>
              <h3 className="text-xl font-bold mb-3">Authenticity First</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                We don&apos;t do &quot;fusion&quot; for the sake of trends. we celebrate the raw, real, and ancestral flavors that define our regions.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3">Community Growth</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                When a restaurant joins AfriTable, they aren&apos;t just a client—they are a partner. We invest in their digital growth.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold mb-3">Cultural Pride</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Every reservation is an act of supporting the diaspora economy and preserving culinary heritage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Meet the Team</h2>
            <div className="h-1 w-20 bg-orange-600 mx-auto"></div>
            <p className="mt-4 text-lg text-slate-600">
              The passionate people building AfriTable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Founder */}
            <div className="text-center">
              <div className="mb-6 mx-auto w-48 h-48 rounded-full bg-slate-200 overflow-hidden shadow-lg relative">
                <Image 
                  src="/api/placeholder/200/200" 
                  alt="Founder" 
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Founder</h3>
              <p className="text-sm text-slate-500 mb-4">Leadership & Vision</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Building the platform that connects the diaspora with authentic culinary experiences.
              </p>
            </div>

            {/* Head of Growth */}
            <div className="text-center">
              <div className="mb-6 mx-auto w-48 h-48 rounded-full bg-slate-200 overflow-hidden shadow-lg">
                <img 
                  src="/api/placeholder/200/200" 
                  alt="Head of Growth" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Head of Growth</h3>
              <p className="text-sm text-slate-500 mb-4">Marketing & Expansion</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Growing our community of restaurants and diners across cities.
              </p>
            </div>

            {/* Community Lead */}
            <div className="text-center">
              <div className="mb-6 mx-auto w-48 h-48 rounded-full bg-slate-200 overflow-hidden shadow-lg relative">
                <Image 
                  src={PLACEHOLDERS.square(200)}
                  alt="Community Lead" 
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Community Lead</h3>
              <p className="text-sm text-slate-500 mb-4">Engagement & Support</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Fostering connections between restaurants and their communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cities of Flavor Section */}
      <ContactAndMap />
    </div>
  );
}
