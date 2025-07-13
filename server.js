const express = require('express');
const stripe = require('stripe')(import.meta.env.PUBLIC_STRIPE_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_SERVICE_ROLE_KEY);

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details.email;

    try {
      // Create or retrieve a Stripe Customer
      let customer = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customer.data.length === 0) {
        customer = await stripe.customers.create({
          email: customerEmail,
        });
      } else {
        customer = customer.data[0];
      }

      // Store purchase and customer information in your database
      const { error } = await supabase
        .from('purchases')
        .insert({
          email: customerEmail,
          product_id: 'premium_membership',
          status: 'active',
          stripe_session_id: session.id,
          stripe_customer_id: customer.id
        });
        
      if (error) throw error;
      console.log(`Purchase recorded for ${customerEmail}`);
    } catch (err) {
      console.error('Error recording purchase or creating customer:', err);
    }
  }

  response.send();
});

app.listen(4242, () => console.log('Running on port 4242'));