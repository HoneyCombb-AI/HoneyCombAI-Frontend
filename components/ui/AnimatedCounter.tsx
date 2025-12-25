"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
    value: number;
    className?: string;
    suffix?: string;
}

export function AnimatedCounter({ value, className, suffix = "" }: AnimatedCounterProps) {
    let spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    let display = useTransform(spring, (current) => Math.round(current).toLocaleString());

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return (
        <span className={className}>
            <motion.span>{display}</motion.span>
            {suffix}
        </span>
    );
}
