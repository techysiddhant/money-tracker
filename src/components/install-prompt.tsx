"use client";

import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone
    ) {
      setIsStandalone(true);
      return;
    }

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Listen for Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Initial delay so we don't bombard immediately
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Could save this choice in localStorage so it doesn't bother again soon
    localStorage.setItem("pwaPromptDismissed", "true");
  };

  // Only show if we know it's not installed AND (it's iOS OR we have a deferred prompt)
  const hasBeenDismissed =
    typeof window !== "undefined" &&
    localStorage.getItem("pwaPromptDismissed") === "true";

  if (isStandalone || !showPrompt || hasBeenDismissed) return null;
  if (!isIOS && !deferredPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 flex justify-center animate-in slide-in-from-bottom flex-col sm:flex-row">
      <Card className="w-full max-w-md p-4 shadow-xl border-t sm:border sm:rounded-xl bg-background/95 backdrop-blur flex items-start gap-4">
        <div className="flex-1 space-y-1">
          <p className="font-medium text-sm">Install Money Tracker</p>
          <p className="text-xs text-muted-foreground">
            {isIOS
              ? "Install this app on your device for quick and easy access."
              : "Add to home screen for quick and easy access."}
          </p>

          {isIOS && (
            <div className="pt-2 text-xs flex items-center gap-1.5 text-muted-foreground">
              To install, tap <Share className="h-3.5 w-3.5 mx-1 text-primary" />
              and then <strong className="text-foreground">Add to Home Screen</strong>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {!isIOS && (
            <Button size="sm" onClick={handleInstallClick} className="w-full h-8 px-4 text-xs font-medium">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Install
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground relative -right-1"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Not now
          </Button>
        </div>
      </Card>
    </div>
  );
}
