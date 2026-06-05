/**
 * Per-article demo content (summary + body) used by the
 * `page-knowledge-record` view so the prototype reads as a real
 * article when different rows are opened from the Knowledge Base
 * list. Bodies are modelled as a small block schema so the template
 * can render headings, paragraphs, and lists with consistent SLDS
 * styling — see `.kr-rich` in `knowledgeRecord.css`.
 *
 * Each block is one of:
 *   { type: 'lead', text }         -> bold intro paragraph
 *   { type: 'subheading', text }   -> bold region-style heading
 *   { type: 'minor', text }        -> bold inline sub-heading
 *   { type: 'paragraph', text }
 *   { type: 'list', items: [...] }
 *
 * Unknown titles fall back to a generic structure derived from the
 * title string — keeps the layout populated for user-saved drafts
 * and ad-hoc Knowledge Block titles.
 */

const ARTICLE_CONTENT = {
    'How to Enroll in the 401(k) Plan?': {
        summary:
            'Step-by-step guidance for enrolling in the company-sponsored 401(k) retirement plan, including eligibility windows, contribution limits, and employer match rules.',
        body: [
            { type: 'lead', text: '401(k) Enrollment — Quick Reference' },
            {
                type: 'paragraph',
                text:
                    'Eligible employees can begin pre-tax or Roth contributions on the first of the month following 30 days of service. Annual changes can be made at any time through the People Portal.',
            },
            { type: 'subheading', text: 'Steps to enroll' },
            {
                type: 'list',
                items: [
                    'Sign in to the People Portal and open Benefits > Retirement.',
                    'Choose your contribution percentage and split between pre-tax and Roth.',
                    'Designate primary and contingent beneficiaries.',
                    'Select your investment lineup or accept the qualified default.',
                    'Submit and download the confirmation page for your records.',
                ],
            },
            { type: 'subheading', text: 'Contribution and match' },
            {
                type: 'paragraph',
                text:
                    'Employees may contribute up to the IRS annual limit. The company matches 100% of the first 4% of eligible pay; matching contributions vest after two years of continuous service.',
            },
        ],
    },
    'Parental Leave Policy — US Employees': {
        summary:
            'Eligibility, duration, and pay continuation for US-based employees taking parental leave for the birth, adoption, or placement of a child.',
        body: [
            { type: 'lead', text: 'Parental Leave — United States' },
            {
                type: 'paragraph',
                text:
                    'Regular full-time employees are eligible from their first day of employment. Leave must be taken within 12 months of the qualifying event.',
            },
            { type: 'subheading', text: 'What you receive' },
            {
                type: 'list',
                items: [
                    'Up to 16 weeks of paid leave for the primary caregiver.',
                    'Up to 8 weeks of paid leave for the secondary caregiver.',
                    'Continuation of medical, dental, and vision coverage at active rates.',
                    'Bonding leave can be taken in two segments within the first year.',
                ],
            },
            { type: 'subheading', text: 'How to request' },
            {
                type: 'paragraph',
                text:
                    'Submit a leave request through the People Portal at least 30 days before the expected start date when the event is foreseeable. The request routes to your manager and the leave administrator for approval.',
            },
        ],
    },
    'Employee Relocation Policy — EMEA Region': {
        summary:
            'Relocation benefits, immigration support, and reimbursable expenses for employees moving for a role within the EMEA region.',
        body: [
            { type: 'lead', text: 'EMEA Relocation Overview' },
            {
                type: 'paragraph',
                text:
                    'Approved relocations include a household goods shipment, temporary housing of up to 60 days, and a one-time miscellaneous allowance scaled to the destination cost-of-living.',
            },
            { type: 'subheading', text: 'Covered expenses' },
            {
                type: 'list',
                items: [
                    'Air travel for the employee and registered dependents.',
                    'Cross-border household goods shipment with full insurance.',
                    'Up to 60 nights of temporary accommodation in the host city.',
                    'Visa, work-permit, and dependent-permit application fees.',
                    'Tax-equalized relocation allowance based on family size.',
                ],
            },
            { type: 'subheading', text: 'Tax and immigration' },
            {
                type: 'paragraph',
                text:
                    'Global Mobility partners with the local immigration counsel and a tax provider to manage filings. Plan for an 8 to 12 week lead time before the intended start date in the host country.',
            },
        ],
    },
    'How to Update Your Direct Deposit Info?': {
        summary:
            'How employees can update bank details for payroll direct deposit, including timing rules and verification steps to avoid a delayed paycheck.',
        body: [
            { type: 'lead', text: 'Updating direct deposit' },
            {
                type: 'paragraph',
                text:
                    'Changes made before the 10th of the month take effect for that month\u2019s payroll. Updates after the 10th apply to the next pay cycle.',
            },
            { type: 'subheading', text: 'Steps' },
            {
                type: 'list',
                items: [
                    'Open the People Portal > Pay > Payment Elections.',
                    'Add a new account using the routing and account numbers from a recent bank statement.',
                    'Set the new account as Balance so net pay routes there.',
                    'Confirm the change with the verification code sent to your registered email.',
                ],
            },
            { type: 'subheading', text: 'Tips to avoid a missed paycheck' },
            {
                type: 'list',
                items: [
                    'Keep the prior account active for at least one full pay cycle.',
                    'Update tax withholdings separately if your bank also changed addresses.',
                ],
            },
        ],
    },
    'Benefits Enrollment Deadline and Eligibility': {
        summary:
            'Annual benefits enrollment window, eligibility criteria, and the steps to add or remove dependents during open enrollment or a qualifying life event.',
        body: [
            { type: 'lead', text: 'Open Enrollment at a glance' },
            {
                type: 'paragraph',
                text:
                    'Open enrollment runs each November for coverage effective January 1. Outside the open window, changes are only permitted within 30 days of a qualifying life event.',
            },
            { type: 'subheading', text: 'Who is eligible' },
            {
                type: 'list',
                items: [
                    'Regular full-time employees from the first day of employment.',
                    'Regular part-time employees scheduled for 20+ hours per week.',
                    'Spouses, domestic partners, and dependent children up to age 26.',
                ],
            },
            { type: 'subheading', text: 'Qualifying life events' },
            {
                type: 'list',
                items: [
                    'Marriage, divorce, or domestic-partner registration.',
                    'Birth, adoption, or legal guardianship of a child.',
                    'Loss of other coverage by an enrolled dependent.',
                ],
            },
            {
                type: 'paragraph',
                text:
                    'Documentation must be uploaded within 30 days of the event date. Late submissions are reviewed case by case by the benefits team.',
            },
        ],
    },
    'Onboarding Checklist for New Hires': {
        summary:
            'A consolidated checklist covering equipment, system access, paperwork, and orientation activities for new joiners across their first 30 days.',
        body: [
            { type: 'lead', text: 'First 30 day checklist' },
            { type: 'subheading', text: 'Day 1' },
            {
                type: 'list',
                items: [
                    'Complete I-9 / Right-to-Work verification with HR.',
                    'Pick up your laptop and finish device enrollment in MDM.',
                    'Sign in to the People Portal and confirm your home address.',
                ],
            },
            { type: 'subheading', text: 'Week 1' },
            {
                type: 'list',
                items: [
                    'Meet your hiring manager for role expectations and your 30/60/90 plan.',
                    'Complete required compliance modules (Security, Privacy, Code of Conduct).',
                    'Join the new-hire cohort orientation and tools deep-dive.',
                ],
            },
            { type: 'subheading', text: 'Days 14 to 30' },
            {
                type: 'list',
                items: [
                    'Set OKRs and align with your manager.',
                    'Schedule introductions across cross-functional partners.',
                    'Confirm benefits enrollment and direct-deposit setup.',
                ],
            },
        ],
    },
    'Global Travel Policy — Expense Limits': {
        summary:
            'Per-diem rates, lodging caps, and approval thresholds for business travel by region, plus the booking tool that must be used to qualify for reimbursement.',
        body: [
            { type: 'lead', text: 'Travel and Expense Standards' },
            {
                type: 'paragraph',
                text:
                    'All air, rail, and lodging must be booked through the corporate travel platform. Off-platform bookings require pre-approval and additional documentation to be reimbursable.',
            },
            { type: 'subheading', text: 'Lodging caps (USD per night)' },
            {
                type: 'list',
                items: [
                    'Tier 1 metros (NYC, SF, London, Tokyo): $375',
                    'Tier 2 metros (Chicago, Berlin, Singapore): $275',
                    'All other locations: $200',
                ],
            },
            { type: 'subheading', text: 'Daily meal allowance' },
            {
                type: 'list',
                items: [
                    'AMER: $90 per day',
                    'EMEA: 80 EUR per day',
                    'APAC: 9,500 JPY per day or local equivalent',
                ],
            },
            { type: 'subheading', text: 'Approvals' },
            {
                type: 'paragraph',
                text:
                    'Trips above $5,000 USD or 5 business days require advance VP-level approval, regardless of region.',
            },
        ],
    },
    'Work Authorization Renewal Checklist': {
        summary:
            'Pre-expiration timeline, required documents, and the stakeholders involved in renewing work authorization without an interruption in employment.',
        body: [
            { type: 'lead', text: 'Renewal at a glance' },
            {
                type: 'paragraph',
                text:
                    'Begin renewal at least six months before the current authorization expires. Filing earlier reduces the risk of an authorized work gap if processing slows.',
            },
            { type: 'subheading', text: 'Documents to prepare' },
            {
                type: 'list',
                items: [
                    'Current and prior authorization documents (I-797, EAD, visa stamps).',
                    'Recent payslips covering the last six pay periods.',
                    'Updated job description signed by the hiring manager.',
                    'Educational credentials and supporting evaluations.',
                ],
            },
            { type: 'subheading', text: 'Who is involved' },
            {
                type: 'list',
                items: [
                    'Employee — collect personal documents and review the petition.',
                    'Manager — confirm role, location, and compensation details.',
                    'Immigration partner — drafts and files the renewal package.',
                    'Global Mobility — coordinates timing and tracks status.',
                ],
            },
        ],
    },
    'Password and Access Management Policy': {
        summary:
            'Password requirements, multifactor authentication rules, privileged-access reviews, and the lockout-and-recovery procedure for account incidents.',
        body: [
            { type: 'lead', text: 'Account security standards' },
            { type: 'subheading', text: 'Password requirements' },
            {
                type: 'list',
                items: [
                    'Minimum 14 characters; passphrases recommended.',
                    'Reuse of the previous 10 passwords is blocked.',
                    'Rotation is not required unless a compromise is suspected.',
                ],
            },
            { type: 'subheading', text: 'Multifactor authentication' },
            {
                type: 'list',
                items: [
                    'Hardware security keys are required for privileged roles.',
                    'Authenticator apps are required for all other employees.',
                    'SMS-based MFA is no longer permitted as a primary factor.',
                ],
            },
            { type: 'subheading', text: 'Privileged access reviews' },
            {
                type: 'paragraph',
                text:
                    'All elevated entitlements are recertified quarterly by the data owner. Access not recertified within 14 days of notice is automatically removed.',
            },
        ],
    },
    'How to Submit an HR Service Request?': {
        summary:
            'Where to file HR requests, expected turnaround times by category, and how to escalate cases that have stalled past the published SLA.',
        body: [
            { type: 'lead', text: 'Filing an HR Service Request' },
            {
                type: 'paragraph',
                text:
                    'Open the People Portal > Help > New Request. Select the closest category so the request routes to the correct specialist team.',
            },
            { type: 'subheading', text: 'Typical turnaround' },
            {
                type: 'list',
                items: [
                    'Tier 1 (employment letters, basic data updates): 1 business day.',
                    'Tier 2 (compensation, benefits, mobility): 3 to 5 business days.',
                    'Tier 3 (complex investigations, leave, accommodations): 5 to 10 business days.',
                ],
            },
            { type: 'subheading', text: 'Escalation' },
            {
                type: 'paragraph',
                text:
                    'If a case is past SLA without a response, click Escalate inside the case record. The escalation routes to the team lead and notifies the regional HR Business Partner.',
            },
        ],
    },
    'Employee Assistance Program (EAP) Overview': {
        summary:
            'Confidential counseling, financial advising, and wellbeing services available to employees and members of their household at no cost.',
        body: [
            { type: 'lead', text: 'What the EAP includes' },
            {
                type: 'list',
                items: [
                    'Up to 8 confidential counseling sessions per issue, per year.',
                    'Legal consultations on family, housing, and estate matters.',
                    'Financial coaching, including budgeting and debt management.',
                    'Crisis support available 24/7 in 30+ languages.',
                ],
            },
            { type: 'subheading', text: 'Who can use it' },
            {
                type: 'paragraph',
                text:
                    'All regular employees and any member of their household, including spouses, domestic partners, and dependent children. There is no charge for any service in scope.',
            },
            { type: 'subheading', text: 'How to access' },
            {
                type: 'paragraph',
                text:
                    'Call the regional EAP hotline or open the EAP portal from the People Portal. Use of the EAP is confidential — managers and HR cannot see participation.',
            },
        ],
    },
    'Tax Equalization Policy for Expatriates': {
        summary:
            'How home- and host-country tax obligations are reconciled for international assignees so net pay remains comparable to a domestic-equivalent role.',
        body: [
            { type: 'lead', text: 'Tax equalization principles' },
            {
                type: 'paragraph',
                text:
                    'An assignee continues to pay the equivalent of home-country tax (the hypothetical tax). The company assumes all actual host-country and any incremental home-country taxes related to the assignment.',
            },
            { type: 'subheading', text: 'What is equalized' },
            {
                type: 'list',
                items: [
                    'Base salary and target bonus.',
                    'Cash allowances tied to the assignment (housing, COLA).',
                    'Equity compensation vesting during the assignment period.',
                ],
            },
            { type: 'subheading', text: 'What is not' },
            {
                type: 'list',
                items: [
                    'Personal investment income unrelated to the assignment.',
                    'Income from spousal employment in the host country.',
                ],
            },
            {
                type: 'paragraph',
                text:
                    'Annual settlements are calculated by the assigned tax provider after both home- and host-country returns are filed. Refunds and additional liabilities are settled within 60 days of the final calculation.',
            },
        ],
    },
    'Workplace Safety and Incident Reporting': {
        summary:
            'How to report a workplace incident, near-miss, or hazard, and the investigation timeline that follows once a report is opened.',
        body: [
            { type: 'lead', text: 'Reporting an incident' },
            {
                type: 'paragraph',
                text:
                    'Any employee, contractor, or visitor can file a report. Reports can be submitted anonymously and there is a strict no-retaliation policy.',
            },
            { type: 'subheading', text: 'What to report' },
            {
                type: 'list',
                items: [
                    'Injuries, illnesses, or exposures occurring at work.',
                    'Near-miss events that could have caused harm.',
                    'Unsafe conditions, equipment, or behaviors.',
                ],
            },
            { type: 'subheading', text: 'What happens next' },
            {
                type: 'list',
                items: [
                    'An acknowledgment is sent within one business day.',
                    'An investigator is assigned within three business days.',
                    'Findings and corrective actions are shared within 30 days.',
                ],
            },
        ],
    },
    'Data Retention and Deletion Standards': {
        summary:
            'Retention periods by data category, secure deletion methods, and the legal-hold exception process for data that must be preserved.',
        body: [
            { type: 'lead', text: 'Retention by category' },
            {
                type: 'list',
                items: [
                    'Employee records: term of employment + 7 years.',
                    'Customer transaction records: 7 years from the transaction date.',
                    'System and security logs: 13 months in hot storage, 7 years in archive.',
                    'Marketing and analytics data: 25 months from collection.',
                ],
            },
            { type: 'subheading', text: 'Secure deletion' },
            {
                type: 'list',
                items: [
                    'Cryptographic erasure for cloud-stored data with key destruction.',
                    'NIST 800-88 sanitization for decommissioned media.',
                    'Verified destruction certificates retained for 5 years.',
                ],
            },
            { type: 'subheading', text: 'Legal hold' },
            {
                type: 'paragraph',
                text:
                    'When a legal hold is issued, the standard schedule is paused for the in-scope data. Hold owners review applicability quarterly and release the hold once the matter is resolved.',
            },
        ],
    },
    'Tuition Reimbursement Program Guide': {
        summary:
            'Reimbursable courses, the annual cap, the pre-approval workflow, and grade requirements for tuition assistance to qualify for reimbursement.',
        body: [
            { type: 'lead', text: 'Tuition Reimbursement at a glance' },
            {
                type: 'list',
                items: [
                    'Up to $5,250 per calendar year for approved courses.',
                    'Open to regular full-time employees with 6+ months of service.',
                    'Courses must be at an accredited institution and relevant to your role or career path.',
                ],
            },
            { type: 'subheading', text: 'Pre-approval process' },
            {
                type: 'list',
                items: [
                    'Submit a Tuition Reimbursement request before the course start date.',
                    'Manager approves the request based on business relevance.',
                    'Learning and Development verifies eligibility and the annual cap remaining.',
                ],
            },
            { type: 'subheading', text: 'Grade requirements' },
            {
                type: 'paragraph',
                text:
                    'Reimbursement requires a final grade of B or higher, or a Pass in pass/fail courses. Submit the official transcript and itemized invoice within 60 days of completion.',
            },
        ],
    },
    'How to Request Software Access or License?': {
        summary:
            'Where to request a new tool, how license assignments are reviewed, and what to do when an existing license is reclaimed for non-use.',
        body: [
            { type: 'lead', text: 'Software access requests' },
            {
                type: 'paragraph',
                text:
                    'All standard tools are listed in the Software Catalog. Request a license through Service Hub > Software > Request License so usage is tracked against the active inventory.',
            },
            { type: 'subheading', text: 'Steps' },
            {
                type: 'list',
                items: [
                    'Search the Software Catalog for the tool you need.',
                    'Submit the request with a brief business justification.',
                    'Manager and tool owner approve within 1 to 2 business days.',
                    'License is provisioned automatically once approved.',
                ],
            },
            { type: 'subheading', text: 'Reclamation' },
            {
                type: 'paragraph',
                text:
                    'Licenses unused for 60 consecutive days are reclaimed automatically. You will receive a reminder 14 days before reclamation; one click in the email keeps the license assigned to you.',
            },
        ],
    },
    'Work Visa Sponsorship Process': {
        summary:
            'End-to-end overview of the work visa sponsorship process, from role qualification and immigration counsel kickoff through visa stamping and arrival in the host country.',
        body: [
            { type: 'lead', text: 'Sponsorship phases' },
            { type: 'subheading', text: 'Phase 1 — Qualification' },
            {
                type: 'list',
                items: [
                    'Hiring manager confirms the role meets minimum requirements for sponsorship.',
                    'Compensation is benchmarked against the prevailing wage in the host location.',
                    'Recruiter and Global Mobility align on the target start date.',
                ],
            },
            { type: 'subheading', text: 'Phase 2 — Filing' },
            {
                type: 'list',
                items: [
                    'Immigration counsel drafts the petition and supporting evidence.',
                    'Employee uploads personal documents to the secure case portal.',
                    'Petition is filed once both employer and employee documents are complete.',
                ],
            },
            { type: 'subheading', text: 'Phase 3 — Arrival' },
            {
                type: 'paragraph',
                text:
                    'After approval, the employee schedules a consular interview, completes visa stamping, and coordinates travel with Global Mobility. On arrival, the local site team supports onboarding and tax registration.',
            },
        ],
    },
    'H-1B Transfer and Extension Guide': {
        summary:
            'Steps to transfer an active H-1B to a new employer or extend an existing petition, including timing rules, premium-processing options, and travel implications.',
        body: [
            { type: 'lead', text: 'Transfer vs. extension' },
            {
                type: 'paragraph',
                text:
                    'A transfer changes the petitioning employer; an extension keeps the same employer and pushes out the validity period. Both follow similar filing steps but differ in timing and travel rules.',
            },
            { type: 'subheading', text: 'Transfer essentials' },
            {
                type: 'list',
                items: [
                    'Employees may begin work on receipt of the transfer petition under H-1B portability.',
                    'Recent payslips, the most current I-797, and prior I-94 records are required.',
                    'Transfers do not require a new lottery selection if the original H-1B is active.',
                ],
            },
            { type: 'subheading', text: 'Extension essentials' },
            {
                type: 'list',
                items: [
                    'File no later than 6 months before the I-797 expires.',
                    'Premium processing reduces adjudication to 15 business days.',
                    'Travel during a pending extension is permitted with the prior approval and a valid visa stamp.',
                ],
            },
        ],
    },
    'I-9 Employment Eligibility Verification': {
        summary:
            'How and when to complete Form I-9 for new hires and rehires, the document categories that satisfy each section, and the audit retention requirements.',
        body: [
            { type: 'lead', text: 'I-9 timing' },
            {
                type: 'list',
                items: [
                    'Section 1 must be completed by the employee on or before the first day of work.',
                    'Section 2 must be completed by an authorized representative within 3 business days of the start date.',
                    'Reverification (Section 3) is required when work authorization expires.',
                ],
            },
            { type: 'subheading', text: 'Acceptable documents' },
            {
                type: 'list',
                items: [
                    'List A — single document establishing both identity and employment authorization.',
                    'List B — identity only, paired with a List C document.',
                    'List C — employment authorization only, paired with a List B document.',
                ],
            },
            { type: 'subheading', text: 'Retention' },
            {
                type: 'paragraph',
                text:
                    'I-9 forms are retained for 3 years after the date of hire or 1 year after employment ends, whichever is later. Forms must be available for federal inspection on 3 business days notice.',
            },
        ],
    },
    'Green Card Sponsorship Eligibility': {
        summary:
            'Eligibility criteria, role categories, and the company review process for initiating an employment-based green card sponsorship.',
        body: [
            { type: 'lead', text: 'Eligibility overview' },
            {
                type: 'paragraph',
                text:
                    'Sponsorship is initiated for full-time employees in roles that meet the company sponsorship criteria. Decisions consider role longevity, performance, and business need.',
            },
            { type: 'subheading', text: 'Common categories' },
            {
                type: 'list',
                items: [
                    'EB-2 — advanced degree professionals or those with exceptional ability.',
                    'EB-3 — professionals, skilled workers, and other workers.',
                    'EB-1 — multinational managers, outstanding researchers, and individuals of extraordinary ability.',
                ],
            },
            { type: 'subheading', text: 'Initiation' },
            {
                type: 'paragraph',
                text:
                    'Managers nominate eligible employees during the annual sponsorship review. Approved cases are kicked off with immigration counsel and Global Mobility within 30 days of approval.',
            },
        ],
    },
    'Global Mobility Relocation Policy': {
        summary:
            'Relocation benefits, immigration coordination, and tax-equalization framework for employees moving across countries for an internal role.',
        body: [
            { type: 'lead', text: 'Relocation overview' },
            {
                type: 'paragraph',
                text:
                    'Cross-border relocations are coordinated by Global Mobility in partnership with immigration counsel and a tax provider. Each relocation is scoped to the destination, family size, and assignment length.',
            },
            { type: 'subheading', text: 'Core benefits' },
            {
                type: 'list',
                items: [
                    'Round-trip air travel for the employee and registered dependents.',
                    'Household goods shipment with full insurance.',
                    'Up to 60 days of temporary accommodation at the destination.',
                    'Visa, work-permit, and dependent-permit fees.',
                    'Tax-equalized assignment allowance based on family size.',
                ],
            },
            { type: 'subheading', text: 'Long-term assignments' },
            {
                type: 'paragraph',
                text:
                    'Assignments longer than 12 months may include a host-country housing allowance, schooling support for school-age dependents, and an annual home-leave trip.',
            },
        ],
    },
    'International Employee Onboarding Compliance': {
        summary:
            'Compliance steps and timelines for onboarding international employees, including work authorization checks, payroll registration, and country-specific filings.',
        body: [
            { type: 'lead', text: 'Compliance milestones' },
            { type: 'subheading', text: 'Before Day 1' },
            {
                type: 'list',
                items: [
                    'Confirm valid work authorization for the work location.',
                    'Register with the host-country payroll provider.',
                    'Set up the local benefits enrollment package.',
                ],
            },
            { type: 'subheading', text: 'First two weeks' },
            {
                type: 'list',
                items: [
                    'Complete country-specific employment and tax forms.',
                    'Verify identity documents in person where required.',
                    'Provision local equipment under the country data-residency rules.',
                ],
            },
            { type: 'subheading', text: 'Audit-readiness' },
            {
                type: 'paragraph',
                text:
                    'Onboarding records are stored in the secure HR vault and refreshed at every status change. Quarterly audits confirm that authorization documents, tax filings, and registrations are current.',
            },
        ],
    },
    'Dependent Visa Application Support': {
        summary:
            'What dependent statuses are supported, the documents required, and the ways the company can support spouses and children during a relocation or work assignment.',
        body: [
            { type: 'lead', text: 'Supported dependent categories' },
            {
                type: 'list',
                items: [
                    'Spouses and registered domestic partners.',
                    'Dependent children under 21 (varies by host country).',
                    'Long-term parents in countries that recognize parental dependency.',
                ],
            },
            { type: 'subheading', text: 'Required documents' },
            {
                type: 'list',
                items: [
                    'Passports valid for at least six months past the intended stay.',
                    'Marriage and birth certificates with certified translations where required.',
                    'Recent passport photos meeting the host-country specifications.',
                ],
            },
            { type: 'subheading', text: 'Support provided' },
            {
                type: 'list',
                items: [
                    'Application fees for in-scope dependents.',
                    'Coordination with immigration counsel on dependent filings.',
                    'Information on dependent work eligibility in the host country.',
                ],
            },
        ],
    },
    'Cross-Border Employment Tax Obligations': {
        summary:
            'How payroll taxes, social security, and reporting obligations are handled when an employee works across more than one country, including totalization agreements and shadow payroll.',
        body: [
            { type: 'lead', text: 'Cross-border tax basics' },
            {
                type: 'paragraph',
                text:
                    'Working in more than one country during a calendar year creates obligations in each jurisdiction. The company partners with a global tax provider to identify, document, and meet those obligations.',
            },
            { type: 'subheading', text: 'Common scenarios' },
            {
                type: 'list',
                items: [
                    'Permanent transfer — full payroll moves to the host country.',
                    'Long-term assignment — shadow payroll in the host with home-country payroll continuing.',
                    'Frequent business travel — day-counting and treaty analysis required.',
                ],
            },
            { type: 'subheading', text: 'What you should track' },
            {
                type: 'list',
                items: [
                    'Days physically present in each country, including transit days.',
                    'Activity performed in each country (sales, training, internal work).',
                    'Any equity compensation events and their grant or vest locations.',
                ],
            },
        ],
    },
    'Permanent Residency Pathway Guide': {
        summary:
            'An overview of permanent residency pathways the company sponsors, the typical timelines, and the milestones an employee passes through during the process.',
        body: [
            { type: 'lead', text: 'Pathway phases' },
            { type: 'subheading', text: 'Phase 1 — Foundation' },
            {
                type: 'list',
                items: [
                    'Manager and HR confirm sponsorship eligibility.',
                    'Immigration counsel reviews education and experience credentials.',
                    'Initial filing strategy is selected (PERM, EB-1, EB-2, EB-3).',
                ],
            },
            { type: 'subheading', text: 'Phase 2 — Filing' },
            {
                type: 'list',
                items: [
                    'Recruitment and prevailing-wage steps complete.',
                    'Form I-140 is filed by the company on the employee behalf.',
                    'Premium processing is available where eligible.',
                ],
            },
            { type: 'subheading', text: 'Phase 3 — Adjustment' },
            {
                type: 'paragraph',
                text:
                    'Once a priority date is current, the employee can file Form I-485 along with employment authorization and travel documents. Final adjudication can occur via a USCIS interview or be waived in some categories.',
            },
        ],
    },
    'L-1 Intracompany Transfer Policy': {
        summary:
            'Eligibility for L-1A and L-1B intracompany transfers, the qualifying employment relationship, and the timing of filings ahead of the planned start date.',
        body: [
            { type: 'lead', text: 'L-1 categories' },
            {
                type: 'list',
                items: [
                    'L-1A — managers and executives transferring to a US affiliate.',
                    'L-1B — employees with specialized knowledge transferring to a US affiliate.',
                ],
            },
            { type: 'subheading', text: 'Eligibility checks' },
            {
                type: 'list',
                items: [
                    'Continuous employment with the foreign affiliate for at least 1 year in the past 3 years.',
                    'Qualifying employment in a managerial, executive, or specialized-knowledge capacity.',
                    'Sufficient evidence of US site readiness for new-office L-1 cases.',
                ],
            },
            { type: 'subheading', text: 'Timing' },
            {
                type: 'paragraph',
                text:
                    'Plan for at least 90 days from kickoff to filing receipt, plus visa stamping at a US consulate. Premium processing reduces USCIS adjudication to 15 business days when available.',
            },
        ],
    },
    'OPT and STEM Extension Guidelines': {
        summary:
            'Guidance for international students on initial OPT, the 24-month STEM extension, and the reporting and employer requirements that apply during the work period.',
        body: [
            { type: 'lead', text: 'OPT essentials' },
            {
                type: 'list',
                items: [
                    '12 months of work authorization tied to a degree at the same level.',
                    'Apply up to 90 days before and 60 days after program completion.',
                    'Maintain less than 90 days of unemployment during the OPT period.',
                ],
            },
            { type: 'subheading', text: 'STEM extension' },
            {
                type: 'list',
                items: [
                    'An additional 24 months for eligible STEM degrees and E-Verify employers.',
                    'Form I-983 training plan signed by the employer is required.',
                    'Six-month and annual self-evaluations must be submitted to the DSO.',
                ],
            },
            { type: 'subheading', text: 'Employer requirements' },
            {
                type: 'paragraph',
                text:
                    'The role must be paid, related to the degree, and at least 20 hours per week. Material job changes require an updated I-983 and DSO notification within 10 business days.',
            },
        ],
    },
    'Immigration Case Management Process': {
        summary:
            'How the immigration case management system works, from intake and document collection through approval, status updates, and audit-ready record keeping.',
        body: [
            { type: 'lead', text: 'Case lifecycle' },
            { type: 'subheading', text: 'Intake' },
            {
                type: 'list',
                items: [
                    'Manager initiates a case in the immigration portal.',
                    'Employee receives a personalized document checklist.',
                    'Immigration counsel confirms strategy and target filing date.',
                ],
            },
            { type: 'subheading', text: 'Active case' },
            {
                type: 'list',
                items: [
                    'All status changes are posted to the case timeline within 1 business day.',
                    'Documents are stored in an encrypted vault with role-based access.',
                    'Notifications are sent for upcoming expirations and required actions.',
                ],
            },
            { type: 'subheading', text: 'Closure' },
            {
                type: 'paragraph',
                text:
                    'Closed cases are retained for the longer of 7 years or any applicable statutory retention period. Audit-ready summaries can be exported on demand by Global Mobility.',
            },
        ],
    },
    'PERM Labor Certification Process': {
        summary:
            'An overview of the PERM labor certification process, the recruitment requirements, and the prevailing-wage and audit considerations.',
        body: [
            { type: 'lead', text: 'What PERM proves' },
            {
                type: 'paragraph',
                text:
                    'PERM certifies that there are no qualified, willing, and available US workers for the offered position at the prevailing wage in the area of intended employment.',
            },
            { type: 'subheading', text: 'Key milestones' },
            {
                type: 'list',
                items: [
                    'Prevailing wage determination from the Department of Labor.',
                    'Recruitment campaign in approved channels for the required time.',
                    'Recruitment report documenting all applicants reviewed.',
                    'Form ETA-9089 filing with all supporting evidence.',
                ],
            },
            { type: 'subheading', text: 'Audit considerations' },
            {
                type: 'paragraph',
                text:
                    'Maintain copies of all recruitment materials, applicant resumes, and disposition notes for at least five years. Audits typically conclude within 90 days of the audit notice when records are organized and complete.',
            },
        ],
    },
    'Immigration Document Retention Policy': {
        summary:
            'Retention periods for immigration-related records, the storage standards that apply, and the steps to take during a public-body audit or internal review.',
        body: [
            { type: 'lead', text: 'Retention schedule' },
            {
                type: 'list',
                items: [
                    'I-9 forms — 3 years after hire or 1 year after termination, whichever is later.',
                    'PERM recruitment files — minimum of 5 years from filing.',
                    'Visa petitions and approvals — duration of employment + 7 years.',
                ],
            },
            { type: 'subheading', text: 'Storage standards' },
            {
                type: 'list',
                items: [
                    'Encrypted, role-based access with quarterly access reviews.',
                    'Geographic redundancy in approved data residency regions.',
                    'Tamper-evident logs for every document view or edit.',
                ],
            },
            { type: 'subheading', text: 'During an audit' },
            {
                type: 'paragraph',
                text:
                    'Notify the Global Mobility lead and immigration counsel within one business day of receiving any audit notice. The Records team will produce the in-scope artifacts under the timeline specified by the requesting agency.',
            },
        ],
    },
    'Emergency Immigration Support Services': {
        summary:
            'Services available to employees and dependents in immigration emergencies, including 24/7 hotline support, document retrieval, and consular outreach.',
        body: [
            { type: 'lead', text: 'What counts as an emergency' },
            {
                type: 'list',
                items: [
                    'Loss or theft of a passport, visa, or work-authorization document.',
                    'Detained or denied entry at a port of entry.',
                    'Unexpected expiration discovered during travel.',
                ],
            },
            { type: 'subheading', text: 'How to get help' },
            {
                type: 'list',
                items: [
                    'Call the 24/7 immigration emergency hotline listed on the People Portal.',
                    'Provide the case ID and the location where the issue occurred.',
                    'An on-call attorney engages within 30 minutes for active disruptions.',
                ],
            },
            { type: 'subheading', text: 'Follow-up' },
            {
                type: 'paragraph',
                text:
                    'After the immediate issue is resolved, Global Mobility files an incident summary and updates the employee case file. Lessons learned from major incidents inform future travel and document-handling guidance.',
            },
        ],
    },
};

