"""
Generate 100 sample B2B leads for RevenueRadar testing
"""
import pandas as pd
import random
from datetime import datetime, timedelta

# Company data pools
company_prefixes = [
    "Tech", "Global", "Digital", "Smart", "Cloud", "Data", "Cyber", "Net", "Web", "App",
    "Info", "Soft", "Mega", "Ultra", "Prime", "Elite", "Pro", "Max", "Core", "Next",
    "Future", "Modern", "Advanced", "Dynamic", "Innovative", "Strategic", "Premier", "Alpha", "Beta", "Omega"
]

company_suffixes = [
    "Solutions", "Systems", "Technologies", "Industries", "Dynamics", "Innovations", "Enterprises",
    "Corp", "Inc", "Group", "Holdings", "Partners", "Consulting", "Services", "Labs", "Works",
    "Ventures", "Networks", "Digital", "Analytics", "AI", "Software", "Cloud", "Tech", "Data"
]

industries = [
    "Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Education",
    "Real Estate", "Logistics", "Energy", "Telecommunications", "Media", "Automotive",
    "Aerospace", "Pharmaceuticals", "Insurance", "Banking", "E-commerce", "SaaS",
    "Cybersecurity", "Fintech", "Healthtech", "Edtech", "Cleantech", "Biotech"
]

countries = [
    ("United States", ["New York", "San Francisco", "Los Angeles", "Chicago", "Boston", "Seattle", "Austin", "Miami", "Denver", "Atlanta"]),
    ("United Kingdom", ["London", "Manchester", "Birmingham", "Edinburgh", "Bristol"]),
    ("Germany", ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"]),
    ("Canada", ["Toronto", "Vancouver", "Montreal", "Calgary"]),
    ("Australia", ["Sydney", "Melbourne", "Brisbane", "Perth"]),
    ("France", ["Paris", "Lyon", "Marseille"]),
    ("Netherlands", ["Amsterdam", "Rotterdam", "Utrecht"]),
    ("Singapore", ["Singapore"]),
    ("Japan", ["Tokyo", "Osaka", "Yokohama"]),
    ("UAE", ["Dubai", "Abu Dhabi"])
]

job_titles = [
    "CEO", "CTO", "CFO", "COO", "CMO", "CIO", "VP of Sales", "VP of Marketing",
    "VP of Engineering", "VP of Operations", "Director of IT", "Director of Sales",
    "Director of Marketing", "Director of Business Development", "Head of Procurement",
    "Head of Digital Transformation", "Senior Manager", "Product Manager", "IT Manager",
    "Procurement Manager", "Operations Manager", "Business Development Manager"
]

lead_sources = [
    "Website Form", "LinkedIn", "Trade Show", "Referral", "Cold Outreach",
    "Webinar", "Content Download", "Free Trial", "Demo Request", "Partner",
    "Google Ads", "Social Media", "Email Campaign", "Industry Event", "Conference"
]

first_names = [
    "James", "Michael", "Robert", "David", "William", "Richard", "Joseph", "Thomas", "Christopher", "Daniel",
    "Sarah", "Jennifer", "Emily", "Jessica", "Amanda", "Ashley", "Stephanie", "Nicole", "Elizabeth", "Michelle",
    "Alexander", "Benjamin", "Charles", "Edward", "George", "Henry", "Jack", "Oliver", "Samuel", "Victoria",
    "Emma", "Olivia", "Sophia", "Isabella", "Charlotte", "Amelia", "Harper", "Evelyn", "Abigail", "Mia"
]

last_names = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris",
    "Clark", "Lewis", "Walker", "Hall", "Young", "Allen", "King", "Wright", "Scott", "Green",
    "Baker", "Adams", "Nelson", "Hill", "Campbell", "Mitchell", "Roberts", "Carter", "Phillips", "Evans"
]

def generate_company_name():
    return f"{random.choice(company_prefixes)}{random.choice(company_suffixes)}"

def generate_email(first_name, last_name, company):
    domain = company.lower().replace(" ", "") + ".com"
    formats = [
        f"{first_name.lower()}.{last_name.lower()}@{domain}",
        f"{first_name[0].lower()}{last_name.lower()}@{domain}",
        f"{first_name.lower()}@{domain}",
    ]
    return random.choice(formats)

def generate_phone(country):
    if country == "United States":
        return f"+1 ({random.randint(200,999)}) {random.randint(200,999)}-{random.randint(1000,9999)}"
    elif country == "United Kingdom":
        return f"+44 {random.randint(20,79)} {random.randint(1000,9999)} {random.randint(1000,9999)}"
    elif country == "Germany":
        return f"+49 {random.randint(30,89)} {random.randint(10000000,99999999)}"
    else:
        return f"+{random.randint(1,99)} {random.randint(100,999)} {random.randint(1000000,9999999)}"

