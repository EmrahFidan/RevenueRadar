"""
RevenueRadar API - B2B Lead Scoring Platform
Hybrid AI + Rule-based scoring system
Version 2.0
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from dotenv import load_dotenv
import os
import json
import io
import httpx
from datetime import datetime
import math

load_dotenv()

app = FastAPI(
    title="RevenueRadar API",
    description="B2B Lead Scoring Platform with Hybrid AI + Rule-based System",
    version="2.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# ============================================
# HYBRID SCORING SYSTEM
# ============================================

class ScoringWeights:
    """Scoring weights configuration - easily adjustable"""
    COMPANY_SIZE = 0.20          # 20% - Employee count & revenue
    ENGAGEMENT = 0.25            # 25% - Website visits, emails, downloads
    BUDGET_FIT = 0.15            # 15% - Budget range alignment
    DECISION_AUTHORITY = 0.15   # 15% - Decision maker level
    TIMELINE = 0.10              # 10% - Purchase urgency
    DATA_QUALITY = 0.10          # 10% - Email verified, LinkedIn, completeness
    BEHAVIORAL = 0.05            # 5% - Demo request, free trial

def calculate_company_size_score(employee_count: int, annual_revenue: float) -> float:
    """Score based on company size (employees + revenue)"""
    # Employee score (0-50 points)
    if employee_count >= 5000:
        emp_score = 50
    elif employee_count >= 1000:
        emp_score = 45
    elif employee_count >= 500:
        emp_score = 40
    elif employee_count >= 200:
        emp_score = 35
    elif employee_count >= 50:
        emp_score = 25
    elif employee_count >= 10:
        emp_score = 15
    else:
        emp_score = 5

    # Revenue score (0-50 points)
    if annual_revenue >= 100_000_000:
        rev_score = 50
    elif annual_revenue >= 50_000_000:
        rev_score = 45
    elif annual_revenue >= 10_000_000:
        rev_score = 40
    elif annual_revenue >= 5_000_000:
        rev_score = 30
    elif annual_revenue >= 1_000_000:
        rev_score = 20
    else:
        rev_score = 10

    return (emp_score + rev_score) / 100 * 100

def calculate_engagement_score(website_visits: int, emails_opened: int, content_downloads: int) -> float:
    """Score based on engagement metrics"""
    # Website visits (0-35 points)
    if website_visits >= 20:
        visit_score = 35
    elif website_visits >= 10:
        visit_score = 30
    elif website_visits >= 5:
        visit_score = 20
    elif website_visits >= 1:
        visit_score = 10
    else:
        visit_score = 0

    # Emails opened (0-35 points)
    if emails_opened >= 10:
        email_score = 35
    elif emails_opened >= 5:
        email_score = 28
    elif emails_opened >= 3:
        email_score = 20
    elif emails_opened >= 1:
        email_score = 10
    else:
        email_score = 0

    # Content downloads (0-30 points)
    if content_downloads >= 3:
        download_score = 30
    elif content_downloads >= 2:
        download_score = 22
    elif content_downloads >= 1:
        download_score = 15
    else:
        download_score = 0

    return (visit_score + email_score + download_score) / 100 * 100

def calculate_budget_score(budget_range: str) -> float:
    """Score based on indicated budget"""
    budget_scores = {
        "Over $1M": 100,
        "$500K - $1M": 90,
        "$100K - $500K": 75,
        "$50K - $100K": 55,
        "$10K - $50K": 35,
        "Under $10K": 15
    }
    return budget_scores.get(budget_range, 25)

def calculate_decision_authority_score(authority: str, job_title: str) -> float:
    """Score based on decision-making power"""
    authority_scores = {
        "Final Decision Maker": 100,
        "Key Influencer": 75,
        "Evaluator": 50,
        "End User": 25
    }
    base_score = authority_scores.get(authority, 40)

    c_level_titles = ["CEO", "CTO", "CFO", "COO", "CMO", "CIO"]
    vp_titles = ["VP", "Vice President", "Director", "Head of"]

    title_upper = job_title.upper() if job_title else ""

    if any(title in title_upper for title in c_level_titles):
        base_score = min(100, base_score + 15)
    elif any(title in title_upper for title in vp_titles):
        base_score = min(100, base_score + 10)

    return base_score

def calculate_timeline_score(timeline: str) -> float:
    """Score based on purchase timeline"""
    timeline_scores = {
        "Immediate (< 1 month)": 100,
        "Short-term (1-3 months)": 80,
        "Medium-term (3-6 months)": 55,
        "Long-term (6-12 months)": 30,
        "Just researching": 10
    }
    return timeline_scores.get(timeline, 25)

def calculate_data_quality_score(email_verified: bool, has_linkedin: bool, lead_data: dict) -> float:
    """Score based on data completeness and quality"""
    score = 0

    if email_verified:
        score += 30
    if has_linkedin:
        score += 20

    important_fields = ['company_name', 'contact_email', 'job_title', 'industry', 'employee_count']
    filled_fields = sum(1 for field in important_fields if lead_data.get(field) and str(lead_data.get(field)).strip())
    completeness_score = (filled_fields / len(important_fields)) * 50
    score += completeness_score

    return score

def calculate_behavioral_score(demo_requested: bool, free_trial: bool) -> float:
    """Score based on high-intent behaviors"""
    score = 0
    if demo_requested:
        score += 60
    if free_trial:
        score += 40
    return min(score, 100)

def calculate_rule_based_score(lead: dict) -> tuple:
    """Calculate the rule-based component of the hybrid score"""
    breakdown = {}

    employee_count = int(lead.get('employee_count', 0) or 0)
    annual_revenue = float(lead.get('annual_revenue_usd', 0) or 0)
    company_score = calculate_company_size_score(employee_count, annual_revenue)
    breakdown['company_size'] = round(company_score, 1)

    website_visits = int(lead.get('website_visits', 0) or 0)
    emails_opened = int(lead.get('emails_opened', 0) or 0)
    content_downloads = int(lead.get('content_downloads', 0) or 0)
    engagement_score = calculate_engagement_score(website_visits, emails_opened, content_downloads)
    breakdown['engagement'] = round(engagement_score, 1)

    budget_range = lead.get('budget_range', '')
    budget_score = calculate_budget_score(budget_range)
    breakdown['budget_fit'] = round(budget_score, 1)

    authority = lead.get('decision_authority', '')
    job_title = lead.get('job_title', '')
    authority_score = calculate_decision_authority_score(authority, job_title)
    breakdown['decision_authority'] = round(authority_score, 1)

    timeline = lead.get('purchase_timeline', '')
    timeline_score = calculate_timeline_score(timeline)
    breakdown['timeline'] = round(timeline_score, 1)

    email_verified = lead.get('email_verified', False)
    if isinstance(email_verified, str):
        email_verified = email_verified.lower() == 'true'
    has_linkedin = lead.get('has_linkedin_profile', False)
    if isinstance(has_linkedin, str):
        has_linkedin = has_linkedin.lower() == 'true'
    data_quality_score = calculate_data_quality_score(email_verified, has_linkedin, lead)
    breakdown['data_quality'] = round(data_quality_score, 1)

    demo_requested = lead.get('demo_requested', False)
    if isinstance(demo_requested, str):
        demo_requested = demo_requested.lower() == 'true'
    free_trial = lead.get('free_trial_signup', False)
    if isinstance(free_trial, str):
        free_trial = free_trial.lower() == 'true'
    behavioral_score = calculate_behavioral_score(demo_requested, free_trial)
    breakdown['behavioral'] = round(behavioral_score, 1)

    total_score = (
        company_score * ScoringWeights.COMPANY_SIZE +
        engagement_score * ScoringWeights.ENGAGEMENT +
        budget_score * ScoringWeights.BUDGET_FIT +
        authority_score * ScoringWeights.DECISION_AUTHORITY +
        timeline_score * ScoringWeights.TIMELINE +
        data_quality_score * ScoringWeights.DATA_QUALITY +
        behavioral_score * ScoringWeights.BEHAVIORAL
    )

    return round(total_score, 1), breakdown

# ============================================
# AI FUNCTIONS
# ============================================

async def call_groq(prompt: str) -> str:
    """Call Groq API"""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {
                "role": "system",
                "content": """You are an expert B2B sales analyst. Analyze leads and provide:
