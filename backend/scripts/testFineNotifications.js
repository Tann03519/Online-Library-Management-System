const mongoose = require('mongoose');
const Fine = require('../models/Fine');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { notifyFineIssued, notifyFinePaid, notifyFineWaived } = require('../utils/notificationHelper');

async function testFineNotifications() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management');
        console.log('✅ Connected to MongoDB');

        // Find a user to test with
        const user = await User.findOne({ role: 'USER' });
        if (!user) {
            console.log('❌ No user found for testing');
            return;
        }

        console.log('👤 Testing with user:', user.fullName);

        // Create a test fine
        const testFine = new Fine({
            userId: user._id,
            type: 'DAMAGE',
            amount: 50000,
            currency: 'VND',
            description: 'Test damage fine for notification testing',
            status: 'PENDING'
        });

        await testFine.save();
        console.log('💰 Created test fine:', testFine._id);

        // Test fine issued notification
        console.log('\n🔔 Testing fine issued notification...');
        await notifyFineIssued(testFine._id);

        let notification = await Notification.findOne({
            userId: user._id,
            type: 'FINE_ISSUED'
        });
        console.log('✅ Fine issued notification created:', notification ? 'Yes' : 'No');
        if (notification) {
            console.log('   Title:', notification.title);
            console.log('   Message:', notification.message);
            console.log('   Data:', JSON.stringify(notification.data, null, 2));
        }

        // Test fine paid notification
        console.log('\n💳 Testing fine paid notification...');
        testFine.status = 'PAID';
        testFine.paidAt = new Date();
        await testFine.save();

        await notifyFinePaid(testFine._id);

        notification = await Notification.findOne({
            userId: user._id,
            type: 'FINE_PAID'
        });
        console.log('✅ Fine paid notification created:', notification ? 'Yes' : 'No');
        if (notification) {
            console.log('   Title:', notification.title);
            console.log('   Message:', notification.message);
        }

        // Test fine waived notification
        console.log('\n🙏 Testing fine waived notification...');
        testFine.status = 'WAIVED';
        testFine.waivedAt = new Date();
        testFine.waivedReason = 'Test waiver reason';
        await testFine.save();

        await notifyFineWaived(testFine._id, 'Test waiver reason');

        notification = await Notification.findOne({
            userId: user._id,
            type: 'FINE_WAIVED'
        });
        console.log('✅ Fine waived notification created:', notification ? 'Yes' : 'No');
        if (notification) {
            console.log('   Title:', notification.title);
            console.log('   Message:', notification.message);
        }

        // Show all notifications for the user
        console.log('\n📋 All notifications for user:');
        const allNotifications = await Notification.find({ userId: user._id }).sort({ createdAt: -1 });
        allNotifications.forEach((notif, index) => {
            console.log(`   ${index + 1}. [${notif.type}] ${notif.title}`);
            console.log(`      ${notif.message}`);
            console.log(`      Priority: ${notif.priority}, Read: ${notif.isRead}`);
            console.log('');
        });

        // Clean up test data
        await Fine.findByIdAndDelete(testFine._id);
        await Notification.deleteMany({ userId: user._id, type: { $in: ['FINE_ISSUED', 'FINE_PAID', 'FINE_WAIVED'] } });
        console.log('🧹 Cleaned up test data');

        console.log('\n🎉 Fine notification test completed successfully!');

    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the test
console.log('🚀 Starting fine notification test...');
testFineNotifications();
