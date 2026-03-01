// ===== تهيئة الجسيمات الخلفية =====
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

// ===== إدارة المستخدمين =====
const UserManager = {
    // تسجيل مستخدم جديد
    signup: function(username, email, password, avatar) {
        const users = JSON.parse(localStorage.getItem('robloxTrades_users') || '[]');
        
        // التحقق من عدم تكرار اسم المستخدم
        if (users.find(u => u.username === username)) {
            alert('اسم المستخدم موجود مسبقاً!');
            return false;
        }
        
        const newUser = {
            id: Date.now(),
            username,
            email,
            password, // في التطبيق الحقيقي يجب تشفيرها
            avatar,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('robloxTrades_users', JSON.stringify(users));
        
        // تسجيل الدخول تلقائياً
        this.login(username, password);
        return true;
    },
    
    // تسجيل الدخول
    login: function(username, password) {
        const users = JSON.parse(localStorage.getItem('robloxTrades_users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            localStorage.setItem('robloxTrades_currentUser', JSON.stringify(user));
            return true;
        }
        return false;
    },
    
    // تسجيل الخروج
    logout: function() {
        localStorage.removeItem('robloxTrades_currentUser');
        window.location.href = 'index.html';
    },
    
    // الحصول على المستخدم الحالي
    getCurrentUser: function() {
        return JSON.parse(localStorage.getItem('robloxTrades_currentUser'));
    },
    
    // التحقق من تسجيل الدخول
    isLoggedIn: function() {
        return !!this.getCurrentUser();
    }
};

// ===== إدارة المنشورات =====
const PostManager = {
    // إضافة منشور جديد
    addPost: function(postData) {
        const posts = JSON.parse(localStorage.getItem('robloxTrades_posts') || '[]');
        const user = UserManager.getCurrentUser();
        
        const newPost = {
            id: Date.now(),
            ...postData,
            userId: user.id,
            username: user.username,
            userAvatar: user.avatar,
            createdAt: new Date().toISOString(),
            likes: 0
        };
        
        posts.unshift(newPost); // إضافة في البداية
        localStorage.setItem('robloxTrades_posts', JSON.stringify(posts));
        return newPost;
    },
    
    // الحصول على جميع المنشورات
    getPosts: function() {
        return JSON.parse(localStorage.getItem('robloxTrades_posts') || '[]');
    },
    
    // حذف منشور
    deletePost: function(postId) {
        let posts = this.getPosts();
        posts = posts.filter(p => p.id !== postId);
        localStorage.setItem('robloxTrades_posts', JSON.stringify(posts));
    }
};

// ===== معالجة الصور =====
const ImageHandler = {
    // تحويل الصورة إلى Base64
    toBase64: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    // ضغط الصورة
    compress: function(base64String, maxWidth = 800) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64String;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scale;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        });
    }
};

// ===== تهيئة الصفحات =====
document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    
    // صفحة تسجيل الدخول
    if (document.getElementById('loginForm')) {
        initLoginPage();
    }
    
    // صفحة التسجيل
    if (document.getElementById('signupForm')) {
        initSignupPage();
    }
    
    // صفحة المنشورات
    if (document.getElementById('feedContainer')) {
        initFeedPage();
    }
});

// ===== صفحة تسجيل الدخول =====
function initLoginPage() {
    const form = document.getElementById('loginForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // تأثير تحميل
        const btn = form.querySelector('button');
        btn.innerHTML = '<span class="loading">⏳</span>';
        
        setTimeout(() => {
            if (UserManager.login(username, password)) {
                // تأثير انتقالي
                document.body.style.animation = 'fadeOut 0.5s ease';
                setTimeout(() => {
                    window.location.href = 'feed.html';
                }, 500);
            } else {
                btn.innerHTML = '<span class="btn-text">تسجيل الدخول</span><div class="btn-shine"></div>';
                
                // اهتزاز للخطأ
                form.style.animation = 'shake 0.5s ease';
                setTimeout(() => {
                    form.style.animation = '';
                }, 500);
                
                alert('اسم المستخدم أو كلمة المرور غير صحيحة!');
            }
        }, 1000);
    });
}

// ===== صفحة التسجيل =====
function initSignupPage() {
    const form = document.getElementById('signupForm');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    let avatarBase64 = '';
    
    // معاينة الأفتار
    avatarInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64 = await ImageHandler.toBase64(file);
                const compressed = await ImageHandler.compress(base64, 200);
                avatarBase64 = compressed;
                
                avatarPreview.innerHTML = `<img src="${compressed}" alt="Avatar">`;
                avatarPreview.classList.add('has-image');
                
                // تأثير النبض
                avatarPreview.style.animation = 'pulse 0.5s ease';
            } catch (err) {
                console.error('Error processing image:', err);
            }
        }
    });
    
    // فتح اختيار الملف عند النقر
    avatarPreview.addEventListener('click', () => avatarInput.click());
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('newUsername').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('newPassword').value;
        
        if (!avatarBase64) {
            alert('الرجاء اختيار صورة أفتار!');
            return;
        }
        
        const btn = form.querySelector('button');
        btn.innerHTML = '<span class="loading">⏳ جاري إنشاء الحساب...</span>';
        
        setTimeout(() => {
            if (UserManager.signup(username, email, password, avatarBase64)) {
                alert('تم إنشاء الحساب بنجاح!');
                window.location.href = 'feed.html';
            } else {
                btn.innerHTML = '<span class="btn-text">إنشاء الحساب</span><div class="btn-shine"></div>';
            }
        }, 1500);
    });
}

