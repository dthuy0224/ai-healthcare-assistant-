"""Medical analysis and report processing routes"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Response
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from uuid import uuid4
import json
import uuid
import io
import base64
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

router = APIRouter()

# In-memory storage for assessments (replace with database in production)
assessments_db = {}

# Pydantic Models for Health Assessment
class BasicHealthProfile(BaseModel):
    age: int = Field(..., ge=1, le=120, description="Age in years")
    gender: str = Field(..., description="Gender identity")
    height: float = Field(..., gt=0, description="Height")
    height_unit: str = Field(..., pattern="^(cm|ft)$", description="Height unit")
    weight: float = Field(..., gt=0, description="Weight")
    weight_unit: str = Field(..., pattern="^(kg|lbs)$", description="Weight unit")
    activity_level: int = Field(..., ge=1, le=5, description="Activity level 1-5")
    medications: List[str] = Field(default=[], description="Current medications")
    no_medications: bool = Field(default=False, description="No medications flag")

class SymptomInput(BaseModel):
    primary_symptom: str = Field(..., min_length=10, max_length=500, description="Primary symptom description")
    duration: str = Field(..., description="Symptom duration")
    severity: int = Field(..., ge=1, le=10, description="Pain/discomfort level 1-10")
    affected_body_parts: List[str] = Field(default=[], description="Affected body areas")
    additional_symptoms: List[str] = Field(default=[], description="Additional symptoms")

class ContextualQuestions(BaseModel):
    symptom_onset_date: Optional[date] = Field(None, description="When symptoms first appeared")
    previous_experience: Optional[bool] = Field(None, description="Experienced this before")
    current_treatment: Optional[bool] = Field(None, description="Currently taking medication for this")
    healthcare_consultation: Optional[bool] = Field(None, description="Consulted healthcare provider")
    uploaded_files: List[str] = Field(default=[], description="Uploaded file names")
    has_voice_recording: bool = Field(default=False, description="Has voice recording")
    dynamic_answers: Dict[str, Any] = Field(default={}, description="Dynamic question answers")

class HealthAssessmentRequest(BaseModel):
    basic_profile: BasicHealthProfile
    symptom_input: SymptomInput
    contextual_questions: ContextualQuestions
    
    @validator('basic_profile')
    def validate_basic_profile(cls, v):
        # BMI validation
        height_m = v.height / 100 if v.height_unit == 'cm' else v.height * 0.3048
        weight_kg = v.weight if v.weight_unit == 'kg' else v.weight / 2.205
        bmi = weight_kg / (height_m ** 2)
        
        if bmi < 10 or bmi > 60:
            raise ValueError('BMI appears to be outside normal range. Please check height and weight.')
        
        return v

class RiskLevel(BaseModel):
    level: str = Field(..., pattern="^(low|medium|high)$")
    description: str
    score: float = Field(..., ge=0, le=100)

class Insight(BaseModel):
    category: str
    title: str
    content: Any  # Can be string, list, or dict
    confidence: float = Field(..., ge=0, le=100)

class Recommendation(BaseModel):
    priority: str = Field(..., pattern="^(urgent|important|general)$")
    title: str
    description: str
    timeframe: str

class AnalysisResults(BaseModel):
    risk_level: RiskLevel
    insights: List[Insight]
    recommendations: List[Recommendation]
    possible_conditions: List[Dict[str, Any]]
    key_factors: List[str]
    timeline_assessment: str

class HealthAssessmentResponse(BaseModel):
    assessment_id: str
    status: str
    submitted_at: datetime
    analysis_results: Optional[AnalysisResults] = None
    message: str

# Legacy models for backward compatibility
class SymptomAnalysis(BaseModel):
    id: str
    user_id: str
    symptoms: List[str]
    analysis_result: Dict[str, Any]
    severity_level: str  # low, medium, high, critical
    recommendations: List[str]
    created_at: datetime

class SymptomAnalysisRequest(BaseModel):
    user_id: str
    symptoms: List[str]
    additional_info: Optional[Dict[str, Any]] = None

class MedicalReport(BaseModel):
    id: str
    user_id: str
    report_type: str  # blood_test, xray, ultrasound, etc.
    file_name: str
    analysis_result: Dict[str, Any]
    key_findings: List[str]
    recommendations: List[str]
    uploaded_at: datetime

@router.post("/symptoms/analyze", response_model=SymptomAnalysis)
async def analyze_symptoms(request: SymptomAnalysisRequest) -> SymptomAnalysis:
    """Analyze user symptoms and provide health assessment"""

    analysis_id = str(uuid4())

    # Mock analysis (replace with actual AI/ML model)
    analysis_result = perform_symptom_analysis(request.symptoms, request.additional_info)

    analysis = SymptomAnalysis(
        id=analysis_id,
        user_id=request.user_id,
        symptoms=request.symptoms,
        analysis_result=analysis_result,
        severity_level=analysis_result.get("severity", "medium"),
        recommendations=analysis_result.get("recommendations", []),
        created_at=datetime.utcnow()
    )

    # Store analysis (in production, save to database)
    store_analysis(analysis)

    return analysis

@router.post("/reports/upload")
async def upload_medical_report(
    user_id: str,
    report_type: str,
    file: UploadFile = File(...)
) -> MedicalReport:
    """Upload and analyze medical report"""

    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="File type not supported. Please upload PDF or image files."
        )

    report_id = str(uuid4())

    # Mock report analysis (replace with actual OCR/AI analysis)
    analysis_result = analyze_medical_report(file, report_type)

    report = MedicalReport(
        id=report_id,
        user_id=user_id,
        report_type=report_type,
        file_name=file.filename,
        analysis_result=analysis_result,
        key_findings=analysis_result.get("key_findings", []),
        recommendations=analysis_result.get("recommendations", []),
        uploaded_at=datetime.utcnow()
    )

    # Store report (in production, save to database and file storage)
    store_medical_report(report)

    return report

@router.get("/reports/{user_id}")
async def get_user_reports(user_id: str) -> List[MedicalReport]:
    """Get all medical reports for a user"""
    # Mock data (replace with database query)
    return []

@router.get("/reports/{user_id}/{report_id}")
async def get_report(user_id: str, report_id: str) -> MedicalReport:
    """Get specific medical report"""
    # Mock data (replace with database query)
    raise HTTPException(status_code=404, detail="Report not found")

def perform_symptom_analysis(symptoms: List[str], additional_info: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Mock symptom analysis - replace with actual AI model"""

    # Simple rule-based analysis for demo
    high_severity_symptoms = ["đau ngực", "khó thở", "choáng váng", "mất ý thức"]
    medium_severity_symptoms = ["sốt cao", "đau đầu", "buồn nôn", "mệt mỏi"]

    severity = "low"
    recommendations = []

    for symptom in symptoms:
        symptom_lower = symptom.lower()
        if any(high_symptom in symptom_lower for high_symptom in high_severity_symptoms):
            severity = "high"
            recommendations.extend([
                "Tìm kiếm sự giúp đỡ y tế khẩn cấp",
                "Gọi cấp cứu 115",
                "Theo dõi các dấu hiệu vital"
            ])
            break
        elif any(med_symptom in symptom_lower for med_symptom in medium_severity_symptoms):
            severity = "medium"
            recommendations.extend([
                "Nghỉ ngơi đầy đủ",
                "Uống nhiều nước",
                "Theo dõi triệu chứng"
            ])

    if severity == "low":
        recommendations.extend([
            "Theo dõi tình trạng sức khỏe",
            "Thực hiện lối sống lành mạnh",
            "Khám sức khỏe định kỳ"
        ])

    return {
        "severity": severity,
        "possible_conditions": ["Cần thêm thông tin để chẩn đoán"],
        "recommendations": recommendations,
        "next_steps": ["Ghi nhận thêm triệu chứng", "Theo dõi diễn tiến"],
        "disclaimer": "Đây chỉ là phân tích sơ bộ, không thay thế tư vấn y tế chuyên khoa"
    }

