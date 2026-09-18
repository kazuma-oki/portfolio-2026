"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/** ページが切り替わるたびに、下から軽くフェードインさせる */
export default function PageTransition({ children }) {
  const pathname = usePathname();

  return (
    <motion.main
      key={pathname}
      id="main"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.main>
  );
}
