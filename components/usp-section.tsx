import { Button } from "@/components/ui/button"

export function USPSection() {
  return (
    <section className="py-12 px-4 sm:px-6 bg-[#BAD6EB] relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Text and Button */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#081F5C] mb-6 leading-snug">
              Why Beyond Career is Built Different
            </h2>
            <Button
              variant="outline"
              className="border-white text-[#081F5C] bg-transparent hover:bg-white/10 rounded-lg px-6 py-3"
              asChild
            >
              <a href="/signup">
                Explore →
              </a>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            <div className="text-center bg-white/20 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/30 w-full min-w-0">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#081F5C] mb-3 break-words">
                95%
              </div>
              <p className="text-[#081F5C] text-sm sm:text-base leading-relaxed text-balance">
                Placement success rate across partner colleges through custom prep and industry mentorship
              </p>
            </div>

            <div className="text-center bg-white/20 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/30 w-full min-w-0">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#081F5C] mb-3 break-words">
                10,000+
              </div>
              <p className="text-[#081F5C] text-sm sm:text-base leading-relaxed text-balance">
                Students impacted through resources, mentorship sessions, and community support
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default USPSection
