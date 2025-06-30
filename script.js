// متغيرات عامة
let currentPlayer = null;
let currentModal = null;

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// تهيئة التطبيق
function initializeApp() {
    loadChannels();
    setupThemeToggle();
    setupModalEvents();
    loadThemePreference();
}

// تحميل وعرض القنوات
function loadChannels() {
    const channelsGrid = document.getElementById('channelsGrid');
    
    if (!channels || channels.length === 0) {
        channelsGrid.innerHTML = '<p class="no-channels">لا توجد قنوات متاحة حالياً</p>';
        return;
    }
    
    channelsGrid.innerHTML = '';
    
    channels.forEach(channel => {
        const channelCard = createChannelCard(channel);
        channelsGrid.appendChild(channelCard);
    });
}

// إنشاء بطاقة قناة
function createChannelCard(channel) {
    const card = document.createElement('div');
    card.className = 'channel-card';
    card.setAttribute('data-channel-id', channel.id);
    
    card.innerHTML = `
        <div class="channel-thumbnail">
            <img src="${channel.thumbnail}" alt="${channel.name}" loading="lazy">
            <div class="channel-category">${channel.category}</div>
        </div>
        <div class="channel-info">
            <h3 class="channel-name">${channel.name}</h3>
            <p class="channel-description">${channel.description}</p>
            <button class="watch-btn" onclick="playChannel(${channel.id})">
                <i class="fas fa-play"></i>
                مشاهدة
            </button>
        </div>
    `;
    
    // إضافة تأثير النقر على البطاقة
    card.addEventListener('click', function(e) {
        if (!e.target.classList.contains('watch-btn')) {
            playChannel(channel.id);
        }
    });
    
    return card;
}

// تشغيل القناة
function playChannel(channelId) {
    const channel = channels.find(ch => ch.id === channelId);
    if (!channel) {
        showError('القناة غير موجودة');
        return;
    }
    
    showLoadingSpinner();
    
    // تحديث عنوان النافذة المنبثقة
    document.getElementById('modalTitle').textContent = channel.name;
    
    // إعداد مشغل الفيديو
    setupVideoPlayer(channel.streamUrl, channel.name);
}

// إعداد مشغل الفيديو
function setupVideoPlayer(streamUrl, channelName) {
    try {
        // تنظيف المشغل السابق
        if (currentPlayer) {
            currentPlayer.dispose();
            currentPlayer = null;
        }
        
        const videoElement = document.getElementById('videoPlayer');
        
        // تهيئة Video.js
        currentPlayer = videojs(videoElement, {
            controls: true,
            responsive: true,
            fluid: true,
            playbackRates: [0.5, 1, 1.25, 1.5, 2],
            plugins: {
                hotkeys: {
                    volumeStep: 0.1,
                    seekStep: 5,
                    enableModifiersForNumbers: false
                }
            }
        });
        
        // معالجة روابط HLS
        if (streamUrl.includes('.m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                
                hls.loadSource(streamUrl);
                hls.attachMedia(videoElement);
                
                hls.on(Hls.Events.MANIFEST_PARSED, function() {
                    hideLoadingSpinner();
                    showModal();
                    currentPlayer.play().catch(e => {
                        console.log('تشغيل تلقائي غير مسموح:', e);
                    });
                });
                
                hls.on(Hls.Events.ERROR, function(event, data) {
                    console.error('خطأ HLS:', data);
                    handleVideoError('خطأ في تحميل القناة');
                });
                
            } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                // دعم Safari الأصلي للـ HLS
                videoElement.src = streamUrl;
                hideLoadingSpinner();
                showModal();
            } else {
                handleVideoError('المتصفح لا يدعم تشغيل هذا النوع من الملفات');
            }
        } else {
            // روابط فيديو عادية
            currentPlayer.src({
                src: streamUrl,
                type: 'video/mp4'
            });
            
            hideLoadingSpinner();
            showModal();
        }
        
        // معالجة الأحداث
        currentPlayer.on('error', function() {
            handleVideoError('خطأ في تشغيل القناة');
        });
        
        currentPlayer.on('loadstart', function() {
            console.log('بدء تحميل القناة:', channelName);
        });
        
        currentPlayer.on('canplay', function() {
            console.log('القناة جاهزة للتشغيل:', channelName);
        });
        
    } catch (error) {
        console.error('خطأ في إعداد المشغل:', error);
        handleVideoError('خطأ في إعداد مشغل الفيديو');
    }
}

