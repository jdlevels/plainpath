import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"
import { Card } from "@/components/ui/card"

const TESTIMONIALS = [
  {
    quote: "I uploaded my apartment lease and within a minute I had every deadline, every required document, and three risks I hadn't even noticed. Saved me from missing my move-in checklist entirely.",
    name: "Marisol T.",
    role: "Renter, Austin TX",
    rating: 5,
    tag: "Lease Agreement",
  },
  {
    quote: "I'm a freelancer and I used Contract Builder to draft my first Freelance Agreement. It walked me through every clause, flagged that I had no kill fee, and generated a real, usable draft in minutes.",
    name: "Jordan K.",
    role: "Independent Designer",
    rating: 5,
    tag: "Contract Builder",
  },
  {
    quote: "I got a job offer from a company I'd never heard of. The Trust Check immediately flagged two things — the email domain didn't match the company name and the payment terms were unusual. Avoided a scam.",
    name: "Priya S.",
    role: "Job Seeker",
    rating: 5,
    tag: "Document Trust Check",
  },
  {
    quote: "My father received a Medicare explanation of benefits that nobody in our family could understand. PlainPath broke it into plain English, listed exactly what he needed to do, and highlighted a billing error we then disputed.",
    name: "Carlos R.",
    role: "Family Caregiver",
    rating: 5,
    tag: "Healthcare Document",
  },
  {
    quote: "We applied for a city small business grant and uploaded the 28-page application packet. PlainPath pulled out every requirement and eligibility rule in about 90 seconds. We got the grant.",
    name: "Diana W.",
    role: "Small Business Owner",
    rating: 5,
    tag: "Grant Application",
  },
  {
    quote: "As a paralegal I use this to do first-pass reviews on contracts before escalating to attorneys. It catches things fast. The source section explainers are especially good.",
    name: "Nathaniel P.",
    role: "Paralegal",
    rating: 5,
    tag: "Legal Documents",
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

export default function TestimonialsSection() {
  return (
    <section className="max-w-6xl w-full mb-28">
      <div className="text-center mb-14">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3"
        >
          What people say
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-display font-bold"
        >
          Real documents. Real relief.
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="h-full bg-card border-border/40 shadow-sm hover:shadow-lg transition-shadow rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <Stars count={t.rating} />
                <Quote className="w-4 h-4 text-muted-foreground/30 shrink-0" />
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/8 text-primary font-medium">
                  {t.tag}
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
