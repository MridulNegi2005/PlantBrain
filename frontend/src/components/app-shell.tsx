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

import { cn } from "@/lib/utils"

const navigation = [
  { code: "OV", href: "/dashboard", label: "Overview", icon: LayoutDashboardIcon },
  { code: "UP", href: "/upload", label: "Add documents", icon: UploadCloudIcon },
  { code: "DC", href: "/documents", label: "Documents", icon: FileStackIcon },
  { code: "EQ", href: "/assets", label: "Equipment", icon: BoxesIcon },
  { code: "AI", href: "/copilot", label: "Ask a question", icon: BotIcon },
  { code: "MP", href: "/graph", label: "Connections", icon: GitBranchIcon },
  { code: "DX", href: "/rca", label: "Diagnose issue", icon: SearchCheckIcon },
  { code: "CO", href: "/compliance", label: "Compliance", icon: ClipboardCheckIcon },
  { code: "AC", href: "/evaluation", label: "Accuracy", icon: ActivityIcon },
  { code: "LG", href: "/admin/audit", label: "Activity log", icon: ShieldCheckIcon },
] as const

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const current = navigation.find((item) => isActive(pathname, item.href)) ?? navigation[0]

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-50 -translate-y-20 border border-ring bg-background px-3 py-2 font-mono text-xs text-foreground focus:translate-y-0"
      >
        Skip to workspace
      </a>

      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-sidebar-border px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
              <BrainCircuitIcon className="size-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[0.62rem] font-semibold tracking-[0.18em] text-sidebar-primary uppercase">
                AI PLANT ASSISTANT
              </p>
              <p className="mt-1 font-heading text-base font-semibold tracking-[-0.02em] text-sidebar-foreground">
                PlantBrain
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-sidebar-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">
              Active plant
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[0.62rem] text-accent uppercase">
              <span className="size-1.5 bg-accent" aria-hidden="true" />
              Connected
            </span>
          </div>
          <p className="mt-2 font-mono text-xs font-medium text-sidebar-foreground">SHAKTI / UNIT-2</p>
        </div>

        <nav aria-label="Primary navigation" className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {navigation.map((item) => {
            const active = isActive(pathname, item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative grid min-h-10 grid-cols-[2rem_1.25rem_1fr] items-center gap-2 border-l-2 px-3 py-2 text-sm transition-colors duration-150 focus-visible:outline-ring",
                  active
                    ? "border-l-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                    : "border-l-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <span className={cn("font-mono text-[0.6rem]", active ? "text-sidebar-primary" : "text-muted-foreground")}>
                  {item.code}
                </span>
                <Icon className="size-4" strokeWidth={1.6} />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="border border-sidebar-border bg-sidebar-accent p-3">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-sidebar-primary" strokeWidth={1.75} />
              <span className="font-mono text-[0.65rem] font-semibold tracking-[0.12em] text-sidebar-foreground uppercase">
                Answers you can trust
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Every answer points to a real document. No source, no answer.
            </p>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-border bg-background lg:hidden">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center bg-primary text-primary-foreground">
                <BrainCircuitIcon className="size-4" strokeWidth={1.75} />
              </div>
              <div>
                <p className="font-heading text-sm font-semibold">PlantBrain</p>
                <p className="font-mono text-[0.58rem] tracking-[0.12em] text-muted-foreground uppercase">SHAKTI / UNIT-2</p>
              </div>
            </div>
            <span className="font-mono text-[0.62rem] text-accent">{current.code} / ACTIVE</span>
          </div>
          <nav
            aria-label="Primary navigation"
            className="flex gap-px overflow-x-auto border-t border-border px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {navigation.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-2 border px-3 font-mono text-[0.65rem] uppercase transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{item.code}</span>
                  <span className="font-sans text-xs normal-case">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </header>

        <div className="hidden h-12 items-center justify-between border-b border-border px-6 lg:flex">
          <div className="flex items-center gap-3">
            <span className="bg-primary px-2 py-1 font-mono text-[0.62rem] font-semibold text-primary-foreground">{current.code}</span>
            <span className="font-mono text-[0.65rem] tracking-[0.12em] text-muted-foreground uppercase">{current.label}</span>
          </div>
          <div className="flex items-center gap-5 font-mono text-[0.62rem] tracking-[0.1em] text-muted-foreground uppercase">
            <span>Plant / Shakti Unit-2</span>
            <span className="flex items-center gap-2 text-accent"><span className="size-1.5 bg-accent" /> Every answer cites a source</span>
          </div>
        </div>

        <main id="main-content" className="mx-auto min-h-[calc(100vh-3rem)] w-full max-w-[100rem] p-4 sm:p-6 lg:p-8 xl:p-10">
          <div key={pathname} className="rise">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