def analyze_medical_report(file: UploadFile, report_type: str) -> Dict[str, Any]:
    """Mock medical report analysis - replace with OCR and AI analysis"""

    return {
        "summary": "Báo cáo đã được tải lên thành công",
        "key_findings": ["Phân tích chi tiết sẽ có sau"],
        "recommendations": ["Tham khảo ý kiến bác sĩ chuyên khoa"],
        "confidence_score": 0.85,
        "processing_status": "completed"
    }

def store_analysis(analysis: SymptomAnalysis):
    """Store analysis result - implement database storage"""
    pass

# AI Analysis Engine (Mock Implementation)
class HealthAnalysisEngine:
    @staticmethod
    def analyze_assessment(assessment_data: HealthAssessmentRequest) -> AnalysisResults:
        """
        Mock AI analysis engine that processes health assessment data
        In production, this would integrate with actual AI/ML models
        """
        
        # Calculate risk level based on symptoms
        risk_level = HealthAnalysisEngine._calculate_risk_level(assessment_data)
        
        # Generate insights
        insights = HealthAnalysisEngine._generate_insights(assessment_data)
        
        # Generate recommendations
        recommendations = HealthAnalysisEngine._generate_recommendations(assessment_data, risk_level)
        
        # Generate possible conditions
        possible_conditions = HealthAnalysisEngine._generate_possible_conditions(assessment_data)
        
        # Identify key factors
        key_factors = HealthAnalysisEngine._identify_key_factors(assessment_data)
        
        # Timeline assessment
        timeline_assessment = HealthAnalysisEngine._assess_timeline(assessment_data)
        
        return AnalysisResults(
            risk_level=risk_level,
            insights=insights,
            recommendations=recommendations,
            possible_conditions=possible_conditions,
            key_factors=key_factors,
            timeline_assessment=timeline_assessment
        )
    
    @staticmethod
    def _calculate_risk_level(data: HealthAssessmentRequest) -> RiskLevel:
        severity = data.symptom_input.severity
        duration = data.symptom_input.duration
        age = data.basic_profile.age
        
        # Risk scoring algorithm
        risk_score = 0
        
        # Severity factor (0-40 points)
        risk_score += severity * 4
        
        # Duration factor (0-30 points)
        duration_scores = {
            'hours': 5, 'days': 10, 'weeks': 20, 'months': 25, 'years': 30
        }
        risk_score += duration_scores.get(duration, 10)
        
        # Age factor (0-20 points)
        if age > 65:
            risk_score += 20
        elif age > 50:
            risk_score += 10
        elif age < 18:
            risk_score += 15
        
        # Additional symptoms factor (0-10 points)
        risk_score += min(len(data.symptom_input.additional_symptoms) * 2, 10)
        
        # Determine risk level
        if risk_score >= 70:
            return RiskLevel(level="high", description="Symptoms require immediate medical attention", score=risk_score)
        elif risk_score >= 40:
            return RiskLevel(level="medium", description="Some symptoms require attention", score=risk_score)
        else:
            return RiskLevel(level="low", description="Symptoms appear manageable", score=risk_score)
    
    @staticmethod
    def _generate_insights(data: HealthAssessmentRequest) -> List[Insight]:
        insights = []
        
        # Symptom analysis insight
        symptom_insight = Insight(
            category="symptom_analysis",
            title="Symptom Pattern Analysis",
            content={
                "primary_symptom": data.symptom_input.primary_symptom[:100] + "...",
                "severity_level": data.symptom_input.severity,
                "duration": data.symptom_input.duration,
                "affected_areas": len(data.symptom_input.affected_body_parts)
            },
            confidence=85.0
        )
        insights.append(symptom_insight)
        
        # Health profile insight
        bmi = HealthAnalysisEngine._calculate_bmi(data.basic_profile)
        profile_insight = Insight(
            category="health_profile",
            title="Health Profile Assessment",
            content={
                "age_group": HealthAnalysisEngine._get_age_group(data.basic_profile.age),
                "bmi": round(bmi, 1),
                "activity_level": data.basic_profile.activity_level,
                "medications_count": len(data.basic_profile.medications)
            },
            confidence=95.0
        )
        insights.append(profile_insight)
        
        return insights
    
    @staticmethod
    def _generate_recommendations(data: HealthAssessmentRequest, risk_level: RiskLevel) -> List[Recommendation]:
        recommendations = []
        
        if risk_level.level == "high":
            recommendations.append(Recommendation(
                priority="urgent",
                title="Seek Immediate Medical Attention",
                description="Based on your symptoms and risk factors, we recommend consulting with a healthcare provider immediately.",
                timeframe="Immediately"
            ))
        elif risk_level.level == "medium":
            recommendations.append(Recommendation(
                priority="important",
                title="Schedule Medical Consultation",
                description="Consider scheduling an appointment with your primary care physician within the next few days.",
                timeframe="Within 24-48 hours"
            ))
        
        # General recommendations
        recommendations.append(Recommendation(
            priority="general",
            title="Monitor Symptoms",
            description="Keep track of your symptoms and note any changes in severity or new symptoms.",
            timeframe="Ongoing"
        ))
        
        recommendations.append(Recommendation(
            priority="general",
            title="Rest and Self-Care",
            description="Ensure adequate rest, stay hydrated, and avoid activities that may worsen your symptoms.",
            timeframe="Immediate"
        ))
        
        return recommendations
    
    @staticmethod
    def _generate_possible_conditions(data: HealthAssessmentRequest) -> List[Dict[str, Any]]:
        # Mock condition matching based on symptoms
        conditions = [
            {"name": "Common Cold", "match_percentage": 70, "description": "Viral upper respiratory infection"},
            {"name": "Seasonal Allergies", "match_percentage": 45, "description": "Allergic reaction to environmental factors"},
            {"name": "Viral Infection", "match_percentage": 30, "description": "General viral infection"}
        ]
        
        # Adjust based on severity and symptoms
        severity = data.symptom_input.severity
        if severity >= 8:
            conditions.insert(0, {"name": "Acute Condition", "match_percentage": 85, "description": "Requires immediate attention"})
        
        return conditions
    
    @staticmethod
    def _identify_key_factors(data: HealthAssessmentRequest) -> List[str]:
        factors = []
        
        # Age factor
        age = data.basic_profile.age
        if age > 65:
            factors.append("Advanced age increases risk factors")
        elif age < 18:
            factors.append("Young age requires special consideration")
        
        # Severity factor
        if data.symptom_input.severity >= 7:
            factors.append("High symptom severity")
        
        # Duration factor
        if data.symptom_input.duration in ['months', 'years']:
            factors.append("Chronic symptom duration")
        
        # Multiple symptoms
        if len(data.symptom_input.additional_symptoms) > 3:
            factors.append("Multiple concurrent symptoms")
        
        # Medications
        if len(data.basic_profile.medications) > 0:
            factors.append("Current medication usage")
        
        # Default factors
        factors.extend([
            "Symptom combination pattern",
            "Individual health profile",
            "Reported timeline"
        ])
        
        return factors[:5]  # Return top 5 factors
    
    @staticmethod
    def _assess_timeline(data: HealthAssessmentRequest) -> str:
        duration = data.symptom_input.duration
        severity = data.symptom_input.severity
        
        if duration == 'hours':
            return "Symptoms are acute and recently developed. Monitor closely for changes."
        elif duration == 'days':
            return "Symptoms are in early stages. Typical progression timeframe for this type of condition."
        elif duration == 'weeks':
            return "Symptoms have persisted for an extended period. May require medical evaluation."
        elif duration in ['months', 'years']:
            return "Chronic symptoms requiring comprehensive medical assessment and management."
        else:
            return "Symptom timeline suggests ongoing health concern requiring attention."
    
    @staticmethod
    def _calculate_bmi(profile: BasicHealthProfile) -> float:
        height_m = profile.height / 100 if profile.height_unit == 'cm' else profile.height * 0.3048
        weight_kg = profile.weight if profile.weight_unit == 'kg' else profile.weight / 2.205
        return weight_kg / (height_m ** 2)
    
    @staticmethod
    def _get_age_group(age: int) -> str:
        if age < 18:
            return "Pediatric"
        elif age < 30:
            return "Young Adult"
        elif age < 50:
            return "Adult"
        elif age < 65:
            return "Middle-aged Adult"
        else:
            return "Senior Adult"

