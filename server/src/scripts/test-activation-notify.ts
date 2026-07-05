import prisma from '../config/prisma';
import { SubscriptionActivationService } from '../services/SubscriptionActivationService';

async function run() {
  const orderId = '79bba37e-e930-4d7e-8c3e-cb1a184ba1da';
  console.log(`Running manually notifyAndSendInvoice for order ID: ${orderId}...`);
  
  try {
    await SubscriptionActivationService.notifyAndSendInvoice(orderId);
    console.log("notifyAndSendInvoice completed successfully without throwing exceptions.");
  } catch (err) {
    console.error("notifyAndSendInvoice threw an error:", err);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
