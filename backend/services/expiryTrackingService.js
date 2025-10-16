const Donation = require('../models/donation');
const Request = require('../models/request');
const User = require('../models/user');
const emailService = require('./emailService');

/**
 * Expiry Tracking Service
 * Monitors food donations and sends notifications when they're about to expire
 */

class ExpiryTrackingService {
  constructor() {
    this.checkInterval = 15 * 60 * 1000; // Check every 15 minutes
    this.isRunning = false;
  }

  /**
   * Start the expiry tracking service
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Expiry tracking service is already running');
      return;
    }

    console.log('🚀 Starting expiry tracking service...');
    this.isRunning = true;
    
    // Run immediately on start
    this.checkExpiringDonations();
    
    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.checkExpiringDonations();
    }, this.checkInterval);
    
    console.log('✅ Expiry tracking service started successfully');
  }

  /**
   * Stop the expiry tracking service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      console.log('🛑 Expiry tracking service stopped');
    }
  }

  /**
   * Main function to check all expiring donations
   */
  async checkExpiringDonations() {
    try {
      const now = new Date();
      console.log(`🔍 Checking expiring donations at ${now.toISOString()}`);

      // Find all available donations
      const donations = await Donation.find({ 
        status: 'available',
        markedAsExpired: false 
      }).populate('donor', 'firstName lastName email username');

      let updatedCount = 0;
      let notifiedCount = 0;

      for (const donation of donations) {
        const expiryDate = new Date(donation.expiry);
        const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);

        // Update urgency level
        const oldUrgency = donation.urgencyLevel;
        let newUrgency = 'safe';

        if (hoursUntilExpiry < 0) {
          newUrgency = 'expired';
          // Mark as expired
          donation.status = 'expired';
          donation.markedAsExpired = true;
          console.log(`❌ Donation "${donation.foodName}" (ID: ${donation._id}) has expired`);
        } else if (hoursUntilExpiry <= 2) {
          newUrgency = 'urgent';
        } else if (hoursUntilExpiry <= 5) {
          newUrgency = 'warning';
        }

        // Update urgency if changed
        if (newUrgency !== oldUrgency) {
          donation.urgencyLevel = newUrgency;
          updatedCount++;
        }

        // Send notification if food is expiring soon and donor hasn't been notified
        if (hoursUntilExpiry > 0 && hoursUntilExpiry <= 3 && !donation.expiryNotificationSent) {
          await this.notifyDonorAboutExpiry(donation);
          donation.expiryNotificationSent = true;
          donation.expiryWarningTime = now;
          notifiedCount++;
        }

        // Save changes
        await donation.save();
      }

      if (updatedCount > 0 || notifiedCount > 0) {
        console.log(`✅ Updated ${updatedCount} donations, sent ${notifiedCount} notifications`);
      }
    } catch (error) {
      console.error('❌ Error in expiry tracking service:', error);
    }
  }

  /**
   * Notify donor about expiring food
   */
  async notifyDonorAboutExpiry(donation) {
    try {
      const expiryDate = new Date(donation.expiry);
      const now = new Date();
      const hoursLeft = Math.floor((expiryDate - now) / (1000 * 60 * 60));
      const minutesLeft = Math.floor(((expiryDate - now) % (1000 * 60 * 60)) / (1000 * 60));

      // Check if there are any pending requests for this donation
      const requestCount = await Request.countDocuments({ 
        donation: donation._id,
        status: { $in: ['pending', 'accepted'] }
      });

      const hasRequests = requestCount > 0;

      // Log notification
      let message = '';
      if (hasRequests) {
        message = `⏰ Your donation "${donation.foodName}" has ${hoursLeft}h ${minutesLeft}m left and has ${requestCount} pending request(s). Please review them soon!`;
      } else {
        message = `⚠️ Your donation "${donation.foodName}" expires in ${hoursLeft}h ${minutesLeft}m and hasn't been claimed yet. Consider donating it offline to prevent waste.`;
      }

      console.log(`📧 Notifying ${donation.donor.username}: ${message}`);

      // Email notifications disabled - only logging
      console.log(`📧 [DISABLED] Would send email notification to ${donation.donor.email}: ${message}`);

      // You can also extend this to:
      // 1. Send push notifications
      // 2. Create in-app notifications
      // 3. Send SMS alerts

      // Example: Create an in-app notification (if you have a notification model)
      // await Notification.create({
      //   user: donation.donor._id,
      //   type: 'expiry_warning',
      //   title: 'Food Expiring Soon',
      //   message: message,
      //   relatedDonation: donation._id
      // });

      return true;
    } catch (error) {
      console.error(`❌ Error notifying donor for donation ${donation._id}:`, error);
      return false;
    }
  }

  /**
   * Get urgency statistics
   */
  async getUrgencyStats() {
    try {
      const stats = await Donation.aggregate([
        { $match: { status: 'available' } },
        { $group: { _id: '$urgencyLevel', count: { $sum: 1 } } }
      ]);

      return stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error getting urgency stats:', error);
      return {};
    }
  }

  /**
   * Manually trigger expiry check (useful for testing)
   */
  async triggerCheck() {
    console.log('🔄 Manually triggering expiry check...');
    await this.checkExpiringDonations();
  }
}

// Create singleton instance
const expiryTrackingService = new ExpiryTrackingService();

module.exports = expiryTrackingService;
