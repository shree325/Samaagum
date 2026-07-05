import PDFDocument from 'pdfkit';
import prisma from '../config/prisma';

export class InvoiceService {
    /**
     * Generates a PDF invoice in-memory for a completed subscription order.
     * Persists the invoice record with the PDF byte array in the database and returns it.
     */
    static async generateInvoice(orderId: string): Promise<any> {
        console.log(`[InvoiceService] Starting in-memory invoice generation for order ID: ${orderId}`);
        try {
            // 1. Fetch Order with plan and user details
            const order = await prisma.subscription_orders.findUnique({
                where: { id: orderId },
                include: {
                    admin_subscription_plans: true,
                    users: true
                }
            });

            if (!order) {
                throw new Error(`Order ${orderId} not found`);
            }

            if (order.status !== 'completed') {
                throw new Error(`Order ${orderId} is not in completed status`);
            }

            // 2. Check if Invoice already exists
            const existingInvoice = await prisma.invoices.findUnique({
                where: { order_id: orderId }
            });

            if (existingInvoice) {
                console.log(`[InvoiceService] Invoice already exists for order ${orderId}: ${existingInvoice.invoice_number}`);
                return existingInvoice;
            }

            // 3. Generate unique invoice number
            // Map order numbers like SUB-000001 to INV-000001
            const invoiceNumber = `INV-${order.order_number.replace('SUB-', '')}`;

            // 4. Generate PDF using pdfkit in-memory
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks: Buffer[] = [];

            const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', (err) => reject(err));

                // --- Styling / Branding ---
                const primaryColor = '#120865'; // Midnight Blue
                const accentColor = '#6d5efc'; // Indigo
                const textColor = '#1f2937'; // Dark Gray
                const secondaryTextColor = '#4b5563'; // Medium Gray
                const lightBg = '#f9fafb'; // Soft Off-White
                const borderLight = '#e5e7eb'; // Light Gray border

                // --- Header Section ---
                doc.fillColor(primaryColor)
                   .fontSize(22)
                   .font('Helvetica-Bold')
                   .text('TAX INVOICE', 50, 50);

                doc.fontSize(10)
                   .font('Helvetica')
                   .fillColor(secondaryTextColor)
                   .text(`Invoice No: ${invoiceNumber}`, 50, 75)
                   .text(`Invoice Date: ${new Date(order.completed_at || order.created_at).toLocaleDateString('en-IN')}`, 50, 90)
                   .text(`Order Number: ${order.order_number}`, 50, 105);

                // Company Details (Top Right)
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .fillColor(primaryColor)
                   .text('Samaagum Inc.', 400, 50, { align: 'right' });

                doc.fontSize(9)
                   .font('Helvetica')
                   .fillColor(secondaryTextColor)
                   .text('100 Feet Rd, Indiranagar', 400, 65, { align: 'right' })
                   .text('Bengaluru, Karnataka, 560038', 400, 78, { align: 'right' })
                   .text('Email: billing@samaagum.com', 400, 91, { align: 'right' })
                   .text('GSTIN: 29SAMAAGUM12345', 400, 104, { align: 'right' });

                // Horizontal Line separator
                doc.moveTo(50, 130)
                   .lineTo(545, 130)
                   .strokeColor(borderLight)
                   .lineWidth(1)
                   .stroke();

                // --- Customer & Billing Address ---
                doc.fontSize(11)
                   .font('Helvetica-Bold')
                   .fillColor(primaryColor)
                   .text('BILL TO', 50, 150);

                const billAddressObj = (order.billing_address as any) || {};
                const name = `${billAddressObj.firstName || order.users?.first_name || ''} ${billAddressObj.lastName || order.users?.last_name || ''}`.trim() || 'Valued Customer';
                const email = billAddressObj.email || order.users?.primary_email || 'N/A';
                const phone = billAddressObj.phone || order.users?.phone_e164 || 'N/A';
                const addressText = `${billAddressObj.address1 || ''} ${billAddressObj.address2 || ''}, ${billAddressObj.city || ''}, ${billAddressObj.state || ''} - ${billAddressObj.postcode || ''}, ${billAddressObj.country || ''}`.trim().replace(/^,|,$/g, '');

                doc.fontSize(9.5)
                   .font('Helvetica')
                   .fillColor(textColor)
                   .text(name, 50, 168)
                   .text(`Email: ${email}`, 50, 182)
                   .text(`Phone: ${phone}`, 50, 196)
                   .text(`Address: ${addressText}`, 50, 210, { width: 230 });

                // Payment Details Box (Right Column)
                doc.rect(340, 150, 205, 80)
                   .fill(lightBg);

                doc.fontSize(9.5)
                   .font('Helvetica-Bold')
                   .fillColor(primaryColor)
                   .text('Payment Details', 350, 160);

                const paidDate = order.payment_paid_date ? new Date(order.payment_paid_date).toLocaleDateString('en-IN') : 'N/A';
                doc.fontSize(8.5)
                   .font('Helvetica')
                   .fillColor(textColor)
                   .text(`Method: ${order.payment_method_title || order.payment_method}`, 350, 178)
                   .text(`Transaction ID: ${order.payment_transaction_id || 'N/A'}`, 350, 192, { width: 190 })
                   .text(`Paid Date: ${paidDate}`, 350, 212);

                // --- Order Details / Items Table ---
                const tableTop = 260;

                // Table Header Row
                doc.rect(50, tableTop, 495, 20)
                   .fill(primaryColor);

                doc.fontSize(9)
                   .font('Helvetica-Bold')
                   .fillColor('#ffffff')
                   .text('Subscription Description', 60, tableTop + 6)
                   .text('Billing Cycle', 280, tableTop + 6)
                   .text('Validity Dates', 360, tableTop + 6)
                   .text('Subtotal', 480, tableTop + 6, { align: 'right', width: 55 });

                // Table Data Row
                const rowTop = tableTop + 25;
                const planName = order.admin_subscription_plans?.display_name || 'Samaagum Subscription';
                const billingCycle = order.plan_type === 'yearly' ? 'Yearly' : 'Monthly';
                const startDateStr = order.subscription_start_date ? new Date(order.subscription_start_date).toLocaleDateString('en-IN') : 'N/A';
                const endDateStr = order.subscription_end_date ? new Date(order.subscription_end_date).toLocaleDateString('en-IN') : 'N/A';
                const validityPeriod = `${startDateStr} to ${endDateStr}`;

                doc.fontSize(9.5)
                   .font('Helvetica')
                   .fillColor(textColor)
                   .text(planName, 60, rowTop + 5, { width: 210 })
                   .text(billingCycle, 280, rowTop + 5)
                   .text(validityPeriod, 360, rowTop + 5)
                   .text(`₹${Number(order.subtotal).toFixed(2)}`, 480, rowTop + 5, { align: 'right', width: 55 });

                // Line separation under the row
                doc.moveTo(50, rowTop + 25)
                   .lineTo(545, rowTop + 25)
                   .strokeColor(borderLight)
                   .lineWidth(1)
                   .stroke();

                // --- Summary Calculations ---
                const summaryTop = rowTop + 45;

                // Labels
                doc.fontSize(9)
                   .font('Helvetica')
                   .fillColor(secondaryTextColor)
                   .text('Subtotal:', 380, summaryTop)
                   .text('Discount:', 380, summaryTop + 15)
                   .text('GST (18%):', 380, summaryTop + 30);

                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .fillColor(primaryColor)
                   .text('Total Amount Paid:', 380, summaryTop + 50);

                // Values
                const fmtPrice = (val: any) => `₹${Number(val).toFixed(2)}`;
                doc.fontSize(9)
                   .font('Helvetica')
                   .fillColor(textColor)
                   .text(fmtPrice(order.subtotal), 480, summaryTop, { align: 'right', width: 55 })
                   .text(`-${fmtPrice(order.discount_amount)}`, 480, summaryTop + 15, { align: 'right', width: 55 })
                   .text(fmtPrice(order.tax_total), 480, summaryTop + 30, { align: 'right', width: 55 });

                doc.fontSize(11)
                   .font('Helvetica-Bold')
                   .fillColor(primaryColor)
                   .text(fmtPrice(order.total), 480, summaryTop + 50, { align: 'right', width: 55 });

                // --- Footer / Terms ---
                const footerTop = 750;
                doc.moveTo(50, footerTop)
                   .lineTo(545, footerTop)
                   .strokeColor(borderLight)
                   .lineWidth(1)
                   .stroke();

                doc.fontSize(8.5)
                   .font('Helvetica')
                   .fillColor(secondaryTextColor)
                   .text('This is a computer-generated tax invoice and does not require a physical signature.', 50, footerTop + 10, { align: 'center', width: 495 });

                doc.font('Helvetica-Bold')
                   .text('Thank you for subscribing to Samaagum!', 50, footerTop + 22, { align: 'center', width: 495 });

                // End document
                doc.end();
            });

            // 5. Store invoice record in DB
            const invoice = await prisma.invoices.create({
                data: {
                    invoice_number: invoiceNumber,
                    order_id: orderId,
                    pdf_data: Buffer.from(pdfBuffer)
                }
            });

            console.log(`[InvoiceService] Successfully saved in-memory invoice record in DB with ID: ${invoice.id}`);
            return invoice;
        } catch (error: any) {
            console.error(`[InvoiceService] Error generating invoice for order ${orderId}:`, error);
            throw error;
        }
    }
}
