const nodemailer = require('nodemailer');

// Configure transporter with better error handling
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Better timeout settings
  connectionTimeout: 10000,
  socketTimeout: 10000
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      // Important for email deliverability
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High'
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;