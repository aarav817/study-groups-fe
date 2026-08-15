"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Users,
  CalendarDays,
  Library,
  MessagesSquare,
  ShieldCheck,
  Lock,
  User,
  Settings,
  LogOut,
  LogIn,
} from "lucide-react"

import { useAuth } from "@/lib/AuthContext"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NAV_ITEMS = [
  { href: "/groups", label: "Groups", icon: Users, match: (p: string) => p.startsWith("/groups") },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, match: (p: string) => p === "/calendar" },
  { href: "/materials", label: "Materials Library", icon: Library, match: (p: string) => p === "/materials" },
  { href: "/messages", label: "Messages", icon: MessagesSquare, match: (p: string) => p === "/messages" },
]

function initials(name?: string | null) {
  if (!name) return "U"
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? "U").concat(parts[1]?.[0] ?? "").toUpperCase()
}

function Brand({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 no-underline" aria-label="locked in. home">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Lock className="size-4" aria-hidden />
      </span>
      <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
        locked in<span className="text-primary">.</span>
      </span>
    </Link>
  )
}

function HeaderNav() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) {
    return (
      <nav className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/login" />}
          className={cn(pathname === "/login" && "text-primary")}
        >
          <LogIn data-icon="inline-start" />
          Sign In
        </Button>
        <Button size="sm" nativeButton={false} render={<Link href="/signup" />}>
          Get Started
        </Button>
      </nav>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Account menu"
      >
        <Avatar className="size-8 border border-border">
          {user.avatar_url ? <AvatarImage src={user.avatar_url} alt={user.full_name ?? "You"} /> : null}
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {initials(user.full_name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">{user.full_name ?? "Your account"}</span>
          {user.email ? <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account" />}>
          <User />
          Account Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logout()}>
          <LogOut />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SidebarNav() {
  const { user } = useAuth()
  const pathname = usePathname()
  const showAdmin = Boolean(user?.is_admin) || pathname === "/admin"

  const items = [...NAV_ITEMS]
  if (showAdmin) {
    items.push({ href: "/admin", label: "Admin Panel", icon: ShieldCheck, match: (p: string) => p === "/admin" })
  }

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar md:block">
      <nav className="sticky top-16 flex flex-col gap-1 p-4">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/signup"

  useEffect(() => {
    if (!loading && !user && !isPublicPage) {
      router.replace("/login")
    }
  }, [loading, user, isPublicPage, router])

  if (!loading && !user && !isPublicPage) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur">
        <Brand href={user ? "/groups" : "/"} />
        <HeaderNav />
      </header>

      {isPublicPage ? (
        <main className="flex-1">{children}</main>
      ) : (
        <div className="flex flex-1">
          <SidebarNav />
          <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
        </div>
      )}
    </div>
  )
}
