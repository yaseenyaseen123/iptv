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
    
    // إنشاء URL للصفحة الجديدة مع معاملات القناة
    const playerUrl = new URL('player.html', window.location.href);
    playerUrl.searchParams.set('id', channel.id);
    playerUrl.searchParams.set('name', channel.name);
    playerUrl.searchParams.set('description', channel.description);
    playerUrl.searchParams.set('streamUrl', channel.streamUrl);
    playerUrl.searchParams.set('category', channel.category);
    
    // فتح الصفحة في نافذة جديدة
    window.open(playerUrl.toString(), '_blank');
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
                    backBufferLength: 90,
                    // إعدادات إضافية لمعالجة CORS
                    xhrSetup: function(xhr, url) {
                        // محاولة إضافة headers للـ CORS
                        xhr.withCredentials = false;
                    }
                });
                
                // معالجة أخطاء HLS بشكل أفضل
                hls.on(Hls.Events.ERROR, function(event, data) {
                    console.error('خطأ HLS:', data);
                    
                    if (data.fatal) {
                        switch(data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.log('خطأ في الشبكة، محاولة إعادة التحميل...');
                                // محاولة استخدام CORS proxy
                                tryWithCorsProxy(streamUrl, channelName);
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.log('خطأ في الوسائط، محاولة الاستعادة...');
                                hls.recoverMediaError();
                                break;
                            default:
                                console.log('خطأ غير قابل للاستعادة');
                                handleVideoError('خطأ في تحميل القناة - قد تكون المشكلة في الخادم أو إعدادات CORS');
                                break;
                        }
                    }
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

// محاولة استخدام CORS proxy
function tryWithCorsProxy(originalUrl, channelName) {
    const corsProxies = [
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?'
    ];
    
    let proxyIndex = 0;
    
    function tryNextProxy() {
        if (proxyIndex >= corsProxies.length) {
            handleVideoError('فشل في تحميل القناة - جميع محاولات CORS proxy فشلت. قد تحتاج لاستخدام VPN أو رابط آخر.');
            return;
        }
        
        const proxyUrl = corsProxies[proxyIndex] + encodeURIComponent(originalUrl);
        console.log(`محاولة CORS proxy ${proxyIndex + 1}:`, proxyUrl);
        
        // محاولة تحميل الرابط مع proxy
        fetch(proxyUrl, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    console.log('CORS proxy يعمل، محاولة تشغيل الفيديو...');
                    setupVideoPlayerWithProxy(proxyUrl, channelName);
                } else {
                    proxyIndex++;
                    tryNextProxy();
                }
            })
            .catch(error => {
                console.log(`CORS proxy ${proxyIndex + 1} فشل:`, error);
                proxyIndex++;
                tryNextProxy();
            });
    }
    
    tryNextProxy();
}

// إعداد مشغل الفيديو مع CORS proxy
function setupVideoPlayerWithProxy(proxyUrl, channelName) {
    try {
        if (currentPlayer) {
            currentPlayer.dispose();
            currentPlayer = null;
        }
        
        const videoElement = document.getElementById('videoPlayer');
        
        currentPlayer = videojs(videoElement, {
            controls: true,
            responsive: true,
            fluid: true
        });
        
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(proxyUrl);
            hls.attachMedia(videoElement);
            
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                hideLoadingSpinner();
                showModal();
                currentPlayer.play().catch(e => {
                    console.log('تشغيل تلقائي غير مسموح:', e);
                });
            });
            
            hls.on(Hls.Events.ERROR, function(event, data) {
                console.error('خطأ HLS مع proxy:', data);
                handleVideoError('فشل في تشغيل القناة حتى مع CORS proxy');
            });
        }
        
    } catch (error) {
        console.error('خطأ في إعداد المشغل مع proxy:', error);
        handleVideoError('خطأ في إعداد مشغل الفيديو مع proxy');
    }
}

// معالجة أخطاء الفيديو
function handleVideoError(message) {
    hideLoadingSpinner();
    
    // إنشاء رسالة خطأ مخصصة
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>خطأ في تشغيل القناة</h3>
            <p>${message}</p>
            <div class="error-suggestions">
                <h4>اقتراحات للحل:</h4>
                <ul>
                    <li>تأكد من اتصال الإنترنت</li>
                    <li>جرب استخدام VPN</li>
                    <li>تأكد من صحة رابط البث</li>
                    <li>جرب قناة أخرى</li>
                </ul>
            </div>
            <button onclick="hideErrorMessage()" class="error-close-btn">حسناً</button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
}

// إخفاء رسالة الخطأ
function hideErrorMessage() {
    const errorDiv = document.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
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