1. Detailed reasoning for the score
2. Specific, actionable recommendations as bullet points
3. Professional insights based on the data
Always respond in valid JSON format. Use English language only."""
            },
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 8192
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(GROQ_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]

def clean_json_response(text: str) -> str:
    """Clean AI response to extract valid JSON"""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/")
async def root():
    return {
        "message": "RevenueRadar API is running",
        "version": "2.0",
        "features": ["Hybrid Scoring", "Excel Export", "Bulk Email", "CRM Integration"]
    }

@app.post("/analyze")
async def analyze_leads(file: UploadFile = File(...)):
    """Analyze leads with Hybrid Scoring: 60% Rule-based + 40% AI adjustment"""
    try:
        contents = await file.read()

        if file.filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(contents))
        elif file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Only .xlsx and .csv files are supported")

        # Replace NaN/inf values with defaults
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.fillna('')

        # Convert numeric columns
        numeric_cols = ['employee_count', 'annual_revenue_usd', 'website_visits', 'emails_opened', 'content_downloads']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)

        leads_data = df.to_dict(orient='records')

        # Clean any remaining NaN/inf in dict values
        def clean_value(v):
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                return 0
            return v

        leads_data = [{k: clean_value(v) for k, v in lead.items()} for lead in leads_data]

        # Calculate rule-based scores
        scored_leads = []
        for lead in leads_data:
            rule_score, breakdown = calculate_rule_based_score(lead)
            lead['rule_based_score'] = rule_score
            lead['score_breakdown'] = breakdown
            scored_leads.append(lead)

        # AI analysis for top leads (limit to avoid timeout)
        leads_for_ai = scored_leads[:30]

        prompt = f"""Analyze these B2B leads. I've calculated rule-based scores.

