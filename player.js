// متغيرات عامة
let currentPlayer = null;
let currentHls = null;

// تحميل النمط المحفوظ
document.addEventListener('DOMContentLoaded', function() {
    // تطبيق النمط المحفوظ
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // استخراج معلومات القناة من URL
    const urlParams = new URLSearchParams(window.location.search);
    const channelData = {
        id: urlParams.get('id'),
        name: urlParams.get('name'),
        description: urlParams.get('description'),
        streamUrl: urlParams.get('streamUrl'),
        category: urlParams.get('category')
    };
    
    // التحقق من وجود البيانات المطلوبة
    if (!channelData.streamUrl || !channelData.name) {
        showError('معلومات القناة غير مكتملة');
        return;
    }
    
    // عرض معلومات القناة
    displayChannelInfo(channelData);
    
    // تشغيل القناة
    setupVideoPlayer(channelData.streamUrl, channelData.name);
});

// عرض معلومات القناة
function displayChannelInfo(channelData) {
    document.getElementById('channelTitle').textContent = channelData.name;
    document.getElementById('channelName').textContent = channelData.name;
    document.getElementById('channelDescription').textContent = 
        channelData.description || 'قناة تلفزيونية';
    
    // تحديث عنوان الصفحة
    document.title = `${channelData.name} - مشغل القناة`;
}

// إعداد مشغل الفيديو
function setupVideoPlayer(streamUrl, channelName) {
    try {
        // تنظيف المشغل السابق
        if (currentPlayer) {
            currentPlayer.dispose();
            currentPlayer = null;
        }
        
        if (currentHls) {
            currentHls.destroy();
            currentHls = null;
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
        
        // معالجة روابط HLS و TS
        if (streamUrl.includes(".m3u8")) {
            if (Hls.isSupported()) {
                currentHls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                    xhrSetup: function(xhr, url) {
                        xhr.withCredentials = false;
                    }
                });
                
                currentHls.on(Hls.Events.ERROR, function(event, data) {
                    console.error("خطأ HLS:", data);
                    if (data.fatal) {
                        switch(data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.log("خطأ في الشبكة، محاولة إعادة التحميل...");
                                handleVideoError("خطأ في تحميل القناة - قد تكون المشكلة في الخادم أو إعدادات CORS");
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.log("خطأ في الوسائط، محاولة الاستعادة...");
                                currentHls.recoverMediaError();
                                break;
                            default:
                                console.log("خطأ غير قابل للاستعادة");
                                handleVideoError("خطأ في تحميل القناة - قد تكون المشكلة في الخادم أو إعدادات CORS");
                                break;
                        }
                    }
                });
                
                currentHls.loadSource(streamUrl);
                currentHls.attachMedia(videoElement);
                
                currentHls.on(Hls.Events.MANIFEST_PARSED, function() {
                    hideLoadingSpinner();
                    showVideoPlayer();
                    currentPlayer.play().catch(e => {
                        console.log("تشغيل تلقائي غير مسموح:", e);
                    });
                });
                
            } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
                videoElement.src = streamUrl;
                hideLoadingSpinner();
                showVideoPlayer();
            } else {
                handleVideoError("المتصفح لا يدعم تشغيل هذا النوع من الملفات");
            }
        } else if (streamUrl.includes(".ts") || streamUrl.includes(".mp4")) {
            currentPlayer.src({
                src: streamUrl,
                type: streamUrl.includes(".ts") ? "video/mp2t" : "video/mp4"
            });
            hideLoadingSpinner();
            showVideoPlayer();
        } else {
            handleVideoError("صيغة رابط البث غير مدعومة");
        }
        
        // معالجة الأحداث العامة للمشغل
        currentPlayer.on("error", function() {
            handleVideoError("خطأ في تشغيل القناة");
        });
        
        currentPlayer.on("loadstart", function() {
            console.log("بدء تحميل القناة:", channelName);
        });
        
        currentPlayer.on("canplay", function() {
            console.log("القناة جاهزة للتشغيل:", channelName);
        });
        
    } catch (error) {
        console.error("خطأ في إعداد المشغل:", error);
        handleVideoError("خطأ في إعداد مشغل الفيديو");
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
                    setupVideoPlayer(proxyUrl, channelName); // Use the main setup function
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

// إخفاء شاشة التحميل وإظهار المشغل
function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

function showVideoPlayer() {
    document.getElementById('videoPlayer').style.display = 'block';
}

// معالجة أخطاء الفيديو
function handleVideoError(message) {
    hideLoadingSpinner();
    
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.innerHTML = `
        <div class="error-message">
            <h3><i class="fas fa-exclamation-triangle"></i> خطأ في تشغيل القناة</h3>
            <p>${message}</p>
            <div style="margin-top: 1rem;">
                <h4>اقتراحات للحل:</h4>
                <ul style="text-align: right; margin-top: 0.5rem;">
                    <li>تأكد من اتصال الإنترنت</li>
                    <li>جرب استخدام VPN</li>
                    <li>تأكد من صحة رابط البث</li>
                    <li>جرب قناة أخرى</li>
                </ul>
            </div>
        </div>
    `;
}

// عرض رسالة خطأ
function showError(message) {
    hideLoadingSpinner();
    document.getElementById('channelName').textContent = 'خطأ';
    document.getElementById('channelDescription').textContent = message;
    handleVideoError(message);
}

// تبديل النمط الليلي
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// تحديث أيقونة النمط
function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-sun';
    } else {
        themeIcon.className = 'fas fa-moon';
    }
}

// تنظيف الموارد عند إغلاق الصفحة
window.addEventListener('beforeunload', function() {
    if (currentPlayer) {
        currentPlayer.dispose();
    }
    if (currentHls) {
        currentHls.destroy();
    }
});

