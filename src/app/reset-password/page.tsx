"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import AuthShell, { AuthPasswordField, PasswordStrength } from "@/components/auth/auth-ui";
import { confirmPasswordReset } from "@/app/actions/username-auth";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setToken(new URLSearchParams(window.location.search).get("token") || "");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords do not match. Please check both fields.");
      return;
    }
    if (password.length < 8) {
      setMessage("Use at least 8 characters for your new password.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await confirmPasswordReset(token, password);
      setMessage(result.message);
      if (result.ok) {
        setDone(true);
        setPassword("");
        setConfirm("");
        window.history.replaceState(null, "", "/reset-password");
      }
    } catch {
      setMessage("Unable to reset your password. Request another link and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-content">
        <div className="auth-header">
          <span className="auth-eyebrow">SECURE ACCOUNT RECOVERY</span>
          <h1>{done ? "You're all set." : "Choose a new password."}</h1>
          <p>{done
            ? "Your password has been updated. Continue your English learning journey with your username."
            : "Choose a unique password to keep your progress and account protected."}</p>
          <p className="auth-telugu" lang="te">{done
            ? "మీ password మార్చబడింది. ఇప్పుడు login అవ్వండి."
            : "మీ account కోసం కొత్త password ఇవ్వండి."}</p>
        </div>
        {done ? (
          <div className="auth-reset-success" role="status">
            <span className="auth-success-icon" aria-hidden="true">✓</span>
            <strong>Password updated</strong>
            <p>{message}</p>
            <Link href="/" className="auth-primary auth-primary-link">
              <span>Back to sign in</span><span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : token ? (
          <form className="auth-form" onSubmit={submit}>
            <AuthPasswordField id="reset-new-password" label="New password"
              autoComplete="new-password" required minLength={8} maxLength={128}
              placeholder="Create your new password" value={password}
              onChange={(event) => setPassword(event.target.value)} />
            <PasswordStrength password={password} />
            <AuthPasswordField id="reset-confirm-password" label="Confirm password"
              autoComplete="new-password" required minLength={8} maxLength={128}
              placeholder="Re-enter your new password" value={confirm}
              onChange={(event) => setConfirm(event.target.value)} />
            {confirm && password !== confirm && <p className="auth-field-hint auth-match-hint">Passwords do not match yet.</p>}
            {message && <p className="auth-alert auth-alert-error" role="alert">{message}</p>}
            <button type="submit" className="auth-primary" disabled={busy}>
              <span>{busy ? "Updating your password…" : "Update password"}</span>
              <span aria-hidden="true">{busy ? "· · ·" : "→"}</span>
            </button>
          </form>
        ) : (
          <div className="auth-alert auth-alert-info" role="status">
            This link is missing its reset token. Open the latest link from your recovery email or request a new one.
          </div>
        )}
        {!done && <div className="auth-links">
          <Link href="/" className="auth-link">← Back to sign in</Link>
        </div>}
      </div>
    </AuthShell>
  );
}
