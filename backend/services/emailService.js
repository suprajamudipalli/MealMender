const nodemailer = require('nodemailer');

/**
 * Email Service for MealMender
 * Handles all email notifications including expiry warnings
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initialize();
  }

  /**
   * Initialize email transporter with configuration
   */
  initialize() {
    try {
      // Check if email configuration exists
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️  Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env file');
        return;
      }

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      this.isConfigured = true;
      console.log('✅ Email service initialized successfully');

      // Verify connection
      this.verifyConnection();
    } catch (error) {
      console.error('❌ Error initializing email service:', error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Verify email server connection
   */
  async verifyConnection() {
    if (!this.transporter) return;

    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
    } catch (error) {
      console.error('❌ Email server connection failed:', error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Send expiry warning email to donor
   */
  async sendExpiryWarning(donor, donation, hoursLeft, minutesLeft, hasRequests, requestCount) {
    if (!this.isConfigured) {
      console.log('⚠️  Email not sent - service not configured');
      return false;
    }

    try {
      const subject = `⏰ Your donation "${donation.foodName}" is expiring soon!`;
      const htmlContent = this.generateExpiryWarningHTML(donor, donation, hoursLeft, minutesLeft, hasRequests, requestCount);
      const textContent = this.generateExpiryWarningText(donor, donation, hoursLeft, minutesLeft, hasRequests, requestCount);

      const mailOptions = {
        from: `"MealMender" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: donor.email,
        subject: subject,
        text: textContent,
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Expiry warning email sent to ${donor.email} (Message ID: ${info.messageId})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send expiry warning email to ${donor.email}:`, error.message);
      return false;
    }
  }

  /**
   * Generate HTML content for expiry warning email
   */
  generateExpiryWarningHTML(donor, donation, hoursLeft, minutesLeft, hasRequests, requestCount) {
    const timeString = hoursLeft > 0 
      ? `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} and ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`
      : `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;

    const urgencyColor = hoursLeft <= 1 ? '#dc3545' : '#ff9800';
    const urgencyIcon = hoursLeft <= 1 ? '🚨' : '⚠️';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Food Expiry Warning</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🍽️ MealMender
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Food Donation Platform
              </p>
            </td>
          </tr>

          <!-- Urgency Banner -->
          <tr>
            <td style="background-color: ${urgencyColor}; padding: 20px 40px; text-align: center;">
              <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ${urgencyIcon} Food Expiring Soon!
              </h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                Hello <strong>${donor.firstName} ${donor.lastName}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                This is an important reminder about your food donation:
              </p>

              <!-- Donation Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid ${urgencyColor}; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #2E7D32; font-size: 20px;">
                      📦 ${donation.foodName}
                    </h3>
                    <table width="100%" cellpadding="5" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 14px; padding: 5px 0;">
                          <strong>⏰ Time Remaining:</strong>
                        </td>
                        <td style="color: ${urgencyColor}; font-size: 14px; font-weight: 700; padding: 5px 0;">
                          ${timeString}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px; padding: 5px 0;">
                          <strong>📊 Quantity:</strong>
                        </td>
                        <td style="color: #333; font-size: 14px; padding: 5px 0;">
                          ${donation.quantity}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px; padding: 5px 0;">
                          <strong>🏷️ Type:</strong>
                        </td>
                        <td style="color: #333; font-size: 14px; padding: 5px 0;">
                          ${donation.type}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px; padding: 5px 0;">
                          <strong>📍 Location:</strong>
                        </td>
                        <td style="color: #333; font-size: 14px; padding: 5px 0;">
                          ${donation.pickupLocation?.address || 'Not specified'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${hasRequests ? `
                <!-- Has Requests -->
                <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #4caf50;">
                  <p style="margin: 0 0 10px 0; font-size: 16px; color: #2e7d32; font-weight: 700;">
                    ✅ Good News! You have ${requestCount} pending request${requestCount !== 1 ? 's' : ''}
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #558b2f; line-height: 1.6;">
                    Please review and accept a request soon to ensure the food reaches someone before it expires.
                  </p>
                </div>
              ` : `
                <!-- No Requests -->
                <div style="background-color: #fff3e0; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ff9800;">
                  <p style="margin: 0 0 10px 0; font-size: 16px; color: #e65100; font-weight: 700;">
                    ⚠️ No requests yet
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #ef6c00; line-height: 1.6;">
                    Consider donating this food offline to a nearby shelter, community center, or someone in need to prevent it from going to waste.
                  </p>
                </div>
              `}

              <!-- Action Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/frontend/profile.html" 
                       style="display: inline-block; background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 5px;">
                      View My Profile
                    </a>
                    ${hasRequests ? `
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/frontend/notifications.html" 
                       style="display: inline-block; background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 5px;">
                      Review Requests
                    </a>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; font-size: 14px; color: #666; line-height: 1.6;">
                Thank you for helping fight food waste and hunger! 💚
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                <strong>MealMender</strong> - Share Food, Share Love
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                You received this email because you have an active food donation on MealMender.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Generate plain text content for expiry warning email
   */
  generateExpiryWarningText(donor, donation, hoursLeft, minutesLeft, hasRequests, requestCount) {
    const timeString = hoursLeft > 0 
      ? `${hoursLeft} hour(s) and ${minutesLeft} minute(s)`
      : `${minutesLeft} minute(s)`;

    return `
MealMender - Food Expiry Warning

Hello ${donor.firstName} ${donor.lastName},

⏰ URGENT: Your food donation is expiring soon!

Donation Details:
- Food: ${donation.foodName}
- Time Remaining: ${timeString}
- Quantity: ${donation.quantity}
- Type: ${donation.type}
- Location: ${donation.pickupLocation?.address || 'Not specified'}

${hasRequests 
  ? `✅ Good News! You have ${requestCount} pending request(s). Please review and accept a request soon to ensure the food reaches someone before it expires.`
  : `⚠️ No requests yet. Consider donating this food offline to a nearby shelter, community center, or someone in need to prevent it from going to waste.`
}

View your profile: ${process.env.FRONTEND_URL || 'http://localhost:5500'}/frontend/profile.html
${hasRequests ? `Review requests: ${process.env.FRONTEND_URL || 'http://localhost:5500'}/frontend/notifications.html` : ''}

Thank you for helping fight food waste and hunger!

---
MealMender - Share Food, Share Love
You received this email because you have an active food donation on MealMender.
    `.trim();
  }

  /**
   * Send test email
   */
  async sendTestEmail(toEmail) {
    if (!this.isConfigured) {
      console.log('⚠️  Email not sent - service not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: `"MealMender" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: '✅ MealMender Email Service Test',
        text: 'This is a test email from MealMender. If you received this, your email service is working correctly!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
              <h2 style="color: #2E7D32;">✅ Email Service Test Successful!</h2>
              <p>This is a test email from MealMender.</p>
              <p>If you received this, your email service is configured correctly and working! 🎉</p>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
              <p style="color: #666; font-size: 14px;">MealMender - Share Food, Share Love</p>
            </div>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Test email sent to ${toEmail} (Message ID: ${info.messageId})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send test email:`, error.message);
      return false;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
