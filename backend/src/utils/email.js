// KodiKart Email Service (Resend.com - Free tier: 3000 emails/month)
// ZERO-RUPEE: Resend.com requires no credit card for the free tier
// Sign up at https://resend.com and add your API key to .env

let resendClient = null;

function getResendClient() {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      return null;
    }
    try {
      const { Resend } = require('resend');
      resendClient = new Resend(process.env.RESEND_API_KEY);
    } catch (e) {
      return null;
    }
  }
  return resendClient;
}

/**
 * Send Login OTP Email
 * In development without Resend API key: OTP is printed to console (safe for local dev only)
 */
async function sendLoginOTP({ to, name, otp, phone }) {
  const resend = getResendClient();

  if (!resend) {
    // Development fallback - console only, never in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n================================');
      console.log('📧 [DEV MODE] EMAIL OTP DELIVERY');
      console.log(`To: ${to} (${name})`);
      console.log(`Phone: ${phone}`);
      console.log(`OTP: ${otp}`);
      console.log(`Expires: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log('================================\n');
      return { success: true, dev: true };
    }
    // In production without API key, fail safely
    console.error('[CRITICAL] RESEND_API_KEY not set in production. Email OTP cannot be sent.');
    return { success: false, error: 'Email service not configured. Contact support.' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'KodiKart <noreply@kodikart.in>',
      to: [to],
      subject: `${otp} - Your KodiKart Login OTP`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #2d6a4f; padding: 24px; text-align: center;">
              <h1 style="color: #d4a017; margin: 0; font-size: 28px;">🐔 KodiKart</h1>
              <p style="color: #b7e4c7; margin: 4px 0 0; font-size: 14px;">మన నాటి కోళ్లు – మన నమ్మకం</p>
            </div>
            <div style="padding: 32px 24px; text-align: center;">
              <p style="color: #333; font-size: 16px; margin: 0 0 8px;">Hello ${name},</p>
              <p style="color: #666; font-size: 14px; margin: 0 0 24px;">Your KodiKart login verification code is:</p>
              <div style="background: #f0fdf4; border: 2px dashed #2d6a4f; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
                <span style="font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #1b4332;">${otp}</span>
              </div>
              <p style="color: #888; font-size: 13px; margin: 0 0 8px;">⏰ This code expires in <strong>10 minutes</strong></p>
              <p style="color: #888; font-size: 13px; margin: 0 0 24px;">🔒 Never share this code with anyone</p>
              <div style="background: #fff3cd; border-radius: 6px; padding: 12px; text-align: left;">
                <p style="color: #856404; font-size: 12px; margin: 0;"><strong>Security Alert:</strong> If you did not request this code, please ignore this email. Your account is safe.</p>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 16px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #aaa; font-size: 11px; margin: 0;">KodiKart — Live Native Hens. Direct from Farms.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('Email send failed:', err);
    return { success: false, error: 'Email delivery failed.' };
  }
}

/**
 * Send Handover OTP Email (sent to customer when farm is ready to hand over hens)
 * SECURITY: This OTP is ONLY sent to the customer's email, never shown to farm owner
 */
async function sendHandoverOTP({ to, customerName, otp, bookingNumber, farmName, henCount }) {
  const resend = getResendClient();

  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n================================');
      console.log('📧 [DEV MODE] HANDOVER OTP');
      console.log(`To Customer: ${to} (${customerName})`);
      console.log(`Booking: ${bookingNumber} | Farm: ${farmName}`);
      console.log(`Hens: ${henCount} | OTP: ${otp}`);
      console.log('SECURITY: Show this OTP to the farm owner at handover');
      console.log('================================\n');
      return { success: true, dev: true };
    }
    return { success: false, error: 'Email service not configured.' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'KodiKart <noreply@kodikart.in>',
      to: [to],
      subject: `${otp} - KodiKart Hen Handover OTP for Booking ${bookingNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #1b4332; padding: 24px; text-align: center;">
              <h1 style="color: #d4a017; margin: 0; font-size: 28px;">🐔 KodiKart</h1>
              <p style="color: #b7e4c7; margin: 8px 0 0; font-size: 16px;">Hen Handover Verification</p>
            </div>
            <div style="padding: 32px 24px;">
              <p style="color: #333; font-size: 16px; margin: 0 0 16px;">Hello <strong>${customerName}</strong>,</p>
              <p style="color: #555; font-size: 14px; margin: 0 0 20px;">
                Your hens from <strong>${farmName}</strong> are ready for handover.<br>
                Booking: <strong>${bookingNumber}</strong> | Hens: <strong>${henCount}</strong>
              </p>
              <div style="background: #fff3e0; border: 2px dashed #e65100; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 20px;">
                <p style="color: #bf360c; font-size: 13px; font-weight: bold; margin: 0 0 8px;">🔑 HANDOVER OTP</p>
                <span style="font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #bf360c;">${otp}</span>
                <p style="color: #bf360c; font-size: 12px; margin: 8px 0 0;">Share this code with the farm owner / delivery person</p>
              </div>
              <div style="background: #ffebee; border-left: 4px solid #c62828; padding: 12px 16px; border-radius: 4px; margin: 0 0 20px;">
                <p style="color: #b71c1c; font-size: 13px; margin: 0 0 4px;"><strong>⚠️ Important Security Rules:</strong></p>
                <ul style="color: #c62828; font-size: 12px; margin: 0; padding-left: 16px;">
                  <li>Share this OTP <strong>only</strong> at the time of physical hen handover</li>
                  <li>Verify you have received all your hens before sharing the OTP</li>
                  <li>This OTP is valid for <strong>30 minutes</strong> from now</li>
                  <li>Never share via WhatsApp/text before physically receiving your hens</li>
                </ul>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 16px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #aaa; font-size: 11px; margin: 0;">KodiKart — Live Native Hens. Direct from Farms.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend handover OTP error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('Handover OTP email failed:', err);
    return { success: false, error: 'Email delivery failed.' };
  }
}

/**
 * Send booking notification email
 */
async function sendBookingNotification({ to, name, subject, message }) {
  const resend = getResendClient();
  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Email to ${to}: ${subject}`);
    }
    return { success: true, dev: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'KodiKart <noreply@kodikart.in>',
      to: [to],
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;">
          <div style="background:#2d6a4f;padding:16px;border-radius:8px 8px 0 0;text-align:center;">
            <h2 style="color:#d4a017;margin:0;">🐔 KodiKart</h2>
          </div>
          <div style="background:#fff;border:1px solid #e0e0e0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
            <p>Hello <strong>${name}</strong>,</p>
            <p>${message}</p>
            <p style="color:#888;font-size:12px;margin-top:24px;">KodiKart — Live Native Hens. Direct from Farms.</p>
          </div>
        </div>
      `,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: 'Email delivery failed.' };
  }
}

module.exports = { sendLoginOTP, sendHandoverOTP, sendBookingNotification };
