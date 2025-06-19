// server/services/email.js

const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT, 10),
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

/**
 * Send a reminder email to a student and increment reminderSentCount.
 * Includes a link to their Codeforces profile.
 *
 * @param {object} student – Mongoose student document (must have .email, .name, .codeforcesHandle)
 * @returns {object} info or { quotaExceeded: true }
 */
async function sendReminder(student) {
  // Compose the URL to their CF profile
  const profileUrl = `${student.codeforcesHandle}`;

  // Plaintext fallback
  const textBody = 
    `Hi ${student.name},\n\n` +
    `We noticed you haven’t solved any problems in the last week on Codeforces.` +
    `\n\nYour profile: ${profileUrl}\n\n` +
    `Keep up the practice and happy coding!\n\n` +
    `— Student Progress Manager`;

  // HTML version
  const htmlBody = `
    <p>Hi ${student.name},</p>
    <p>We noticed you haven’t solved any problems in the last week on Codeforces.</p>
    <p>Your profile: <a href="${profileUrl}" target="_blank">${student.codeforcesHandle}</a></p>
    <p>Keep up the practice and happy coding!</p>
    <p>— Student Progress Manager</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: student.email,
      subject: 'We miss you on Codeforces!',
      text: textBody,
      html: htmlBody
    });

    // Only increment if actually sent
    student.reminderSentCount = (student.reminderSentCount || 0) + 1;
    await student.save();

    return info;
  } catch (err) {
    // Handle quota errors specially
    if (err.message && err.message.includes('451')) {
      console.warn(`Email quota exceeded (451): Skipping email to ${student.email}`);
      return { quotaExceeded: true };
    }
    throw err;
  }
}

module.exports = { sendReminder };

