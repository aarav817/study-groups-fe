"use client"

import Link from "next/link"
import { ArrowRight, GraduationCap, BookOpen, FolderTree, MessageSquare } from "lucide-react"

import { useAuth } from "@/lib/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const FEATURES = [
  {
    icon: BookOpen,
    title: "Course Study Hubs",
    description:
      "Create public or private study groups tailored to your specific university courses and departments.",
  },
  {
    icon: FolderTree,
    title: "Folder Hierarchy & Files",
    description:
      "Upload notes, lecture slides, and past exams organized neatly in folder hierarchies.",
  },
  {
    icon: MessageSquare,
    title: "Direct Messaging",
    description:
      "Send 1-on-1 chat requests to classmates using custom 6-character user codes.",
  },
]

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <section className="flex flex-col items-center text-center">
        <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-sm font-medium">
          <GraduationCap className="size-4 text-primary" aria-hidden />
          Verified University Student Platform
        </Badge>

        <h1 className="mt-6 max-w-3xl text-balance font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          A simple study platform to boost your focus
        </h1>

        <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Connect with university classmates, share organized study materials, schedule live review
          sessions, and message verified .edu students.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Button size="lg" nativeButton={false} render={<Link href="/groups" />}>
              Go to My Groups
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            <>
              <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
                Get Started with .edu Email
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
                Sign In
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="h-full">
            <CardHeader>
              <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <CardTitle className="mt-4 text-lg">{title}</CardTitle>
              <CardDescription className="leading-relaxed">{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  )
}