function buildFallback(title) {
    const cleaned = (title || '').replace(/[?.!]+$/, '').trim() || 'Knowledge Article';
    return {
        summary:
            'Quick reference covering eligibility, key steps, and where to get help for ' +
            cleaned +
            ' across all supported regions.',
        body: [
            { type: 'lead', text: cleaned + ' — Overview' },
            {
                type: 'paragraph',
                text:
                    'This article walks through the policy, eligibility criteria, and the steps employees and managers should follow. Specifics may vary by region, so confirm with your local HR partner before acting on time-sensitive items.',
            },
            { type: 'subheading', text: 'Who this applies to' },
            {
                type: 'list',
                items: [
                    'Regular full-time employees in eligible regions.',
                    'Managers responsible for review or approval steps.',
                    'HR partners coordinating the request end to end.',
                ],
            },
            { type: 'subheading', text: 'How to get help' },
            {
                type: 'paragraph',
                text:
                    'Open an HR Service Request from the People Portal or contact your regional support team. Track progress on the case timeline and use the in-case escalation if a step has stalled past its published SLA.',
            },
        ],
    };
}

export function getArticleContent(title) {
    if (title && Object.prototype.hasOwnProperty.call(ARTICLE_CONTENT, title)) {
        return ARTICLE_CONTENT[title];
    }
    return buildFallback(title);
}

