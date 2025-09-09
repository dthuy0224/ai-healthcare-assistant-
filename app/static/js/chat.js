/**
 * AI Health Care Assistant - Chat Interface JavaScript
 * Handles real-time chat functionality, voice input, and AI responses
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
});

let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

/**
 * Initialize Chat Interface
 */
function initializeChat() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-btn');
    const voiceButton = document.getElementById('voice-btn');
    const emergencyButton = document.querySelector('.emergency-btn');

    if (messageInput) {
        // Input event listeners
        messageInput.addEventListener('input', handleInputChange);
        messageInput.addEventListener('keypress', handleKeyPress);

        // Send button
        if (sendButton) {
            sendButton.addEventListener('click', sendMessage);
        }

        // Voice button
        if (voiceButton) {
            voiceButton.addEventListener('click', toggleVoiceRecording);
        }

        // Emergency button
        if (emergencyButton) {
            emergencyButton.addEventListener('click', showEmergencyModal);
        }

        // Quick replies
        initializeQuickReplies();

        // Auto-focus input
        messageInput.focus();

        // Scroll to bottom on load
        scrollToBottom();
    }
}

/**
 * Handle Input Changes
 */
function handleInputChange(event) {
    const input = event.target;
    const sendButton = document.getElementById('send-btn');

    // Enable/disable send button
    if (sendButton) {
        sendButton.disabled = input.value.trim().length === 0;
    }

    // Auto-resize textarea if needed
    if (input.tagName === 'TEXTAREA') {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
    }
}

/**
 * Handle Key Press Events
 */
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

/**
 * Send Message to AI
 */
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user');

    // Clear input
    messageInput.value = '';
    handleInputChange({ target: messageInput });

    // Show typing indicator
    showTypingIndicator();

    try {
        // Simulate AI response (replace with actual API call)
        const response = await getAIResponse(message);

        // Hide typing indicator
        hideTypingIndicator();

        // Add AI response
        setTimeout(() => {
            addMessage(response.message, 'ai', response.type, response.data);
        }, 500);

    } catch (error) {
        console.error('Error sending message:', error);
        hideTypingIndicator();
        addMessage('Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.', 'ai', 'error');
    }
}

/**
 * Add Message to Chat
 */
