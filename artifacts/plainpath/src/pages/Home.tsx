import { Link, useLocation } from "wouter"
import { motion } from "framer-motion"
import { ArrowRight, FileCheck, Target, Zap, Clock, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const DEMOS = [
  {
    id: "event-permit",
    title: "Small Business Event Permit",
    desc: "A typical messy local government packet filled with vague requirements.",
    icon: Sparkles,
    color: "text-blue-500",
    bg: "bg-blue-50"
  },
  {
    id: "school-enrollment",
    title: "School Enrollment Form",
    desc: "Confusing multi-page PDF with hidden deadlines and requested proofs.",
    icon: Target,
    color: "text-emerald-500",
    bg: "bg-emerald-50"
  },
  {
    id: "grant-application",
    title: "State Grant Application",
    desc: "Dense legalese requiring strict formatting and a dozen attachments.",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-50"
  }
];

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F7F4] relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-[80vh] opacity-50 pointer-events-none -z-10">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F8F7F4]/50 to-[#F8F7F4]"></div>
      </div>

      <main className="flex-1 flex flex-col items-center pt-24 pb-20 px-4">
        
        {/* Hero Section */}
        <div className="max-w-4xl w-full text-center space-y-8 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border/50 shadow-sm text-sm font-medium text-muted-foreground mb-4"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            AI-Powered Document Analysis
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-display font-bold tracking-tight text-balance text-foreground leading-[1.1]"
          >
            Turn confusing paperwork into a <span className="text-primary relative whitespace-nowrap">
              clear action plan
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.00021 6.84039C52.7933 1.70135 142.348 -1.82136 198.36 6.84039" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance"
          >
            Upload dense permits, applications, or manuals. PlainPath instantly extracts exactly what you need to do, what documents you need, and when they are due.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button size="lg" className="w-full sm:w-auto text-base" onClick={() => setLocation('/import')}>
              Analyze a Document <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base bg-white" onClick={() => {
              document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Try a Demo
            </Button>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          {[
            { title: "Prioritized Checklist", desc: "Know exactly what steps to take first, ordered by urgency.", icon: FileCheck },
            { title: "Hidden Deadlines", desc: "Never miss a hard deadline buried on page 14 of the fine print.", icon: Clock },
            { title: "Required Documents", desc: "A clear list of every attachment, form, or proof you must provide.", icon: ShieldCheck },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.2 }}
            >
              <Card className="h-full border-none shadow-md hover:shadow-lg bg-white/60 backdrop-blur-sm">
                <div className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Demos Section */}
        <div id="demos" className="max-w-6xl w-full scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">See it in action</h2>
            <p className="text-muted-foreground text-lg">Try one of our pre-loaded examples to see how we extract structure from chaos.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEMOS.map((demo, i) => (
              <motion.div
                key={demo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <button 
                  onClick={() => setLocation(`/analyze?demo=${demo.id}`)}
                  className="w-full text-left h-full group"
                >
                  <Card className="h-full border-border/50 hover:border-primary/30 transition-colors overflow-hidden relative">
                    <div className="p-6 space-y-4 relative z-10">
                      <div className={`w-12 h-12 rounded-xl ${demo.bg} flex items-center justify-center mb-6`}>
                        <demo.icon className={`w-6 h-6 ${demo.color}`} />
                      </div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{demo.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{demo.desc}</p>
                    </div>
                    <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <ArrowRight className="w-5 h-5 text-primary" />
                    </div>
                  </Card>
                </button>
              </motion.div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
