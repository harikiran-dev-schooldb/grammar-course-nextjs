"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { confirmPasswordReset } from "@/app/actions/username-auth";
export default function ResetPasswordPage(){
 const [token,setToken]=useState("");const [password,setPassword]=useState("");
 const [confirm,setConfirm]=useState("");const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);const [done,setDone]=useState(false);
 useEffect(()=>{setToken(new URLSearchParams(window.location.search).get("token")||"");},[]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(password!==confirm){setMessage("Passwords do not match.");return;}
  setBusy(true);
  try{const result=await confirmPasswordReset(token,password);setMessage(result.message);
    if(result.ok){setDone(true);setPassword("");setConfirm("");window.history.replaceState(null,"","/reset-password");}
  }catch{setMessage("Unable to reset password.");}finally{setBusy(false);}
 }
 return <main className="login-page"><section className="login-card">
  <div className="login-brand"><span className="brand-mark">G</span><div><strong>Grammar Studio</strong><small>English · తెలుగు</small></div></div>
  <p className="kicker">Account recovery</p><h1>Set a new password</h1>
  {done?<p className="login-intro" role="status">{message}</p>:token?<form onSubmit={submit}>
   <label>New password<input type="password" minLength={8} maxLength={128} autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
   <label>Confirm password<input type="password" minLength={8} maxLength={128} autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
   {message&&<p className="auth-error" role="alert">{message}</p>}
   <button type="submit" disabled={busy}>{busy?"Updating…":"Update password"}</button>
  </form>:<p className="login-intro">Open the reset link from your recovery email or request another.</p>}
  <p className="login-intro"><Link href="/">Back to sign in</Link></p>
 </section></main>;
}
