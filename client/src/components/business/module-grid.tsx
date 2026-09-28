"use client";

import type { BusinessModule } from "@/lib/business-modules";
import { ModuleCard } from "@/components/business/module-card";

interface ModuleGridProps {
  modules: BusinessModule[];
  onSelect: (module: BusinessModule) => void;
  disabled?: boolean;
}

/** Two columns on phones, three from 651px, four on desktop. */
export function ModuleGrid({ modules, onSelect, disabled }: ModuleGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 min-[651px]:grid-cols-3 min-[651px]:gap-4 lg:grid-cols-4">
      {modules.map((module, index) => (
        <ModuleCard
          key={module.id}
          module={module}
          index={index}
          onSelect={onSelect}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