# New Health Assessment API Endpoints
@router.post("/health-assessment", response_model=HealthAssessmentResponse)
async def submit_health_assessment(assessment: HealthAssessmentRequest):
    """
    Submit a complete health assessment for AI analysis
    """
    try:
        # Generate unique assessment ID
        assessment_id = str(uuid.uuid4())
        
        # Perform AI analysis
        analysis_results = HealthAnalysisEngine.analyze_assessment(assessment)
        
        # Store assessment
        assessment_record = {
            "id": assessment_id,
            "assessment_data": assessment.dict(),
            "analysis_results": analysis_results.dict(),
            "status": "completed",
            "submitted_at": datetime.now(),
            "processed_at": datetime.now()
        }
        
        assessments_db[assessment_id] = assessment_record
        
        return HealthAssessmentResponse(
            assessment_id=assessment_id,
            status="completed",
            submitted_at=datetime.now(),
            analysis_results=analysis_results,
            message="Assessment completed successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing assessment: {str(e)}")

@router.get("/health-assessment/{assessment_id}", response_model=HealthAssessmentResponse)
async def get_health_assessment(assessment_id: str):
    """
    Retrieve a health assessment by ID
    """
    if assessment_id not in assessments_db:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    assessment_record = assessments_db[assessment_id]
    return HealthAssessmentResponse(**assessment_record)

