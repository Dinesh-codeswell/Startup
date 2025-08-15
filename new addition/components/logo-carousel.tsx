"use client"

import { useState } from "react"

export default function LogoCarousel() {
  const [failedImages, setFailedImages] = useState(new Set())

  const allLogos = [
    // IITs
    {
      name: "IIT Bombay",
      logo: "/images/R.png",
      height: "h-12",
      link: "https://www.iitb.ac.in/",
    },
    {
      name: "IIT Delhi",
      logo: "/images/358-3581667_indian-institute-of-technology-delhi-indian-institute-of.png",
      height: "h-12",
      link: "https://home.iitd.ac.in/",
    },
    {
      name: "IIT Madras",
      logo: "/images/iit-madras-logo.png",
      height: "h-12",
      link: "https://www.iitm.ac.in/",
    },
    {
      name: "IIT Kharagpur",
      logo: "/images/iit-kharagpur-logo-freelogovectors.net_.png",
      height: "h-12",
      link: "https://www.iitkgp.ac.in/",
    },
 
    {
      name: "IIT Roorkee",
      logo: "/images/iit-rourkee-logo-16x9.png",
      height: "h-12",
      link: "https://www.iitr.ac.in/",
    },

    // IIMs
    {
      name: "IIM Ahmedabad",
      logo: "/images/iim-ahmedabad-logo.png",
      height: "h-12",
      link: "https://www.iima.ac.in/",
    },
    {
      name: "IIM Bangalore",
      logo: "/images/520-5200027_indian-institute-of-management-bangalore-logo-clipart.png",
      height: "h-12",
      link: "https://www.iimb.ac.in/",
    },
    {
      name: "IIM Calcutta",
      logo: "/images/63-639287_iim-calcutta-logo-hd-png-download.png",
      height: "h-12",
      link: "https://www.iimcal.ac.in/",
    },
    // Other Top Institutes
    {
      name: "BITS Pilani",
      logo: "/images/132-1327406_bits-pilani-logo-png-transparent-png.png",
      height: "h-12",
      link: "https://www.bits-pilani.ac.in/",
    },
    {
      name: "NIT Trichy",
      logo: "/images/NIT-Trichy-Recruitment-Notification.png",
      height: "h-12",
      link: "https://www.nitt.edu/",
    },
   
    // Delhi University and Colleges
    {
      name: "Delhi University",
      logo: "/images/delhi-university-686256.jpg",
      height: "h-12",
      link: "https://www.du.ac.in/",
    },
    {
      name: "St. Stephen's College",
      logo: "/images/Crest_of_St.Stephens_Coll,_UOD.svg.png",
      height: "h-12",
      link: "https://www.ststephens.edu/",
    },

    {
      name: "Lady Shri Ram College",
      logo: "/images/218-2187086_lady-shri-ram-college-for-women-logo-hd.png",
      height: "h-12",
      link: "https://lsr.edu.in/",
    },
    {
      name: "SRCC",
      logo: "/images/56052dd0_logo.jpg",
      height: "h-12",
      link: "https://www.srcc.edu/",
    },
 
    // Tech Giants
    {
      name: "Google",
      logo: "/images/300221.png",
      height: "h-8",
      link: "https://www.google.com/",
    },
    {
      name: "Microsoft",
      logo: "/images/732221.png",
      height: "h-8",
      link: "https://www.microsoft.com/",
    },
    {
      name: "Amazon",
      logo: "/images/14079391.png",
      height: "h-8",
      link: "https://www.amazon.com/",
    },
    {
      name: "Apple",
      logo: "/images/747.png",
      height: "h-8",
      link: "https://www.apple.com/",
    },
    {
      name: "Meta",
      logo: "/images/6033716.png",
      height: "h-8",
      link: "https://about.meta.com/",
    },
    {
      name: "Netflix",
      logo: "/images/732228.png",
      height: "h-8",
      link: "https://www.netflix.com/",
    },
    // Indian IT Giants
    {
      name: "TCS",
      logo: "/images/Tata_Consultancy_Services_Logo.svg.png",
      height: "h-8",
      link: "https://www.tcs.com/",
    },
    {
      name: "Infosys",
      logo: "/images/Infosys-Logo-1536x960.png",
      height: "h-8",
      link: "https://www.infosys.com/",
    },
    {
      name: "Wipro",
      logo: "/images/Wipro-logo.png",
      height: "h-8",
      link: "https://www.wipro.com/",
    },
    {
      name: "Reliance",
      logo: "/images/reliance-industries-logo-1.png",
      height: "h-8",
      link: "https://www.ril.com/",
    },
    // Consulting
    {
      name: "McKinsey",
      logo: "/images/McKinsey-Logo.png",
      height: "h-8",
      link: "https://www.mckinsey.com/",
    },
    {
      name: "BCG",
      logo: "/images/bc4661b032-bcg-logo-boston-consulting-group-logo.png",
      height: "h-8",
      link: "https://www.bcg.com/",
    },
    {
      name: "Bain",
      logo: "/images/bain_company_logo-freelogovectors.net_.png",
      height: "h-8",
      link: "https://www.bain.com/",
    },
    // Big 4 Consulting Firms
    {
      name: "Deloitte",
      logo: "/images/Deloitte-Logo-PNG-Cutout.png",
      height: "h-8",
      link: "https://www2.deloitte.com/",
    },
    {
      name: "PwC",
      logo: "/images/PwC-PricewaterhouseCoopers-Logo.png",
      height: "h-8",
      link: "https://www.pwc.com/",
    },
    {
      name: "Accenture",
      logo: "/images/Accenture-Logo.png",
      height: "h-8",
      link: "https://www.accenture.com/",
    },

  ]

  const handleImageError = (index) => {
    setFailedImages((prev) => new Set([...prev, index]))
  }

  const handleImageLoad = (index) => {
    setFailedImages((prev) => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }

  return (
    <section className="py-16 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-center text-sm text-gray-600 uppercase tracking-wide mb-8 font-medium">
          Our community members come from
        </h2>
        <div className="overflow-hidden">
          <div className="flex w-max animate-infinite-scroll">
            {/* Duplicate the logos to create a seamless loop */}
            {allLogos.concat(allLogos).map((logo, index) => (
              <a
                key={`logo-${index}`}
                href={logo.link}
                className="flex-shrink-0 block mx-8"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className={`${logo.height} w-auto flex items-center justify-center min-w-[120px]`}>
                  <img
                    src={failedImages.has(index) ? "/placeholder.svg" : logo.logo}
                    alt={logo.name}
                    className={`${logo.height} w-auto max-w-full transition-all duration-300 opacity-90 hover:opacity-100 object-contain`}
                    loading="lazy"
                    onError={() => handleImageError(index)}
                    onLoad={() => handleImageLoad(index)}
                    style={{
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "scale(1.05)"
                      e.target.style.opacity = "1"
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "scale(1)"
                      e.target.style.opacity = "0.9"
                    }}
                  />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Optional: Add categories below */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500 uppercase tracking-wider">
            <span>Premier Institutes</span>
            <span>•</span>
            <span>Delhi University Colleges</span>
            <span>•</span>
            <span>Tech Giants</span>
            <span>•</span>
            <span>Consulting Firms</span>
            <span>•</span>
            <span>Investment Banks</span>
            <span>•</span>
            <span>Indian Unicorns</span>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes infinite-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-infinite-scroll {
          animation: infinite-scroll 60s linear infinite;
        }
        
        .animate-infinite-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
