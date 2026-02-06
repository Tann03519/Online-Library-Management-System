import React from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Users,
    Target,
    Award,
    Heart,
    Globe,
    Shield,
    Zap
} from 'lucide-react';

const About: React.FC = () => {
    const features = [
        {
            icon: BookOpen,
            title: 'Kho sách phong phú',
            description: 'Hơn 10,000 đầu sách từ các lĩnh vực khác nhau, được cập nhật liên tục'
        },
        {
            icon: Users,
            title: 'Cộng đồng học tập',
            description: 'Kết nối với hàng nghìn sinh viên và giảng viên trong hệ thống'
        },
        {
            icon: Target,
            title: 'Mục tiêu rõ ràng',
            description: 'Hỗ trợ tối đa việc học tập và nghiên cứu của sinh viên'
        },
        {
            icon: Award,
            title: 'Chất lượng cao',
            description: 'Sách được tuyển chọn kỹ lưỡng từ các nhà xuất bản uy tín'
        },
        {
            icon: Heart,
            title: 'Dịch vụ tận tâm',
            description: 'Đội ngũ thủ thư chuyên nghiệp, sẵn sàng hỗ trợ 24/7'
        },
        {
            icon: Globe,
            title: 'Truy cập mọi lúc',
            description: 'Hệ thống online cho phép tìm kiếm và đặt sách mọi lúc, mọi nơi'
        }
    ];

    const stats = [
        { number: '10,000+', label: 'Đầu sách' },
        { number: '5,000+', label: 'Sinh viên' },
        { number: '500+', label: 'Giảng viên' },
        { number: '50+', label: 'Thể loại' }
    ];

    return (
        <div className="min-h-screen bg-dark-900 pt-16">
            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />

                {/* Background Elements */}
                <div className="absolute inset-0">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white/20 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -20, 0],
                                opacity: [0.2, 0.8, 0.2],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-6">
                            Về Thư Viện
                        </h1>
                        <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                            Hệ thống quản lý thư viện hiện đại, mang đến trải nghiệm học tập
                            và nghiên cứu tốt nhất cho cộng đồng sinh viên.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-dark-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                className="text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <div className="text-3xl md:text-4xl font-bold text-primary-400 mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-dark-300 font-medium">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl font-heading font-bold text-dark-50 mb-6">
                                Sứ mệnh của chúng tôi
                            </h2>
                            <p className="text-dark-300 text-lg leading-relaxed mb-6">
                                Thư viện được thành lập với sứ mệnh cung cấp nguồn tài liệu học tập
                                và nghiên cứu phong phú, hiện đại cho cộng đồng sinh viên và giảng viên.
                                Chúng tôi cam kết mang đến trải nghiệm học tập tốt nhất thông qua
                                công nghệ tiên tiến và dịch vụ chuyên nghiệp.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-primary-400" />
                                    <span className="text-dark-300">Bảo mật thông tin cao</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-primary-400" />
                                    <span className="text-dark-300">Tốc độ truy cập nhanh</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Heart className="w-5 h-5 text-primary-400" />
                                    <span className="text-dark-300">Dịch vụ tận tâm</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <div className="glass-card p-8">
                                <div className="text-center">
                                    <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <BookOpen className="w-12 h-12 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-heading font-bold text-dark-50 mb-4">
                                        Thư viện số hiện đại
                                    </h3>
                                    <p className="text-dark-300 leading-relaxed">
                                        Ứng dụng công nghệ tiên tiến để mang đến trải nghiệm
                                        học tập và nghiên cứu tốt nhất cho người dùng.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-dark-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-heading font-bold text-dark-50 mb-4">
                            Tại sao chọn chúng tôi?
                        </h2>
                        <p className="text-dark-300 text-lg max-w-2xl mx-auto">
                            Chúng tôi cung cấp những tính năng và dịch vụ tốt nhất
                            để hỗ trợ việc học tập và nghiên cứu của bạn.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className="glass-card p-6 text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-heading font-semibold text-dark-50 mb-4">
                                    {feature.title}
                                </h3>
                                <p className="text-dark-300 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-heading font-bold text-dark-50 mb-6">
                            Liên hệ với chúng tôi
                        </h2>
                        <p className="text-dark-300 text-lg mb-8">
                            Có câu hỏi hoặc cần hỗ trợ? Chúng tôi luôn sẵn sàng giúp đỡ bạn.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="glass-card p-6">
                                <Globe className="w-8 h-8 text-primary-400 mx-auto mb-4" />
                                <h3 className="font-heading font-semibold text-dark-50 mb-2">
                                    Website
                                </h3>
                                <p className="text-dark-300 text-sm">
                                    www.thuvien.edu.vn
                                </p>
                            </div>

                            <div className="glass-card p-6">
                                <Users className="w-8 h-8 text-primary-400 mx-auto mb-4" />
                                <h3 className="font-heading font-semibold text-dark-50 mb-2">
                                    Hotline
                                </h3>
                                <p className="text-dark-300 text-sm">
                                    (028) 1234-5678
                                </p>
                            </div>

                            <div className="glass-card p-6">
                                <Heart className="w-8 h-8 text-primary-400 mx-auto mb-4" />
                                <h3 className="font-heading font-semibold text-dark-50 mb-2">
                                    Email
                                </h3>
                                <p className="text-dark-300 text-sm">
                                    support@thuvien.edu.vn
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default About;