@router.get("/health-assessment/{assessment_id}/pdf")
async def download_assessment_pdf(assessment_id: str):
    """
    Generate and download PDF report for health assessment
    """
    if assessment_id not in assessments_db:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    assessment_record = assessments_db[assessment_id]
    
    try:
        # Generate PDF
        pdf_buffer = generate_assessment_pdf(assessment_record)
        
        # Return PDF as downloadable file
        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=health-assessment-{assessment_id}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@router.post("/health-assessment/{assessment_id}/share")
async def share_assessment(assessment_id: str, share_request: dict):
    """
    Share health assessment via email or generate shareable link
    """
    if assessment_id not in assessments_db:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    assessment_record = assessments_db[assessment_id]
    method = share_request.get("method")
    
    try:
        if method == "email":
            email = share_request.get("email")
            if not email:
                raise HTTPException(status_code=400, detail="Email address required")
            
            # Send email with PDF attachment
            result = send_assessment_email(assessment_record, email)
            return {"message": "Assessment shared via email successfully", "result": result}
            
        elif method == "link":
            # Generate shareable link
            share_link = generate_share_link(assessment_id)
            return {"message": "Share link generated", "link": share_link}
            
        else:
            raise HTTPException(status_code=400, detail="Invalid sharing method")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sharing assessment: {str(e)}")

