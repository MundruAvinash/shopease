
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const INACTIVITY_LIMIT = 10 * 60 * 1000; // 2 minutes
const WARNING_TIME = 60 * 1000; // 1 minute warning
const WARNING_AFTER = INACTIVITY_LIMIT - WARNING_TIME;

const LOGOUT_EVENT_KEY = "shopease_logout_event";
const ACTIVITY_EVENT_KEY = "shopease_activity_event";
const USER_ACTIVE_EVENT = "shopease-user-active";

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

    // Clear all timers
    const clearTimers = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);

      timerRef.current = null;
      countdownRef.current = null;
    };

    // Notify other tabs about logout
    const broadcastLogout = () => {
      localStorage.setItem(
        LOGOUT_EVENT_KEY,
        JSON.stringify({ reason: "inactive", timestamp: Date.now() })
      );
    };

    // Logout user and redirect to login
    const logout = async () => {
      if (logoutStartedRef.current) return;

      logoutStartedRef.current = true;
      clearTimers();
      setShowWarning(false);
      broadcastLogout();

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("Logout failed:", error);
      } finally {
        window.location.replace("/login?reason=inactive");
      }
    };

    // Display warning and start 60-second countdown
    const startWarning = () => {
      if (countdownRef.current || logoutStartedRef.current) return;

      setShowWarning(true);
      const deadline = Date.now() + WARNING_TIME;

      countdownRef.current = setInterval(() => {
        const seconds = Math.max(
          0,
          Math.ceil((deadline - Date.now()) / 1000)
        );

        setRemainingSeconds(seconds);

        if (seconds <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          void logout();
        }
      }, 1000);
    };

    // Check whether the inactivity limit has been reached
    const checkInactivity = () => {
      if (!isAuthenticated || logoutStartedRef.current) return;
      if (lastActivityRef.current === null) return;

      const inactiveTime = Date.now() - lastActivityRef.current;
      const remainingTime = INACTIVITY_LIMIT - inactiveTime;

      if (remainingTime <= 0) {
        void logout();
      } else if (remainingTime <= WARNING_TIME) {
        startWarning();
      } else {
        timerRef.current = setTimeout(
          checkInactivity,
          remainingTime - WARNING_TIME
        );
      }
    };

    // Reset inactivity timer whenever the user is active
    const resetTimer = (broadcast = true) => {
      if (!isAuthenticated || logoutStartedRef.current) return;

      lastActivityRef.current = Date.now();
      clearTimers();

      setShowWarning(false);
      setRemainingSeconds(60);

      timerRef.current = setTimeout(checkInactivity, WARNING_AFTER);

      // Synchronize activity with other tabs
      if (broadcast && Date.now() - lastBroadcastTime >= 1000) {
        lastBroadcastTime = Date.now();
        localStorage.setItem(ACTIVITY_EVENT_KEY, String(Date.now()));
      }
    };



    // Handle Stay Logged In button
    const handleUserActive = () => resetTimer();

    // Synchronize logout and activity across browser tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOGOUT_EVENT_KEY && event.newValue) {
        logoutStartedRef.current = true;
        clearTimers();
        window.location.replace("/login?reason=inactive");
      }

      if (event.key === ACTIVITY_EVENT_KEY && event.newValue && isAuthenticated) {
        const activityTime = Number(event.newValue);

        if (
          Number.isFinite(activityTime) &&
          activityTime > (lastActivityRef.current ?? 0)
        ) {
          resetTimer(false);
        }
      }
    };

    // Recheck inactivity when the user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") checkInactivity();
    };

    // Verify authentication before starting the timer
    const initialize = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
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

    


    window.addEventListener(USER_ACTIVE_EVENT, handleUserActive);
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    void initialize();

    // Remove timers and event listeners when component unmounts
    return () => {
      clearTimers();

      window.removeEventListener(USER_ACTIVE_EVENT, handleUserActive);
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Reset timer when user clicks Stay Logged In
  const stayLoggedIn = useCallback(() => {
    window.dispatchEvent(new Event(USER_ACTIVE_EVENT));
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
              You have been inactive. Your ShopEase session will expire soon.
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