// معالجة أخطاء الفيديو
function handleVideoError(message) {
    hideLoadingSpinner();
    showError(message);
}

// عرض النافذة المنبثقة
function showModal() {
    const modal = document.getElementById('videoModal');
    modal.classList.add('active');
    currentModal = modal;
    
    // منع التمرير في الخلفية
    document.body.style.overflow = 'hidden';
}

// إخفاء النافذة المنبثقة
function hideModal() {
    const modal = document.getElementById('videoModal');
    modal.classList.remove('active');
    currentModal = null;
    
    // إعادة تفعيل التمرير
    document.body.style.overflow = 'auto';
    
    // إيقاف المشغل
    if (currentPlayer) {
        currentPlayer.pause();
    }
}

// إعداد أحداث النافذة المنبثقة
function setupModalEvents() {
    const modal = document.getElementById('videoModal');
    const closeBtn = document.getElementById('modalClose');
    
    // إغلاق عند النقر على زر الإغلاق
    closeBtn.addEventListener('click', hideModal);
    
    // إغلاق عند النقر خارج المحتوى
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideModal();
        }
    });
    
    // إغلاق بمفتاح Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && currentModal) {
            hideModal();
        }
    });
}

// عرض مؤشر التحميل
function showLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    spinner.classList.add('active');
}

// إخفاء مؤشر التحميل
function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    spinner.classList.remove('active');
}

// عرض رسالة خطأ
function showError(message) {
    alert(message); // يمكن تحسينها لاحقاً بنافذة مخصصة
}

// إعداد تبديل النمط الليلي
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // تحديث الأيقونة
        if (newTheme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
        
        // حفظ التفضيل
        localStorage.setItem('theme', newTheme);
    });
}

// تحميل تفضيل النمط المحفوظ
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (savedTheme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// وظائف مساعدة لإضافة قنوات جديدة
function addChannel(channelData) {
    // التحقق من صحة البيانات
    if (!channelData.name || !channelData.streamUrl) {
        console.error('بيانات القناة غير مكتملة');
        return false;
    }
    
    // إضافة معرف فريد إذا لم يكن موجوداً
    if (!channelData.id) {
        channelData.id = channels.length + 1;
    }
    
    // إضافة قيم افتراضية
    channelData.description = channelData.description || 'وصف القناة';
    channelData.thumbnail = channelData.thumbnail || 'https://via.placeholder.com/300x200/6366f1/ffffff?text=' + encodeURIComponent(channelData.name);
    channelData.category = channelData.category || 'عام';
    
    // إضافة القناة للمصفوفة
    channels.push(channelData);
    
    // إعادة تحميل القنوات
    loadChannels();
    
    return true;
}

// إزالة قناة
function removeChannel(channelId) {
    const index = channels.findIndex(ch => ch.id === channelId);
    if (index !== -1) {
        channels.splice(index, 1);
        loadChannels();
        return true;
    }
    return false;
}

// تحديث بيانات قناة
function updateChannel(channelId, newData) {
    const channel = channels.find(ch => ch.id === channelId);
    if (channel) {
        Object.assign(channel, newData);
        loadChannels();
        return true;
    }
    return false;
}

// البحث في القنوات
function searchChannels(query) {
    const filteredChannels = channels.filter(channel => 
        channel.name.toLowerCase().includes(query.toLowerCase()) ||
        channel.description.toLowerCase().includes(query.toLowerCase()) ||
        channel.category.toLowerCase().includes(query.toLowerCase())
    );
    
    displayFilteredChannels(filteredChannels);
}

// عرض القنوات المفلترة
function displayFilteredChannels(filteredChannels) {
    const channelsGrid = document.getElementById('channelsGrid');
    channelsGrid.innerHTML = '';
    
    if (filteredChannels.length === 0) {
        channelsGrid.innerHTML = '<p class="no-channels">لا توجد قنوات تطابق البحث</p>';
        return;
    }
    
    filteredChannels.forEach(channel => {
        const channelCard = createChannelCard(channel);
        channelsGrid.appendChild(channelCard);
    });
}

// معالجة الأخطاء العامة
window.addEventListener('error', function(e) {
    console.error('خطأ في التطبيق:', e.error);
});

// تنظيف الموارد عند إغلاق الصفحة
window.addEventListener('beforeunload', function() {
    if (currentPlayer) {
        currentPlayer.dispose();
    }
});

// تصدير الوظائف للاستخدام الخارجي
window.TVStreamingApp = {
    addChannel,
    removeChannel,
    updateChannel,
    searchChannels,
    playChannel
};

