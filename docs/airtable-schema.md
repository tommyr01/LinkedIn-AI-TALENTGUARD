# Airtable Base Schema

**Base ID:** `appzgiUWBCdh58x00`

This document lists every table and field (with Airtable data-type) that exists in the TalentGuard Buyer-Intelligence Airtable base.  Use it as the single source of truth when creating Postgres / Supabase tables or writing data-migration scripts.

---

## 1. Company  (`tblJOd8XlW2sT0BQ6`)
| # | Field | Airtable Type |
|---|-------|---------------|
| 1 | Name | singleLineText |
| 2 | Domain | url |
| 3 | Industry | singleLineText |
| 4 | TG Customer? | checkbox |
| 5 | Current News | multilineText |
| 6 | Last Signal Date | date |
| 7 | Contacts | multipleRecordLinks → **Contacts** |
| 8 | Total Contacts | count (lookup) |
| 9 | Recent Signal Type | multipleLookupValues (→ Signals.Type) |
|10 | Signals | multipleRecordLinks → **Signals** |
|11 | Industry Insights | aiText |
|12 | Tasks | multipleRecordLinks → **Tasks** |
|13 | Research | multipleRecordLinks → **Research** |
|14 | Opportunities | multipleRecordLinks → **Opportunities** |
|15 | Company Insights | multipleRecordLinks → **Insights** |
|16 | Description (from Company Insights) | multipleLookupValues |
|17 | Direct Quotes (from Company Insights) | multipleLookupValues |

---

## 2. Contacts  (`tbl78hVAHK199cm3o`)
| # | Field | Airtable Type |
|---|-------|---------------|
| 1 | Name | singleLineText |
| 2 | Title | singleLineText |
| 3 | Email | singleLineText |
| 4 | LinkedIn URL | singleLineText |
| 5 | Role Category | singleLineText |
| 6 | Account | multipleRecordLinks → **Company** |
| 7 | Signals | multipleRecordLinks → **Signals** |
| 8 | Total Signals | count |
| 9 | Latest Signal Date | rollup |
|10 | Signal Summary | aiText |
|11 | Role Impact Score | aiText |
|12 | Tasks | multipleRecordLinks → **Tasks** |
|13 | Research | multipleRecordLinks → **Research** |

---

## 3. Signals  (`tblwrCTx3MULl71uS`)
| # | Field | Airtable Type |
|---|-------|---------------|
| 1 | Source URL | singleLineText |
| 2 | Date | date |
| 3 | Type | singleSelect {News, LinkedIn Post, Job Change, Funding, Other} |
| 4 | Summary | multilineText |
| 5 | Linked Contact | multipleRecordLinks → **Contacts** |
| 6 | Linked Account | multipleRecordLinks → **Company** |
| 7 | Days Since Signal | formula |
| 8 | Signal Impact | aiText |
| 9 | Signal Sentiment | aiText |

---

## 4. Tasks  (`tbl7QneKQyiqAcN8B`)
| # | Field | Airtable Type |
|---|-------|---------------|
| 1 | Task Name | singleLineText |
| 2 | Task Type | singleSelect {Email, Call, PDF Sent, Follow-Up, Other} |
| 3 | Status | singleSelect {To Do, In Progress, Done} |
| 4 | Due Date | date |
| 5 | Owner | singleLineText |
| 6 | Related Account | multipleRecordLinks → **Company** |
| 7 | Related Contact | multipleRecordLinks → **Contacts** |
| 8 | Days Until Due | formula |
| 9 | Account Engagement Score | multipleLookupValues |
|10 | Contact Role Category | multipleLookupValues |
|11 | Task Priority | aiText |
|12 | Suggested Next Action | aiText |

---

## 5. Research  (`tblM7imDwQjjh7F54`)
| # | Field | Airtable Type |
|---|-------|---------------|
| 1 | Research ID | autoNumber |
| 2 | Account | multipleRecordLinks → **Company** |
| 3 | Contact | multipleRecordLinks → **Contacts** |
| 4 | Topic | singleSelect {Succession, Mobility, UI Pain, Reporting Bug, Strategic Use-Case, Other} |
| 5 | Summary | richText |
| 6 | Source URL | url |
| 7 | Insight Bullets | multilineText |
| 8 | Created Date | createdTime |
| 9 | Opportunities | multipleRecordLinks → **Opportunities** |
|10 | Insights | multipleRecordLinks → **Insights** |
|11 | Title | singleLineText |
|12 | Executive Summary | richText |
|13 | PDF / Deck | multipleAttachments |
|14 | Top Opportunities | singleLineText |
|15 | Top Opportunities (Count) | count |
|16 | Key Insights | singleLineText |
|17 | Key Insights (Count) | count |

---

## 6. Opportunities  (`tblcSEoXFmTIYHPAW`)
| # | Field | Airtable Type |
|---|-------|---------------|
| 1 | Title | singleLineText |
| 2 | Need Statement | multilineText |
| 3 | Validation | singleSelect {Validated, Not Validated, Needs Follow Up} |
| 4 | Product Mapping | singleSelect {Product A, Product B, Product C, Check-ins & Reviews, Talent Frameworks + Career Pathing Analytics, Executive Services Add-On, Reporting Suite + HRIS Integration Layer} |
| 5 | CHRO Value | multilineText |
| 6 | Deal Accelerators | multilineText |
| 7 | Research Report | multipleRecordLinks → **Research** |
| 8 | Associated Company | multipleRecordLinks → **Company** |
| 9 | Insights | multipleRecordLinks → **Insights** |

---

## 7. Insights  (`tbldQUfTEWbAbLQPI`)
| # | Field | Airtable Type |
|---|-------|---------------|
| 1 | Insight ID | autoNumber |
| 2 | Type | singleSelect {Product Insight, Customer Need, Market Trend, Feature Request, Usability Feedback, Other, Pain Point, Opportunity} |
| 3 | Description | multilineText |
| 4 | Priority | singleSelect {High, Medium, Low} |
| 5 | Direct Quotes | richText |
| 6 | Source | singleSelect {Interview, Survey, Support Ticket, Sales Call, Research Report, Other, Meeting Transcript} |
| 7 | Date | date |
| 8 | Research Report | multipleRecordLinks → **Research** |
| 9 | Related Opportunity | multipleRecordLinks → **Opportunities** |
|10 | Company | multipleRecordLinks → **Company** |
|11 | Summary (AI) | aiText |
|12 | Tags (AI) | aiText |

---

*Generated automatically on {{DATE}} from Airtable metadata via API.*