"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, PieChart, Users, Wallet, Plus } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = useSession();
  const isLoggedIn = !isPending && !!session;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 lg:px-8 h-16 flex items-center border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <Link className="flex items-center justify-center font-bold font-heading text-lg gap-2" href="/">
          <Image
            src="/logo.png"
            alt="TrackMint"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span>TrackMint</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          {isLoggedIn ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Hey, {session.user?.name || "there"}
              </span>
              <Button asChild size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Link className="text-sm font-medium hover:underline underline-offset-4" href="/auth/signin">
                Sign In
              </Link>
              <Button asChild size="sm">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-24 md:py-32 lg:py-48 flex items-center justify-center px-4">
          <div className="container max-w-5xl text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-heading leading-tight">
                Take control of your <span className="text-primary">finances</span> today
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                TrackMint makes it easy to monitor your spending, manage shared expenses, and hit your financial goals.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {isLoggedIn ? (
                <>
                  <Button asChild size="lg" className="h-12 px-8 text-base">
                    <Link href="/expenses/new">
                      <Plus className="mr-2 h-4 w-4" /> Add Expense
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
                    <Link href="/dashboard">
                      Go to Dashboard
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="h-12 px-8 text-base">
                    <Link href="/auth/signup">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
                    <Link href="/dashboard">
                      Go to Dashboard
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
        <section className="w-full py-16 md:py-24 bg-muted/50 border-t">
          <div className="container max-w-6xl mx-auto px-4 md:px-6">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 items-start justify-center">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <PieChart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-heading">Track Spending</h3>
                <p className="text-muted-foreground leading-relaxed">Log expenses quickly and see exactly where your money goes with detailed cycles.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-heading">Split Bills</h3>
                <p className="text-muted-foreground leading-relaxed">Easily share expenses with family or friends and automatically calculate who owes what.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-heading">Manage Methods</h3>
                <p className="text-muted-foreground leading-relaxed">Keep track of multiple payment methods like credit cards, cash, and bank accounts.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-8 w-full border-t flex items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} TrackMint. Built for personal finance management.
        </p>
      </footer>
    </div>
  );
}