// ===== صفحة المنشورات =====
function initFeedPage() {
    // التحقق من تسجيل الدخول
    if (!UserManager.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    
    const user = UserManager.getCurrentUser();
    document.getElementById('userName').textContent = user.username;
    document.getElementById('userAvatar').src = user.avatar;
    
    // تحميل المنشورات
    renderPosts();
    
    // تهيئة النوافذ المنبثقة
    initModal();
}

// ===== عرض المنشورات =====
function renderPosts() {
    const container = document.getElementById('feedContainer');
    const posts = PostManager.getPosts();
    
    container.innerHTML = '';
    
    posts.forEach((post, index) => {
        const card = createPostCard(post, index);
        container.appendChild(card);
    });
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>لا توجد تريدات حالياً</h3>
                <p>كن أول من ينشر تريد!</p>
            </div>
        `;
    }
}

function createPostCard(post, index) {
    const card = document.createElement('div');
    card.className = 'trade-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const date = new Date(post.createdAt).toLocaleDateString('ar-SA');
    
    card.innerHTML = `
        <div class="card-header">
            <img src="${post.userAvatar}" alt="${post.username}" class="card-avatar">
            <div class="card-user">
                <div class="card-username">${post.username}</div>
                <div class="card-time">${date}</div>
            </div>
        </div>
        
        <div class="trade-display">
            <div class="trade-item">
                <img src="${post.itemImage}" alt="${post.itemName}">
                <div class="trade-item-name">${post.itemName}</div>
            </div>
            
            <div class="trade-arrow">⇄</div>
            
            <div class="trade-item">
                <img src="${post.tradeImage}" alt="${post.tradeName}">
                <div class="trade-item-name">${post.tradeName}</div>
            </div>
        </div>
        
        <a href="${post.tiktokLink}" target="_blank" class="tiktok-btn">
            <svg class="tiktok-icon" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
            <span>تواصل عبر TikTok</span>
        </a>
    `;
    
    return card;
}

// ===== النافذة المنبثقة =====
function initModal() {
    const modal = document.getElementById('postModal');
    const form = document.getElementById('postForm');
    
    // رفع الصور
    const itemImageUpload = document.getElementById('itemImageUpload');
    const tradeImageUpload = document.getElementById('tradeImageUpload');
    const itemImageInput = document.getElementById('itemImage');
    const tradeImageInput = document.getElementById('tradeImage');
    
    let itemImageBase64 = '';
    let tradeImageBase64 = '';
    
    setupImageUpload(itemImageUpload, itemImageInput, (base64) => {
        itemImageBase64 = base64;
    });
    
    setupImageUpload(tradeImageUpload, tradeImageInput, (base64) => {
        tradeImageBase64 = base64;
    });
    
    // إرسال النموذج
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!itemImageBase64 || !tradeImageBase64) {
            alert('الرجاء إضافة الصور!');
            return;
        }
        
        const postData = {
            itemName: document.getElementById('itemName').value,
            itemImage: itemImageBase64,
            tradeName: document.getElementById('tradeName').value,
            tradeImage: tradeImageBase64,
            tiktokLink: document.getElementById('tiktokLink').value
        };
        
        // تأثير النشر
        const btn = form.querySelector('.publish-btn');
        btn.innerHTML = '<span>⏳ جاري النشر...</span>';
        
        setTimeout(() => {
            PostManager.addPost(postData);
            closeModal();
            renderPosts();
            
            // إعادة تعيين النموذج
            form.reset();
            itemImageUpload.innerHTML = '<div class="upload-placeholder"><span class="upload-icon">📸</span><span>صورة العنصر</span></div>';
            tradeImageUpload.innerHTML = '<div class="upload-placeholder"><span class="upload-icon">🎁</span><span>صورة المقابل</span></div>';
            itemImageBase64 = '';
            tradeImageBase64 = '';
            btn.innerHTML = '<span>نشر التريد</span><div class="btn-shine"></div>';
            
            // تأثير نجاح
            showNotification('✅ تم نشر التريد بنجاح!');
        }, 1000);
    });
}

function setupImageUpload(uploadArea, input, callback) {
    uploadArea.addEventListener('click', () => input.click());
    
    input.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64 = await ImageHandler.toBase64(file);
                const compressed = await ImageHandler.compress(base64, 400);
                
                uploadArea.innerHTML = `<img src="${compressed}" alt="Preview">`;
                uploadArea.classList.add('has-image');
                callback(compressed);
            } catch (err) {
                console.error('Error:', err);
            }
        }
    });
}

function openModal() {
    const modal = document.getElementById('postModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('postModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function logout() {
    UserManager.logout();
}

function showNotification(message) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #00d4ff, #ff0055);
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-weight: 700;
        z-index: 9999;
        animation: slideDown 0.5s ease, fadeOut 0.5s ease 2.5s;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.remove(), 3000);
}

// إغلاق النافذة عند النقر خارجها
window.onclick = function(event) {
    const modal = document.getElementById('postModal');
    if (event.target === modal) {
        closeModal();
    }
}

// CSS إضافي للرسوم المتحركة
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    .loading {
        display: inline-block;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem;
        color: var(--text-muted);
    }
    
    .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
`;
document.head.appendChild(style);