@router.get("/health-assessment/shared/{share_token}")
async def view_shared_assessment(share_token: str):
    """
    View shared assessment via public link
    """
    # Decode share token to get assessment ID
    try:
        assessment_id = decode_share_token(share_token)
        if assessment_id not in assessments_db:
            raise HTTPException(status_code=404, detail="Shared assessment not found")
        
        assessment_record = assessments_db[assessment_id]
        
        # Return sanitized version (remove sensitive data)
        sanitized_record = sanitize_assessment_for_sharing(assessment_record)
        return sanitized_record
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid share link")

def generate_assessment_pdf(assessment_record: dict) -> io.BytesIO:
    """
    Generate PDF report from assessment data
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title = Paragraph("Health Assessment Report", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))
    
    # Assessment Info
    assessment_data = assessment_record.get('assessment_data', {})
    analysis_results = assessment_record.get('analysis_results', {})
    
    # Basic Information
    story.append(Paragraph("Basic Information", styles['Heading2']))
    basic_profile = assessment_data.get('basicProfile', {})
    
    basic_info_data = [
        ['Age', f"{basic_profile.get('age', 'N/A')} years"],
        ['Gender', basic_profile.get('gender', 'N/A')],
        ['Height', f"{basic_profile.get('height', 'N/A')} {basic_profile.get('heightUnit', '')}"],
        ['Weight', f"{basic_profile.get('weight', 'N/A')} {basic_profile.get('weightUnit', '')}"],
        ['Activity Level', f"{basic_profile.get('activityLevel', 'N/A')}/5"],
    ]
    
    basic_table = Table(basic_info_data, colWidths=[2*inch, 3*inch])
    basic_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(basic_table)
    story.append(Spacer(1, 12))
    
    # Symptoms
    story.append(Paragraph("Symptoms", styles['Heading2']))
    symptoms = assessment_data.get('symptoms', {})
    
    symptom_text = f"Primary Symptom: {symptoms.get('primarySymptom', 'N/A')}\n"
    symptom_text += f"Duration: {symptoms.get('duration', 'N/A')}\n"
    symptom_text += f"Severity: {symptoms.get('severity', 'N/A')}/10\n"
    
    affected_areas = symptoms.get('affectedAreas', [])
    if affected_areas:
        symptom_text += f"Affected Areas: {', '.join(affected_areas)}\n"
    
    story.append(Paragraph(symptom_text, styles['Normal']))
    story.append(Spacer(1, 12))
    
    # Analysis Results
    story.append(Paragraph("AI Analysis Results", styles['Heading2']))
    
    risk_level = analysis_results.get('risk_level', {})
    story.append(Paragraph(f"Risk Level: {risk_level.get('level', 'N/A')}", styles['Normal']))
    story.append(Paragraph(f"Risk Description: {risk_level.get('description', 'N/A')}", styles['Normal']))
    story.append(Spacer(1, 12))
    
    # Recommendations
    recommendations = analysis_results.get('recommendations', [])
    if recommendations:
        story.append(Paragraph("Recommendations", styles['Heading3']))
        for i, rec in enumerate(recommendations, 1):
            story.append(Paragraph(f"{i}. {rec.get('recommendation', '')}", styles['Normal']))
    
    story.append(Spacer(1, 12))
    
    # Footer
    footer_text = f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
    footer_text += "This report is for informational purposes only and should not replace professional medical advice."
    story.append(Paragraph(footer_text, styles['Normal']))
    
    doc.build(story)
    buffer.seek(0)
    return buffer

def send_assessment_email(assessment_record: dict, recipient_email: str) -> dict:
    """
    Send assessment report via email
    """
    # Mock email sending - in production, use actual SMTP settings
    try:
        # Generate PDF
        pdf_buffer = generate_assessment_pdf(assessment_record)
        
        # Create email message
        msg = MIMEMultipart()
        msg['From'] = "noreply@healthcare-ai.com"
        msg['To'] = recipient_email
        msg['Subject'] = "Your Health Assessment Report"
        
        # Email body
        body = """
        Dear Patient,
        
        Please find your health assessment report attached to this email.
        
        This report contains your AI-generated health analysis based on the information you provided.
        Please consult with a healthcare professional for proper medical advice.
        
        Best regards,
        AI Healthcare Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Attach PDF
        pdf_attachment = MIMEApplication(pdf_buffer.getvalue(), _subtype='pdf')
        pdf_attachment.add_header('Content-Disposition', 'attachment', filename='health-assessment-report.pdf')
        msg.attach(pdf_attachment)
        
        # In production, actually send the email
        # server = smtplib.SMTP('smtp.gmail.com', 587)
        # server.starttls()
        # server.login("your-email@gmail.com", "your-password")
        # text = msg.as_string()
        # server.sendmail("your-email@gmail.com", recipient_email, text)
        # server.quit()
        
        return {"status": "success", "message": "Email sent successfully (simulated)"}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

