import Stripe from "stripe";
import { config } from "../config.js";

const stripe = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey)
  : null;

export default stripe;