function addMessage(content, sender, type = 'text', data = null) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message-wrapper ${sender}-message`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';

    if (sender === 'ai') {
        avatar.innerHTML = `
            <svg class="w-6 h-6 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
        `;
        messageWrapper.appendChild(avatar);
    }

    // Message bubble
    if (type === 'medical-insight') {
        messageContent.appendChild(createMedicalInsightCard(data));
    } else {
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = formatMessage(content);
        messageContent.appendChild(bubble);
    }

    // Timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'message-time';
    timestamp.textContent = new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
    messageContent.appendChild(timestamp);

    if (sender === 'user') {
        messageWrapper.appendChild(messageContent);
        messageWrapper.appendChild(avatar);
    } else {
        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(messageContent);
    }

    chatMessages.appendChild(messageWrapper);
    scrollToBottom();
}

/**
 * Create Medical Insight Card
 */
function createMedicalInsightCard(data) {
    const card = document.createElement('div');
    card.className = 'medical-insight-card';

    card.innerHTML = `
        <div class="insight-header">
            <div class="insight-icon">🔍</div>
            <div>
                <h4 class="insight-title">Phân tích triệu chứng</h4>
                <div class="severity-indicator severity-${data.severity || 'medium'}">${data.severityText || 'Mức độ trung bình'}</div>
            </div>
        </div>
        <div class="insight-content">
            <p><strong>Triệu chứng của bạn:</strong> ${data.symptoms || 'Đang phân tích...'}</p>
            ${data.causes ? `
            <ul class="mt-2 space-y-1">
                ${data.causes.map(cause => `<li>• ${cause}</li>`).join('')}
            </ul>
            ` : ''}

            ${data.recommendations ? `
            <div class="recommendations mt-4">
                <h5 class="font-medium text-gray-900">Khuyến nghị:</h5>
                <ul class="mt-2 space-y-2">
                    ${data.recommendations.map(rec => `<li>${rec.icon || '✅'} ${rec.text}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
        <div class="insight-actions">
            <button class="action-btn primary" onclick="scheduleAppointment()">Đặt lịch khám</button>
            <button class="action-btn secondary" onclick="learnMore()">Tìm hiểu thêm</button>
        </div>
    `;

    return card;
}

/**
 * Format Message Content
 */
function formatMessage(content) {
    // Basic text formatting
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

/**
 * Show/Hide Typing Indicator
 */
function showTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.style.display = 'flex';
        scrollToBottom();
    }
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

/**
 * Scroll to Bottom of Chat
 */
function scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }
}

/**
 * Voice Recording Functionality
 */
async function toggleVoiceRecording() {
    const voiceButton = document.getElementById('voice-btn');
    const voiceRecording = document.getElementById('voice-recording');

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                processVoiceInput(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;

            // Update UI
            voiceButton.classList.add('active');
            voiceRecording.style.display = 'block';

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền.');
        }
    } else {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        isRecording = false;

        // Update UI
        voiceButton.classList.remove('active');
        voiceRecording.style.display = 'none';
    }
}

/**
 * Process Voice Input
 */
async function processVoiceInput(audioBlob) {
    try {
        // Show processing message
        addMessage('Đang xử lý giọng nói...', 'ai');

        // Simulate voice-to-text processing
        // In real implementation, send to speech-to-text API
        setTimeout(() => {
            const transcribedText = 'Tôi bị đau đầu và chóng mặt'; // Mock transcription
            addMessage(`Đã nhận: "${transcribedText}"`, 'ai');

            // Process as regular text message
            getAIResponse(transcribedText).then(response => {
                addMessage(response.message, 'ai', response.type, response.data);
            });
        }, 2000);

    } catch (error) {
        console.error('Error processing voice input:', error);
        addMessage('Có lỗi khi xử lý giọng nói. Vui lòng thử lại.', 'ai', 'error');
    }
}

/**
 * Initialize Quick Replies
 */
function initializeQuickReplies() {
    const quickReplies = document.getElementById('quick-replies');

    if (quickReplies) {
        quickReplies.addEventListener('click', function(event) {
            if (event.target.classList.contains('quick-reply-btn')) {
                const reply = event.target.dataset.reply;
                if (reply) {
                    const messageInput = document.getElementById('message-input');
                    messageInput.value = reply;
                    handleInputChange({ target: messageInput });
                    messageInput.focus();
                }
            }
        });
    }
}

/**
 * Mock AI Response (Replace with actual API calls)
 */
async function getAIResponse(message) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const lowerMessage = message.toLowerCase();

    // Mock responses based on keywords
    if (lowerMessage.includes('đau đầu') || lowerMessage.includes('headache')) {
        return {
            message: 'Tôi hiểu bạn đang bị đau đầu. Hãy cho tôi biết thêm về triệu chứng của bạn.',
            type: 'medical-insight',
            data: {
                severity: 'medium',
                severityText: 'Mức độ trung bình',
                symptoms: 'Đau đầu và chóng mặt',
                causes: [
                    'Thiếu nước hoặc mất ngủ',
                    'Huyết áp thay đổi',
                    'Stress hoặc căng thẳng',
                    'Có thể do thời tiết'
                ],
                recommendations: [
                    { icon: '💧', text: 'Uống đủ 2 lít nước/ngày' },
                    { icon: '😴', text: 'Nghỉ ngơi đầy đủ (7-8 tiếng)' },
                    { icon: '🩸', text: 'Đo huyết áp tại nhà' },
                    { icon: '🚫', text: 'Tránh caffeine và rượu bia' }
                ]
            }
        };
    }

    if (lowerMessage.includes('sốt') || lowerMessage.includes('fever')) {
        return {
            message: 'Triệu chứng sốt cần được theo dõi kỹ. Bạn sốt bao nhiêu độ?',
            type: 'medical-insight',
            data: {
                severity: 'high',
                severityText: 'Cần theo dõi',
                symptoms: 'Sốt cao',
                causes: [
                    'Nhiễm trùng',
                    'Viêm đường hô hấp',
                    'COVID-19 hoặc cảm cúm',
                    'Các bệnh truyền nhiễm khác'
                ],
                recommendations: [
                    { icon: '🌡️', text: 'Theo dõi nhiệt độ mỗi 4 giờ' },
                    { icon: '💊', text: 'Uống thuốc hạ sốt nếu >38.5°C' },
                    { icon: '💧', text: 'Uống nhiều nước' },
                    { icon: '🏥', text: 'Khám ngay nếu sốt >39°C' }
                ]
            }
        };
    }

    // Default response
    return {
        message: 'Cảm ơn bạn đã chia sẻ. Dựa trên triệu chứng bạn mô tả, tôi khuyến nghị bạn nên theo dõi thêm và có thể cần thăm khám bác sĩ. Bạn có thể cho tôi biết thêm chi tiết không?',
        type: 'text'
    };
}

/**
 * Emergency Modal Functions
 */
function showEmergencyModal() {
    const modal = document.getElementById('emergency-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeEmergencyModal() {
    const modal = document.getElementById('emergency-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Make functions globally available
window.closeEmergencyModal = closeEmergencyModal;
window.scheduleAppointment = function() {
    addMessage('Đang chuyển hướng đến trang đặt lịch...', 'ai');
    // In real app, redirect to appointment page
};
window.learnMore = function() {
    addMessage('Tôi sẽ cung cấp thêm thông tin chi tiết về tình trạng của bạn.', 'ai');
};