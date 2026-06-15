"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginWithEmail } from "@/lib/api";

// ── The two pre-seeded demo users ─────────────────────────────────────────────
const DEMO_USERS = [
  {
    name: "Ravi Kumar",
    email: "ravi@example.com",
    password: "Amazon@123",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi",
    subtitle: "user_001 · customer C001",
  },
  {
    name: "Shreya Sharma",
    email: "shreya@example.com",
    password: "Prime#456",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Shreya",
    subtitle: "user_002 · customer C002",
  },
];

export default function AuthPage() {
  const router = useRouter();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState("");

  // If already logged in, skip to home
  useEffect(() => {
    try {
      const user = localStorage.getItem("amazon_now_user");
      if (user) router.replace("/");
    } catch {
      /* ignore */
    }
  }, [router]);

  async function handleUserLogin(user: (typeof DEMO_USERS)[0]) {
    setError("");
    setLoadingEmail(user.email);
    try {
      const authUser = await loginWithEmail(user.email, user.password);
      localStorage.setItem("amazon_now_user", JSON.stringify(authUser));
      localStorage.setItem("my_name", authUser.name);
      sessionStorage.setItem("my_name", authUser.name);
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoadingEmail(null);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          width: "100%",
          background: "#131921",
          padding: "12px 0",
          display: "flex",
          justifyContent: "center",
          marginBottom: 36,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#FF9900",
              fontFamily: "Georgia, serif",
              letterSpacing: -1,
            }}
          >
            amazon
          </span>
          <div
            style={{
              background: "#FF9900",
              color: "#131921",
              fontSize: 9,
              fontWeight: 800,
              padding: "1px 5px",
              borderRadius: 3,
              marginTop: 2,
            }}
          >
            now
          </div>
        </div>
      </div>

      {/* ── Card ── */}
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          border: "1px solid #D5D9D9",
          borderRadius: 8,
          padding: "28px 30px 32px",
          background: "white",
          marginBottom: 18,
        }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: "#0F1111",
            margin: "0 0 6px",
          }}
        >
          Sign in
        </h1>
        <p style={{ fontSize: 13, color: "#565959", margin: "0 0 24px" }}>
          Choose an account to continue
        </p>

        {/* Error banner */}
        {error && (
          <div
            style={{
              background: "#FFF3CD",
              border: "1px solid #FFC107",
              borderLeft: "4px solid #E77600",
              borderRadius: 4,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 13,
              color: "#5A3E00",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* User cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {DEMO_USERS.map((user) => {
            const isLoading = loadingEmail === user.email;
            return (
              <button
                key={user.email}
                onClick={() => handleUserLogin(user)}
                disabled={loadingEmail !== null}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                  padding: "14px 16px",
                  background: isLoading ? "#FFFBF0" : "white",
                  border: "1px solid",
                  borderColor: isLoading ? "#E77600" : "#D5D9D9",
                  borderRadius: 8,
                  cursor: loadingEmail !== null ? "wait" : "pointer",
                  textAlign: "left",
                  transition: "border-color 0.15s, background 0.15s",
                  boxShadow: "none",
                }}
                onMouseEnter={(e) => {
                  if (!loadingEmail)
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "#E77600";
                }}
                onMouseLeave={(e) => {
                  if (!loadingEmail)
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "#D5D9D9";
                }}
              >
                {/* Avatar */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar}
                  alt={user.name}
                  width={44}
                  height={44}
                  style={{
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "#F5F5F5",
                  }}
                />

                {/* Name + subtitle */}
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#0F1111",
                    }}
                  >
                    {user.name}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 12,
                      color: "#767676",
                    }}
                  >
                    {user.email}
                  </p>
                </div>

                {/* Arrow / spinner */}
                {isLoading ? (
                  <span style={spinnerStyle} />
                ) : (
                  <span style={{ fontSize: 18, color: "#767676" }}>›</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Fine print */}
        <p
          style={{
            fontSize: 11,
            color: "#767676",
            margin: "22px 0 0",
            lineHeight: 1.6,
          }}
        >
          By continuing, you agree to Amazon&apos;s{" "}
          <span style={{ color: "#007185", cursor: "pointer" }}>
            Conditions of Use
          </span>{" "}
          and{" "}
          <span style={{ color: "#007185", cursor: "pointer" }}>
            Privacy Notice
          </span>
          .
        </p>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          width: "100%",
          maxWidth: 380,
        }}
      >
        <div style={{ flex: 1, height: 1, background: "#E0E0E0" }} />
        <svg width="80" height="20" viewBox="0 0 80 20" fill="none">
          <text
            x="0"
            y="15"
            fontSize="13"
            fontWeight="700"
            fill="#767676"
            fontFamily="Georgia, serif"
          >
            amazon
          </text>
        </svg>
        <div style={{ flex: 1, height: 1, background: "#E0E0E0" }} />
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        {["Conditions of Use", "Privacy Notice", "Help"].map((t) => (
          <span
            key={t}
            style={{ fontSize: 11, color: "#007185", cursor: "pointer" }}
          >
            {t}
          </span>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "#767676", marginBottom: 40 }}>
        © 1996–2026, Amazon.com, Inc. or its affiliates
      </p>
    </div>
  );
}

const spinnerStyle: React.CSSProperties = {
  display: "inline-block",
  width: 16,
  height: 16,
  border: "2px solid #C89411",
  borderTop: "2px solid transparent",
  borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
  flexShrink: 0,
};
