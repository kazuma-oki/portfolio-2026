"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

/**
 * ページが切り替わるたびに、ふわっと現れる。
 * 位置は動かさず透明度だけにしている。下から持ち上げると
 * 「画面がスクロールした」ように見えてしまうため。
 */
export default function PageTransition({ children }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  return (
    <motion.main
      key={pathname}
      id="main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.main>
  );
}
