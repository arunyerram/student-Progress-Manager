// server/test-email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

(async () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT,
    secure: false,            // Gmail uses STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,    // “Student Progress Manager <no-reply@…>”
    to:   process.env.SMTP_USER,     // sends back to your own Gmail
    subject: 'SMTP Test ✔',
    text:    'Success! You are now sending through Gmail SMTP.'
  });

  console.log('✅ Sent Message ID:', info.messageId);
  process.exit(0);
})().catch(err => {
  console.error('❌ Test email failed:', err);
  process.exit(1);
});