For each lead, provide:
1. AI score adjustment (-15 to +15 based on qualitative factors)
2. Detailed reason (2-3 sentences)
3. Action items as bullet points (4-5 specific actions)

Lead Data:
{json.dumps(leads_for_ai, ensure_ascii=False, default=str)}

Respond with JSON array:
[{{"lead_id": "<id>", "ai_adjustment": <-15 to 15>, "reason": "<explanation>", "actions": ["action1", "action2", "action3", "action4"]}}]

Actions should be very specific like:
- "Schedule discovery call within 24 hours - they have immediate purchase timeline"
- "Send case study from their industry sector to demonstrate relevant experience"
- "Connect on LinkedIn to build relationship with decision maker"
- "Prepare ROI calculator based on their budget range" """

        try:
            ai_response = await call_groq(prompt)
            ai_response = clean_json_response(ai_response)
            ai_results = json.loads(ai_response)
        except:
            ai_results = []

        ai_lookup = {}
        for result in ai_results:
            lead_id = result.get('lead_id', '')
            if lead_id:
                ai_lookup[str(lead_id)] = result

        # Build final results
        final_results = []
        for i, lead in enumerate(scored_leads):
            lead_id = lead.get('lead_id', str(i))
            ai_data = ai_lookup.get(str(lead_id), ai_lookup.get(str(i), {}))
            ai_adjustment = max(-15, min(15, ai_data.get('ai_adjustment', 0)))

            rule_score = lead['rule_based_score']
            final_score = round(min(100, max(0, rule_score + ai_adjustment)))

            customer_name = lead.get('company_name', '')
            if not customer_name:
                first_name = lead.get('contact_first_name', '')
                last_name = lead.get('contact_last_name', '')
                customer_name = f"{first_name} {last_name}".strip() or f"Lead {i+1}"

            reason = ai_data.get('reason', f"Score based on: Company size ({lead['score_breakdown'].get('company_size', 0)}), Engagement ({lead['score_breakdown'].get('engagement', 0)}), Budget fit ({lead['score_breakdown'].get('budget_fit', 0)})")

            actions = ai_data.get('actions', [])
            if not actions:
                if final_score >= 80:
                    actions = [
                        "Schedule discovery call within 24-48 hours",
                        "Prepare customized demo based on their industry",
                        "Research their current tech stack and pain points",
                        "Identify additional stakeholders for multi-threading",
                        "Prepare ROI analysis based on their company size"
                    ]
                elif final_score >= 60:
                    actions = [
                        "Send personalized follow-up email with relevant case study",
                        "Schedule introductory call within 1 week",
                        "Add to nurture campaign with industry-specific content",
                        "Monitor engagement for buying signals"
                    ]
                else:
                    actions = [
                        "Add to automated nurture sequence",
                        "Monitor engagement metrics for future interest",
                        "Re-evaluate lead status in 30 days"
                    ]

            result = {
                "customer_name": customer_name,
                "score": final_score,
                "rule_based_score": rule_score,
                "ai_adjustment": ai_adjustment,
                "reason": reason,
                "actions": actions,
                "score_breakdown": lead['score_breakdown'],
                "lead_data": {
                    "lead_id": lead.get('lead_id', ''),
                    "company_name": lead.get('company_name', ''),
                    "industry": lead.get('industry', ''),
                    "country": lead.get('country', ''),
                    "city": lead.get('city', ''),
                    "employee_count": lead.get('employee_count', 0),
                    "annual_revenue": lead.get('annual_revenue_usd', 0),
                    "contact_name": f"{lead.get('contact_first_name', '')} {lead.get('contact_last_name', '')}".strip(),
                    "contact_email": lead.get('contact_email', ''),
                    "contact_phone": lead.get('contact_phone', ''),
                    "job_title": lead.get('job_title', ''),
                    "budget_range": lead.get('budget_range', ''),
                    "purchase_timeline": lead.get('purchase_timeline', ''),
                    "lead_source": lead.get('lead_source', ''),
                    "pain_points": lead.get('pain_points', ''),
                    "current_solution": lead.get('current_solution', ''),
                    "demo_requested": lead.get('demo_requested', False),
                    "free_trial": lead.get('free_trial_signup', False)
                }
            }
            final_results.append(result)

        final_results.sort(key=lambda x: x['score'], reverse=True)

        return {
            "results": final_results,
            "summary": {
                "total_leads": len(final_results),
                "hot_leads": len([r for r in final_results if r['score'] >= 80]),
                "warm_leads": len([r for r in final_results if 60 <= r['score'] < 80]),
                "cold_leads": len([r for r in final_results if r['score'] < 60]),
                "average_score": round(sum(r['score'] for r in final_results) / len(final_results), 1) if final_results else 0
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/draft-email")
async def draft_email(
    customer_name: str = Query(...),
    company: str = Query(default=""),
    reason: str = Query(default=""),
    email_type: str = Query(default="initial_outreach")
):
    """Generate professional, well-formatted sales email"""
    prompt = f"""Create a professional B2B sales email for {customer_name}.

