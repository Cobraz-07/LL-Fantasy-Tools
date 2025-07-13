const express = require('express');
const stripe = require('stripe')(import.meta.env.PUBLIC_STRIPE_KEY);
// Add database connection (example with Supabase, similar to what you're using)
import supabase from '../../lib/supabase'; 

const app = express();

app.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  let event;

  if (endpointSecret) {
    const signature = request.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(request.body, signature, endpointSecret);
    } catch (err) {
      console.log(`⚠️ Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }
  } else {
    event = request.body;
  }

  // Handle checkout.session.completed event to track successful purchases
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Get customer email from the session
    const customerEmail = session.customer_details.email;
    
    // Store purchase information in your database
    try {
      const { error } = await supabase
        .from('purchases')
        .insert({
          email: customerEmail,
          product_id: 'premium_membership',
          status: 'active',
          stripe_session_id: session.id
        });
        
      if (error) throw error;
      console.log(`Purchase recorded for ${customerEmail}`);
    } catch (err) {
      console.error('Error recording purchase:', err);
    }
  }

  response.send();
});

app.listen(4242, () => console.log('Running on port 4242'));