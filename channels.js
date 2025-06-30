// بيانات القنوات التلفزيونية
const channels = [
    {
        id: 1,
        name: "القناة الأولى",
        description: "قناة إخبارية شاملة",
        thumbnail: "https://via.placeholder.com/300x200/4f46e5/ffffff?text=القناة+الأولى",
        streamUrl: "http://platform.topuphost.com:8577/live/alfajr.stream/playlist.m3u8",
        category: "إخبارية"
    },
    {
        id: 2,
        name: "قناة الرياضة",
        description: "أحدث الأخبار الرياضية",
        thumbnail: "https://via.placeholder.com/300x200/059669/ffffff?text=قناة+الرياضة",
        streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        category: "رياضية"
    },
    {
        id: 3,
        name: "قناة الأطفال",
        description: "برامج تعليمية وترفيهية للأطفال",
        thumbnail: "https://via.placeholder.com/300x200/dc2626/ffffff?text=قناة+الأطفال",
        streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        category: "أطفال"
    },
    {
        id: 4,
        name: "قناة الأفلام",
        description: "أحدث الأفلام العربية والعالمية",
        thumbnail: "https://via.placeholder.com/300x200/7c3aed/ffffff?text=قناة+الأفلام",
        streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        category: "أفلام"
    },
    {
        id: 5,
        name: "قناة الطبخ",
        description: "وصفات شهية من المطبخ العربي",
        thumbnail: "https://via.placeholder.com/300x200/ea580c/ffffff?text=قناة+الطبخ",
        streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        category: "طبخ"
    },
    {
        id: 6,
        name: "قناة الموسيقى",
        description: "أجمل الأغاني العربية والعالمية",
        thumbnail: "https://via.placeholder.com/300x200/0891b2/ffffff?text=قناة+الموسيقى",
        streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        category: "موسيقى"
    },
    {
        id: 7,
        name: "قناة الوثائقيات",
        description: "أفلام وثائقية متنوعة",
        thumbnail: "https://via.placeholder.com/300x200/16a34a/ffffff?text=قناة+الوثائقيات",
        streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        category: "وثائقية"
    },
    {
        id: 8,
        name: "قناة التكنولوجيا",
        description: "أحدث التطورات التقنية",
        thumbnail: "https://via.placeholder.com/300x200/6366f1/ffffff?text=قناة+التكنولوجيا",
        streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        category: "تقنية"
    },
    {
        id: 9,
        name: "قناة السفر",
        description: "استكشف العالم معنا",
        thumbnail: "https://via.placeholder.com/300x200/be185d/ffffff?text=قناة+السفر",
        streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        category: "سفر"
    },
    {
        id: 10,
        name: "قناة الصحة",
        description: "نصائح طبية ومعلومات صحية",
        thumbnail: "https://via.placeholder.com/300x200/059669/ffffff?text=قناة+الصحة",
        streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        category: "صحة"
    }
];

// تصدير البيانات للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = channels;
}

