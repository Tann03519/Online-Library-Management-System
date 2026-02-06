const mongoose = require('mongoose');
const Review = require('../models/Review');
const Book = require('../models/Book');
const User = require('../models/User');
require('dotenv').config();

const seedReviews = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB');

        // Get some books and users for reviews
        const books = await Book.find().limit(10);
        const users = await User.find({ role: 'USER' }).limit(10);

        if (books.length === 0 || users.length === 0) {
            console.log('❌ No books or users found. Please seed books and users first.');
            return;
        }

        // Clear existing reviews
        await Review.deleteMany({});
        console.log('🗑️ Cleared existing reviews');

        // Sample reviews data
        const reviewsData = [
            {
                bookId: books[0]._id,
                userId: users[0]._id,
                rating: 5,
                comment: 'Sách rất hay và bổ ích! Tôi đã học được nhiều điều từ cuốn sách này. Tác giả có cách viết rất dễ hiểu và thực tế.',
                status: 'ACTIVE',
                helpful: 12,
                reportCount: 0
            },
            {
                bookId: books[1]._id,
                userId: users[1]._id,
                rating: 4,
                comment: 'Nội dung tốt, dễ hiểu. Phù hợp cho những người mới bắt đầu khởi nghiệp.',
                status: 'ACTIVE',
                helpful: 8,
                reportCount: 0
            },
            {
                bookId: books[2]._id,
                userId: users[2]._id,
                rating: 5,
                comment: 'Triết lý sâu sắc, đáng đọc. Cuốn sách này đã thay đổi cách tôi nhìn nhận về cuộc sống.',
                status: 'ACTIVE',
                helpful: 15,
                reportCount: 0
            },
            {
                bookId: books[3]._id,
                userId: users[3]._id,
                rating: 3,
                comment: 'Sách hay nhưng hơi dài dòng. Một số phần có thể rút gọn hơn.',
                status: 'HIDDEN',
                helpful: 3,
                reportCount: 1
            },
            {
                bookId: books[4]._id,
                userId: users[4]._id,
                rating: 2,
                comment: 'Không phù hợp với tôi. Nội dung quá khó hiểu.',
                status: 'HIDDEN',
                helpful: 1,
                reportCount: 2
            },
            {
                bookId: books[0]._id,
                userId: users[5]._id,
                rating: 4,
                comment: 'Cuốn sách này rất hữu ích cho việc phát triển kỹ năng lãnh đạo.',
                status: 'ACTIVE',
                helpful: 6,
                reportCount: 0
            },
            {
                bookId: books[1]._id,
                userId: users[6]._id,
                rating: 5,
                comment: 'Tuyệt vời! Tôi đã áp dụng được nhiều kiến thức từ cuốn sách này.',
                status: 'ACTIVE',
                helpful: 10,
                reportCount: 0
            },
            {
                bookId: books[2]._id,
                userId: users[7]._id,
                rating: 3,
                comment: 'Nội dung hay nhưng hơi khó hiểu với người mới bắt đầu.',
                status: 'ACTIVE',
                helpful: 2,
                reportCount: 0
            },
            {
                bookId: books[3]._id,
                userId: users[8]._id,
                rating: 4,
                comment: 'Một cuốn sách đáng đọc, nhiều bài học quý giá.',
                status: 'ACTIVE',
                helpful: 7,
                reportCount: 0
            },
            {
                bookId: books[4]._id,
                userId: users[9]._id,
                rating: 1,
                comment: 'Không thích cuốn sách này, nội dung không phù hợp.',
                status: 'HIDDEN',
                helpful: 0,
                reportCount: 3
            }
        ];

        // Create reviews
        const reviews = await Review.insertMany(reviewsData);
        console.log(`✅ Created ${reviews.length} reviews`);

        console.log('🎉 Reviews seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error seeding reviews:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
};

// Run the seeding function
seedReviews();
