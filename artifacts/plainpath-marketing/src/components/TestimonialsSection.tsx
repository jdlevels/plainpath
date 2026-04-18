import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"
import { Card } from "@/components/ui/card"

const TESTIMONIALS = [
  {
    quote: "I uploaded my apartment lease and within a minute I had every deadline, every required document, and three risks I hadn't even noticed. Saved me from missing my move-in checklist entirely.",
    name: "Marisol T.",
    role: "Renter, Austin TX",
    rating: 5,
    tag: "Analyze a Document",
    tagColor: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",
  },
  {
    quote: "I'm a freelancer and I used the contract builder to draft my first agreement. It walked me through every clause, flagged that I had no kill fee, and generated a real, usable draft in minutes.",
    name: "Jordan K.",
    role: "Independent Designer",
    rating: 5,
    tag: "Build a Contract",
    tagColor: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
  },
  {
    quote: "I got a job offer from a company I'd never heard of. The Trust Check immediately flagged two things — the email domain didn't match the company name and the payment terms were unusual. Avoided a scam.",
    name: "Priya S.",
    role: "Job Seeker",
    rating: 5,
    tag: "Document Trust Check",
    tagColor: "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400",
  },
  {
    quote: "My father received a Medicare explanation of benefits that nobody in our family could understand. PlainPath broke it into plain English, listed exactly what he needed to do, and highlighted a billing error we then disputed.",
    name: "Carlos R.",
    role: "Family Caregiver",
    rating: 5,
    tag: "Analyze a Document",
    tagColor: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",
  },
  {
    quote: "I used Contract Review before signing my employment offer. It caught a 5-year non-compete buried on page 9 and gave me exact negotiation language. My lawyer confirmed it was legitimate and I got the clause removed.",
    name: "Diana W.",
    role: "Operations Manager",
    rating: 5,
    tag: "Contract Review",
    tagColor: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400",
  },
  {
    quote: "As a paralegal I use Contract Review to do first-pass reviews before escalating to attorneys. It surfaces problematic clauses fast and explains why each one is a concern — the source section is especially useful.",
    name: "Nathaniel P.",
    role: "Paralegal",
    rating: 5,
    tag: "Contract Review",
    tagColor: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400",
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
    <section className="w-full">
      <div className="text-center mb-10">
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
          className="text-3xl md:text-4xl font-bold"
          style={{ fontFamily: "var(--font-display)" }}
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
            <Card className="h-full bg-white dark:bg-card border-border/40 shadow-sm hover:shadow-lg transition-shadow rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <Stars count={t.rating} />
                <Quote className="w-4 h-4 text-muted-foreground/25 dark:text-muted-foreground/40 shrink-0" />
              </div>
              <p className="text-sm text-foreground/85 dark:text-foreground/90 leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground dark:text-muted-foreground/80">{t.role}</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${t.tagColor}`}>
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
