"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "row-span-1 rounded-3xl group/bento transition duration-200 p-6 bg-white/85 backdrop-blur-[28px] border border-white/95 shadow-[0_16px_36px_-8px_rgba(15,23,42,0.05)] hover:border-cyan-200 flex flex-col justify-between space-y-4 hover:shadow-lg",
        className
      )}
    >
      {header}
      <div className="transition duration-200">
        {icon}
        <div className="font-bold text-slate-900 mb-1 mt-2 tracking-tight">
          {title}
        </div>
        <div className="text-xs text-slate-600 leading-relaxed font-medium">
          {description}
        </div>
      </div>
    </motion.div>
  );
};
