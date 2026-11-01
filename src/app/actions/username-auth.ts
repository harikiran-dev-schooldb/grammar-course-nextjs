"use server";
import { neon } from "@neondatabase/serverless";
import { auth, neonConfigured } from "@/lib/auth-server";
import { normalizeUsername, isValidUsername } from "@/lib/usernames";

type Result = {ok:boolean;message:string};
const generic="If this username exists, password reset instructions will be sent to its recovery email.";
const sqlClient=()=>{
  if(!process.env.DATABASE_URL) throw new Error("Neon database is not configured.");
  return neon(process.env.DATABASE_URL);
};
async function usernames(){
  const sql=sqlClient();
  await sql`CREATE TABLE IF NOT EXISTS learner_usernames (
    username TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    recovery_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_learner_username CHECK (username ~ '^[a-z0-9_]{3,30}$')
  )`;
  return sql;
}

export async function claimUsername(input:string):Promise<Result>{
  const username=normalizeUsername(input);
  if(!isValidUsername(username))return {ok:false,message:"Username must be 3–30 letters, numbers or underscores."};
  if(!neonConfigured)return {ok:false,message:"Neon Auth is not configured."};
  try{
    const {data}=await auth.getSession();const user=data?.user;
    if(!user?.id||!user.email)return {ok:false,message:"Sign in first to choose a username."};
    const sql=await usernames();
    const inserted=await sql`INSERT INTO learner_usernames (username,user_id,recovery_email)
      VALUES (${username},${user.id},${user.email.toLowerCase()})
      ON CONFLICT DO NOTHING RETURNING username`;
    if(inserted.length)return {ok:true,message:"Username saved."};
    const owned=await sql`SELECT username FROM learner_usernames WHERE user_id=${user.id} LIMIT 1`;
    return owned.length
      ? owned[0].username===username?{ok:true,message:"Username saved."}:{ok:false,message:"This account already has a username."}
      : {ok:false,message:"Username is already taken."};
  }catch{return {ok:false,message:"Could not save the username. Please try again."};}
}

export async function getMyUsername():Promise<string|null>{
  if(!neonConfigured||!process.env.DATABASE_URL)return null;
  try{
    const {data}=await auth.getSession();
    if(!data?.user?.id)return null;
    const sql=await usernames();
    const rows=await sql`SELECT username FROM learner_usernames WHERE user_id=${data.user.id} LIMIT 1`;
    return typeof rows[0]?.username==="string"?rows[0].username:null;
  }catch{return null;}
}

/** The account email is looked up on the server only. Neon validates passwords and creates sessions. */
export async function signInWithUsername(input:string,password:string):Promise<Result>{
  const username=normalizeUsername(input);
  if(!isValidUsername(username)||!password||password.length>1024||!neonConfigured)return {ok:false,message:"Invalid username or password."};
  try{
    const sql=await usernames();
    const rows=await sql`SELECT recovery_email FROM learner_usernames WHERE username=${username} LIMIT 1`;
    if(typeof rows[0]?.recovery_email!=="string")return {ok:false,message:"Invalid username or password."};
    const result=await auth.signIn.email({email:String(rows[0].recovery_email),password});
    return result.error?{ok:false,message:"Invalid username or password."}:{ok:true,message:"Signed in."};
  }catch{return {ok:false,message:"Unable to sign in. Please try again."};}
}

type ResetApi={
  requestPasswordReset(input:{email:string;redirectTo:string}):Promise<{error?:{message?:string}|null}>;
  resetPassword(input:{token:string;newPassword:string}):Promise<{error?:{message?:string}|null}>;
};
const resetApi=auth as unknown as ResetApi;

/** Uniform response prevents account enumeration; throttle by username. */
export async function requestUsernamePasswordReset(input:string):Promise<Result>{
  const username=normalizeUsername(input);
  if(!isValidUsername(username)||!neonConfigured||!process.env.DATABASE_URL)return {ok:true,message:generic};
  try{
    const sql=await usernames();
    await sql`CREATE TABLE IF NOT EXISTS learner_reset_throttle (
      username TEXT PRIMARY KEY,
      last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    const rows=await sql`SELECT recovery_email FROM learner_usernames WHERE username=${username} LIMIT 1`;
    if(!rows.length)return {ok:true,message:generic};
    const permit=await sql`INSERT INTO learner_reset_throttle (username,last_request_at)
      VALUES (${username},NOW())
      ON CONFLICT (username) DO UPDATE SET last_request_at=NOW()
      WHERE learner_reset_throttle.last_request_at < NOW() - INTERVAL '2 minutes'
      RETURNING username`;
    if(!permit.length)return {ok:true,message:generic};
    const origin=new URL(process.env.APP_BASE_URL||"https://grammar-course-nextjs.vercel.app");
    if(!["https:","http:"].includes(origin.protocol))return {ok:true,message:generic};
    const result=await resetApi.requestPasswordReset({
      email:String(rows[0].recovery_email),
      redirectTo:new URL("/reset-password",origin).toString(),
    });
    if(result.error)console.error("Neon password reset delivery:",result.error.message);
  }catch(error){console.error("Password reset:",error instanceof Error?error.message:"Unknown");}
  return {ok:true,message:generic};
}

export async function confirmPasswordReset(token:string,newPassword:string):Promise<Result>{
  if(typeof token!=="string"||token.length<8||token.length>4096)return {ok:false,message:"Reset token is invalid."};
  if(newPassword.length<8||newPassword.length>128)return {ok:false,message:"Password must be 8–128 characters."};
  if(!neonConfigured)return {ok:false,message:"Neon Auth is not configured."};
  try{
    const result=await resetApi.resetPassword({token,newPassword});
    return result.error?{ok:false,message:"Link expired or invalid; request another."}:{ok:true,message:"Password updated. Sign in with your username."};
  }catch{return {ok:false,message:"Unable to reset password. Request another link."};}
}
