const cron = require('node-cron');
const Loan = require('../models/Loan');
const { notifyLoanOverdue, notifyLoanDueSoon } = require('./notificationHelper');

// Update overdue loans status
const updateOverdueLoans = async () => {
    try {
        const today = new Date();

        // Find loans that are overdue but still marked as OPEN
        const overdueLoans = await Loan.find({
            status: 'OPEN',
            dueDate: { $lt: today }
        });

        if (overdueLoans.length > 0) {
            // Update status to OVERDUE
            await Loan.updateMany(
                {
                    status: 'OPEN',
                    dueDate: { $lt: today }
                },
                {
                    $set: { status: 'OVERDUE' }
                }
            );

            // Create notifications for overdue loans
            for (const loan of overdueLoans) {
                await notifyLoanOverdue(loan._id);
            }

            console.log(`🕐 Updated ${overdueLoans.length} loans to OVERDUE status and sent notifications`);
        }
    } catch (error) {
        console.error('❌ Error updating overdue loans:', error);
    }
};

// Check for loans due soon (within 2 days)
const checkLoansDueSoon = async () => {
    try {
        const today = new Date();
        const twoDaysFromNow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

        // Find loans that are due within 2 days
        const loansDueSoon = await Loan.find({
            status: 'OPEN',
            dueDate: {
                $gte: today,
                $lte: twoDaysFromNow
            }
        });

        if (loansDueSoon.length > 0) {
            // Create notifications for loans due soon
            for (const loan of loansDueSoon) {
                await notifyLoanDueSoon(loan._id);
            }

            console.log(`⏰ Sent ${loansDueSoon.length} due soon notifications`);
        }
    } catch (error) {
        console.error('❌ Error checking loans due soon:', error);
    }
};

// Schedule cron job to run daily at 00:05
const startCronJobs = () => {
    // Update overdue loans every day at 00:05
    cron.schedule('5 0 * * *', () => {
        console.log('🕐 Running daily overdue loans update...');
        updateOverdueLoans();
    }, {
        scheduled: true,
        timezone: 'Asia/Ho_Chi_Minh'
    });

    // Check loans due soon every day at 09:00
    cron.schedule('0 9 * * *', () => {
        console.log('⏰ Running daily due soon loans check...');
        checkLoansDueSoon();
    }, {
        scheduled: true,
        timezone: 'Asia/Ho_Chi_Minh'
    });

    console.log('⏰ Cron jobs started');
};

module.exports = {
    startCronJobs,
    updateOverdueLoans
};
