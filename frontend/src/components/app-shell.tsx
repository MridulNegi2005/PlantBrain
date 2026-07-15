"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ActivityIcon,
  BotIcon,
  BoxesIcon,
  BrainCircuitIcon,
  ClipboardCheckIcon,
  FileStackIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  SearchCheckIcon,
  ShieldCheckIcon,
  UploadCloudIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const navigation = [
  { href: "/dashboard", label: "Plant overview", icon: LayoutDashboardIcon },
  { href: "/upload", label: "Ingestion", icon: UploadCloudIcon },
  { href: "/documents", label: "Documents", icon: FileStackIcon },
  { href: "/assets", label: "Assets", icon: BoxesIcon },
  { href: "/copilot", label: "Cited copilot", icon: BotIcon },
  { href: "/graph", label: "Knowledge graph", icon: GitBranchIcon },
  { href: "/rca", label: "Root cause", icon: SearchCheckIcon },
  { href: "/compliance", label: "Compliance", icon: ClipboardCheckIcon },
  { href: "/evaluation", label: "Evaluation", icon: ActivityIcon },
  { href: "/admin/audit", label: "Audit log", icon: ShieldCheckIcon },
]

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar/95 lg:flex lg:h-screen lg:flex-col lg:sticky lg:top-0">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuitIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold tracking-tight">PlantBrain AI</p>
            <p className="truncate font-mono text-[0.65rem] text-muted-foreground">SHAKTI / UNIT-2</p>
          </div>
        </div>
        <Separator />
        <nav aria-label="Primary navigation" className="flex flex-1 flex-col gap-1 p-3">
          {navigation.map((item) => {
            const active = isActive(pathname, item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  buttonVariants({ variant: active ? "secondary" : "ghost", size: "sm" }),
                  "w-full justify-start gap-2.5",
                  active && "text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4">
          <div className="rounded-lg border bg-background/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Evidence policy</span>
              <Badge variant="outline">Enforced</Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              No citation means no operational answer.
            </p>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-50 border-b bg-background px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BrainCircuitIcon className="size-5 text-primary" />
              <span className="font-heading text-sm font-semibold">PlantBrain AI</span>
            </div>
            <Badge variant="outline" className="font-mono">UNIT-2</Badge>
          </div>
          <nav aria-label="Primary navigation" className="mt-3 flex gap-1 overflow-x-auto pb-1">
            {navigation.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: active ? "secondary" : "ghost", size: "xs" }),
                    "shrink-0"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </header>

        <main className="mx-auto min-h-screen w-full max-w-[96rem] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
