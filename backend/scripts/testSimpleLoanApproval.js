const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Book = require('../models/Book');

async function testSimpleLoanApproval() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management');
        console.log('✅ Connected to MongoDB');

        // Find a pending loan
        const pendingLoan = await Loan.findOne({ status: 'PENDING' }).populate('items.bookId');
        if (!pendingLoan) {
            console.log('❌ No pending loans found');
            return;
        }

        console.log('📋 Found pending loan:', pendingLoan.code);
        console.log('📚 Loan items:', pendingLoan.items.map(item => ({
            book: item.bookId.title,
            qty: item.qty
        })));

        // Check book quantities before approval
        console.log('\n=== 📊 BEFORE APPROVAL ===');
        const beforeQuantities = {};
        for (const item of pendingLoan.items) {
            const book = await Book.findById(item.bookId);
            beforeQuantities[item.bookId.toString()] = book.quantityAvailable;
            console.log(`📖 ${book.title}: Available = ${book.quantityAvailable}, Requested = ${item.qty}`);
        }

        // Simulate approval process
        console.log('\n=== 🔄 PROCESSING APPROVAL ===');
        for (const item of pendingLoan.items) {
            const updatedBook = await Book.findByIdAndUpdate(
                item.bookId,
                { $inc: { quantityAvailable: -item.qty } },
                { new: true }
            );
            console.log(`✅ Updated ${updatedBook.title}: ${beforeQuantities[item.bookId.toString()]} → ${updatedBook.quantityAvailable}`);
        }

        // Update loan status
        pendingLoan.status = 'BORROWED';
        pendingLoan.loanDate = new Date();
        await pendingLoan.save();
        console.log('✅ Loan status updated to BORROWED');

        // Check book quantities after approval
        console.log('\n=== 📊 AFTER APPROVAL ===');
        for (const item of pendingLoan.items) {
            const book = await Book.findById(item.bookId);
            const beforeQty = beforeQuantities[item.bookId.toString()];
            const afterQty = book.quantityAvailable;
            const expectedQty = beforeQty - item.qty;

            console.log(`📖 ${book.title}:`);
            console.log(`   Before: ${beforeQty}`);
            console.log(`   After:  ${afterQty}`);
            console.log(`   Expected: ${expectedQty}`);
            console.log(`   ✅ ${afterQty === expectedQty ? 'CORRECT' : '❌ INCORRECT'}`);
        }

        console.log('\n🎉 Loan approval test completed successfully!');

    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the test
console.log('🚀 Starting simple loan approval test...');
testSimpleLoanApproval();
