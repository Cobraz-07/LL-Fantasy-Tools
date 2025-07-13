export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  
  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Check if user has purchased the premium membership
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('email', email)
    .eq('product_id', 'premium_membership')
    .eq('status', 'active')
    .single();

  if (error) {
    return new Response(JSON.stringify({ hasPurchased: false }), { 
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ hasPurchased: !!data }), { 
    headers: { "Content-Type": "application/json" }
  });
};