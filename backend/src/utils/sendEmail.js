const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Set SendGrid API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email templates
const emailTemplates = {
  emailVerification: (data) => ({
    subject: 'Verify Your Email - BookingApp',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to BookingApp, ${data.name}!</h2>
        <p>Thank you for registering with us. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${data.verificationUrl}</p>
        <p style="color: #666; font-size: 14px;">
          This verification link will expire in 24 hours. If you didn't create an account with us, please ignore this email.
        </p>
      </div>
    `,
    text: `
      Welcome to BookingApp, ${data.name}!
      
      Thank you for registering with us. Please verify your email address by visiting:
      ${data.verificationUrl}
      
      This verification link will expire in 24 hours.
      If you didn't create an account with us, please ignore this email.
    `,
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset Request - BookingApp',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${data.name},</p>
        <p>You requested a password reset for your BookingApp account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" 
             style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${data.resetUrl}</p>
        <p style="color: #666; font-size: 14px;">
          This password reset link will expire in 10 minutes. If you didn't request a password reset, please ignore this email.
        </p>
      </div>
    `,
    text: `
      Password Reset Request
      
      Hello ${data.name},
      
      You requested a password reset for your BookingApp account. Visit this link to reset your password:
      ${data.resetUrl}
      
      This password reset link will expire in 10 minutes.
      If you didn't request a password reset, please ignore this email.
    `,
  }),

  bookingConfirmation: (data) => ({
    subject: `Booking Confirmation - ${data.booking.confirmationCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Booking Confirmed!</h2>
        <p>Dear ${data.booking.guestDetails.primaryGuest.firstName},</p>
        <p>Your booking has been confirmed. Here are your booking details:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Booking Details</h3>
          <p><strong>Confirmation Code:</strong> ${data.confirmationCode}</p>
          <p><strong>Hotel:</strong> ${data.booking.hotel.name}</p>
          <p><strong>Room:</strong> ${data.booking.room.name}</p>
          <p><strong>Check-in:</strong> ${new Date(data.booking.dates.checkIn).toDateString()}</p>
          <p><strong>Check-out:</strong> ${new Date(data.booking.dates.checkOut).toDateString()}</p>
          <p><strong>Nights:</strong> ${data.booking.dates.nights}</p>
          <p><strong>Guests:</strong> ${data.booking.guestDetails.totalGuests.adults} Adults, ${data.booking.guestDetails.totalGuests.children} Children</p>
          <p><strong>Total Amount:</strong> ${data.booking.pricing.currency} ${data.booking.pricing.totalAmount.toFixed(2)}</p>
        </div>
        
        <h3>Hotel Information</h3>
        <p>${data.booking.hotel.location.address}, ${data.booking.hotel.location.city}</p>
        <p>Phone: ${data.booking.hotel.contact.phone}</p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Please keep this confirmation for your records. You may be asked to present it at check-in.
        </p>
      </div>
    `,
    text: `
      Booking Confirmed!
      
      Dear ${data.booking.guestDetails.primaryGuest.firstName},
      
      Your booking has been confirmed. Here are your booking details:
      
      Confirmation Code: ${data.confirmationCode}
      Hotel: ${data.booking.hotel.name}
      Room: ${data.booking.room.name}
      Check-in: ${new Date(data.booking.dates.checkIn).toDateString()}
      Check-out: ${new Date(data.booking.dates.checkOut).toDateString()}
      Nights: ${data.booking.dates.nights}
      Guests: ${data.booking.guestDetails.totalGuests.adults} Adults, ${data.booking.guestDetails.totalGuests.children} Children
      Total Amount: ${data.booking.pricing.currency} ${data.booking.pricing.totalAmount.toFixed(2)}
      
      Hotel Information:
      ${data.booking.hotel.location.address}, ${data.booking.hotel.location.city}
      Phone: ${data.booking.hotel.contact.phone}
      
      Please keep this confirmation for your records.
    `,
  }),

  bookingCancellation: (data) => ({
    subject: `Booking Cancelled - ${data.booking.confirmationCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Booking Cancelled</h2>
        <p>Dear ${data.booking.guestDetails.primaryGuest.firstName},</p>
        <p>Your booking has been cancelled. Here are the details:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Cancelled Booking Details</h3>
          <p><strong>Confirmation Code:</strong> ${data.booking.confirmationCode}</p>
          <p><strong>Hotel:</strong> ${data.booking.hotel.name}</p>
          <p><strong>Room:</strong> ${data.booking.room.name}</p>
          <p><strong>Check-in:</strong> ${new Date(data.booking.dates.checkIn).toDateString()}</p>
          <p><strong>Check-out:</strong> ${new Date(data.booking.dates.checkOut).toDateString()}</p>
          <p><strong>Original Amount:</strong> ${data.booking.pricing.currency} ${data.booking.pricing.totalAmount.toFixed(2)}</p>
          ${data.refundAmount > 0 ? `<p><strong>Refund Amount:</strong> ${data.booking.pricing.currency} ${data.refundAmount.toFixed(2)}</p>` : ''}
        </div>
        
        ${data.refundAmount > 0 ? 
          '<p>Your refund will be processed within 5-7 business days to your original payment method.</p>' : 
          '<p>No refund is available for this cancellation as per the cancellation policy.</p>'
        }
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If you have any questions about this cancellation, please contact our customer support.
        </p>
      </div>
    `,
    text: `
      Booking Cancelled
      
      Dear ${data.booking.guestDetails.primaryGuest.firstName},
      
      Your booking has been cancelled. Here are the details:
      
      Confirmation Code: ${data.booking.confirmationCode}
      Hotel: ${data.booking.hotel.name}
      Room: ${data.booking.room.name}
      Check-in: ${new Date(data.booking.dates.checkIn).toDateString()}
      Check-out: ${new Date(data.booking.dates.checkOut).toDateString()}
      Original Amount: ${data.booking.pricing.currency} ${data.booking.pricing.totalAmount.toFixed(2)}
      ${data.refundAmount > 0 ? `Refund Amount: ${data.booking.pricing.currency} ${data.refundAmount.toFixed(2)}` : ''}
      
      ${data.refundAmount > 0 ? 
        'Your refund will be processed within 5-7 business days to your original payment method.' : 
        'No refund is available for this cancellation as per the cancellation policy.'
      }
    `,
  }),
};