def generate_leads(n=100):
    leads = []

    for i in range(n):
        country, cities = random.choice(countries)
        city = random.choice(cities)
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        company = generate_company_name()

        # Employee count with realistic distribution
        employee_ranges = [
            (1, 10, 0.15),      # Small startup
            (11, 50, 0.20),     # Small business
            (51, 200, 0.25),    # Medium business
            (201, 500, 0.20),   # Mid-market
            (501, 1000, 0.10),  # Upper mid-market
            (1001, 5000, 0.07), # Enterprise
            (5001, 50000, 0.03) # Large enterprise
        ]

        range_choice = random.choices(employee_ranges, weights=[r[2] for r in employee_ranges])[0]
        employee_count = random.randint(range_choice[0], range_choice[1])

        # Annual revenue based on employee count (rough estimate)
        revenue_per_employee = random.randint(80000, 300000)
        annual_revenue = employee_count * revenue_per_employee

        # Budget indication
        budget_ranges = [
            ("Under $10K", 0.20),
            ("$10K - $50K", 0.30),
            ("$50K - $100K", 0.25),
            ("$100K - $500K", 0.15),
            ("$500K - $1M", 0.07),
            ("Over $1M", 0.03)
        ]
        budget = random.choices([b[0] for b in budget_ranges], weights=[b[1] for b in budget_ranges])[0]

        # Engagement metrics
        website_visits = random.choices(
            [0, random.randint(1, 5), random.randint(6, 15), random.randint(16, 50)],
            weights=[0.3, 0.35, 0.25, 0.1]
        )[0]

        emails_opened = random.choices(
            [0, random.randint(1, 3), random.randint(4, 8), random.randint(9, 15)],
            weights=[0.25, 0.40, 0.25, 0.10]
        )[0]

        content_downloads = random.choices(
            [0, 1, 2, random.randint(3, 5)],
            weights=[0.40, 0.30, 0.20, 0.10]
        )[0]

        demo_requested = random.choices([True, False], weights=[0.15, 0.85])[0]
        free_trial = random.choices([True, False], weights=[0.10, 0.90])[0]

        # Timeline
        timeline_options = [
            ("Immediate (< 1 month)", 0.10),
            ("Short-term (1-3 months)", 0.25),
            ("Medium-term (3-6 months)", 0.35),
            ("Long-term (6-12 months)", 0.20),
            ("Just researching", 0.10)
        ]
        purchase_timeline = random.choices([t[0] for t in timeline_options], weights=[t[1] for t in timeline_options])[0]

        # Decision maker level
        decision_authority = random.choices(
            ["Final Decision Maker", "Key Influencer", "Evaluator", "End User"],
            weights=[0.15, 0.30, 0.35, 0.20]
        )[0]

        # Lead quality indicators
        has_linkedin = random.choices([True, False], weights=[0.70, 0.30])[0]
        verified_email = random.choices([True, False], weights=[0.80, 0.20])[0]

        # Days since first contact
        days_since_contact = random.randint(1, 180)
        first_contact_date = (datetime.now() - timedelta(days=days_since_contact)).strftime("%Y-%m-%d")

        # Last activity
        last_activity_days = random.randint(0, min(days_since_contact, 60))
        last_activity_date = (datetime.now() - timedelta(days=last_activity_days)).strftime("%Y-%m-%d")

        # Pain points / interests
        pain_points = random.sample([
            "Cost Reduction", "Efficiency Improvement", "Digital Transformation",
            "Data Analytics", "Customer Experience", "Security & Compliance",
            "Scalability", "Automation", "Integration", "Reporting"
        ], k=random.randint(1, 3))

        # Competition
        using_competitor = random.choices([True, False], weights=[0.40, 0.60])[0]
        competitor_names = ["Competitor A", "Competitor B", "Competitor C", "None", "Unknown"]
        current_solution = random.choice(competitor_names) if using_competitor else random.choice(["None", "In-house solution", "Unknown"])

        # Notes
        notes_options = [
            "Very interested in enterprise features",
            "Needs integration with existing CRM",
            "Budget approved for Q2",
            "Looking to replace current solution",
            "Referred by existing customer",
            "Met at industry conference",
            "Downloaded pricing guide",
            "Attended product webinar",
            "Requested custom demo",
            "Multiple stakeholders involved",
            "Fast-growing company",
            "Recent funding round",
            "Expanding to new markets",
            "Compliance requirements",
            ""
        ]
        notes = random.choice(notes_options)

        lead = {
            "lead_id": f"LD-{10000 + i}",
            "company_name": company,
            "industry": random.choice(industries),
            "country": country,
            "city": city,
            "employee_count": employee_count,
            "annual_revenue_usd": annual_revenue,
            "contact_first_name": first_name,
            "contact_last_name": last_name,
            "contact_email": generate_email(first_name, last_name, company),
            "contact_phone": generate_phone(country),
            "job_title": random.choice(job_titles),
            "decision_authority": decision_authority,
            "lead_source": random.choice(lead_sources),
            "budget_range": budget,
            "purchase_timeline": purchase_timeline,
            "website_visits": website_visits,
            "emails_opened": emails_opened,
            "content_downloads": content_downloads,
            "demo_requested": demo_requested,
            "free_trial_signup": free_trial,
            "has_linkedin_profile": has_linkedin,
            "email_verified": verified_email,
            "current_solution": current_solution,
            "pain_points": ", ".join(pain_points),
            "first_contact_date": first_contact_date,
            "last_activity_date": last_activity_date,
            "notes": notes
        }

        leads.append(lead)

    return pd.DataFrame(leads)

if __name__ == "__main__":
    # Generate 100 leads
    df = generate_leads(100)

    # Save to Excel
    output_path = "sample_leads_100.xlsx"
    df.to_excel(output_path, index=False, sheet_name="Leads")

    print(f"Generated {len(df)} leads")
    print(f"Saved to: {output_path}")
    print(f"\nColumns: {list(df.columns)}")
    print(f"\nSample lead:")
    print(df.iloc[0].to_dict())
