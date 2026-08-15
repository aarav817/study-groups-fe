"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"

import { api } from "@/lib/api"
import { useAuth } from "@/lib/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { setUser } = useAuth()

  const [unverifiedEmail, setUnverifiedEmail] = useState("")
  const [resendStatus, setResendStatus] = useState("")
  const [resending, setResending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please fill in all fields.")
      return
    }

    try {
      setLoading(true)
      const res = await api.auth.login({ email, password })
      if (res.success && res.data?.user) {
        setUser(res.data.user)
        router.push("/groups")
      } else {
        setError(res.error?.message || "Invalid email or password.")
      }
    } catch (err: any) {
      const errMsg = err.message || ""
      if (errMsg.includes("verify") || errMsg.includes("EMAIL_NOT_VERIFIED")) {
        setUnverifiedEmail(email)
      } else {
        setError(errMsg || "Login failed. Please check your credentials.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!unverifiedEmail) return
    try {
      setResending(true)
      setResendStatus("")
      const res = await api.auth.resendVerification(unverifiedEmail)
      if (res.success) {
        setResendStatus("Verification link sent! Please check your inbox.")
      } else {
        setResendStatus(res.error?.message || "Failed to resend email.")
      }
    } catch (err: any) {
      setResendStatus(err.message || "Failed to resend email.")
    } finally {
      setResending(false)
    }
  }

  const resendOk = resendStatus.includes("sent") || resendStatus.includes("resent")

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      {unverifiedEmail ? (
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Mail className="size-6" aria-hidden />
            </span>
            <CardTitle className="text-xl">Email Verification Required</CardTitle>
            <CardDescription className="leading-relaxed">
              Your account with <strong className="font-medium text-foreground">{unverifiedEmail}</strong> requires
              email verification before signing in. Please check your inbox and click the link to activate your
              account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {resendStatus ? (
              <Alert variant={resendOk ? "default" : "destructive"}>
                <AlertDescription>{resendStatus}</AlertDescription>
              </Alert>
            ) : null}
            <Button variant="outline" className="w-full" onClick={handleResend} disabled={resending}>
              {resending ? "Resending Email..." : "Resend Verification Email"}
            </Button>
            <Button className="w-full" onClick={() => setUnverifiedEmail("")}>
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>Welcome back. Enter your details to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">University Email (.edu)</FieldLabel>
                  <Input
                    type="email"
                    id="email"
                    placeholder="alex@stanford.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    type="password"
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </FieldGroup>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
