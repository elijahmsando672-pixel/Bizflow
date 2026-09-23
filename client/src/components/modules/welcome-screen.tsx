"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { welcomeSteps } from "@/lib/modules-data";

interface WelcomeScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function WelcomeScreen({ onComplete, onSkip }: WelcomeScreenProps) {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";
  const [step, setStep] = useState(0);
  const isLast = step === welcomeSteps.length - 1;
  const current = welcomeSteps[step];

  return (
    <div className="flex min-h-full items-center justify-center py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan-600 text-white shadow-sm">
            <current.icon className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome to BizFlow, {firstName} <span aria-hidden>👋</span>
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Let&apos;s get your workspace ready so you can start managing your business.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="min-h-[300px] p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.18 }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {current.eyebrow}
                </p>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <current.icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">{current.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{current.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between border-t border-border px-8 py-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className={step === 0 ? "invisible" : undefined}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {welcomeSteps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <Button type="button" onClick={() => (isLast ? onComplete() : setStep((s) => s + 1))}>
              {isLast ? current.cta : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}