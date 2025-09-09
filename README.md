# AI Health Care Assistant

Một trợ lý y tế thông minh sử dụng AI để hỗ trợ chẩn đoán sơ bộ, theo dõi sức khỏe, và đưa ra gợi ý điều trị an toàn.

## 🚀 Tính năng chính

- **Khảo sát & đánh giá ban đầu**: Phân tích triệu chứng và đánh giá mức độ nguy hiểm
- **Gợi ý phác đồ điều trị**: Hướng dẫn chăm sóc tại nhà hoặc khám chuyên khoa
- **Theo dõi sức khỏe**: Hệ thống nhắc nhở và tracking các chỉ số
- **Tóm tắt báo cáo y tế**: Giải thích kết quả xét nghiệm bằng ngôn ngữ dễ hiểu
- **Chatbot thông minh**: Hỏi đáp về sức khỏe với khả năng ghi nhớ ngữ cảnh
- **Voice interaction**: Hỗ trợ giao tiếp bằng giọng nói
- **Multi-level explanation**: Giải thích y khoa theo nhiều cấp độ

## 🛠️ Cài đặt và Chạy

### 1. Chuẩn bị môi trường

```bash
# Kích hoạt virtual environment (đã có sẵn)
healthcare_env\Scripts\activate  # Windows
# hoặc
source healthcare_env/bin/activate  # Linux/Mac
```

### 2. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 3. Cấu hình môi trường

```bash
# Sao chép file cấu hình mẫu
cp .env.example .env

# Chỉnh sửa các API keys và cấu hình trong .env
# - OPENAI_API_KEY: API key của OpenAI
# - MONGODB_URL: URL kết nối MongoDB
# - Và các cấu hình khác
```

### 4. Chạy server

```bash
# Development mode
python main.py

# Hoặc sử dụng uvicorn trực tiếp
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server sẽ chạy tại: http://localhost:8000

## 📚 API Documentation

Sau khi chạy server, truy cập:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **API Status**: http://localhost:8000/api/v1/status

## 🏗️ Cấu trúc Project

```
AI-HealthCare-Project/
├── app/
│   ├── api/                 # API endpoints
│   ├── config/             # Cấu hình ứng dụng
│   ├── database/           # Database setup
│   ├── models/             # Pydantic models
│   ├── routes/             # FastAPI routers
│   ├── schemas/            # Database schemas
│   ├── services/           # Business logic
│   └── utils/              # Utility functions
├── data/                   # Dữ liệu và vector database
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── tests/                  # Unit tests
├── uploads/                # File uploads
├── logs/                   # Log files
├── main.py                 # Main application
├── requirements.txt        # Python dependencies
└── README.md
```

## 🔧 API Endpoints

### Health Check
- `GET /api/v1/health/` - Health check
- `GET /api/v1/status` - API status

### User Management
- `POST /api/v1/users/` - Tạo user mới
- `GET /api/v1/users/{user_id}` - Lấy thông tin user
- `PUT /api/v1/users/{user_id}` - Cập nhật user
- `DELETE /api/v1/users/{user_id}` - Xóa user

### Chat & AI Assistant
- `POST /api/v1/chat/message` - Gửi tin nhắn cho AI
- `GET /api/v1/chat/history/{user_id}` - Lấy lịch sử chat

### Medical Analysis
- `POST /api/v1/medical/symptoms/analyze` - Phân tích triệu chứng
- `POST /api/v1/medical/reports/upload` - Upload báo cáo y tế

### Reminders
- `POST /api/v1/reminders/` - Tạo reminder
- `GET /api/v1/reminders/user/{user_id}` - Lấy reminders của user
- `POST /api/v1/reminders/health-metrics` - Setup reminder đo chỉ số

## 🧪 Testing API

### Tạo user mới
```bash
curl -X POST "http://localhost:8000/api/v1/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "nguyenvana@example.com",
    "age": 30,
    "gender": "male",
    "medical_history": ["tăng huyết áp"]
  }'
```

### Chat với AI
```bash
curl -X POST "http://localhost:8000/api/v1/chat/message" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_id_from_previous_request",
    "message": "Tôi bị đau đầu và chóng mặt"
  }'
```

### Phân tích triệu chứng
```bash
curl -X POST "http://localhost:8000/api/v1/medical/symptoms/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_id",
    "symptoms": ["đau đầu", "chóng mặt", "buồn nôn"],
    "additional_info": {"duration": "2 ngày", "intensity": "vừa"}
  }'
