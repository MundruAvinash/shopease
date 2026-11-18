
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 10 minutes
const WARNING_TIME = 60 * 1000; // 1 minute
const WARNING_AFTER = INACTIVITY_LIMIT - WARNING_TIME;

const LOGOUT_EVENT_KEY = "shopease_logout_event";
const ACTIVITY_EVENT_KEY = "shopease_activity_event";

export default function SessionTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef<number | null>(null);
  const logoutStartedRef = useRef(false);

  useEffect(() => {
    let isAuthenticated = false;
    let lastBroadcastTime = 0;

    const clearTimers = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);

      timerRef.current = null;
      countdownRef.current = null;
    };

    const broadcastLogout = (reason: "inactive" | "manual") => {
      localStorage.setItem(
        LOGOUT_EVENT_KEY,
        JSON.stringify({ reason, timestamp: Date.now() })
      );
    };

    const logout = async () => {
      if (logoutStartedRef.current) return;

      logoutStartedRef.current = true;
      clearTimers();
      setShowWarning(false);

      broadcastLogout("inactive");

      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (error) {
        console.error("Automatic logout failed:", error);
      } finally {
        window.location.replace("/login?reason=inactive");
      }
    };

    const startWarning = () => {
      if (logoutStartedRef.current || countdownRef.current) return;

      setShowWarning(true);
      setRemainingSeconds(60);

      const deadline = Date.now() + WARNING_TIME;

      countdownRef.current = setInterval(() => {
        const secondsLeft = Math.max(
          0,
          Math.ceil((deadline - Date.now()) / 1000)
        );

        setRemainingSeconds(secondsLeft);

        if (secondsLeft <= 0) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }

          void logout();
        }
      }, 1000);
    };

    const checkInactivity = () => {
      if (
        !isAuthenticated ||
        logoutStartedRef.current ||
        lastActivityRef.current === null
      ) {
        return;
      }

      const inactiveTime = Date.now() - lastActivityRef.current;
      const remainingTime = INACTIVITY_LIMIT - inactiveTime;

      if (remainingTime <= 0) {
        void logout();
        return;
      }

      if (remainingTime <= WARNING_TIME) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        startWarning();
        return;
      }

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(
        checkInactivity,
        remainingTime - WARNING_TIME
      );
    };

    const resetTimer = (broadcast = true) => {
      if (!isAuthenticated || logoutStartedRef.current) return;

      lastActivityRef.current = Date.now();

      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);

      timerRef.current = null;
      countdownRef.current = null;

      setShowWarning(false);
      setRemainingSeconds(60);

      timerRef.current = setTimeout(
        checkInactivity,
        WARNING_AFTER
      );

      if (broadcast) {
        const now = Date.now();

        if (now - lastBroadcastTime >= 1000) {
          lastBroadcastTime = now;

          localStorage.setItem(
            ACTIVITY_EVENT_KEY,
            String(now)
          );
        }
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOGOUT_EVENT_KEY && event.newValue) {
        let reason: "inactive" | "manual" = "manual";

        try {
          const data = JSON.parse(event.newValue);
          reason = data.reason === "inactive" ? "inactive" : "manual";
        } catch {
          // Use manual logout as fallback
        }

        logoutStartedRef.current = true;
        clearTimers();

        window.location.replace(
          reason === "inactive" ? "/login?reason=inactive" : "/login"
        );
      }

      if (
        event.key === ACTIVITY_EVENT_KEY &&
        event.newValue &&
        isAuthenticated
      ) {
        const activityTime = Number(event.newValue);

        if (
          Number.isFinite(activityTime) &&
          (lastActivityRef.current === null ||
            activityTime > lastActivityRef.current)
        ) {
          resetTimer(false);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkInactivity();
      }
    };

    const initialize = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = await response.json();

        if (!result.success) return;

        isAuthenticated = true;
        lastActivityRef.current = Date.now();

        resetTimer();
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, () => resetTimer());
    });

    window.addEventListener("storage", handleStorageChange);

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    void initialize();

    return () => {
      clearTimers();
      window.removeEventListener("storage", handleStorageChange);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  const stayLoggedIn = useCallback(() => {
    // User activity resets the inactivity timer.
    window.dispatchEvent(new Event("shopease-user-active"));
  }, []);

  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-warning-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-3xl">
                ⏳
              </div>
            </div>

            <h2
              id="session-warning-title"
              className="mb-3 text-center text-2xl font-bold text-gray-800"
            >
              Session Expiring Soon!
            </h2>

            <p className="mb-4 text-center text-gray-600">
              You have been inactive. Your ShopEase session will
              expire soon.
            </p>

            <p className="mb-6 text-center text-lg font-semibold text-red-600">
              Automatic logout in {remainingSeconds} seconds
            </p>

            <button
              onClick={stayLoggedIn}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      )}
    </>
  );
}
