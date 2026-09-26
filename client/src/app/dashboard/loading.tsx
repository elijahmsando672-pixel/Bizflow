"use client";

import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[62px]" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-7 w-44" />
          </PanelHeader>
          <PanelBody>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="mt-4 h-[240px] w-full" />
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader>
            <Skeleton className="h-4 w-28" />
          </PanelHeader>
          <PanelBody className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </PanelBody>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader>
            <Skeleton className="h-4 w-44" />
          </PanelHeader>
          <PanelBody className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader>
            <Skeleton className="h-4 w-32" />
          </PanelHeader>
          <PanelBody className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
