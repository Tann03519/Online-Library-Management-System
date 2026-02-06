const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Book = require('../models/Book');
const User = require('../models/User');
const Fine = require('../models/Fine');
const LoanExtension = require('../models/LoanExtension');
const FinePolicy = require('../models/FinePolicy');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function seedLoanData() {
    try {
        console.log('🌱 Seeding loan data...');

        // Get some users and books
        const users = await User.find().limit(10);
        const books = await Book.find().limit(20);

        if (users.length === 0 || books.length === 0) {
            console.log('❌ No users or books found. Please run the main seed script first.');
            return;
        }

        // Create sample loans with different statuses
        const sampleLoans = [];

        // PENDING loans
        for (let i = 0; i < 3; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const bookCount = Math.floor(Math.random() * 3) + 1;
            const selectedBooks = [];

            for (let j = 0; j < bookCount; j++) {
                const book = books[Math.floor(Math.random() * books.length)];
                if (!selectedBooks.find(b => b.bookId.toString() === book._id.toString())) {
                    selectedBooks.push({
                        bookId: book._id,
                        qty: 1
                    });
                }
            }

            const loan = new Loan({
                readerUserId: user._id,
                createdByRole: 'USER',
                loanDate: new Date(),
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                items: selectedBooks,
                status: 'PENDING',
                notes: `Yêu cầu mượn sách mẫu ${i + 1}`
            });

            sampleLoans.push(loan);
        }

        // APPROVED loans
        for (let i = 0; i < 2; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const bookCount = Math.floor(Math.random() * 2) + 1;
            const selectedBooks = [];

            for (let j = 0; j < bookCount; j++) {
                const book = books[Math.floor(Math.random() * books.length)];
                if (!selectedBooks.find(b => b.bookId.toString() === book._id.toString())) {
                    selectedBooks.push({
                        bookId: book._id,
                        qty: 1
                    });
                }
            }

            const loan = new Loan({
                readerUserId: user._id,
                librarianId: users.find(u => u.role === 'LIBRARIAN')?._id || users[0]._id,
                createdByRole: 'USER',
                loanDate: new Date(),
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                items: selectedBooks,
                status: 'APPROVED',
                notes: `Đã duyệt mượn sách mẫu ${i + 1}`
            });

            sampleLoans.push(loan);
        }

        // BORROWED loans
        for (let i = 0; i < 5; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const bookCount = Math.floor(Math.random() * 2) + 1;
            const selectedBooks = [];

            for (let j = 0; j < bookCount; j++) {
                const book = books[Math.floor(Math.random() * books.length)];
                if (!selectedBooks.find(b => b.bookId.toString() === book._id.toString())) {
                    selectedBooks.push({
                        bookId: book._id,
                        qty: 1
                    });
                }
            }

            const loan = new Loan({
                readerUserId: user._id,
                librarianId: users.find(u => u.role === 'LIBRARIAN')?._id || users[0]._id,
                createdByRole: 'USER',
                loanDate: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000), // Random date in last 10 days
                dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000), // Random date in next 14 days
                items: selectedBooks,
                status: 'BORROWED',
                notes: `Đang mượn sách mẫu ${i + 1}`
            });

            sampleLoans.push(loan);
        }

        // OVERDUE loans
        for (let i = 0; i < 2; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const bookCount = Math.floor(Math.random() * 2) + 1;
            const selectedBooks = [];

            for (let j = 0; j < bookCount; j++) {
                const book = books[Math.floor(Math.random() * books.length)];
                if (!selectedBooks.find(b => b.bookId.toString() === book._id.toString())) {
                    selectedBooks.push({
                        bookId: book._id,
                        qty: 1
                    });
                }
            }

            const loan = new Loan({
                readerUserId: user._id,
                librarianId: users.find(u => u.role === 'LIBRARIAN')?._id || users[0]._id,
                createdByRole: 'USER',
                loanDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
                dueDate: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000), // Overdue by 1-5 days
                items: selectedBooks,
                status: 'OVERDUE',
                notes: `Quá hạn mượn sách mẫu ${i + 1}`
            });

            sampleLoans.push(loan);
        }

        // RETURNED loans
        for (let i = 0; i < 8; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const bookCount = Math.floor(Math.random() * 2) + 1;
            const selectedBooks = [];

            for (let j = 0; j < bookCount; j++) {
                const book = books[Math.floor(Math.random() * books.length)];
                if (!selectedBooks.find(b => b.bookId.toString() === book._id.toString())) {
                    selectedBooks.push({
                        bookId: book._id,
                        qty: 1
                    });
                }
            }

            const loan = new Loan({
                readerUserId: user._id,
                librarianId: users.find(u => u.role === 'LIBRARIAN')?._id || users[0]._id,
                createdByRole: 'USER',
                loanDate: new Date(Date.now() - (20 + Math.random() * 30) * 24 * 60 * 60 * 1000), // 20-50 days ago
                dueDate: new Date(Date.now() - (5 + Math.random() * 15) * 24 * 60 * 60 * 1000), // 5-20 days ago
                items: selectedBooks,
                status: 'RETURNED',
                notes: `Đã trả sách mẫu ${i + 1}`
            });

            sampleLoans.push(loan);
        }

        // Save all loans
        await Loan.insertMany(sampleLoans);
        console.log(`✅ Created ${sampleLoans.length} sample loans`);

        // Create sample extension requests
        const borrowedLoans = await Loan.find({ status: 'BORROWED' }).limit(3);
        const sampleExtensions = [];

        for (let i = 0; i < borrowedLoans.length; i++) {
            const loan = borrowedLoans[i];
            const extensionDays = [3, 7, 14][Math.floor(Math.random() * 3)];
            const newDueDate = new Date(loan.dueDate);
            newDueDate.setDate(newDueDate.getDate() + extensionDays);

            const extension = new LoanExtension({
                loanId: loan._id,
                userId: loan.readerUserId,
                requestedBy: loan.readerUserId,
                currentDueDate: loan.dueDate,
                newDueDate,
                extensionDays,
                reason: `Cần thêm thời gian để hoàn thành nghiên cứu mẫu ${i + 1}`,
                status: i === 0 ? 'PENDING' : i === 1 ? 'APPROVED' : 'REJECTED',
                reviewedBy: i > 0 ? users.find(u => u.role === 'LIBRARIAN')?._id : undefined,
                reviewedAt: i > 0 ? new Date() : undefined,
                reviewNotes: i === 1 ? 'Đã duyệt gia hạn' : i === 2 ? 'Không đủ lý do chính đáng' : undefined
            });

            sampleExtensions.push(extension);
        }

        await LoanExtension.insertMany(sampleExtensions);
        console.log(`✅ Created ${sampleExtensions.length} sample extension requests`);

        // Create sample fines
        const overdueLoans = await Loan.find({ status: 'OVERDUE' });
        const sampleFines = [];

        for (let i = 0; i < overdueLoans.length; i++) {
            const loan = overdueLoans[i];
            const overdueDays = Math.ceil((new Date() - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24));
            const fineAmount = overdueDays * 5000; // 5000 VND per day

            const fine = new Fine({
                loanId: loan._id,
                userId: loan.readerUserId,
                type: 'LATE_RETURN',
                amount: fineAmount,
                currency: 'VND',
                description: `Phạt trả muộn ${overdueDays} ngày`,
                status: i === 0 ? 'PENDING' : 'PAID',
                paidAt: i === 1 ? new Date() : undefined,
                paidBy: i === 1 ? users.find(u => u.role === 'LIBRARIAN')?._id : undefined
            });

            sampleFines.push(fine);
        }

        // Add some damage fines
        const returnedLoans = await Loan.find({ status: 'RETURNED' }).limit(2);
        for (let i = 0; i < returnedLoans.length; i++) {
            const loan = returnedLoans[i];
            const fineAmount = 50000; // 50,000 VND

            const fine = new Fine({
                loanId: loan._id,
                userId: loan.readerUserId,
                type: 'DAMAGE',
                amount: fineAmount,
                currency: 'VND',
                description: 'Phạt hư hỏng sách',
                status: 'PENDING'
            });

            sampleFines.push(fine);
        }

        await Fine.insertMany(sampleFines);
        console.log(`✅ Created ${sampleFines.length} sample fines`);

        // Ensure fine policy exists
        let finePolicy = await FinePolicy.findOne({ isActive: true });
        if (!finePolicy) {
            finePolicy = await FinePolicy.create({
                lateFeePerDay: 5000,
                damageFeeRate: 0.3,
                currency: 'VND',
                isActive: true
            });
            console.log('✅ Created fine policy');
        }

        console.log('🎉 Loan data seeding completed!');
        console.log(`📊 Summary:`);
        console.log(`   - Loans: ${sampleLoans.length}`);
        console.log(`   - Extensions: ${sampleExtensions.length}`);
        console.log(`   - Fines: ${sampleFines.length}`);
        console.log(`   - Fine Policy: ${finePolicy ? 'Exists' : 'Created'}`);

    } catch (error) {
        console.error('❌ Error seeding loan data:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run if called directly
if (require.main === module) {
    seedLoanData();
}

module.exports = seedLoanData;
