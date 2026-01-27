import Image from "next/image";

export function HeritageSection() {
  return (
    <section className="py-24 px-6 bg-brand-paper">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          
          {/* Visual Side */}
          <div className="relative flex justify-center">
            {/* Soft decorative glow behind the logo */}
            <div className="absolute inset-0 bg-brand-ochre/10 blur-3xl rounded-full scale-75"></div>
            <div className="relative z-10 w-full max-w-md">
              <Image 
                src="/logo.png" 
                alt="AfriTable Sankofa Logo" 
                width={400}
                height={400}
                className="w-full h-auto drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Text Side */}
          <div>
            <h2 className="text-sm font-black text-brand-bronze uppercase tracking-[0.2em] mb-4">
              The Meaning Behind the Mark
            </h2>
            <h3 className="text-4xl font-black text-slate-900 mb-6 leading-tight">
              Sankofa: Honoring the Past to <span className="text-brand-bronze">Feed the Future.</span>
            </h3>
            
            <div className="space-y-6 text-lg text-slate-700 leading-relaxed">
              <p>
                Our logo features the <strong>Sankofa</strong>, a sacred symbol from the Akan people of Ghana. The bird is depicted with its head turned backward, retrieving a precious egg—representing the wisdom of our ancestors.
              </p>
              <p>
                At <strong>AfriTable</strong>, this reflects our core belief: that the most innovative dining experiences are rooted in the traditions we carry with us. Look closer at our symbol and you will see this mission taking shape: the bird&apos;s back is designed as a table, flanked by chairs on either side. It is a literal invitation to gather.
              </p>
              <p>
                By &quot;reaching back&quot; to authentic recipes and cultural rituals, we create a way forward for the diaspora&apos;s culinary legacy—one seat at a time.
              </p>
              <p className="font-serif italic text-brand-bronze">
                &quot;Se wo were fi na wosankofa a yenkyi.&quot; <br/>
                <span className="text-sm font-sans font-bold text-slate-400 not-italic">
                  (It is not wrong to go back for that which you have forgotten.)
                </span>
              </p>
            </div>

            <div className="mt-10 flex gap-4">
              <div className="h-1 w-12 bg-brand-mutedRed"></div>
              <div className="h-1 w-12 bg-brand-forest"></div>
              <div className="h-1 w-12 bg-brand-ochre"></div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
