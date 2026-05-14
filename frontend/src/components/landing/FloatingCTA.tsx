import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const FloatingCTA = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button asChild className="bg-accent text-accent-foreground font-semibold hover:bg-accent/90 glow-accent shadow-lg">
            <Link to="/inscription">Obtenir une clé API <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCTA;
