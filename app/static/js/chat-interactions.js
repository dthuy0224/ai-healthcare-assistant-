/* ================================
   CHAT INTERACTIONS JS
   Additional interactive functionality
   ================================ */

// Extend the ChatInterface class with additional interactions
if (typeof ChatInterface !== 'undefined') {
    
    // Search functionality
    ChatInterface.prototype.toggleSearch = function() {
        const searchOverlay = document.getElementById('search-overlay');
        if (searchOverlay) {
            searchOverlay.classList.toggle('show');
            if (searchOverlay.classList.contains('show')) {
                document.getElementById('search-input')?.focus();
            }
        }
    };

    ChatInterface.prototype.closeSearch = function() {
        const searchOverlay = document.getElementById('search-overlay');
        if (searchOverlay) {
            searchOverlay.classList.remove('show');
        }
    };

    ChatInterface.prototype.clearSearch = function() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
            this.performSearch('');
        }
    };

    ChatInterface.prototype.performSearch = function(query) {
        this.currentSearch = query;
        const resultsContainer = document.getElementById('search-results');
        
        if (!query.trim()) {
            resultsContainer.innerHTML = `
                <div class="search-empty">
                    <div class="empty-icon">🔍</div>
                    <p>Start typing to search messages...</p>
                </div>
            `;
            return;
        }

        // Search through messages
        const results = this.searchMessages(query);
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-empty">
                    <div class="empty-icon">❌</div>
                    <p>No messages found for "${query}"</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = results.map(result => `
            <div class="search-result" data-message-id="${result.id}">
                <div class="result-preview">${this.highlightSearchTerm(result.preview, query)}</div>
                <div class="result-meta">
                    ${result.type === 'ai' ? '👨‍⚕️ Dr. AI' : '👤 You'} • ${this.formatMessageTime(result.timestamp)}
                </div>
            </div>
        `).join('');

        // Add click handlers
        resultsContainer.querySelectorAll('.search-result').forEach(result => {
            result.addEventListener('click', () => {
                this.jumpToMessage(result.dataset.messageId);
                this.closeSearch();
            });
        });
    };

    ChatInterface.prototype.searchMessages = function(query) {
        const lowerQuery = query.toLowerCase();
        return this.messages
            .filter(message => {
                if (typeof message.content === 'string') {
                    return message.content.toLowerCase().includes(lowerQuery);
                } else if (message.content && message.content.title) {
                    return message.content.title.toLowerCase().includes(lowerQuery);
                }
                return false;
            })
            .map(message => ({
                id: message.id,
                type: message.type,
                timestamp: message.timestamp,
                preview: this.getMessagePreview(message, query)
            }))
            .slice(0, 20); // Limit results
    };

    ChatInterface.prototype.getMessagePreview = function(message, query) {
        let text = '';
        if (typeof message.content === 'string') {
            text = message.content;
        } else if (message.content && message.content.title) {
            text = message.content.title;
        }

        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text.substring(0, 100) + '...';

        const start = Math.max(0, index - 30);
        const end = Math.min(text.length, index + query.length + 30);
        return (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
    };

    ChatInterface.prototype.highlightSearchTerm = function(text, term) {
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    };

    ChatInterface.prototype.jumpToMessage = function(messageId) {
        const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageEl) {
            messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageEl.style.outline = '2px solid var(--primary-blue)';
            setTimeout(() => {
                messageEl.style.outline = '';
            }, 2000);
        }
    };

    ChatInterface.prototype.setSearchFilter = function(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Re-perform search with filter
        this.performSearch(this.currentSearch);
    };

    // Chat menu functionality
    ChatInterface.prototype.toggleChatMenu = function() {
        const chatMenu = document.getElementById('chat-menu');
        if (chatMenu) {
            chatMenu.classList.toggle('show');
        }
    };

    ChatInterface.prototype.closeChatMenu = function() {
        const chatMenu = document.getElementById('chat-menu');
        if (chatMenu) {
            chatMenu.classList.remove('show');
        }
    };

    // Modal functionality
    ChatInterface.prototype.showModal = function(modal) {
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Focus management
            const focusableElements = modal.querySelectorAll('button, input, textarea, select');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    };

    ChatInterface.prototype.closeModal = function(modal) {
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    };

    ChatInterface.prototype.showEmergencyModal = function() {
        const modal = document.getElementById('emergency-modal');
        this.showModal(modal);
    };

    ChatInterface.prototype.handleEmergencyAction = function(action) {
        switch (action) {
            case 'call-911':
                if (confirm('This will call emergency services (911). Continue?')) {
                    window.location.href = 'tel:911';
                }
                break;
            case 'find-hospital':
                this.findNearestHospital();
                break;
            case 'poison-control':
                if (confirm('This will call Poison Control (1-800-222-1222). Continue?')) {
                    window.location.href = 'tel:1-800-222-1222';
                }
                break;
            case 'mental-health':
                if (confirm('This will call the 988 Suicide & Crisis Lifeline. Continue?')) {
                    window.location.href = 'tel:988';
                }
                break;
        }
        
        this.closeModal(document.getElementById('emergency-modal'));
    };

    ChatInterface.prototype.findNearestHospital = function() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                const url = `https://www.google.com/maps/search/hospital+emergency+room/@${latitude},${longitude},15z`;
                window.open(url, '_blank');
            }, (error) => {
                console.error('Geolocation error:', error);
                // Fallback to general search
                window.open('https://www.google.com/maps/search/hospital+emergency+room', '_blank');
            });
        } else {
            window.open('https://www.google.com/maps/search/hospital+emergency+room', '_blank');
        }
    };

    // Voice recording functionality
    ChatInterface.prototype.startVoiceRecording = function() {
        if (this.isRecording) return;

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                this.isRecording = true;
                this.recordingStartTime = Date.now();

                this.mediaRecorder.ondataavailable = (event) => {
                    this.audioChunks.push(event.data);
                };

                this.mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                    this.processVoiceRecording(audioBlob);
                };

                this.mediaRecorder.start();
                this.showVoiceRecordingUI();
                this.startRecordingTimer();
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                this.showNotification('Could not access microphone. Please check permissions.', 'error');
            });
    };

    ChatInterface.prototype.stopVoiceRecording = function() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        this.isRecording = false;
        this.stopRecordingTimer();
        this.hideVoiceRecordingUI();
    };

    ChatInterface.prototype.toggleVoiceRecording = function() {
        if (this.isRecording) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    };

    ChatInterface.prototype.showVoiceRecordingUI = function() {
        const voiceRecording = document.getElementById('voice-recording');
        const voiceBtn = document.getElementById('voice-btn');
        
        if (voiceRecording) {
            voiceRecording.classList.add('show');
        }
        
        if (voiceBtn) {
            voiceBtn.classList.add('active');
            voiceBtn.dataset.recording = 'true';
            document.getElementById('voice-icon').textContent = '⏸️';
        }
    };

    ChatInterface.prototype.hideVoiceRecordingUI = function() {
        const voiceRecording = document.getElementById('voice-recording');
        const voiceBtn = document.getElementById('voice-btn');
        
        if (voiceRecording) {
            voiceRecording.classList.remove('show');
        }
        
        if (voiceBtn) {
            voiceBtn.classList.remove('active');
            voiceBtn.dataset.recording = 'false';
            document.getElementById('voice-icon').textContent = '🎤';
        }
    };

    ChatInterface.prototype.startRecordingTimer = function() {
        const recordingTime = document.getElementById('recording-time');
        
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            
            if (recordingTime) {
                recordingTime.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            }
            
            // Auto-stop after 5 minutes
            if (elapsed > 300000) {
                this.stopVoiceRecording();
            }
        }, 100);
    };

    ChatInterface.prototype.stopRecordingTimer = function() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    };

    ChatInterface.prototype.cancelRecording = function() {
        this.stopVoiceRecording();
        this.audioChunks = [];
        this.showNotification('Voice recording cancelled');
    };

    ChatInterface.prototype.pauseRecording = function() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            document.getElementById('pause-recording').innerHTML = `
                <span class="btn-icon">▶️</span>
                <span>Resume</span>
            `;
        } else if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            document.getElementById('pause-recording').innerHTML = `
                <span class="btn-icon">⏸️</span>
                <span>Pause</span>
            `;
        }
    };

    ChatInterface.prototype.sendVoiceMessage = function() {
        this.stopVoiceRecording();
        // Voice message will be processed in processVoiceRecording
    };

    ChatInterface.prototype.processVoiceRecording = function(audioBlob) {
        // Convert to base64 for demo purposes
        const reader = new FileReader();
        reader.onload = () => {
            const audioData = reader.result;
            
            // Simulate speech-to-text conversion
            this.convertSpeechToText(audioBlob).then(text => {
                if (text) {
                    document.getElementById('message-input').value = text;
                    this.updateCharacterCount(text.length);
                    this.updateSendButton(true);
                    this.showNotification('Voice message converted to text');
                } else {
                    // Send as audio message
                    this.sendAudioMessage(audioData);
                }
            });
        };
        reader.readAsDataURL(audioBlob);
    };

    ChatInterface.prototype.convertSpeechToText = function(audioBlob) {
        // Mock speech-to-text conversion
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate conversion result
                const mockTexts = [
                    "I've been having headaches for the past few days",
                    "My symptoms include fatigue and nausea",
                    "Can you help me understand my medication?",
                    "I need to schedule an appointment",
                    "What should I do about this pain?"
                ];
                const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
                resolve(randomText);
            }, 1000);
        });
    };

    ChatInterface.prototype.sendAudioMessage = function(audioData) {
        const userMessage = {
            id: this.generateMessageId(),
            type: 'user',
            content: 'Voice message',
            attachments: [{
                type: 'audio',
                name: 'voice_message.wav',
                data: audioData,
                size: audioData.length
            }],
            timestamp: new Date(),
            status: 'sending'
        };

        this.addMessageToUI(userMessage);
        this.showNotification('Voice message sent');
    };

    // File handling functionality
    ChatInterface.prototype.handleFileSelect = function(e) {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            if (this.validateFile(file)) {
                this.addAttachment(file);
            }
        });
        
        // Clear input for next selection
        e.target.value = '';
    };

    ChatInterface.prototype.validateFile = function(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif',
            'application/pdf', 'text/plain',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (file.size > maxSize) {
            this.showNotification(`File "${file.name}" is too large. Maximum size is 10MB.`, 'error');
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            this.showNotification(`File type "${file.type}" is not supported.`, 'error');
            return false;
        }

        return true;
    };

    ChatInterface.prototype.addAttachment = function(file) {
        const attachment = {
            id: this.generateMessageId(),
            name: file.name,
            type: this.getFileType(file.type),
            size: file.size,
            file: file
        };

        this.attachments.push(attachment);
        this.showAttachmentPreview();
    };

    ChatInterface.prototype.getFileType = function(mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType === 'application/pdf') return 'pdf';
        return 'document';
    };

    ChatInterface.prototype.showAttachmentPreview = function() {
        const previewContainer = document.getElementById('attachment-preview');
        
        if (this.attachments.length === 0) {
            previewContainer.classList.remove('show');
            return;
        }

        previewContainer.innerHTML = this.attachments.map(attachment => `
            <div class="attachment-item" data-attachment-id="${attachment.id}">
                <span class="attachment-icon">${this.getAttachmentIcon(attachment.type)}</span>
                <span class="attachment-name">${attachment.name}</span>
                <span class="attachment-size">${this.formatFileSize(attachment.size)}</span>
                <button class="attachment-remove" onclick="chatInterface.removeAttachment('${attachment.id}')">✕</button>
            </div>
        `).join('');
        
        previewContainer.classList.add('show');
    };

    ChatInterface.prototype.removeAttachment = function(attachmentId) {
        this.attachments = this.attachments.filter(att => att.id !== attachmentId);
        this.showAttachmentPreview();
    };

    ChatInterface.prototype.clearAttachments = function() {
        this.attachments = [];
        this.showAttachmentPreview();
    };

    ChatInterface.prototype.openCamera = function() {
        // Request camera access
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(stream => {
                this.showCameraInterface(stream);
            })
            .catch(error => {
                console.error('Error accessing camera:', error);
                this.showNotification('Could not access camera. Please check permissions.', 'error');
            });
    };

    ChatInterface.prototype.showCameraInterface = function(stream) {
        // Create camera modal
        const cameraModal = document.createElement('div');
        cameraModal.className = 'modal camera-modal show';
        cameraModal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content camera-content">
                <div class="camera-header">
                    <h3>Take Photo</h3>
                    <button class="modal-close">✕</button>
                </div>
                <div class="camera-body">
                    <video id="camera-video" autoplay></video>
                    <canvas id="camera-canvas" style="display: none;"></canvas>
                </div>
                <div class="camera-footer">
                    <button class="btn secondary" id="camera-cancel">Cancel</button>
                    <button class="btn primary" id="camera-capture">📷 Capture</button>
                </div>
            </div>
        `;

        document.body.appendChild(cameraModal);
        
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        
        video.srcObject = stream;
        
        // Event handlers
        document.getElementById('camera-capture').addEventListener('click', () => {
            this.capturePhoto(video, canvas, stream);
            this.closeCameraInterface(cameraModal, stream);
        });
        
        document.getElementById('camera-cancel').addEventListener('click', () => {
            this.closeCameraInterface(cameraModal, stream);
        });
        
        cameraModal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeCameraInterface(cameraModal, stream);
        });
    };

    ChatInterface.prototype.capturePhoto = function(video, canvas, stream) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob(blob => {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            this.addAttachment(file);
            this.showNotification('Photo captured successfully!');
        }, 'image/jpeg', 0.9);
    };

    ChatInterface.prototype.closeCameraInterface = function(modal, stream) {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
    };

    // Emoji picker functionality
    ChatInterface.prototype.toggleEmojiPicker = function() {
        const emojiPicker = document.getElementById('emoji-picker');
        if (emojiPicker) {
            emojiPicker.classList.toggle('show');
            if (emojiPicker.classList.contains('show')) {
                this.loadEmojiGrid('health');
            }
        }
    };

    ChatInterface.prototype.closeEmojiPicker = function() {
        const emojiPicker = document.getElementById('emoji-picker');
        if (emojiPicker) {
            emojiPicker.classList.remove('show');
        }
    };

    ChatInterface.prototype.loadEmojiGrid = function(category) {
        const emojiGrid = document.getElementById('emoji-grid');
        const emojis = this.emojiCategories[category] || [];
        
        emojiGrid.innerHTML = emojis.map(emoji => `
            <div class="emoji-item" data-emoji="${emoji}">${emoji}</div>
        `).join('');
        
        // Add click handlers
        emojiGrid.querySelectorAll('.emoji-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.insertEmoji(e.target.dataset.emoji);
            });
        });
        
        // Update active category
        document.querySelectorAll('.emoji-category').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
    };

    ChatInterface.prototype.insertEmoji = function(emoji) {
        const messageInput = document.getElementById('message-input');
        const cursorPos = messageInput.selectionStart;
        const textBefore = messageInput.value.substring(0, cursorPos);
        const textAfter = messageInput.value.substring(messageInput.selectionEnd);
        
        messageInput.value = textBefore + emoji + textAfter;
        messageInput.selectionStart = messageInput.selectionEnd = cursorPos + emoji.length;
        
        this.updateCharacterCount(messageInput.value.length);
        this.updateSendButton(messageInput.value.trim().length > 0);
        this.closeEmojiPicker();
        messageInput.focus();
    };

    // Message actions
    ChatInterface.prototype.handleMessageAction = function(action, messageElement) {
        const messageId = messageElement.dataset.messageId;
        
        switch (action) {
            case 'like':
                this.likeMessage(messageId);
                break;
            case 'dislike':
                this.dislikeMessage(messageId);
                break;
            case 'bookmark':
                this.bookmarkMessage(messageId);
                break;
            case 'copy':
                this.copyMessage(messageId);
                break;
            case 'share':
                this.shareMessage(messageId);
                break;
        }
    };

    ChatInterface.prototype.likeMessage = function(messageId) {
        this.showNotification('Message liked! This helps improve AI responses.');
        // In real app, send feedback to server
    };

    ChatInterface.prototype.dislikeMessage = function(messageId) {
        this.showNotification('Feedback recorded. We\'ll work to improve our responses.');
        // In real app, send feedback to server
    };

    ChatInterface.prototype.bookmarkMessage = function(messageId) {
        const bookmarks = JSON.parse(localStorage.getItem('messageBookmarks') || '[]');
        if (!bookmarks.includes(messageId)) {
            bookmarks.push(messageId);
            localStorage.setItem('messageBookmarks', JSON.stringify(bookmarks));
            this.showNotification('Message bookmarked!');
        } else {
            this.showNotification('Message already bookmarked');
        }
    };

    ChatInterface.prototype.copyMessage = function(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            let textToCopy = '';
            if (typeof message.content === 'string') {
                textToCopy = message.content;
            } else if (message.content && message.content.title) {
                textToCopy = message.content.title;
            }
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                this.showNotification('Message copied to clipboard!');
            }).catch(() => {
                this.showNotification('Could not copy message', 'error');
            });
        }
    };

    ChatInterface.prototype.shareMessage = function(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (message && navigator.share) {
            navigator.share({
                title: 'AI Health Assistant Message',
                text: typeof message.content === 'string' ? message.content : 'Health insight from AI Assistant',
                url: window.location.href
            }).catch(console.error);
        } else {
            this.copyMessage(messageId);
            this.showNotification('Message copied to clipboard for sharing!');
        }
    };

    // Insight card actions
    ChatInterface.prototype.handleInsightAction = function(action) {
        switch (action) {
            case 'schedule':
                this.scheduleAppointment();
                break;
            case 'learn-more':
                this.showEducationalContent();
                break;
            case 'add-record':
                this.addToHealthRecord();
                break;
        }
    };

    ChatInterface.prototype.scheduleAppointment = function() {
        this.showNotification('Redirecting to appointment scheduling...');
        // In real app: window.location.href = '/appointments/schedule';
    };

    ChatInterface.prototype.showEducationalContent = function() {
        this.showNotification('Opening educational resources...');
        // In real app: window.open('/education/headaches', '_blank');
    };

    ChatInterface.prototype.addToHealthRecord = function() {
        this.showNotification('Added to your health record!');
        // In real app: send to health record API
    };

    // Other functionality
    ChatInterface.prototype.handleEscape = function() {
        // Close any open overlays/modals
        this.closeSearch();
        this.closeChatMenu();
        this.closeEmojiPicker();
        
        document.querySelectorAll('.modal.show').forEach(modal => {
            this.closeModal(modal);
        });
    };

    ChatInterface.prototype.focusMessageInput = function() {
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.focus();
        }
    };

    ChatInterface.prototype.bookmarkConversation = function() {
        const conversationId = 'conv_' + Date.now();
        const bookmarks = JSON.parse(localStorage.getItem('conversationBookmarks') || '[]');
        bookmarks.push({
            id: conversationId,
            timestamp: new Date(),
            messageCount: this.messages.length
        });
        localStorage.setItem('conversationBookmarks', JSON.stringify(bookmarks));
        this.showNotification('Conversation bookmarked!');
    };

    ChatInterface.prototype.clearChatHistory = function() {
        if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
            this.messages = [];
            localStorage.removeItem('chatHistory');
            
            // Clear UI
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML = '';
            
            // Show welcome message again
            this.showWelcomeMessage();
            
            this.showNotification('Chat history cleared!');
        }
    };

    ChatInterface.prototype.exportChat = function() {
        const chatData = {
            timestamp: new Date().toISOString(),
            messageCount: this.messages.length,
            messages: this.messages.map(msg => ({
                type: msg.type,
                content: msg.content,
                timestamp: msg.timestamp
            }))
        };

        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Chat exported successfully!');
    };

    ChatInterface.prototype.toggleHighContrast = function() {
        document.documentElement.classList.toggle('high-contrast');
        const isEnabled = document.documentElement.classList.contains('high-contrast');
        this.settings.highContrast = isEnabled;
        localStorage.setItem('chatSettings', JSON.stringify(this.settings));
        this.showNotification(`High contrast ${isEnabled ? 'enabled' : 'disabled'}`);
    };

    ChatInterface.prototype.toggleTranslation = function() {
        this.settings.autoTranslate = !this.settings.autoTranslate;
        localStorage.setItem('chatSettings', JSON.stringify(this.settings));
        this.showNotification(`Auto-translation ${this.settings.autoTranslate ? 'enabled' : 'disabled'}`);
    };

    ChatInterface.prototype.toggleSpeechToText = function() {
        const btn = document.getElementById('speech-to-text-btn');
        const isActive = btn.classList.contains('active');
        
        if (isActive) {
            this.stopSpeechToText();
        } else {
            this.startSpeechToText();
        }
    };

    ChatInterface.prototype.startSpeechToText = function() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = this.settings.chatLanguage || 'en-US';
            
            this.recognition.onstart = () => {
                document.getElementById('speech-to-text-btn').classList.add('active');
                this.showNotification('Listening... Speak now');
            };
            
            this.recognition.onresult = (event) => {
                const messageInput = document.getElementById('message-input');
                let transcript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        transcript += event.results[i][0].transcript;
                    }
                }
                
                if (transcript) {
                    messageInput.value += transcript;
                    this.updateCharacterCount(messageInput.value.length);
                    this.updateSendButton(messageInput.value.trim().length > 0);
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopSpeechToText();
                this.showNotification('Speech recognition error: ' + event.error, 'error');
            };
            
            this.recognition.start();
        } else {
            this.showNotification('Speech recognition not supported in this browser', 'error');
        }
    };

    ChatInterface.prototype.stopSpeechToText = function() {
        if (this.recognition) {
            this.recognition.stop();
            this.recognition = null;
        }
        
        document.getElementById('speech-to-text-btn').classList.remove('active');
        this.showNotification('Speech recognition stopped');
    };

    ChatInterface.prototype.translateInput = function() {
        const messageInput = document.getElementById('message-input');
        const text = messageInput.value.trim();
        
        if (!text) {
            this.showNotification('Please enter some text to translate', 'warning');
            return;
        }
        
        // Mock translation
        this.showNotification('Translation feature coming soon!', 'info');
    };

    // Setup emoji category handlers
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.emoji-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                if (window.chatInterface) {
                    window.chatInterface.loadEmojiGrid(category);
                }
            });
        });
    });

} else {
    console.warn('ChatInterface class not found. Make sure chat-interface.js is loaded first.');
}