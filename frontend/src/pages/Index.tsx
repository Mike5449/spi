import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import CodeExamples from "@/components/landing/CodeExamples";
import Credentials from "@/components/landing/Credentials";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import FloatingCTA from "@/components/landing/FloatingCTA";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <Hero />
    <HowItWorks />
    <Features />
    <CodeExamples />
    <Credentials />
    <FAQ />
    <Footer />
    <FloatingCTA />
  </div>
);

export default Index;