/**
 * Convert the structured body block array into the HTML shape expected
 * by the Review Article editor's contenteditable. Used to seed the
 * editor when "Edit Article" is clicked from the Knowledge Record so
 * the user starts with the same content they were just reading.
 *
 * Schema mapping:
 *   lead       -> <p><strong>...</strong></p>
 *   subheading -> <h3>...</h3>
 *   minor      -> <h4>...</h4>
 *   paragraph  -> <p>...</p>
 *   list       -> <ul><li>...</li></ul>
 */
export function articleBodyToHtml(body) {
    if (!Array.isArray(body) || !body.length) return '<p><br></p>';
    const escape = (s) =>
        String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    return body
        .map((b) => {
            switch (b.type) {
                case 'lead':
                    return `<p><strong>${escape(b.text)}</strong></p>`;
                case 'subheading':
                    return `<h3>${escape(b.text)}</h3>`;
                case 'minor':
                    return `<h4>${escape(b.text)}</h4>`;
                case 'paragraph':
                    return `<p>${escape(b.text)}</p>`;
                case 'list': {
                    const items = (b.items || [])
                        .map((i) => `<li>${escape(i)}</li>`)
                        .join('');
                    return `<ul>${items}</ul>`;
                }
                default:
                    return `<p>${escape(b.text)}</p>`;
            }
        })
        .join('\n');
}