```

## 🔐 Bảo mật & Quy định

- **Disclaimer**: AI chỉ hỗ trợ chẩn đoán sơ bộ, không thay thế bác sĩ
- **Data Privacy**: Tuân thủ quy định bảo mật dữ liệu y tế
- **Medical Accuracy**: Cần validation từ chuyên gia y tế

## 🚀 Roadmap

### Phase 1 (Current)
- [x] Basic FastAPI setup
- [x] User management
- [x] Chat system với AI mock
- [x] Symptom analysis
- [x] Reminder system

### Phase 2 (Next)
- [ ] Voice input/output integration
- [ ] Real AI model integration (OpenAI, LangChain)
- [ ] Vector database cho chat history
- [ ] Medical report OCR
- [ ] Push notifications

### Phase 3 (Future)
- [ ] Mobile app
- [ ] Real-time health monitoring
- [ ] Integration với bệnh viện
- [ ] Multi-language support
- [ ] Advanced ML models

## 🎨 UI Implementation Status

### ✅ Completed Features

#### 1. **Landing Page** (`/`)
- Hero section với call-to-action
- Features grid với 6 tính năng chính
- Trust indicators và statistics
- Responsive design cho mobile

#### 2. **Health Dashboard** (`/dashboard`)
- Personalized greeting và health score
- Vital signs monitoring (nhịp tim, huyết áp, nhiệt độ)
- Recent activity timeline
- Medication tracker với reminders
- Symptom trends với biểu đồ
- AI insights và recommendations
- Emergency preparedness section

#### 3. **AI Chat Interface** (`/chat`)
- Real-time messaging với AI assistant
- Medical insight cards cho diagnoses
- Voice recording capability
- Quick reply options
- Emergency button always visible
- Typing indicators và message status

#### 4. **Authentication System**
- **Login Page** (`/login`): Email/password với social login
- **Registration Page** (`/register`): Multi-step form với validation
- Password strength indicator
- Form validation và error handling
- Responsive design

#### 5. **Health Assessment** (`/assessment`)
- Multi-step wizard (4 bước)
- Symptom analysis với severity ratings
- Medical history collection
- Lifestyle assessment
- Progress tracking và form validation
- Real-time AI processing simulation

#### 6. **Design System**
- CSS custom properties cho colors, typography, spacing
- Consistent button styles và form elements
- Medical-themed color palette
- Accessibility compliance (WCAG 2.1 AA)
- Mobile-first responsive design

### 🚀 Available Routes

| Route | Description | Status |
|-------|-------------|--------|
| `/` | Landing page với hero và features | ✅ Complete |
| `/dashboard` | Health dashboard với widgets | ✅ Complete |
| `/chat` | AI chat interface | ✅ Complete |
| `/assessment` | Health assessment wizard | ✅ Complete |
| `/login` | User login page | ✅ Complete |
| `/register` | User registration (multi-step) | ✅ Complete |
| `/api/v1/*` | REST API endpoints | ✅ Backend Ready |

### 🛠️ Technical Implementation

#### Frontend Stack
- **Templates**: Jinja2 với responsive HTML
- **Styling**: Custom CSS với design system
- **JavaScript**: Vanilla JS với modern ES6+
- **Icons**: Heroicons và custom SVG

#### Key Features Implemented
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Screen reader support, keyboard navigation
- **Form Validation**: Real-time validation với helpful errors
- **Loading States**: Skeleton screens và progress indicators
- **Error Handling**: User-friendly error messages
- **Progressive Enhancement**: Works without JavaScript

#### Medical UI Components
- **Severity Indicators**: Color-coded health status
- **Medical Cards**: Structured medical information display
- **Vital Signs Display**: Real-time health metrics
- **Progress Tracking**: Assessment và medication adherence
- **Emergency Features**: Quick access emergency functions

## 🔧 Development Guide

### Running the Application

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Development Server:**
   ```bash
   python run.py
   ```

3. **Access Application:**
   - Landing Page: http://localhost:8000
   - Dashboard: http://localhost:8000/dashboard
   - Chat: http://localhost:8000/chat
   - Assessment: http://localhost:8000/assessment
   - Login: http://localhost:8000/login
   - Register: http://localhost:8000/register

### Testing Features

#### Dashboard Features
- View health metrics và vital signs
- Check medication reminders
- Review recent activities
- Access emergency features

#### Chat Features
- Send messages to AI assistant
- Try voice recording (microphone permission required)
- Test quick reply options
- Experience medical insight cards

#### Assessment Features
- Complete 4-step health assessment
- Test form validation
- Experience progress tracking
- View summary on completion

#### Authentication Features
- Test login with demo credentials
- Try multi-step registration
- Check password strength indicator
- Experience form validation

### Customization Guide

#### Adding New Pages
1. Create template in `app/templates/`
2. Add route in `main.py`
3. Add navigation link in `base.html`

#### Modifying Design System
1. Update CSS variables in `design-system.css`
2. Modify component styles as needed
3. Ensure responsive design

#### Adding New Components
1. Create HTML structure in templates
2. Add CSS styles
3. Add JavaScript functionality
4. Ensure accessibility compliance

## 📱 Mobile Experience

The application is fully responsive với:
- **Mobile-first design** approach
- **Touch-friendly** interactions
- **Optimized layouts** for small screens
- **Swipe gestures** support
- **Voice input** capabilities

## ♿ Accessibility Features

- **WCAG 2.1 AA** compliance
- **Screen reader** support
- **Keyboard navigation**
- **High contrast** mode support
- **Semantic HTML** structure
- **ARIA labels** và descriptions
- **Focus management** for modals và forms

## 🔒 Security Considerations

- **HTTPS required** for production
- **CSRF protection** implemented
- **Input validation** và sanitization
- **Secure session management**
- **Medical data encryption**
- **HIPAA compliance** ready

## 🚀 Production Deployment

### Prerequisites
- Python 3.8+
- FastAPI compatible server (Uvicorn, Gunicorn)
- PostgreSQL or MongoDB database
- Reverse proxy (Nginx recommended)

### Environment Setup
1. Configure environment variables
2. Setup database connections
3. Configure SSL certificates
4. Setup monitoring và logging

### Deployment Steps
1. Install production dependencies
2. Run database migrations
3. Configure web server
4. Setup SSL certificates
5. Deploy application
6. Configure monitoring

## 🤝 Đóng góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Lưu ý quan trọng

**DỤNG Ý Y TẾ**: Ứng dụng này chỉ mang tính chất hỗ trợ và tham khảo. Không sử dụng để thay thế tư vấn y tế chuyên khoa. Luôn tham khảo ý kiến bác sĩ trước khi áp dụng bất kỳ gợi ý nào.