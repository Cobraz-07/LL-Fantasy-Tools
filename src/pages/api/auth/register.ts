export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const display_name = formData.get("username")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password || !display_name) {
    return new Response("Email, password and username are required", { status: 400 });
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name,
      },
    },
  });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return redirect("/api/signin");
};