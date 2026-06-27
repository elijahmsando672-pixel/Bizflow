import nodemailer from 'nodemailer';
import sanitizeHtml from 'sanitize-html';
import dotenv from 'dotenv';

dotenv.config();

// Default sanitization options for email content
const sanitizeOptions = {
  allowedTags: [], // Strip all HTML tags
  allowedAttributes: {},
  allowedStyles: {},
};

// Helper to escape and sanitize for HTML context
const escapeHtml = (str) => {
  if (!str) return '';
  return sanitizeHtml(String(str), sanitizeOptions);
};

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
    subject: `Invoice ${escapeHtml(invoice.invoice_number)} from ${escapeHtml(process.env.BUSINESS_NAME || 'BizFlow')}`,
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
            <p style="margin:5px 0 0;">${escapeHtml(invoice.invoice_number)}</p>
          </div>
          <div class="content">
            <table class="invoice-info">
              <tr><td class="label">Date:</td><td>${new Date(invoice.created_at).toLocaleDateString()}</td></tr>
              <tr><td class="label">Due Date:</td><td>${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon Receipt'}</td></tr>
              <tr><td class="label">Customer:</td><td>${escapeHtml(customer?.name || 'N/A')}</td></tr>
              <tr><td class="label">Status:</td><td><strong>${escapeHtml(invoice.status.toUpperCase())}</strong></td></tr>
              <tr><td class="label">Total:</td><td class="total">KSh ${parseFloat(invoice.total).toLocaleString()}</td></tr>
            </table>
            <p style="margin-top:20px;">Please find the invoice details attached. Payment can be made via:</p>
            <ul>
              <li>M-Pesa: ${escapeHtml(process.env.MPESA_SHORTCODE || 'XXXXXX')}</li>
              <li>Bank Transfer: ${escapeHtml(process.env.BANK_DETAILS || 'Contact for details')}</li>
            </ul>
            <a href="${escapeHtml(process.env.APP_URL || 'http://localhost:5173')}/invoice/${escapeHtml(invoice.id)}" class="btn">View Invoice</a>
          </div>
          <div class="footer">
            <p>Powered by <strong>BizFlow</strong> - Business Management Made Simple</p>
            <p>${escapeHtml(process.env.BUSINESS_NAME || 'Your Company')}</p>
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
    subject: `Payment Reminder: Invoice ${escapeHtml(invoice.invoice_number)}`,
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
            <p>Invoice #${escapeHtml(invoice.invoice_number)}</p>
          </div>
          <div class="content">
            <p>Dear ${escapeHtml(customer?.name || 'Valued Customer')},</p>
            <p>This is a friendly reminder that payment for the above invoice is now due.</p>
            <p class="amount">KSh ${parseFloat(invoice.total).toLocaleString()}</p>
            <p>Due Date: <strong>${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</strong></p>
            <a href="${escapeHtml(process.env.APP_URL || 'http://localhost:5173')}/invoice/${escapeHtml(invoice.id)}" class="btn">Pay Now</a>
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
            <p>Hi ${escapeHtml(user.name)},</p>
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
            <center><a href="${escapeHtml(process.env.APP_URL || 'http://localhost:5173')}/dashboard.html" class="btn">Get Started</a></center>
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
               ${products.map(p => `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.stock_qty)}</td><td>${escapeHtml(p.reorder_level)}</td></tr>`).join('')}
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

export const sendOTPEmail = async (to, otp, purpose) => {
  const subject = purpose === 'login' ? 'Your BizFlow Login Code' : 'Your BizFlow Password Reset Code';
  const mailOptions = {
    from: `"BizFlow" <${process.env.SMTP_USER || 'noreply@bizflow.co.ke'}>`,
    to,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; text-align: center; }
          .otp { font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">${purpose === 'login' ? 'Login Code' : 'Password Reset Code'}</h1>
          </div>
          <div class="content">
            <p>${purpose === 'login' ? 'Use the code below to log in to your BizFlow account.' : 'Use the code below to reset your BizFlow password.'}</p>
            <div class="otp">${otp}</div>
            <p>This code expires in <strong>10 minutes</strong>.</p>
            <p style="margin-top:20px;color:#94a3b8;">If you didn't request this, please ignore this email.</p>
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
    console.log(`OTP email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
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
            <center><a href="${escapeHtml(resetUrl)}" class="btn">Reset Password</a></center>
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

export const sendTeamInvitationEmail = async (to, { token, businessName, role, invitedBy }) => {
  const acceptUrl = `${process.env.APP_URL || 'http://localhost:3000'}/accept-invite?token=${token}`;
  const mailOptions = {
    from: `"BizFlow" <${process.env.SMTP_USER || 'noreply@bizflow.co.ke'}>`,
    to,
    subject: `You've been invited to join ${escapeHtml(businessName)} on BizFlow`,
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
            <h1 style="margin:0;">Team Invitation</h1>
          </div>
          <div class="content">
            <p>${escapeHtml(invitedBy || 'Someone')} has invited you to join <strong>${escapeHtml(businessName)}</strong> on BizFlow.</p>
            <p>Your role will be: <strong>${escapeHtml(role)}</strong></p>
            <p>Click the button below to accept the invitation and create your account. This link expires in 7 days.</p>
            <center><a href="${escapeHtml(acceptUrl)}" class="btn">Accept Invitation</a></center>
            <p style="margin-top:20px;">If you weren't expecting this invitation, please ignore this email.</p>
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
    console.log(`Team invitation sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send team invitation:', error);
    return false;
  }
};

export const sendTicketCreatedEmail = async (to, ticket, assignee) => {
  const mailOptions = {
    from: `"BizFlow" <${process.env.SMTP_USER || 'noreply@bizflow.co.ke'}>`,
    to,
    subject: `Support Ticket #${escapeHtml(ticket.ticket_number || ticket.id)}: ${escapeHtml(ticket.subject)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .badge-high { background: #fef2f2; color: #dc2626; }
          .badge-medium { background: #fffbeb; color: #d97706; }
          .badge-low { background: #f0fdf4; color: #16a34a; }
          .btn { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">New Support Ticket</h1>
            <p>#${escapeHtml(ticket.ticket_number || ticket.id)}</p>
          </div>
          <div class="content">
            <p>A new support ticket has been created:</p>
            <p><strong>Subject:</strong> ${escapeHtml(ticket.subject)}</p>
            <p><strong>Priority:</strong> <span class="badge badge-${escapeHtml(ticket.priority || 'medium')}">${escapeHtml(ticket.priority || 'medium')}</span></p>
            ${assignee ? `<p><strong>Assigned to:</strong> ${escapeHtml(assignee.name)}</p>` : ''}
            <p><strong>Description:</strong></p>
            <p>${escapeHtml(ticket.description || '').substring(0, 300)}${(ticket.description || '').length > 300 ? '...' : ''}</p>
            <a href="${escapeHtml(process.env.APP_URL || 'http://localhost:3000')}/support/${escapeHtml(ticket.id)}" class="btn">View Ticket</a>
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
    console.log(`Ticket created email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send ticket email:', error);
    return false;
  }
};

export const sendTicketReplyEmail = async (to, ticket, reply, senderName) => {
  const mailOptions = {
    from: `"BizFlow" <${process.env.SMTP_USER || 'noreply@bizflow.co.ke'}>`,
    to,
    subject: `Re: Support Ticket #${escapeHtml(ticket.ticket_number || ticket.id)}: ${escapeHtml(ticket.subject)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .reply-box { background: white; border-left: 4px solid #8b5cf6; padding: 16px; margin: 16px 0; border-radius: 0 4px 4px 0; }
          .btn { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">New Reply on Ticket</h1>
            <p>#${escapeHtml(ticket.ticket_number || ticket.id)}</p>
          </div>
          <div class="content">
            <p><strong>${escapeHtml(senderName)}</strong> replied to your ticket:</p>
            <div class="reply-box">
              ${escapeHtml(reply.message || '').substring(0, 500)}${(reply.message || '').length > 500 ? '...' : ''}
            </div>
            <a href="${escapeHtml(process.env.APP_URL || 'http://localhost:3000')}/support/${escapeHtml(ticket.id)}" class="btn">View Thread</a>
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
    console.log(`Ticket reply email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send ticket reply email:', error);
    return false;
  }
};

export const sendDealCreatedEmail = async (to, deal, owner) => {
  const mailOptions = {
    from: `"BizFlow" <${process.env.SMTP_USER || 'noreply@bizflow.co.ke'}>`,
    to,
    subject: `New Deal: ${escapeHtml(deal.name)} - KSh ${parseFloat(deal.value || 0).toLocaleString()}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .value { font-size: 28px; font-weight: bold; color: #0ea5e9; }
          .btn { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">New Deal Created</h1>
          </div>
          <div class="content">
            <p class="value">KSh ${parseFloat(deal.value || 0).toLocaleString()}</p>
            <p><strong>Deal:</strong> ${escapeHtml(deal.name)}</p>
            ${owner ? `<p><strong>Owner:</strong> ${escapeHtml(owner)}</p>` : ''}
            <p><strong>Stage:</strong> ${escapeHtml(deal.stage_name || deal.stage || 'New')}</p>
            ${deal.expected_close_date ? `<p><strong>Expected Close:</strong> ${new Date(deal.expected_close_date).toLocaleDateString()}</p>` : ''}
            ${deal.notes ? `<p><strong>Notes:</strong> ${escapeHtml(deal.notes).substring(0, 200)}</p>` : ''}
            <a href="${escapeHtml(process.env.APP_URL || 'http://localhost:3000')}/pipeline" class="btn">View Pipeline</a>
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
    console.log(`Deal created email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send deal email:', error);
    return false;
  }
};

export const sendDealWonEmail = async (to, deal) => {
  const mailOptions = {
    from: `"BizFlow" <${process.env.SMTP_USER || 'noreply@bizflow.co.ke'}>`,
    to,
    subject: `Deal Won: ${escapeHtml(deal.name)} - KSh ${parseFloat(deal.value || 0).toLocaleString()}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .value { font-size: 32px; font-weight: bold; color: #16a34a; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">Deal Closed Won</h1>
          </div>
          <div class="content">
            <p class="value">KSh ${parseFloat(deal.value || 0).toLocaleString()}</p>
            <p><strong>Deal:</strong> ${escapeHtml(deal.name)}</p>
            <p>Congratulations! This deal has been marked as won.</p>
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
    console.log(`Deal won email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send deal won email:', error);
    return false;
  }
};

export const sendProjectUpdateEmail = async (to, project, update) => {
  const mailOptions = {
    from: `"BizFlow" <${process.env.SMTP_USER || 'noreply@bizflow.co.ke'}>`,
    to,
    subject: `Project Update: ${escapeHtml(project.name)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .btn { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">Project Update</h1>
            <p>${escapeHtml(project.name)}</p>
          </div>
          <div class="content">
            <p><strong>Status:</strong> ${escapeHtml(project.status || 'active')}</p>
            ${update ? `<p><strong>Update:</strong> ${escapeHtml(update)}</p>` : ''}
            ${project.due_date ? `<p><strong>Due Date:</strong> ${new Date(project.due_date).toLocaleDateString()}</p>` : ''}
            ${project.budget ? `<p><strong>Budget:</strong> KSh ${parseFloat(project.budget).toLocaleString()}</p>` : ''}
            <a href="${escapeHtml(process.env.APP_URL || 'http://localhost:3000')}/projects/${escapeHtml(project.id)}" class="btn">View Project</a>
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
    console.log(`Project update email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send project update email:', error);
    return false;
  }
};