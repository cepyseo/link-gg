document.addEventListener('DOMContentLoaded', function() {
    // Loading ekranını gizle
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1000);
    }

    // DOM Elementleri
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const chatContainer = document.getElementById('chatContainer');
    const themeToggle = document.getElementById('themeToggle');
    const scrollTopBtn = document.getElementById('scrollTop');
    const cookieConsent = document.getElementById('cookieConsent');
    const acceptCookies = document.getElementById('acceptCookies');
    const pwaPrompt = document.getElementById('pwaPrompt');
    const emojiButton = document.getElementById('emojiButton');
    const emojiPanel = document.getElementById('emojiPanel');
    const formatButton = document.getElementById('formatButton');
    const formatPanel = document.getElementById('formatPanel');
    const clearChat = document.getElementById('clearChat');
    const downloadChat = document.getElementById('downloadChat');
    const voiceInput = document.getElementById('voiceInput');
    const shareButton = document.getElementById('shareButton');
    const settingsButton = document.getElementById('settingsButton');

    // Dark Mode Toggle
    themeToggle.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', 
            document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
        );
        themeToggle.querySelector('i').classList.toggle('fa-moon');
        themeToggle.querySelector('i').classList.toggle('fa-sun');
    });

    // Scroll to Top
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 100) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Cookie Consent
    if (!localStorage.getItem('cookieConsent')) {
        cookieConsent.style.display = 'flex';
    }

    acceptCookies.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'true');
        cookieConsent.style.display = 'none';
    });

    // Emoji Panel
    emojiButton.addEventListener('click', () => {
        emojiPanel.style.display = emojiPanel.style.display === 'grid' ? 'none' : 'grid';
        formatPanel.style.display = 'none';
    });

    // Format Panel
    formatButton.addEventListener('click', () => {
        formatPanel.style.display = formatPanel.style.display === 'flex' ? 'none' : 'flex';
        emojiPanel.style.display = 'none';
    });

    // Clear Chat
    clearChat.addEventListener('click', () => {
        if (confirm('Sohbet geçmişini silmek istediğinizden emin misiniz?')) {
            chatMessages.innerHTML = '';
            addMessage('Merhaba! Size nasıl yardımcı olabilirim?', 'ai');
        }
    });

    // Download Chat
    downloadChat.addEventListener('click', () => {
        const messages = Array.from(chatMessages.children).map(msg => {
            const type = msg.classList.contains('user-message') ? 'Kullanıcı' : 'AI';
            const content = msg.querySelector('.message-content').textContent;
            return `${type}: ${content}\n`;
        }).join('\n');

        const blob = new Blob([messages], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sohbet-gecmisi.txt';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Voice Input
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'tr-TR';
        recognition.continuous = false;

        voiceInput.addEventListener('click', () => {
            recognition.start();
            voiceInput.classList.add('recording');
        });

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            userInput.value = text;
            voiceInput.classList.remove('recording');
        };

        recognition.onerror = () => {
            voiceInput.classList.remove('recording');
        };
    } else {
        voiceInput.style.display = 'none';
    }

    // Share Button
    shareButton.addEventListener('click', async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'AI Solutions Chat',
                    text: 'AI Solutions ile sohbet edin!',
                    url: window.location.href
                });
            } catch (err) {
                console.error('Paylaşım hatası:', err);
            }
        } else {
            alert('Paylaşım özelliği tarayıcınız tarafından desteklenmiyor.');
        }
    });

    // Settings
    settingsButton.addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
        modal.show();
    });

    // Chat Form Submit
    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        userInput.value = '';

        try {
            const loadingId = addLoadingMessage();

            // Jsonp ile API çağrısı
            const script = document.createElement('script');
            const callbackName = 'jsonpCallback_' + Date.now();
            
            window[callbackName] = function(response) {
                removeLoadingMessage(loadingId);
                if (response && response.response) {
                    const formattedResponse = renderMarkdown(response.response);
                    addMessage(formattedResponse, 'ai', true);
                } else {
                    addMessage('Üzgünüm, bir yanıt alamadım.', 'ai');
                }
                delete window[callbackName];
                document.head.removeChild(script);
            };

            script.src = `https://meta70b.istebutolga.workers.dev/${encodeURIComponent(message)}?callback=${callbackName}`;
            document.head.appendChild(script);

            // Timeout ekle
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    document.head.removeChild(script);
                    removeLoadingMessage(loadingId);
                    addMessage('Üzgünüm, yanıt zaman aşımına uğradı.', 'ai');
                }
            }, 30000); // 30 saniye timeout

        } catch (error) {
            console.error('Error:', error);
            addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'ai');
        }

        chatContainer.scrollTop = chatContainer.scrollHeight;
    });

    // Helper Functions
    function addMessage(content, type, isHTML = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (isHTML) {
            // Güvenli HTML içeriği
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            // Sadece izin verilen etiketleri tut
            const allowedTags = ['a', 'strong', 'em', 'code', 'br'];
            const clean = DOMPurify.sanitize(content, {
                ALLOWED_TAGS: allowedTags,
                ALLOWED_ATTR: ['href', 'target', 'rel']
            });
            contentDiv.innerHTML = clean;
        } else {
            contentDiv.textContent = content;
        }
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Ses efekti
        if (document.getElementById('soundSwitch').checked) {
            const sound = type === 'user' ? messageSentSound : messageReceivedSound;
            sound.play().catch(() => {}); // Ses çalma hatalarını görmezden gel
        }

        // Bildirim
        if (type === 'ai' && document.getElementById('notificationSwitch').checked && document.hidden) {
            new Notification('Yeni Mesaj', {
                body: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                icon: './logo.png'
            });
        }
    }

    function addLoadingMessage() {
        const loadingDiv = document.createElement('div');
        const loadingId = 'loading-' + Date.now();
        loadingDiv.id = loadingId;
        loadingDiv.className = 'message ai-message';
        loadingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(loadingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return loadingId;
    }

    function removeLoadingMessage(loadingId) {
        const loadingDiv = document.getElementById(loadingId);
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    // PWA Installation
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        pwaPrompt.style.display = 'block';
    });

    document.getElementById('pwaInstall').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('PWA installed');
            }
            deferredPrompt = null;
            pwaPrompt.style.display = 'none';
        }
    });

    document.getElementById('pwaDismiss').addEventListener('click', () => {
        pwaPrompt.style.display = 'none';
    });

    // Dil Değiştirme
    const languageSelect = document.getElementById('languageSelect');
    languageSelect.addEventListener('change', (e) => {
        const lang = e.target.value;
        // Dil değiştirme işlemleri burada yapılacak
        document.documentElement.lang = lang;
    });

    // Kompakt Mod
    const compactModeSwitch = document.getElementById('compactModeSwitch');
    compactModeSwitch.addEventListener('change', (e) => {
        document.documentElement.setAttribute('data-compact', e.target.checked);
    });

    // Bildirimler
    const notificationSwitch = document.getElementById('notificationSwitch');
    notificationSwitch.addEventListener('change', async (e) => {
        if (e.target.checked) {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                e.target.checked = false;
            }
        }
    });

    // Klavye Kısayolları
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    // Emoji Panel İşlevselliği
    const emojis = {
        'Yüzler': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘'],
        'El İşaretleri': ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
        'Kalpler': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💞', '💓'],
        'Semboller': ['✨', '⭐', '🌟', '💫', '💥', '💢', '💦', '💨', '🕊️', '💭', '💬']
    };

    function initializeEmojiPanel() {
        const panel = document.getElementById('emojiPanel');
        panel.innerHTML = '';

        // Kategori sekmeleri
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'emoji-tabs';
        
        // Emoji grid
        const emojiGrid = document.createElement('div');
        emojiGrid.className = 'emoji-grid';

        Object.keys(emojis).forEach((category, index) => {
            // Tab oluştur
            const tab = document.createElement('button');
            tab.className = `emoji-tab ${index === 0 ? 'active' : ''}`;
            tab.textContent = category;
            tab.onclick = () => switchEmojiCategory(category);
            tabsContainer.appendChild(tab);

            // İlk kategoriyi göster
            if (index === 0) {
                showEmojiCategory(category, emojiGrid);
            }
        });

        panel.appendChild(tabsContainer);
        panel.appendChild(emojiGrid);
    }

    function showEmojiCategory(category, grid) {
        grid.innerHTML = '';
        emojis[category].forEach(emoji => {
            const button = document.createElement('button');
            button.className = 'emoji-btn';
            button.textContent = emoji;
            button.onclick = () => insertEmoji(emoji);
            grid.appendChild(button);
        });
    }

    function switchEmojiCategory(category) {
        const tabs = document.querySelectorAll('.emoji-tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
        showEmojiCategory(category, document.querySelector('.emoji-grid'));
    }

    function insertEmoji(emoji) {
        const input = document.getElementById('userInput');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        input.value = text.substring(0, start) + emoji + text.substring(end);
        input.selectionStart = input.selectionEnd = start + emoji.length;
        input.focus();
    }

    // Format Panel İşlevselliği
    function initializeFormatPanel() {
        const formatButtons = document.querySelectorAll('.format-btn');
        formatButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                applyFormat(format);
            });
        });
    }

    function applyFormat(format) {
        const input = document.getElementById('userInput');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        let formattedText = '';

        switch (format) {
            case 'bold':
                formattedText = `**${text.substring(start, end)}**`;
                break;
            case 'italic':
                formattedText = `_${text.substring(start, end)}_`;
                break;
            case 'code':
                formattedText = `\`${text.substring(start, end)}\``;
                break;
            case 'link':
                const url = prompt('URL giriniz:');
                if (url) {
                    formattedText = `[${text.substring(start, end)}](${url})`;
                }
                break;
        }

        if (formattedText) {
            input.value = text.substring(0, start) + formattedText + text.substring(end);
            input.focus();
        }
    }

    // Dil Desteği
    const translations = {
        tr: {
            welcome: 'Merhaba! Size nasıl yardımcı olabilirim?',
            send: 'Gönder',
            clear: 'Temizle',
            download: 'İndir',
            settings: 'Ayarlar',
            darkMode: 'Karanlık Mod',
            language: 'Dil',
            // ... diğer çeviriler
        },
        en: {
            welcome: 'Hello! How can I help you?',
            send: 'Send',
            clear: 'Clear',
            download: 'Download',
            settings: 'Settings',
            darkMode: 'Dark Mode',
            language: 'Language',
            // ... diğer çeviriler
        }
    };

    function changeLanguage(lang) {
        document.documentElement.lang = lang;
        // Tüm metin içeriklerini güncelle
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.dataset.translate;
            element.textContent = translations[lang][key];
        });
    }

    // Markdown Desteği
    function renderMarkdown(text) {
        if (!text) return '';
        
        // XSS koruması
        text = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Markdown dönüşümleri
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\[(.*?)\]\((.*?)\)/g, (_, text, url) => {
                // URL güvenliği
                if (url.startsWith('javascript:')) return text;
                return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            })
            .replace(/\n/g, '<br>');
    }

    // Mesaj geçmişi yönetimi
    function saveMessageHistory() {
        const messages = Array.from(chatMessages.children).map(msg => ({
            type: msg.classList.contains('user-message') ? 'user' : 'ai',
            content: msg.querySelector('.message-content').textContent
        }));
        localStorage.setItem('chatHistory', JSON.stringify(messages));
    }

    function loadMessageHistory() {
        const history = localStorage.getItem('chatHistory');
        if (history) {
            const messages = JSON.parse(history);
            chatMessages.innerHTML = '';
            messages.forEach(msg => addMessage(msg.content, msg.type));
        }
    }

    // Ses ile yazma geliştirmeleri
    function enhanceVoiceInput() {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = document.documentElement.lang;
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = () => {
                voiceInput.classList.add('recording');
                // Mikrofon animasyonu ekle
                voiceInput.innerHTML = '<div class="mic-wave"></div>';
            };

            recognition.onend = () => {
                voiceInput.classList.remove('recording');
                voiceInput.innerHTML = '<i class="fas fa-microphone"></i>';
            };

            recognition.onerror = (event) => {
                console.error('Ses tanıma hatası:', event.error);
                voiceInput.classList.remove('recording');
                alert('Ses tanıma hatası: ' + event.error);
            };

            return recognition;
        }
        return null;
    }

    // Dosya paylaşımı
    function handleFileUpload(file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = `<img src="${e.target.result}" class="chat-image" alt="Yüklenen görsel">`;
                addMessage(img, 'user', true);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Sadece görsel dosyaları desteklenmektedir.');
        }
    }

    // Yeni başlatma kodları
    initializeEmojiPanel();
    initializeFormatPanel();
    loadMessageHistory();
    
    // Dosya yükleme desteği
    const attachButton = document.getElementById('attachButton');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    attachButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Sürükle-bırak desteği
    chatContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        chatContainer.classList.add('drag-over');
    });

    chatContainer.addEventListener('dragleave', () => {
        chatContainer.classList.remove('drag-over');
    });

    chatContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        chatContainer.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    // Mesaj geçmişini otomatik kaydet
    setInterval(saveMessageHistory, 30000); // Her 30 saniyede bir kaydet
}); 