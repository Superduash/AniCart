/**
 * Email service using Nodemailer + Gmail SMTP.
 * Email failures are logged and swallowed to avoid breaking user flows.
 */

const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sentEmailStore = new Map();

const getStoreKey = (email, type) => `${String(email).toLowerCase()}:${type}`;

const storeSentToken = (email, type, token) => {
  sentEmailStore.set(getStoreKey(email, type), {
    token,
    sentAt: new Date(),
  });
};

const getLatestTokenForTesting = (email, type) => {
  const entry = sentEmailStore.get(getStoreKey(email, type));
  return entry ? entry.token : null;
};

const cardTemplate = ({ title, subtitle, buttonText, buttonUrl, footerText }) => `
  <div style="font-family:Segoe UI,Arial,sans-serif;background:#f6f8fb;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8ecf4;border-radius:12px;padding:28px;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">${title}</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">${subtitle}</p>
      ${
        buttonUrl
          ? `<a href="${buttonUrl}" style="display:inline-block;padding:12px 18px;background:#111827;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">${buttonText}</a>`
          : ''
      }
      <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">${footerText || ''}</p>
    </div>
  </div>
`;

const sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  return info;
};

const sendVerificationEmail = async (user, verificationToken) => {
  const verifyUrl = `${config.CLIENT_URL}/auth/verify-email?token=${verificationToken}`;

  const result = await sendEmail({
    to: user.email,
    subject: 'Verify your AniCart account',
    html: cardTemplate({
      title: 'Verify your AniCart account',
      subtitle: `Hi ${user.name || 'there'}, please confirm your email to activate your account.`,
      buttonText: 'Verify Email',
      buttonUrl: verifyUrl,
      footerText: 'If you did not sign up, you can ignore this email.',
    }),
  });

  storeSentToken(user.email, 'verification', verificationToken);
  return result;
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${config.CLIENT_URL}/auth/reset?token=${resetToken}`;

  const result = await sendEmail({
    to: user.email,
    subject: 'Reset your AniCart password',
    html: cardTemplate({
      title: 'Reset your AniCart password',
      subtitle: 'We received a password reset request for your account.',
      buttonText: 'Reset Password',
      buttonUrl: resetUrl,
      footerText: 'This link expires in 15 minutes.',
    }),
  });

  storeSentToken(user.email, 'reset', resetToken);
  return result;
};

const sendOrderReceiptEmail = async (user, order) => {
  const total = order?.totalAmount ?? order?.total ?? 0;
  const orderId = order?._id || order?.id || 'N/A';

  return sendEmail({
    to: user.email,
    subject: 'Your AniCart Order Receipt',
    html: cardTemplate({
      title: 'Your AniCart Order Receipt',
      subtitle: `Thanks for your purchase, ${user.name || 'there'}! Your order ${orderId} has been received.`,
      buttonText: 'View Orders',
      buttonUrl: `${config.CLIENT_URL}/orders`,
      footerText: `Order total: $${Number(total).toFixed(2)}`,
    }),
  });
};

const sendReportNotificationEmail = async (adminEmail, report) => {
  const reportId = report?._id || report?.id || 'N/A';
  const reason = report?.reason || report?.type || 'Wallpaper flagged by user';

  return sendEmail({
    to: adminEmail,
    subject: 'Wallpaper Reported',
    html: cardTemplate({
      title: 'Wallpaper Reported',
      subtitle: `A wallpaper report (${reportId}) requires review.`,
      buttonText: 'Open Admin Panel',
      buttonUrl: `${config.CLIENT_URL}/admin/reports`,
      footerText: `Reason: ${reason}`,
    }),
  });
};

const sendProductApprovalEmail = async (creator, product) => {
  return sendEmail({
    to: creator.email,
    subject: 'Your wallpaper is live! ✦',
    html: cardTemplate({
      title: 'Your wallpaper is live!',
      subtitle: `Great news, ${creator.name}! Your wallpaper "${product.name}" has been approved and is now live on AniCart.`,
      buttonText: 'View Dashboard',
      buttonUrl: `${config.CLIENT_URL}/dashboard`,
    }),
  });
};

const sendProductRejectionEmail = async (creator, product, reason) => {
  return sendEmail({
    to: creator.email,
    subject: 'Update on your wallpaper submission',
    html: cardTemplate({
      title: 'Update on your submission',
      subtitle: `Hi ${creator.name}, unfortunately your wallpaper "${product.name}" could not be approved.`,
      footerText: `Reason: ${reason || 'Does not meet community guidelines.'}`,
    }),
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderReceiptEmail,
  sendReportNotificationEmail,
  sendProductApprovalEmail,
  sendProductRejectionEmail,
  getLatestTokenForTesting,
};
