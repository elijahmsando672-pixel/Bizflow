"use client";

import { useRouter } from "next/navigation";
import { HelpCircle, LogOut, Moon, Settings, ShieldCheck, Sun, UserCog } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-provider";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-accent/50"
        >
          <Avatar name={user?.name} size="sm" />
          <span className="hidden max-w-[120px] truncate text-sm font-medium text-foreground xl:inline">
            {user?.name ?? "Account"}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 normal-case">
          <span className="truncate text-sm font-semibold text-foreground">{user?.name ?? "Account"}</span>
          <span className="truncate text-xs font-normal normal-case text-muted-foreground">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => router.push("/dashboard/settings")}>
          <Settings className="h-4 w-4" aria-hidden />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/users")}>
          <UserCog className="h-4 w-4" aria-hidden />
          Team &amp; Roles
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/documents")}>
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Documents
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={toggleTheme}>
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4" aria-hidden />
              Light mode
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" aria-hidden />
              Dark mode
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => window.open("mailto:support@bizflow.co.ke")}>
          <HelpCircle className="h-4 w-4" aria-hidden />
          Help &amp; support
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem destructive onSelect={() => logout()}>
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