def generate_share_link(assessment_id: str) -> str:
    """
    Generate a secure shareable link for assessment
    """
    # In production, use proper token generation and storage
    share_token = base64.urlsafe_b64encode(f"{assessment_id}:{datetime.now().timestamp()}".encode()).decode()
    return f"/assessment/shared/{share_token}"

def decode_share_token(share_token: str) -> str:
    """
    Decode share token to get assessment ID
    """
    try:
        decoded = base64.urlsafe_b64decode(share_token.encode()).decode()
        assessment_id = decoded.split(':')[0]
        return assessment_id
    except Exception:
        raise ValueError("Invalid share token")

def sanitize_assessment_for_sharing(assessment_record: dict) -> dict:
    """
    Remove sensitive information from assessment for sharing
    """
    sanitized = assessment_record.copy()
    
    # Remove or mask sensitive data
    if 'assessment_data' in sanitized:
        assessment_data = sanitized['assessment_data']
        
        # Remove specific personal identifiers if needed
        if 'basicProfile' in assessment_data:
            basic_profile = assessment_data['basicProfile']
            # Keep medical info but remove specific personal details if needed
            pass
    
    return sanitized

@router.post("/health-assessment/{assessment_id}/save-profile")
async def save_to_profile(assessment_id: str):
    """
    Save assessment to user profile (mock implementation)
    """
    if assessment_id not in assessments_db:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    assessment_record = assessments_db[assessment_id]
    
    try:
        # In production, this would save to user's profile in database
        profile_data = {
            "assessment_id": assessment_id,
            "saved_at": datetime.now().isoformat(),
            "assessment_data": assessment_record["assessment_data"],
            "analysis_results": assessment_record["analysis_results"]
        }
        
        # Mock save to profile storage
        profile_key = f"profile_{assessment_id}_{datetime.now().timestamp()}"
        # In production: save profile_data to user's profile table
        
        return {
            "message": "Assessment saved to profile successfully",
            "profile_id": profile_key,
            "saved_at": profile_data["saved_at"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving to profile: {str(e)}")

@router.post("/health-assessment/save-progress")
async def save_assessment_progress(progress_data: Dict[str, Any]):
    """
    Save assessment progress for later completion
    """
    try:
        # Generate session ID for progress tracking
        session_id = str(uuid.uuid4())
        
        # Store progress data (in production, associate with user session)
        progress_record = {
            "session_id": session_id,
            "progress_data": progress_data,
            "saved_at": datetime.now(),
            "status": "in_progress"
        }
        
        # Store in temporary progress storage
        assessments_db[f"progress_{session_id}"] = progress_record
        
        return {
            "session_id": session_id,
            "status": "saved",
            "message": "Progress saved successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving progress: {str(e)}")

@router.get("/health-assessment/progress/{session_id}")
async def get_assessment_progress(session_id: str):
    """
    Retrieve saved assessment progress
    """
    progress_key = f"progress_{session_id}"
    
    if progress_key not in assessments_db:
        raise HTTPException(status_code=404, detail="Progress session not found")
    
    record = assessments_db[progress_key]
    
    return {
        "session_id": session_id,
        "progress_data": record["progress_data"],
        "saved_at": record["saved_at"],
        "status": record["status"]
    }

@router.get("/health-assessments/user/{user_id}")
async def get_user_assessments(user_id: str):
    """
    Get all assessments for a specific user (future enhancement)
    """
    # Filter assessments by user (mock implementation)
    user_assessments = [
        {
            "id": aid,
            "submitted_at": record["submitted_at"],
            "status": record["status"],
            "risk_level": record["analysis_results"]["risk_level"]["level"]
        }
        for aid, record in assessments_db.items()
        if not aid.startswith("progress_")
    ]
    
    return {
        "user_id": user_id,
        "assessments": user_assessments,
        "total_count": len(user_assessments)
    }

def store_medical_report(report: MedicalReport):
    """Store medical report - implement database and file storage"""
    pass