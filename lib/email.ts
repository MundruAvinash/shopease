import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
) {
  await transporter.sendMail({
    from: `"ShopEase Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your ShopEase Password",
    text: `Use this link to reset your ShopEase password: ${resetUrl}

If you did not request a password reset, you can ignore this email.`,
    html: `
      <h2>Reset Your ShopEase Password</h2>
      <p>Click the link below to reset your password.</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you did not request a password reset, you can ignore this email.</p>
    `,
  });
}