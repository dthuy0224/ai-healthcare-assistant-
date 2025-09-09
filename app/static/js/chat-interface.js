
class ChatInterface {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        this.isRecording = false;
        this.recordingStartTime = null;
        this.recordingTimer = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.currentSearch = '';
        this.searchResults = [];
        this.attachments = [];
        this.messageQueue = [];
        this.isOnline = navigator.onLine;
        this.settings = this.loadSettings();
        this.medicalTermsData = this.loadMedicalTermsData();
        this.currentTooltip = null;
        this.speechRecognition = null;
        this.imageZoom = { scale: 1, x: 0, y: 0 };
        this.quickReplyContext = 'general';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.initializeChat();
        this.loadChatHistory();
        this.setupNotifications();
        this.setupOfflineHandling();
        this.applySettings();
        this.setupMedicalTerms();
        this.setupMultimediaHandling();
        this.setupSpeechToText();
        this.setupQuickReplies();
        this.loadMessageQueue();
    }

    setupEventListeners() {
        // Message input
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');

        messageInput.addEventListener('input', (e) => {
            this.handleInputChange(e);
        });

        messageInput.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // Header actions
        document.getElementById('search-btn')?.addEventListener('click', () => {
            this.toggleSearch();
        });

        document.getElementById('bookmark-btn')?.addEventListener('click', () => {
            this.bookmarkConversation();
        });

        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.toggleChatMenu();
        });

        document.getElementById('emergency-btn')?.addEventListener('click', () => {
            this.showEmergencyModal();
        });

        // Menu actions
        document.getElementById('clear-history-btn')?.addEventListener('click', () => {
            this.clearChatHistory();
        });

        document.getElementById('export-chat-btn')?.addEventListener('click', () => {
            this.exportChat();
        });

        document.getElementById('high-contrast-btn')?.addEventListener('click', () => {
            this.toggleHighContrast();
        });

        document.getElementById('translate-btn')?.addEventListener('click', () => {
            this.toggleTranslation();
        });

        // Voice recording
        document.getElementById('voice-btn')?.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.startVoiceRecording();
            }
        });

        document.getElementById('voice-btn')?.addEventListener('mouseup', () => {
            this.stopVoiceRecording();
        });

        document.getElementById('voice-btn')?.addEventListener('mouseleave', () => {
            if (this.isRecording) {
                this.stopVoiceRecording();
            }
        });

        // File attachment handling
        document.getElementById('attachment-btn')?.addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        document.getElementById('file-input')?.addEventListener('change', (e) => {
            this.handleFileSelection(e);
        });

        // Speech-to-text
        document.getElementById('speech-to-text-btn')?.addEventListener('click', () => {
            this.toggleSpeechToText();
        });

        // Feature buttons
        document.getElementById('translate-input-btn')?.addEventListener('click', () => {
            this.translateCurrentInput();
        });

        document.getElementById('emoji-btn')?.addEventListener('click', () => {
            this.toggleEmojiPicker();
        });

        document.getElementById('voice-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleVoiceRecording();
        });

        // Recording controls
        document.getElementById('cancel-recording')?.addEventListener('click', () => {
            this.cancelRecording();
        });

        document.getElementById('pause-recording')?.addEventListener('click', () => {
            this.pauseRecording();
        });

        document.getElementById('send-recording')?.addEventListener('click', () => {
            this.sendVoiceMessage();
        });

        // File attachments
        document.getElementById('attachment-btn')?.addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        document.getElementById('file-input')?.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        document.getElementById('camera-btn')?.addEventListener('click', () => {
            this.openCamera();
        });

        // Input features
        document.getElementById('speech-to-text-btn')?.addEventListener('click', () => {
            this.toggleSpeechToText();
        });

        document.getElementById('translate-input-btn')?.addEventListener('click', () => {
            this.translateInput();
        });

        document.getElementById('emoji-btn')?.addEventListener('click', () => {
            this.toggleEmojiPicker();
        });

        // Quick start buttons
        document.querySelectorAll('.quick-start-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const message = e.target.closest('.quick-start-btn').dataset.message;
                this.sendQuickMessage(message);
            });
        });

        // Message actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.message-action')) {
                const action = e.target.closest('.message-action').dataset.action;
                const messageElement = e.target.closest('.message');
                this.handleMessageAction(action, messageElement);
            }
        });

        // Insight card actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.insight-btn')) {
                const action = e.target.closest('.insight-btn').dataset.action;
                this.handleInsightAction(action);
            }
        });

        // Search functionality
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });

        document.getElementById('search-close')?.addEventListener('click', () => {
            this.closeSearch();
        });

        document.getElementById('search-clear')?.addEventListener('click', () => {
            this.clearSearch();
        });

        // Search filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setSearchFilter(e.target.dataset.filter);
            });
        });

        // Modal handling
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Emergency modal actions
        document.querySelectorAll('.emergency-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const action = e.target.closest('.emergency-option').dataset.action;
                this.handleEmergencyAction(action);
            });
        });

        document.getElementById('emergency-close')?.addEventListener('click', () => {
            this.closeModal(document.getElementById('emergency-modal'));
        });

        // Settings modal
        document.getElementById('settings-save')?.addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('settings-reset')?.addEventListener('click', () => {
            this.resetSettings();
        });

        // Auto-resize textarea
        messageInput.addEventListener('input', () => {
            this.autoResizeTextarea(messageInput);
        });

        // Click outside to close dropdowns
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-actions')) {
                this.closeChatMenu();
            }
            if (!e.target.closest('.emoji-picker') && !e.target.closest('#emoji-btn')) {
                this.closeEmojiPicker();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't handle shortcuts when typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const shortcuts = {
                'KeyS': () => this.toggleSearch(), // S - Search
                'KeyE': () => this.showEmergencyModal(), // E - Emergency
                'KeyC': () => this.clearChatHistory(), // C - Clear
                'KeyB': () => this.bookmarkConversation(), // B - Bookmark
                'Escape': () => this.handleEscape(), // Escape - Close modals/overlays
                'Slash': () => this.focusMessageInput(), // / - Focus input
            };

            // Handle Ctrl/Cmd + key combinations
            if (e.ctrlKey || e.metaKey) {
                const ctrlShortcuts = {
                    'KeyK': () => { e.preventDefault(); this.toggleSearch(); }, // Ctrl+K - Search
                    'KeyE': () => { e.preventDefault(); this.exportChat(); }, // Ctrl+E - Export
                    'KeyEnter': () => { e.preventDefault(); this.sendMessage(); }, // Ctrl+Enter - Send
                };
                
                if (ctrlShortcuts[e.code]) {
                    ctrlShortcuts[e.code]();
                    return;
                }
            }

            if (shortcuts[e.code]) {
                e.preventDefault();
                shortcuts[e.code]();
            }
        });
    }

    initializeChat() {
        // Show welcome message if no chat history
        if (this.messages.length === 0) {
            this.showWelcomeMessage();
        }

        // Initialize typing indicator
        this.setupTypingIndicator();
        
        // Initialize message auto-scroll
        this.setupAutoScroll();
        
        // Load emoji data
        this.loadEmojiData();
    }

    showWelcomeMessage() {
        // Welcome message is already in HTML, just ensure it's visible
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'flex';
        }
    }

    setupTypingIndicator() {
        this.typingIndicator = document.getElementById('typing-indicator');
    }

    setupAutoScroll() {
        const chatMessages = document.getElementById('chat-messages');
        this.shouldAutoScroll = true;

        chatMessages.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = chatMessages;
            this.shouldAutoScroll = scrollTop + clientHeight >= scrollHeight - 50;
        });
    }

    loadEmojiData() {
        this.emojiCategories = {
            health: ['🏥', '💊', '🩺', '💉', '🧬', '🔬', '🧪', '⚕️', '🩹', '🦷', '👨‍⚕️', '👩‍⚕️'],
            symptoms: ['🤒', '🤕', '🤧', '😷', '🤮', '😵', '🥴', '😴', '😪', '🥵', '🥶', '🤯'],
            emotions: ['😊', '😢', '😰', '😌', '😔', '😖', '😣', '😫', '😩', '🙂', '😐', '😑'],
            body: ['👤', '🧠', '❤️', '🫁', '🦴', '💪', '👁️', '👂', '👃', '👄', '🤚', '🦵']
        };
    }

    handleInputChange(e) {
        const input = e.target;
        const value = input.value;
        
        // Update character count
        this.updateCharacterCount(value.length);
        
        // Enable/disable send button
        this.updateSendButton(value.trim().length > 0);
        
        // Show typing status to other users (if in real chat)
        this.sendTypingIndicator();
        
        // Auto-suggestions
        this.showInputSuggestions(value);
    }

    updateCharacterCount(count) {
        const charCountEl = document.getElementById('char-count');
        const maxChars = 2000;
        
        if (charCountEl) {
            charCountEl.textContent = count;
            charCountEl.className = count > maxChars * 0.9 ? 'character-count warning' :
                                   count > maxChars * 0.95 ? 'character-count error' : 'character-count';
        }
    }

    updateSendButton(hasContent) {
        const sendBtn = document.getElementById('send-btn');
        if (sendBtn) {
            sendBtn.disabled = !hasContent || this.isRecording;
        }
    }

    sendTypingIndicator() {
        // In a real application, this would send typing status to server
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            // Stop showing typing indicator
        }, 1000);
    }

    showInputSuggestions(value) {
        const suggestions = this.generateSuggestions(value);
        const suggestionsEl = document.getElementById('input-suggestions');
        
        if (suggestions.length > 0 && value.length > 2) {
            suggestionsEl.innerHTML = suggestions.map(suggestion => 
                `<div class="suggestion-item" data-suggestion="${suggestion}">${suggestion}</div>`
            ).join('');
            suggestionsEl.classList.add('show');
            
            // Add click handlers
            suggestionsEl.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    this.applySuggestion(e.target.dataset.suggestion);
                });
            });
        } else {
            suggestionsEl.classList.remove('show');
        }
    }

    generateSuggestions(value) {
        const commonPhrases = [
            "I'm experiencing pain in my",
            "I've been having symptoms for",
            "The pain is worse when I",
            "I'm taking medication for",
            "My symptoms include",
            "I need help with",
            "Can you explain why",
            "What should I do if",
            "Is it normal to",
            "How long does it take for"
        ];

        return commonPhrases.filter(phrase => 
            phrase.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 5);
    }

    applySuggestion(suggestion) {
        const messageInput = document.getElementById('message-input');
        messageInput.value = suggestion;
        messageInput.focus();
        
        // Hide suggestions
        document.getElementById('input-suggestions').classList.remove('show');
        
        // Update UI
        this.updateCharacterCount(suggestion.length);
        this.updateSendButton(true);
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        } else if (e.key === 'Escape') {
            this.handleEscape();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            this.handleSuggestionNavigation(e);
        }
    }

    handleSuggestionNavigation(e) {
        const suggestionsEl = document.getElementById('input-suggestions');
        if (!suggestionsEl.classList.contains('show')) return;

        const suggestions = suggestionsEl.querySelectorAll('.suggestion-item');
        const highlighted = suggestionsEl.querySelector('.suggestion-item.highlighted');
        
        let newIndex = 0;
        if (highlighted) {
            const currentIndex = Array.from(suggestions).indexOf(highlighted);
            newIndex = e.key === 'ArrowDown' ? 
                (currentIndex + 1) % suggestions.length : 
                (currentIndex - 1 + suggestions.length) % suggestions.length;
        }

        suggestions.forEach((item, index) => {
            item.classList.toggle('highlighted', index === newIndex);
        });

        if (e.key === 'Enter') {
            e.preventDefault();
            const highlighted = suggestionsEl.querySelector('.suggestion-item.highlighted');
            if (highlighted) {
                this.applySuggestion(highlighted.dataset.suggestion);
            }
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (!message && this.attachments.length === 0) return;

        // Create user message
        const userMessage = {
            id: this.generateMessageId(),
            type: 'user',
            content: message,
            attachments: [...this.attachments],
            timestamp: new Date(),
            status: 'sending'
        };

        // Add to UI immediately
        this.addMessageToUI(userMessage);
        
        // Clear input
        messageInput.value = '';
        this.clearAttachments();
        this.updateCharacterCount(0);
        this.updateSendButton(false);
        this.autoResizeTextarea(messageInput);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send to server (or simulate AI response)
            if (this.isOnline) {
                const response = await this.sendMessageToAPI(userMessage);
                this.handleMessageResponse(userMessage, response);
            } else {
                // Queue message for when online
                this.queueMessage(userMessage);
                this.showOfflineNotification();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.handleMessageError(userMessage, error);
        }
    }

    async sendMessageToAPI(message) {
        // Simulate API call with mock response
        await this.delay(2000); // Simulate network delay
        
        return this.generateMockResponse(message.content);
    }

    generateMockResponse(userMessage) {
        const responses = {
            headache: {
                type: 'insight_card',
                content: {
                    title: 'Headache Analysis',
                    severity: 'medium',
                    confidence: 85,
                    conditions: [
                        { name: 'Tension Headache', probability: 75 },
                        { name: 'Stress-related Headache', probability: 60 }
                    ],
                    recommendations: [
                        { icon: '💧', text: 'Stay well hydrated (8+ glasses of water daily)' },
                        { icon: '😴', text: 'Ensure 7-9 hours of quality sleep' },
                        { icon: '🧘', text: 'Practice stress management techniques' }
                    ],
                    warnings: [
                        { icon: '⚠️', text: 'Consult a doctor if headaches persist for more than a week' }
                    ]
                }
            },
            medication: {
                type: 'text',
                content: 'I can help you with medication information. Could you please specify which medication you need help with? I can provide information about dosages, side effects, interactions, and reminders.'
            },
            appointment: {
                type: 'text',
                content: 'I can help you schedule an appointment. Let me connect you with our scheduling system.',
                actions: [
                    { type: 'schedule', text: 'Schedule Appointment', primary: true },
                    { type: 'find_doctor', text: 'Find a Doctor' }
                ]
            },
            default: {
                type: 'text',
                content: 'Thank you for your message. I\'m analyzing your symptoms and will provide personalized recommendations shortly. Is there anything specific you\'d like me to focus on?'
            }
        };

        // Simple keyword matching for demo
        const lowerMessage = userMessage.toLowerCase();
        if (lowerMessage.includes('headache') || lowerMessage.includes('head')) {
            return responses.headache;
        } else if (lowerMessage.includes('medication') || lowerMessage.includes('medicine')) {
            return responses.medication;
        } else if (lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
            return responses.appointment;
        } else {
            return responses.default;
        }
    }

    handleMessageResponse(userMessage, response) {
        // Update user message status
        userMessage.status = 'delivered';
        this.updateMessageStatus(userMessage.id, 'delivered');

        // Hide typing indicator
        this.hideTypingIndicator();

        // Create AI response
        const aiMessage = {
            id: this.generateMessageId(),
            type: 'ai',
            content: response.content,
            messageType: response.type,
            timestamp: new Date(),
            status: 'delivered'
        };

        // Add AI response to UI
        setTimeout(() => {
            this.addMessageToUI(aiMessage);
            this.showQuickReplies(response);
        }, 500);

        // Save to history
        this.saveMessage(userMessage);
        this.saveMessage(aiMessage);

        // Play notification sound
        this.playNotificationSound();
    }

    handleMessageError(message, error) {
        message.status = 'error';
        this.updateMessageStatus(message.id, 'error');
        this.hideTypingIndicator();
        
        // Show error message
        this.showErrorMessage('Failed to send message. Please try again.');
    }

    addMessageToUI(message) {
        const chatMessages = document.getElementById('chat-messages');
        const messageEl = this.createMessageElement(message);
        
        // Remove quick start section if this is the first user message
        if (message.type === 'user' && this.messages.length === 0) {
            const quickStart = document.querySelector('.quick-start-section');
            if (quickStart) {
                quickStart.style.display = 'none';
            }
        }

        chatMessages.appendChild(messageEl);
        this.messages.push(message);
        
        // Auto-scroll if needed
        if (this.shouldAutoScroll) {
            this.scrollToBottom();
        }

        // Animate message appearance
        setTimeout(() => {
            messageEl.classList.add('animate-in');
        }, 50);
    }

    createMessageElement(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.type}-message`;
        messageEl.dataset.messageId = message.id;

        if (message.type === 'ai') {
            messageEl.innerHTML = this.createAIMessageHTML(message);
        } else {
            messageEl.innerHTML = this.createUserMessageHTML(message);
        }

        return messageEl;
    }

    createAIMessageHTML(message) {
        const timeStr = this.formatMessageTime(message.timestamp);
        const statusIcon = this.getStatusIcon(message.status);

        if (message.messageType === 'insight_card') {
            return `
                <div class="message-avatar">
                    <div class="avatar-icon">👨‍⚕️</div>
                </div>
                <div class="message-content">
                    ${this.createInsightCardHTML(message.content)}
                    <div class="message-footer">
                        <span class="message-time">${timeStr}</span>
                        <div class="message-status">
                            <span class="status-icon ${message.status}">${statusIcon}</span>
                        </div>
                        <div class="message-actions">
                            <button class="message-action" title="Helpful" data-action="like">👍</button>
                            <button class="message-action" title="Not helpful" data-action="dislike">👎</button>
                            <button class="message-action" title="Bookmark" data-action="bookmark">🔖</button>
                            <button class="message-action" title="Share" data-action="share">📤</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="message-avatar">
                    <div class="avatar-icon">👨‍⚕️</div>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        <div class="message-text">
                            <p>${this.formatMessageText(message.content)}</p>
                        </div>
                    </div>
                    <div class="message-footer">
                        <span class="message-time">${timeStr}</span>
                        <div class="message-status">
                            <span class="status-icon ${message.status}">${statusIcon}</span>
                        </div>
                        <div class="message-actions">
                            <button class="message-action" title="Helpful" data-action="like">👍</button>
                            <button class="message-action" title="Not helpful" data-action="dislike">👎</button>
                            <button class="message-action" title="Bookmark" data-action="bookmark">🔖</button>
                            <button class="message-action" title="Copy" data-action="copy">📋</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    createUserMessageHTML(message) {
        const timeStr = this.formatMessageTime(message.timestamp);
        const statusIcon = this.getStatusIcon(message.status);
        
        return `
            <div class="message-content">
                <div class="message-bubble">
                    <div class="message-text">
                        <p>${this.formatMessageText(message.content)}</p>
                        ${message.attachments.length > 0 ? this.createAttachmentsHTML(message.attachments) : ''}
                    </div>
                </div>
                <div class="message-footer">
                    <span class="message-time">${timeStr}</span>
                    <div class="message-status">
                        <span class="status-icon ${message.status}">${statusIcon}</span>
                    </div>
                </div>
            </div>
            <div class="message-avatar">
                <div class="avatar-icon user">👤</div>
            </div>
        `;
    }

    createInsightCardHTML(content) {
        return `
            <div class="medical-insight-card">
                <div class="insight-header">
                    <div class="insight-icon">🔍</div>
                    <div class="insight-info">
                        <h4 class="insight-title">${content.title}</h4>
                        <div class="severity-indicator ${content.severity}">
                            <span class="severity-dot"></span>
                            <span class="severity-text">${content.severity.charAt(0).toUpperCase() + content.severity.slice(1)} Priority</span>
                        </div>
                    </div>
                    <div class="confidence-score">
                        <span class="confidence-value">${content.confidence}%</span>
                        <span class="confidence-label">Confidence</span>
                    </div>
                </div>
                
                <div class="insight-content">
                    ${content.conditions ? `
                        <div class="diagnosis-section">
                            <h5>Possible Conditions:</h5>
                            <div class="condition-list">
                                ${content.conditions.map(condition => `
                                    <div class="condition-item">
                                        <span class="condition-name">${condition.name}</span>
                                        <span class="condition-probability">${condition.probability}%</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${content.recommendations ? `
                        <div class="recommendations-section">
                            <h5>Recommendations:</h5>
                            <ul class="recommendation-list">
                                ${content.recommendations.map(rec => `
                                    <li class="recommendation-item">
                                        <span class="rec-icon">${rec.icon}</span>
                                        <span>${rec.text}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${content.warnings ? `
                        <div class="warning-section">
                            ${content.warnings.map(warning => `
                                <div class="warning-item">
                                    <span class="warning-icon">${warning.icon}</span>
                                    <span>${warning.text}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="insight-actions">
                    <button class="insight-btn primary" data-action="schedule">
                        <span class="btn-icon">📅</span>
                        <span>Schedule Appointment</span>
                    </button>
                    <button class="insight-btn secondary" data-action="learn-more">
                        <span class="btn-icon">📚</span>
                        <span>Learn More</span>
                    </button>
                    <button class="insight-btn secondary" data-action="add-record">
                        <span class="btn-icon">📋</span>
                        <span>Add to Records</span>
                    </button>
                </div>
            </div>
        `;
    }

    createAttachmentsHTML(attachments) {
        return `
            <div class="message-attachments">
                ${attachments.map(attachment => `
                    <div class="attachment-item">
                        <span class="attachment-icon">${this.getAttachmentIcon(attachment.type)}</span>
                        <span class="attachment-name">${attachment.name}</span>
                        <span class="attachment-size">${this.formatFileSize(attachment.size)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    formatMessageText(text) {
        // Basic text formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    formatMessageTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return timestamp.toLocaleDateString();
    }

    getStatusIcon(status) {
        const icons = {
            sending: '⏳',
            sent: '✓',
            delivered: '✓✓',
            read: '✓✓',
            error: '❌'
        };
        return icons[status] || '';
    }

    getAttachmentIcon(type) {
        const icons = {
            image: '🖼️',
            document: '📄',
            audio: '🎵',
            video: '🎥',
            pdf: '📕'
        };
        return icons[type] || '📎';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateMessageStatus(messageId, status) {
        const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageEl) {
            const statusEl = messageEl.querySelector('.status-icon');
            if (statusEl) {
                statusEl.className = `status-icon ${status}`;
                statusEl.textContent = this.getStatusIcon(status);
            }
        }

        // Update in messages array
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            message.status = status;
        }
    }

    showTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.classList.add('show');
            this.scrollToBottom();
            
            // Update typing text
            const typingText = document.getElementById('typing-text');
            const messages = [
                'Dr. AI is analyzing your symptoms...',
                'Consulting medical database...',
                'Preparing personalized recommendations...',
                'Reviewing your health profile...'
            ];
            
            let messageIndex = 0;
            this.typingTextInterval = setInterval(() => {
                if (typingText) {
                    typingText.textContent = messages[messageIndex];
                    messageIndex = (messageIndex + 1) % messages.length;
                }
            }, 2000);
        }
    }

    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.classList.remove('show');
            clearInterval(this.typingTextInterval);
        }
    }

    showQuickReplies(response) {
        const quickReplies = document.getElementById('quick-replies');
        if (!quickReplies) return;

        // Generate contextual quick replies based on response
        const replies = this.generateQuickReplies(response);
        
        if (replies.length > 0) {
            quickReplies.innerHTML = `
                <div class="quick-replies-grid">
                    ${replies.map(reply => `
                        <button class="quick-reply-btn" data-reply="${reply}">${reply}</button>
                    `).join('')}
                </div>
            `;
            
            quickReplies.classList.add('show');
            
            // Add click handlers
            quickReplies.querySelectorAll('.quick-reply-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.sendQuickMessage(e.target.dataset.reply);
                });
            });
        }
    }

    generateQuickReplies(response) {
        const baseReplies = [
            'Tell me more',
            'What should I do?',
            'Is this serious?',
            'Any side effects?',
            'How long does this take?'
        ];

        if (response.type === 'insight_card') {
            return [
                'Tell me more about this',
                'What are the next steps?',
                'Should I see a doctor?',
                'Any home remedies?',
                'How can I prevent this?'
            ];
        }

        return baseReplies;
    }

    sendQuickMessage(message) {
        const messageInput = document.getElementById('message-input');
        messageInput.value = message;
        this.sendMessage();
        
        // Hide quick replies
        const quickReplies = document.getElementById('quick-replies');
        if (quickReplies) {
            quickReplies.classList.remove('show');
        }
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 120); // Max height
        textarea.style.height = newHeight + 'px';
    }

    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Additional methods for voice recording, file handling, search, etc. will be in chat-interactions.js
    
    loadSettings() {
        const defaultSettings = {
            highContrast: false,
            largeText: false,
            reduceMotion: false,
            soundNotifications: true,
            typingSounds: true,
            desktopNotifications: true,
            saveHistory: true,
            analytics: true,
            offlineQueue: true,
            chatLanguage: 'en',
            autoTranslate: false
        };

        const saved = localStorage.getItem('chatSettings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    applySettings() {
        // Apply visual settings
        document.documentElement.classList.toggle('high-contrast', this.settings.highContrast);
        document.documentElement.classList.toggle('large-text', this.settings.largeText);
        document.documentElement.classList.toggle('reduce-motion', this.settings.reduceMotion);

        // Update form controls
        document.getElementById('high-contrast-toggle').checked = this.settings.highContrast;
        document.getElementById('large-text-toggle').checked = this.settings.largeText;
        document.getElementById('reduce-motion-toggle').checked = this.settings.reduceMotion;
        document.getElementById('sound-notifications').checked = this.settings.soundNotifications;
        document.getElementById('typing-sounds').checked = this.settings.typingSounds;
        document.getElementById('desktop-notifications').checked = this.settings.desktopNotifications;
        document.getElementById('save-history').checked = this.settings.saveHistory;
        document.getElementById('analytics').checked = this.settings.analytics;
        document.getElementById('offline-queue').checked = this.settings.offlineQueue;
        document.getElementById('chat-language').value = this.settings.chatLanguage;
        document.getElementById('auto-translate').checked = this.settings.autoTranslate;
    }

    saveSettings() {
        // Collect settings from form
        this.settings = {
            highContrast: document.getElementById('high-contrast-toggle').checked,
            largeText: document.getElementById('large-text-toggle').checked,
            reduceMotion: document.getElementById('reduce-motion-toggle').checked,
            soundNotifications: document.getElementById('sound-notifications').checked,
            typingSounds: document.getElementById('typing-sounds').checked,
            desktopNotifications: document.getElementById('desktop-notifications').checked,
            saveHistory: document.getElementById('save-history').checked,
            analytics: document.getElementById('analytics').checked,
            offlineQueue: document.getElementById('offline-queue').checked,
            chatLanguage: document.getElementById('chat-language').value,
            autoTranslate: document.getElementById('auto-translate').checked
        };

        localStorage.setItem('chatSettings', JSON.stringify(this.settings));
        this.applySettings();
        this.closeModal(document.getElementById('settings-modal'));
        
        this.showNotification('Settings saved successfully!');
    }

    resetSettings() {
        localStorage.removeItem('chatSettings');
        this.settings = this.loadSettings();
        this.applySettings();
        this.showNotification('Settings reset to defaults!');
    }

    loadChatHistory() {
        if (!this.settings.saveHistory) return;
        
        const saved = localStorage.getItem('chatHistory');
        if (saved) {
            this.messages = JSON.parse(saved);
            // Restore messages to UI if needed
        }
    }

    saveMessage(message) {
        if (!this.settings.saveHistory) return;
        
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        history.push(message);
        
        // Keep only last 100 messages
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
        
        localStorage.setItem('chatHistory', JSON.stringify(history));
    }

    setupNotifications() {
        if ('Notification' in window && this.settings.desktopNotifications) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }

    playNotificationSound() {
        if (!this.settings.soundNotifications) return;
        
        // Create and play notification sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYbBjWL0fPTgjEGHm7A7+OZURE=');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Could not play notification sound'));
    }

    setupOfflineHandling() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processMessageQueue();
            this.hideOfflineNotification();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineNotification();
        });
    }

    queueMessage(message) {
        if (this.settings.offlineQueue) {
            this.messageQueue.push(message);
        }
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.sendMessageToAPI(message).then(response => {
                this.handleMessageResponse(message, response);
            }).catch(error => {
                this.handleMessageError(message, error);
            });
        }
    }

    showOfflineNotification() {
        this.showNotification('You are offline. Messages will be sent when connection is restored.', 'warning');
    }

    hideOfflineNotification() {
        this.showNotification('Connection restored!', 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: var(--space-4);
            right: var(--space-4);
            background: var(--surface-secondary);
            color: var(--text-primary);
            padding: var(--space-3) var(--space-4);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;

        if (type === 'success') {
            notification.style.borderLeft = '4px solid var(--success-green)';
        } else if (type === 'warning') {
            notification.style.borderLeft = '4px solid var(--warning-orange)';
        } else if (type === 'error') {
            notification.style.borderLeft = '4px solid var(--error-red)';
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    // Placeholder methods that will be implemented in chat-interactions.js
    toggleSearch() { console.log('toggleSearch - implement in interactions'); }
    toggleChatMenu() { console.log('toggleChatMenu - implement in interactions'); }
    closeChatMenu() { console.log('closeChatMenu - implement in interactions'); }
    showEmergencyModal() { console.log('showEmergencyModal - implement in interactions'); }
    closeModal(modal) { console.log('closeModal - implement in interactions'); }
    handleEscape() { console.log('handleEscape - implement in interactions'); }
    focusMessageInput() { console.log('focusMessageInput - implement in interactions'); }
    bookmarkConversation() { console.log('bookmarkConversation - implement in interactions'); }
    clearChatHistory() { console.log('clearChatHistory - implement in interactions'); }
    exportChat() { console.log('exportChat - implement in interactions'); }
    toggleHighContrast() { console.log('toggleHighContrast - implement in interactions'); }
    toggleTranslation() { console.log('toggleTranslation - implement in interactions'); }
    handleMessageAction(action, messageElement) { console.log('handleMessageAction - implement in interactions'); }
    handleInsightAction(action) { console.log('handleInsightAction - implement in interactions'); }
    handleEmergencyAction(action) { console.log('handleEmergencyAction - implement in interactions'); }
    startVoiceRecording() { console.log('startVoiceRecording - implement in interactions'); }
    stopVoiceRecording() { console.log('stopVoiceRecording - implement in interactions'); }
    toggleVoiceRecording() { console.log('toggleVoiceRecording - implement in interactions'); }
    handleFileSelect(e) { console.log('handleFileSelect - implement in interactions'); }
    clearAttachments() { console.log('clearAttachments - implement in interactions'); }
    toggleEmojiPicker() { console.log('toggleEmojiPicker - implement in interactions'); }
    closeEmojiPicker() { console.log('closeEmojiPicker - implement in interactions'); }
    // ================================
    // MEDICAL TERMS HANDLING
    // ================================
    
    setupMedicalTerms() {
        this.medicalDatabase = {
            'symptoms': {
                definition: 'Physical or mental features indicating a condition of disease.',
                category: 'general'
            },
            'conditions': {
                definition: 'A particular state of health or bodily condition.',
                category: 'general'
            },
            'tension-headache': {
                definition: 'Mild to moderate headache that feels like a tight band around your head.',
                category: 'neurological'
            },
            'stress-headache': {
                definition: 'Headaches caused by stress, tension, or anxiety.',
                category: 'neurological'
            }
        };
        
        this.createMedicalTooltip();
        this.setupMedicalTermListeners();
    }
    
    createMedicalTooltip() {
        if (document.getElementById('medical-tooltip')) return;
        
        const tooltip = document.createElement('div');
        tooltip.id = 'medical-tooltip';
        tooltip.className = 'medical-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <h4 class="tooltip-term"></h4>
                <button class="tooltip-close">✕</button>
            </div>
            <div class="tooltip-content">
                <div class="tooltip-definition"></div>
                <div class="tooltip-actions">
                    <button class="tooltip-learn-more">Learn More</button>
                    <button class="tooltip-translate">Translate</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(tooltip);
        this.medicalTooltip = tooltip;
        
        tooltip.querySelector('.tooltip-close').addEventListener('click', () => {
            this.hideMedicalTooltip();
        });
    }
    
    setupMedicalTermListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('medical-term')) {
                this.handleMedicalTermClick(e.target, e);
            } else if (!e.target.closest('.medical-tooltip')) {
                this.hideMedicalTooltip();
            }
        });
    }
    
    handleMedicalTermClick(termElement, event) {
        event.preventDefault();
        const term = termElement.getAttribute('data-term');
        const termData = this.medicalDatabase[term];
        
        if (termData) {
            this.currentMedicalTerm = term;
            this.showMedicalTooltip(termElement, termData);
        }
    }
    
    showMedicalTooltip(element, termData) {
        if (!this.medicalTooltip) return;
        
        this.medicalTooltip.querySelector('.tooltip-term').textContent = termData.definition.split(' ')[0];
        this.medicalTooltip.querySelector('.tooltip-definition').textContent = termData.definition;
        
        const rect = element.getBoundingClientRect();
        this.medicalTooltip.style.left = `${rect.left}px`;
        this.medicalTooltip.style.top = `${rect.bottom + 10}px`;
        this.medicalTooltip.classList.add('show');
    }
    
    hideMedicalTooltip() {
        if (this.medicalTooltip) {
            this.medicalTooltip.classList.remove('show');
        }
    }
    
    // ================================
    // MULTIMEDIA HANDLING
    // ================================
    
    setupMultimediaHandling() {
        this.setupImageZoomModal();
    }
    
    handleFileSelection(e) {
        for (const file of e.target.files) {
            this.processAttachmentFile(file);
        }
    }
    
    processAttachmentFile(file) {
        const attachment = {
            id: Date.now() + Math.random(),
            file: file,
            type: this.getFileType(file),
            name: file.name,
            size: this.formatFileSize(file.size),
            url: URL.createObjectURL(file)
        };
        
        this.attachments.push(attachment);
        this.displayAttachment(attachment);
    }
    
    getFileType(file) {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('audio/')) return 'voice';
        return 'document';
    }
    
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    }
    
    displayAttachment(attachment) {
        const preview = document.getElementById('attachment-preview');
        const item = document.createElement('div');
        item.className = `attachment-item ${attachment.type}-preview`;
        item.innerHTML = `
            <div class="attachment-icon">${this.getFileIcon(attachment.type)}</div>
            <div class="attachment-info">
                <span class="attachment-name">${attachment.name}</span>
                <span class="attachment-size">${attachment.size}</span>
            </div>
            <button class="attachment-remove" data-id="${attachment.id}">✕</button>
        `;
        
        preview.appendChild(item);
        preview.classList.add('show');
        
        item.querySelector('.attachment-remove').addEventListener('click', () => {
            this.removeAttachment(attachment.id);
        });
    }
    
    getFileIcon(type) {
        switch (type) {
            case 'image': return '🖼️';
            case 'voice': return '🎤';
            default: return '📄';
        }
    }
    
    removeAttachment(id) {
        const index = this.attachments.findIndex(att => att.id === id);
        if (index > -1) {
            URL.revokeObjectURL(this.attachments[index].url);
            this.attachments.splice(index, 1);
        }
        
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) item.remove();
        
        if (this.attachments.length === 0) {
            document.getElementById('attachment-preview').classList.remove('show');
        }
    }
    
    setupImageZoomModal() {
        // Image zoom functionality will be added as needed
        console.log('Image zoom modal setup');
    }
    
    // ================================
    // QUICK REPLIES
    // ================================
    
    setupQuickReplies() {
        const scale = document.querySelectorAll('.severity-btn');
        scale.forEach(btn => {
            btn.addEventListener('click', () => {
                scale.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                const value = btn.dataset.value;
                this.sendMessage(`My pain level is ${value} out of 10`);
                document.getElementById('quick-replies').classList.remove('show');
            });
        });
        
        const replyBtns = document.querySelectorAll('.quick-reply-btn');
        replyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.dataset.message || btn.textContent;
                this.sendMessage(message);
                document.getElementById('quick-replies').classList.remove('show');
            });
        });
    }
    
    // Enhanced send message with attachments
    sendMessage(messageText) {
        const input = document.getElementById('message-input');
        const text = messageText || (input ? input.value.trim() : '');
        
        if (!text && this.attachments.length === 0) return;
        
        if (this.attachments.length > 0) {
            this.sendMessageWithAttachments(text);
        } else {
            this.addMessageToUI({
                type: 'user',
                content: text,
                timestamp: 'Just now'
            });
            
            if (input) {
                input.value = '';
                input.dispatchEvent(new Event('input'));
            }
        }
    }
    
    sendMessageWithAttachments(text) {
        this.addMessageToUI({
            type: 'user',
            content: text,
            attachments: [...this.attachments],
            timestamp: 'Just now'
        });
        
        this.clearAttachments();
    }
    
    clearAttachments() {
        this.attachments.forEach(att => URL.revokeObjectURL(att.url));
        this.attachments = [];
        document.getElementById('attachment-preview').innerHTML = '';
        document.getElementById('attachment-preview').classList.remove('show');
    }
    
    loadMedicalTermsData() {
        return {};
    }
    
    // ================================
    // SPEECH-TO-TEXT FUNCTIONALITY  
    // ================================
    
    setupSpeechToText() {
        if ('webkitSpeechRecognition' in window) {
            this.speechRecognition = new webkitSpeechRecognition();
        } else if ('SpeechRecognition' in window) {
            this.speechRecognition = new SpeechRecognition();
        } else {
            console.warn('Speech recognition not supported');
            return;
        }

        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.lang = 'en-US';

        this.speechRecognition.onstart = () => {
            this.updateSpeechButton(true);
        };

        this.speechRecognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            
            if (finalTranscript) {
                const input = document.getElementById('message-input');
                if (input) {
                    input.value += finalTranscript;
                    input.dispatchEvent(new Event('input'));
                }
            }
        };

        this.speechRecognition.onend = () => {
            this.updateSpeechButton(false);
        };

        this.speechRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.updateSpeechButton(false);
        };
    }
    
    toggleSpeechToText() {
        if (!this.speechRecognition) return;
        
        if (this.isListening) {
            this.speechRecognition.stop();
        } else {
            this.speechRecognition.start();
        }
        this.isListening = !this.isListening;
    }
    
    updateSpeechButton(listening) {
        const button = document.getElementById('speech-to-text-btn');
        const indicator = document.getElementById('listening-indicator');
        
        if (button) {
            button.setAttribute('data-listening', listening);
            button.classList.toggle('active', listening);
        }
        
        if (indicator) {
            indicator.style.opacity = listening ? '1' : '0';
        }
    }
    
    // ================================
    // OFFLINE FUNCTIONALITY
    // ================================
    
    setupOfflineHandling() {
        this.isOnline = navigator.onLine;
        
        window.addEventListener('online', () => {
            this.handleConnectionChange(true);
        });

        window.addEventListener('offline', () => {
            this.handleConnectionChange(false);
        });
        
        this.updateConnectionStatus();
    }
    
    handleConnectionChange(online) {
        this.isOnline = online;
        this.updateConnectionStatus();
        
        if (online && this.messageQueue.length > 0) {
            this.processMessageQueue();
        }
    }
    
    updateConnectionStatus() {
        const indicator = document.getElementById('offline-indicator');
        const statusText = document.querySelector('.status-text');
        const statusIndicator = document.querySelector('.status-indicator');
        
        if (indicator) {
            indicator.classList.toggle('show', !this.isOnline);
        }
        
        if (statusText) {
            statusText.textContent = this.isOnline ? 'Online' : 'Offline';
        }
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${this.isOnline ? 'online' : 'offline'}`;
        }
    }
    
    queueMessage(message) {
        const queuedMessage = {
            id: Date.now() + Math.random(),
            ...message,
            queuedAt: new Date().toISOString(),
            status: 'queued'
        };
        
        this.messageQueue.push(queuedMessage);
        this.saveMessageQueue();
        return queuedMessage.id;
    }
    
    processMessageQueue() {
        if (!this.isOnline || this.messageQueue.length === 0) return;
        
        // Simulate processing queued messages
        this.messageQueue.forEach((message, index) => {
            setTimeout(() => {
                this.removeFromQueue(message.id);
            }, (index + 1) * 1000);
        });
    }
    
    removeFromQueue(messageId) {
        const index = this.messageQueue.findIndex(msg => msg.id === messageId);
        if (index > -1) {
            this.messageQueue.splice(index, 1);
            this.saveMessageQueue();
        }
    }
    
    saveMessageQueue() {
        try {
            localStorage.setItem('chat_message_queue', JSON.stringify(this.messageQueue));
        } catch (error) {
            console.warn('Failed to save message queue:', error);
        }
    }
    
    loadMessageQueue() {
        try {
            const saved = localStorage.getItem('chat_message_queue');
            if (saved) {
                this.messageQueue = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load message queue:', error);
            this.messageQueue = [];
        }
    }
}

// Initialize chat interface when DOM is loaded
let chatInterface;

document.addEventListener('DOMContentLoaded', () => {
    chatInterface = new ChatInterface();
});

// Export for global access
window.chatInterface = chatInterface;