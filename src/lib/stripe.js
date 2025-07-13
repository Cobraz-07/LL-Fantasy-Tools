import Stripe from 'stripe';

// Use environment variable for the API key
const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export default stripe;