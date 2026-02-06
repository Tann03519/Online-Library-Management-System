const mongoose = require('mongoose');
const { notifyNewBookAdded } = require('../utils/notificationHelper');
const Book = require('../models/Book');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const testNewBookNotification = async () => {
    try {
        console.log('🧪 Testing new book notification...\n');

        // Get a sample book
        const book = await Book.findOne();
        if (!book) {
            console.log('❌ No books found in database');
            return;
        }

        console.log(`📚 Testing with book: "${book.title}"`);
        console.log(`📖 Book ID: ${book._id}\n`);

        // Get user count before
        const userCountBefore = await User.countDocuments({ role: 'USER' });
        console.log(`👥 Users in system: ${userCountBefore}`);

        // Get notification count before
        const notificationCountBefore = await Notification.countDocuments();
        console.log(`🔔 Notifications before: ${notificationCountBefore}\n`);

        // Test the notification
        console.log('📤 Sending new book notification...');
        await notifyNewBookAdded(book._id);
        console.log('✅ Notification sent successfully!\n');

        // Get notification count after
        const notificationCountAfter = await Notification.countDocuments();
        console.log(`🔔 Notifications after: ${notificationCountAfter}`);
        console.log(`📈 New notifications created: ${notificationCountAfter - notificationCountBefore}\n`);

        // Get the latest notifications
        const latestNotifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('userId', 'fullName email');

        console.log('📋 Latest notifications:');
        latestNotifications.forEach((notification, index) => {
            console.log(`${index + 1}. ${notification.title}`);
            console.log(`   Message: ${notification.message}`);
            console.log(`   Type: ${notification.type}`);
            console.log(`   Priority: ${notification.priority}`);
            console.log(`   User: ${notification.userId?.fullName || 'N/A'}`);
            console.log(`   Created: ${notification.createdAt.toLocaleString()}\n`);
        });

        // Get notification statistics
        const notificationStats = await Notification.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        console.log('📊 Notification statistics by type:');
        notificationStats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count} notifications`);
        });

        console.log('\n✅ New book notification test completed successfully!');

    } catch (error) {
        console.error('❌ Error testing new book notification:', error);
    }
};

const main = async () => {
    await connectDB();
    await testNewBookNotification();
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
};

main();
