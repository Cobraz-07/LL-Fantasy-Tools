app.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  let event;

  console.log('Received webhook');

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

  console.log(`Event type: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details.email;

    console.log(`Processing checkout.session.completed for ${customerEmail}`);

    try {
      // Create or retrieve a Stripe Customer
      let customerList = await stripe.customers.list({ email: customerEmail, limit: 1 });
      let customer;
      if (customerList.data.length === 0) {
        customer = await stripe.customers.create({
          email: customerEmail,
        });
        console.log(`Created new Stripe customer: ${customer.id}`);
      } else {
        customer = customerList.data[0];
        console.log(`Retrieved existing Stripe customer: ${customer.id}`);
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