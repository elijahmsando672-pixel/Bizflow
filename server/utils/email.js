import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export const sendInvoiceEmail = async (to, invoice, customer) => {
  const mailOptions = {
    from: `"BizFlow" <${process.env.SMTP_USER || 'noreply@bizflow.co.ke'}>`,
    to,
    subject: `Invoice ${invoice.invoice_number} from ${process.env.BUSINESS_NAME || 'BizFlow'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .invoice-info { margin: 20px 0; }
          .invoice-info td { padding: 8px 0; }
          .label { color: #64748b; width: 120px; }
          .total { font-size: 24px; font-weight: bold; color: #4f46e5; }
          .btn { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;font-size:28px;">INVOICE</h1>
            <p style="margin:5px 0 0;">${invoice.invoice_number}</p>
          </div>
          <div class="content">
            <table class="invoice-info">
              <tr><td class="label">Date:</td><td>${new Date(invoice.created_at).toLocaleDateString()}</td></tr>
              <tr><td class="label">Due Date:</td><td>${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon Receipt'}</td></tr>
              <tr><td class="label">Customer:</td><td>${customer?.name || 'N/A'}</td></tr>
              <tr><td class="label">Status:</td><td><strong>${invoice.status.toUpperCase()}</strong></td></tr>
              <tr><td class="label">Total:</td><td class="total">KSh ${parseFloat(invoice.total).toLocaleString()}</td></tr>
            </table>
            <p style="margin-top:20px;">Please find the invoice details attached. Payment can be made via:</p>
            <ul>
              <li>M-Pesa: ${process.env.MPESA_SHORTCODE || 'XXXXXX'}</li>
              <li>Bank Transfer: ${process.env.BANK_DETAILS || 'Contact for details'}</li>
            </ul>
            <a href="${process.env.APP_URL || 'http://localhost:5173'}/invoice/${invoice.id}" class="btn">View Invoice</a>
          </div>
          <div class="footer">
            <p>Powered by <strong>BizFlow</strong> - Business Management Made Simple</p>
            <p>${process.env.BUSINESS_NAME || 'Your Company'}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    return false;
  }
};

export const sendPaymentReminderEmail = async (to, invoice, customer) => {
  const mailOptions = {
    from: `"BizFlow" <${process.env.SMTP_USER || 'noreply@bizflow.co.ke'}>`,
    to,
    subject: `Payment Reminder: Invoice ${invoice.invoice_number}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .amount { font-size: 32px; font-weight: bold; color: #1e293b; }
          .btn { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">Payment Reminder</h1>
            <p>Invoice #${invoice.invoice_number}</p>
          </div>
          <div class="content">
            <p>Dear ${customer?.name || 'Valued Customer'},</p>
            <p>This is a friendly reminder that payment for the above invoice is now due.</p>
            <p class="amount">KSh ${parseFloat(invoice.total).toLocaleString()}</p>
            <p>Due Date: <strong>${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</strong></p>
            <a href="${process.env.APP_URL || 'http://localhost:5173'}/invoice/${invoice.id}" class="btn">Pay Now</a>
          </div>
          <div class="footer">
            <p>Powered by <strong>BizFlow</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Payment reminder sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send reminder:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (to, user) => {
  const mailOptions = {
    from: `"BizFlow" <${process.env.SMTP_USER || 'noreply@bizflow.co.ke'}>`,
    to,
    subject: 'Welcome to BizFlow!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 40px; border: 1px solid #e2e8f0; }
          .btn { display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .features { text-align: left; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
          .features li { margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;font-size:32px;">🎉 Welcome to BizFlow!</h1>
            <p>Business Management Made Simple</p>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Welcome to BizFlow! We're excited to help you manage your business more efficiently.</p>
            <div class="features">
              <strong>Here's what you can do:</strong>
              <ul>
                <li>📊 Track customers and projects</li>
                <li>📄 Create professional invoices</li>
                <li>📦 Manage inventory</li>
                <li>💰 Track expenses and profits</li>
                <li>📈 Get business insights</li>
              </ul>
            </div>
            <center><a href="${process.env.APP_URL || 'http://localhost:5173'}/dashboard.html" class="btn">Get Started</a></center>
          </div>
          <div class="footer">
            <p>Need help? Reply to this email or contact support@bizflow.co.ke</p>
            <p>&copy; 2026 BizFlow. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
};

export const sendLowStockAlert = async (to, products) => {
  const mailOptions = {
    from: `"BizFlow" <${process.env.SMTP_USER || 'noreply@bizflow.co.ke'}>`,
    to,
    subject: 'Low Stock Alert - Action Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { background: #f8fafc; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ Low Stock Alert</h2>
          </div>
          <div class="content">
            <p>The following items are running low:</p>
             <table>
               <tr><th>Product</th><th>Current Stock</th><th>Reorder Level</th></tr>
               ${products.map(p => `<tr><td>${p.name}</td><td>${p.stock_qty}</td><td>${p.reorder_level}</td></tr>`).join('')}
             </table>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Low stock alert sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send low stock alert:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  const mailOptions = {
    from: `"BizFlow" <${process.env.SMTP_USER || 'noreply@bizflow.co.ke'}>`,
    to,
    subject: 'Reset Your BizFlow Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .btn { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">Reset Password</h1>
          </div>
          <div class="content">
            <p>You requested to reset your BizFlow password.</p>
            <p>Click the button below to create a new password. This link will expire in 1 hour.</p>
            <center><a href="${resetUrl}" class="btn">Reset Password</a></center>
            <p style="margin-top:20px;">If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 BizFlow. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
};