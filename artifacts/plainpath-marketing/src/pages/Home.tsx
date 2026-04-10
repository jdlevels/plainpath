import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AppStoreBadge } from "@/components/ui/AppStoreBadge";
import { PlayStoreBadge } from "@/components/ui/PlayStoreBadge";
import { Button } from "@/components/ui/button";
import { FileText, ShieldAlert, FileSignature, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-2xl relative z-10"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now available on iOS & Android
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 text-foreground">
              Turn confusing paperwork into <span className="text-primary italic">plain English.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              Don't sign what you don't understand. PlainPath is your smart friend that reads legal documents, spots risks, and tells you exactly what to do next.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4" id="download">
              <AppStoreBadge />
              <PlayStoreBadge />
            </motion.div>
            
            <motion.div variants={fadeIn} className="mt-10 flex items-center gap-4 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>No lawyer required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Private & Secure</span>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20, rotate: 2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative lg:ml-auto w-full max-w-[400px] mx-auto"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 to-transparent rounded-[3rem] blur-2xl -z-10" />
            <img 
              src={`${import.meta.env.BASE_URL}images/mockup-1.png`}
              alt="PlainPath app on iPhone" 
              className="w-full h-auto drop-shadow-2xl rounded-[3rem] border-8 border-white object-cover aspect-[3/4]"
            />
            
            {/* Floating indicator */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute -left-12 top-1/4 bg-white p-4 rounded-2xl shadow-xl border border-border max-w-[200px]"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Action Step Found</p>
                  <p className="text-xs text-muted-foreground mt-1">Sign and return by Friday the 14th.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Value Prop Banner */}
      <section className="py-20 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Drowning in legal paperwork?</h2>
            <p className="text-xl text-white/70 leading-relaxed mb-10">
              Leases. Contracts. Medical bills. Court notices. They're designed to be confusing. 
              We believe everyone deserves to understand what they're signing and what they owe, 
              without paying hundreds of dollars an hour.
            </p>
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Four tools. One goal. <br/><span className="text-muted-foreground">Absolute clarity.</span></h2>
            <p className="text-lg text-muted-foreground">Everything you need to navigate legal documents with confidence.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Analyze */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-border/60 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-110" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-8">
                  <FileText className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Analyze a Document</h3>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  Snap a photo or upload any document. We'll break it down into plain English, extract exactly what you need to do, and highlight critical deadlines.
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">Leases</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">Letters</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">Notices</span>
                </div>
              </div>
            </motion.div>

            {/* Trust Check */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-border/60 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-110" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-8">
                  <ShieldAlert className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Document Trust Check</h3>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  Not sure if a notice or bill is real? Run a Trust Check to detect common scams, verify legitimacy, and get a clear verdict before you pay.
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">Scam Detection</span>
                  <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">Verification</span>
                </div>
              </div>
            </motion.div>

            {/* Contract Review */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-border/60 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-110" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-8">
                  <ShieldCheck className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Contract Review</h3>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  Before you sign, let us read the fine print. We'll spot unfair clauses, missing protections, and give you specific points to negotiate.
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">Job Offers</span>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">Agreements</span>
                </div>
              </div>
            </motion.div>

            {/* Build a Contract */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-border/60 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-110" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-8">
                  <FileSignature className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Build a Contract</h3>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  Create professional, legally sound agreements in minutes. Our guided wizard asks you plain English questions and handles the complex formatting.
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">Freelance</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">NDAs</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">Sales</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* App Interface Showcase */}
      <section className="py-24 bg-white border-y border-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/40 to-transparent rounded-[2rem] -z-10" />
              <img 
                src={`${import.meta.env.BASE_URL}images/mockup-2.png`}
                alt="PlainPath web app contract builder" 
                className="w-full h-auto rounded-[2rem] shadow-2xl border border-border object-cover aspect-video lg:aspect-square lg:object-left"
              />
            </div>
            
            <div className="order-1 lg:order-2 max-w-lg">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">A clean, modern experience everywhere.</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you're snapping a photo on your phone or building a contract on your laptop, PlainPath feels intuitive and frictionless. Your documents sync seamlessly across all your devices.
              </p>
              
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary text-sm font-bold">1</span>
                  </div>
                  <p className="text-foreground font-medium">Upload or snap a photo of your document</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary text-sm font-bold">2</span>
                  </div>
                  <p className="text-foreground font-medium">PlainPath analyzes the text instantly</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary text-sm font-bold">3</span>
                  </div>
                  <p className="text-foreground font-medium">Get your simplified summary and action plan</p>
                </li>
              </ul>
              
              <Button asChild variant="outline" size="lg" className="rounded-full gap-2">
                <a href="https://plain-path.replit.app" target="_blank" rel="noreferrer">
                  Try the Web App <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center mx-auto mb-8">
            <ShieldCheck className="w-8 h-8 text-background" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Your documents are private.</h2>
          <p className="text-xl text-muted-foreground mb-10">
            We don't sell your data. We don't train our AI on your sensitive documents. 
            Your contracts, bills, and notices belong to you. We process them to give you answers, and keep them secure.
          </p>
          <a href="https://plain-path.replit.app/privacy" target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
            Read our Privacy Policy <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready for absolute clarity?</h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Download the app today and never sign a confusing document again.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <AppStoreBadge className="bg-white text-black hover:bg-gray-100" />
            <PlayStoreBadge className="bg-white text-black hover:bg-gray-100" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