// Create transporter for Nodemailer
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    return null; // Use SendGrid directly
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Main send email function
const sendEmail = async (options) => {
  const { email, subject, template, data, html, text } = options;

  let emailContent = {};

  // Use template if provided
  if (template && emailTemplates[template]) {
    emailContent = emailTemplates[template](data);
  } else {
    emailContent = {
      subject: subject || 'Notification from BookingApp',
      html: html || '',
      text: text || '',
    };
  }

  const emailOptions = {
    to: email,
    from: {
      email: process.env.EMAIL_FROM,
      name: 'BookingApp',
    },
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  };

  try {
    if (process.env.EMAIL_SERVICE === 'sendgrid') {
      // Use SendGrid
      await sgMail.send(emailOptions);
      console.log(`Email sent to ${email} via SendGrid`);
    } else {
      // Use Nodemailer
      const transporter = createTransporter();
      
      if (!transporter) {
        throw new Error('No email service configured');
      }

      const mailOptions = {
        from: `BookingApp <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${email} via SMTP`);
    }
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Email could not be sent');
  }
};

// Send bulk emails
const sendBulkEmail = async (recipients, subject, template, data) => {
  const promises = recipients.map((recipient) =>
    sendEmail({
      email: recipient.email,
      subject,
      template,
      data: { ...data, ...recipient },
    })
  );

  try {
    await Promise.allSettled(promises);
    console.log(`Bulk email sent to ${recipients.length} recipients`);
  } catch (error) {
    console.error('Bulk email error:', error);
    throw new Error('Bulk email sending failed');
  }
};

// Email verification helper
const sendVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  
  await sendEmail({
    email: user.email,
    template: 'emailVerification',
    data: {
      name: user.firstName,
      verificationUrl,
    },
  });
};

// Password reset helper
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  
  await sendEmail({
    email: user.email,
    template: 'passwordReset',
    data: {
      name: user.firstName,
      resetUrl,
    },
  });
};

// Booking confirmation helper
const sendBookingConfirmationEmail = async (booking) => {
  await sendEmail({
    email: booking.guestDetails.primaryGuest.email,
    template: 'bookingConfirmation',
    data: {
      booking,
      confirmationCode: booking.confirmationCode,
    },
  });
};

// Booking cancellation helper
const sendBookingCancellationEmail = async (booking, refundAmount = 0) => {
  await sendEmail({
    email: booking.guestDetails.primaryGuest.email,
    template: 'bookingCancellation',
    data: {
      booking,
      refundAmount,
    },
  });
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
};
