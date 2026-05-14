import { createClient } from "./supabase/server"
import { createClient as createBrowserClient } from "./supabase/client"
import { headers } from "next/headers"

export async function getUser() {
  const headersList = await headers()
  const authorization = headersList.get("authorization")

  // Kalau ada Bearer token (dari Postman), pakai ini
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.replace("Bearer ", "")
    const supabase = createBrowserClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null
    return user
  }

  // Kalau dari browser (pakai cookie session)
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}