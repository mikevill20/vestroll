"use client";
import TitleHeader from "@/components/features/dashboard/TitleHeader";
import avatar from "@/../public/avatar/avatar.png";
import OnboardingCheckList from "@/components/features/dashboard/home/OnboardingCheckList";
import RequiringAttention from "@/components/features/dashboard/home/RequiringAttention";
import QuickAction from "@/components/features/dashboard/home/QuickAction";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export default function DashboardPage() {
  const user = {
    name: "Peter",
    email: "peter@vestroll.com",
    userType: "Administrator",
    avatar: avatar,
  };
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full"
    >
      <motion.header
        variants={itemVariants}
        className="px-6 sm:pt-6 pb-1 space-y-1 sm:space-y-2 bg-white sm:border-b sm:border-[#DCE0E5] sm:pb-5 dark:bg-gray-900 dark:border-gray-800"
      >
        <h1 className="font-bold text-2xl sm:font-semibold sm:text-[1.75rem] text-text-header dark:text-gray-100">
          Welcome back <span className="text-[#9D62D0]">Oreoluwa</span>!
        </h1>
        <p className="text-xs text-[#7F8C9F] font-medium leading-[120%] tracking-[0%] dark:text-gray-400">
          What will you like to do today?
        </p>
      </motion.header>
      <motion.div variants={itemVariants} className="p-2 sm:p-4">
        <OnboardingCheckList />
      </motion.div>
      <motion.div
        variants={itemVariants}
        className="flex flex-col-reverse w-full gap-4 p-2 xl:flex-row sm:p-4"
      >
        <RequiringAttention />
        <QuickAction />
      </motion.div>
    </motion.div>
  );
}