Company: {company}
Context: {reason}

Write a compelling sales email with:
1. Catchy subject line
2. Professional greeting
3. Personalized opening paragraph
4. Value proposition paragraph
5. Call to action paragraph
6. Professional closing

Respond ONLY with valid JSON (no markdown, no extra text):
{{"subject": "your subject here", "body": "Dear [Name],\\n\\nFirst paragraph...\\n\\nSecond paragraph...\\n\\nThird paragraph...\\n\\nBest regards,\\n[Your name]"}}"""

    try:
        ai_response = await call_groq(prompt)
        ai_response = clean_json_response(ai_response)

        # Try to parse JSON
        try:
            email_data = json.loads(ai_response)
            subject = email_data.get("subject", f"Partnership Opportunity for {customer_name}")
            body = email_data.get("body", "")
        except json.JSONDecodeError:
            # If JSON parsing fails, use the raw response as body
            subject = f"Partnership Opportunity for {customer_name}"
            body = ai_response

        # Ensure we have content
        if not body:
            body = f"""Dear {customer_name},

I hope this email finds you well. I wanted to reach out regarding a potential partnership opportunity that could benefit {company or 'your organization'}.

{reason}

Based on your company's profile, I believe we could provide significant value in helping you achieve your business objectives. Our solutions have helped similar organizations improve their operations and drive growth.

I would love to schedule a brief call to discuss how we might work together. Would you have 15-20 minutes available this week?

Looking forward to connecting.

Best regards,
Sales Team"""

        return {
            "subject": subject,
            "body": body,
            "customer_name": customer_name
        }
    except Exception as e:
        # Fallback email if AI fails completely
        return {
            "subject": f"Partnership Opportunity for {customer_name}",
            "body": f"""Dear {customer_name},

I hope this email finds you well. I wanted to reach out regarding a potential partnership opportunity.

