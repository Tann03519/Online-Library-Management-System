const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Book = require('../models/Book');
const User = require('../models/User');

async function testLoanApproval() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management');
        console.log('Connected to MongoDB');

        // Find a pending loan
        const pendingLoan = await Loan.findOne({ status: 'PENDING' }).populate('items.bookId');
        if (!pendingLoan) {
            console.log('No pending loans found');
            return;
        }

        console.log('Found pending loan:', pendingLoan.code);
        console.log('Loan items:', pendingLoan.items);

        // Check book quantities before approval
        console.log('\n=== BEFORE APPROVAL ===');
        for (const item of pendingLoan.items) {
            const book = await Book.findById(item.bookId);
            console.log(`Book: ${book.title} - Available: ${book.quantityAvailable}, Requested: ${item.qty}`);
        }

        // Simulate approval process
        try {
            // Update book quantities
            for (const item of pendingLoan.items) {
                const updatedBook = await Book.findByIdAndUpdate(
                    item.bookId,
                    { $inc: { quantityAvailable: -item.qty } },
                    { new: true }
                );
                console.log(`Updated book ${item.bookId}: ${updatedBook.quantityAvailable} available`);
            }

            // Update loan status
            pendingLoan.status = 'BORROWED';
            pendingLoan.loanDate = new Date();
            await pendingLoan.save();

            console.log('\n=== AFTER APPROVAL ===');
            // Check book quantities after approval
            for (const item of pendingLoan.items) {
                const book = await Book.findById(item.bookId);
                console.log(`Book: ${book.title} - Available: ${book.quantityAvailable}, Requested: ${item.qty}`);
            }

            console.log('\n✅ Loan approval test completed successfully');
        } catch (error) {
            console.error('❌ Error during loan approval:', error);
        }

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the test
testLoanApproval();
