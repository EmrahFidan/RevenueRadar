# RevenueRadar

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
</p>

<p align="center">
  <strong>AI-Powered B2B Lead Scoring Platform</strong>
</p>

<p align="center">
  Hybrid scoring system combining rule-based algorithms with AI analysis to identify and prioritize your hottest sales leads.
</p>

---

## Overview

RevenueRadar transforms raw lead data into actionable sales intelligence. Upload your Excel or CSV files and get instant AI-powered scoring with specific action recommendations for each lead.

### Key Features

- **Hybrid Scoring Engine** - 60% rule-based scoring + 40% AI adjustment for optimal accuracy
- **7-Factor Analysis** - Company size, engagement, budget, authority, timeline, data quality, behavioral signals
- **AI Email Generation** - Personalized outreach drafts using Llama 3.3 70B
- **Excel Export** - Download scored leads with full analysis
- **CRM Ready** - Export in HubSpot and Salesforce compatible formats

---

## Screenshots

<p align="center">
  <i>Upload interface with drag-and-drop support</i>
</p>

<p align="center">
  <i>Results dashboard with filtering and search</i>
</p>

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI Framework |
| TypeScript | 5.9 | Type Safety |
| Vite | 7.2 | Build Tool |
| Tailwind CSS | 4.1 | Styling |
| Radix UI | Latest | Accessible Components |
| Lucide | Latest | Icons |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | Latest | API Framework |
| Python | 3.10+ | Runtime |
| Pandas | Latest | Data Processing |
| OpenPyXL | Latest | Excel Handling |
| HTTPX | Latest | Async HTTP Client |

### AI/ML
| Service | Model | Purpose |
|---------|-------|---------|
| Groq API | Llama 3.3 70B | Lead Analysis & Email Generation |

---

## Architecture

```
                    +------------------+
                    |   React Frontend |
                    |   (TypeScript)   |
                    +--------+---------+
                             |
                             | REST API
                             v
                    +--------+---------+
                    |  FastAPI Backend |
                    |    (Python)      |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
     +--------+--------+          +---------+--------+
     | Rule-Based      |          |   Groq API       |
     | Scoring Engine  |          |   (Llama 3.3)    |
     | (7 Factors)     |          |                  |
     +-----------------+          +------------------+

```

### Scoring Algorithm

```python
Final Score = Rule-Based Score + AI Adjustment (-15 to +15)

Rule-Based Weights:
- Company Size:      20%  (employees + revenue)
- Engagement:        25%  (visits, emails, downloads)
- Budget Fit:        15%  (budget range alignment)
- Decision Authority: 15%  (role + title analysis)
- Timeline:          10%  (purchase urgency)
- Data Quality:      10%  (verification status)
- Behavioral:         5%  (demo/trial requests)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Groq API Key ([Get one here](https://console.groq.com))

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Run server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env

# Run development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze` | Upload and analyze leads file |
| `POST` | `/draft-email` | Generate email for single lead |
| `POST` | `/draft-bulk-emails` | Generate emails for multiple leads |
| `POST` | `/export-excel` | Export results to Excel |
| `POST` | `/export-crm` | Export in CRM format |
| `GET` | `/health` | Health check |

### Sample Request

```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@leads.xlsx"
```

---

## Lead Data Format

Your Excel/CSV file should include these columns:

| Column | Type | Description |
|--------|------|-------------|
| `lead_id` | string | Unique identifier |
| `company_name` | string | Company name |
| `industry` | string | Industry sector |
| `employee_count` | number | Number of employees |
| `annual_revenue_usd` | number | Annual revenue in USD |
| `contact_email` | string | Contact email |
| `job_title` | string | Contact's job title |
| `decision_authority` | string | Final Decision Maker / Key Influencer / Evaluator / End User |
| `budget_range` | string | Under $10K / $10K-$50K / $50K-$100K / $100K-$500K / $500K-$1M / Over $1M |
| `purchase_timeline` | string | Immediate / Short-term / Medium-term / Long-term / Just researching |
| `website_visits` | number | Number of website visits |
| `emails_opened` | number | Marketing emails opened |
| `demo_requested` | boolean | Has requested demo |

---

## Project Structure

```
revenueradar/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment template
│   └── generate_sample_data.py  # Test data generator
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main application
│   │   ├── components/      # UI components
│   │   │   ├── ResultsTable.tsx
│   │   │   └── ui/          # Reusable UI components
│   │   ├── services/
│   │   │   └── api.ts       # API client
│   │   └── lib/
│   │       └── utils.ts     # Utility functions
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build
vercel deploy
```

### Backend (Railway/Render)

1. Create new project
2. Connect GitHub repository
3. Set environment variables:
   - `GROQ_API_KEY`
4. Deploy

### Environment Variables

**Backend:**
```env
GROQ_API_KEY=your_groq_api_key_here
```

**Frontend:**
```env
VITE_API_URL=https://your-backend-url.com
```

---

## Future Roadmap

- [ ] User authentication
- [ ] Lead database persistence
- [ ] Historical scoring trends
- [ ] Custom scoring weight configuration
- [ ] Direct CRM API integration
- [ ] Team collaboration features
- [ ] Lead enrichment via external APIs

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Author

**Emrah Fidan**

- Portfolio: [emrah-fidan.netlify.app](https://emrah-fidan.netlify.app)
- GitHub: [@EmrahFidan](https://github.com/EmrahFidan)

---

<p align="center">
  <strong>Stop guessing. Find your hottest leads.</strong>
</p>