{reason if reason else 'Based on your company profile, I believe we could provide significant value to your organization.'}

I would love to schedule a brief call to discuss how we might work together. Would you have 15-20 minutes available this week?

Looking forward to connecting.

Best regards,
Sales Team""",
            "customer_name": customer_name
        }

class BulkEmailRequest(BaseModel):
    leads: List[dict]

@app.post("/draft-bulk-emails")
async def draft_bulk_emails(request: BulkEmailRequest):
    """Generate emails for multiple leads"""
    results = []
    for lead in request.leads[:10]:
        try:
            customer_name = lead.get('customer_name', 'Valued Customer')
            company_info = f"Company: {lead.get('lead_data', {}).get('company_name', 'N/A')}, Industry: {lead.get('lead_data', {}).get('industry', 'N/A')}"
            email = await draft_email(customer_name, company_info, lead.get('reason', ''))
            results.append({"customer_name": customer_name, "email": email, "status": "success"})
        except Exception as e:
            results.append({"customer_name": lead.get('customer_name', ''), "status": "failed", "error": str(e)})

    return {"results": results, "total": len(results)}

class ExportRequest(BaseModel):
    results: List[dict]

@app.post("/export-excel")
async def export_to_excel(request: ExportRequest):
    """Export analyzed leads to Excel"""
    try:
        export_data = []
        for lead in request.results:
            lead_data = lead.get('lead_data', {})
            export_row = {
                "Company Name": lead.get('customer_name', ''),
                "Final Score": lead.get('score', 0),
                "Status": "Hot" if lead.get('score', 0) >= 80 else "Warm" if lead.get('score', 0) >= 60 else "Cold",
                "Rule-Based Score": lead.get('rule_based_score', 0),
                "AI Adjustment": lead.get('ai_adjustment', 0),
                "Industry": lead_data.get('industry', ''),
                "Country": lead_data.get('country', ''),
                "Employee Count": lead_data.get('employee_count', 0),
                "Contact Name": lead_data.get('contact_name', ''),
                "Contact Email": lead_data.get('contact_email', ''),
                "Job Title": lead_data.get('job_title', ''),
                "Budget Range": lead_data.get('budget_range', ''),
                "Timeline": lead_data.get('purchase_timeline', ''),
                "Reason": lead.get('reason', ''),
                "Actions": " | ".join(lead.get('actions', []))
            }
            export_data.append(export_row)

        df = pd.DataFrame(export_data)
        output = io.BytesIO()

        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Leads Analysis')

        output.seek(0)
        filename = f"revenueradar_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

class CRMExportRequest(BaseModel):
    leads: List[dict]
    crm_type: str

@app.post("/export-crm")
async def export_to_crm(request: CRMExportRequest):
    """Prepare data for CRM export (HubSpot or Salesforce format)"""
    try:
        crm_data = []
        for lead in request.leads:
            lead_data = lead.get('lead_data', {})

            if request.crm_type == "hubspot":
                crm_record = {
                    "properties": {
                        "company": lead.get('customer_name', ''),
                        "email": lead_data.get('contact_email', ''),
                        "phone": lead_data.get('contact_phone', ''),
                        "jobtitle": lead_data.get('job_title', ''),
                        "industry": lead_data.get('industry', ''),
                        "city": lead_data.get('city', ''),
                        "country": lead_data.get('country', ''),
                        "numberofemployees": str(lead_data.get('employee_count', '')),
                        "hs_lead_status": "NEW" if lead.get('score', 0) >= 80 else "OPEN",
                        "lead_score": str(lead.get('score', 0))
                    }
                }
            else:
                crm_record = {
                    "Company": lead.get('customer_name', ''),
                    "Email": lead_data.get('contact_email', ''),
                    "Phone": lead_data.get('contact_phone', ''),
                    "Title": lead_data.get('job_title', ''),
                    "Industry": lead_data.get('industry', ''),
                    "NumberOfEmployees": lead_data.get('employee_count', 0),
                    "Status": "Hot" if lead.get('score', 0) >= 80 else "Warm" if lead.get('score', 0) >= 60 else "Cold",
                    "LeadScore__c": lead.get('score', 0)
                }
            crm_data.append(crm_record)

        return {"crm_type": request.crm_type, "records": crm_data, "total": len(crm_data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CRM export failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}
