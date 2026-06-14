export type PolicySection = { heading: string; body: string };
export type PolicyDoc = {
  id: string;
  title: string;
  summary: string;
  lastUpdated: string;
  sections: PolicySection[];
};

export const POLICIES: PolicyDoc[] = [
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    summary: "How HealthSurya collects, uses, stores, and protects your personal information.",
    lastUpdated: "2026-05-31",
    sections: [
      {
        heading: "1. Introduction",
        body: "HealthSurya (“we”, “our”, “platform”) operates a healthcare discovery and services platform for patients, doctors, laboratories, and pharmacies. This Privacy Policy explains what data we collect, why we collect it, and your rights under applicable Indian law including the Digital Personal Data Protection Act, 2023 (DPDPA) where applicable.",
      },
      {
        heading: "2. Information we collect",
        body: "Account data: name, email, mobile number, gender, date of birth, and address when you register. Booking data: test selections, appointment dates, symptoms (for doctor requests), delivery addresses, and payment references. Partner data: lab/doctor/pharmacy registration details and verification documents. Technical data: device type, IP address, browser, and usage logs for security and analytics.",
      },
      {
        heading: "3. How we use information",
        body: "We use data to provide bookings, medicine orders, doctor mini-websites, notifications, customer support, fraud prevention, and platform improvement. We do not sell your personal data to third-party advertisers.",
      },
      {
        heading: "4. Doctor public listings",
        body: "When a doctor publishes a profile, only information they choose to display publicly (name, qualification, specialization, clinic location, fees, timings, services, photos) may appear on their mini website and in search results. Private account credentials, internal analytics, and unpublished drafts are not shown publicly.",
      },
      {
        heading: "5. Sharing with third parties",
        body: "We share data with labs, doctors, pharmacies, and couriers only as needed to fulfil your request. We use cloud hosting (e.g. Supabase/Azure) and payment/SMS providers under contractual safeguards. We may disclose data if required by law or court order.",
      },
      {
        heading: "6. Retention",
        body: "We retain account and transaction records as long as your account is active and as required for legal, tax, and healthcare compliance. You may request deletion subject to lawful retention obligations.",
      },
      {
        heading: "7. Your rights",
        body: "You may access, correct, or request deletion of your personal data by contacting support@healthsurya.com. You may withdraw consent for optional marketing communications at any time.",
      },
      {
        heading: "8. Contact",
        body: "Data protection queries: support@healthsurya.com. Grievance officer details will be published on our Contact page as required.",
      },
    ],
  },
  {
    id: "terms-of-service",
    title: "Terms of Service",
    summary: "Rules for using the HealthSurya website and mobile experiences.",
    lastUpdated: "2026-05-31",
    sections: [
      {
        heading: "1. Acceptance",
        body: "By accessing HealthSurya you agree to these Terms, our Privacy Policy, and applicable partner policies. If you do not agree, do not use the platform.",
      },
      {
        heading: "2. Platform role",
        body: "HealthSurya is a technology marketplace connecting users with independent healthcare providers. We do not provide medical diagnosis or treatment ourselves. Clinical decisions remain between you and your licensed provider.",
      },
      {
        heading: "3. User accounts",
        body: "You must provide accurate registration information and keep credentials secure. You are responsible for activity under your account. Misuse, impersonation, or fraudulent bookings may result in suspension.",
      },
      {
        heading: "4. Partner listings",
        body: "Labs, doctors, and pharmacies are responsible for the accuracy of their listings, licences, and services. HealthSurya may verify credentials but does not guarantee outcomes of medical care.",
      },
      {
        heading: "5. Limitation of liability",
        body: "To the maximum extent permitted by law, HealthSurya is not liable for indirect, incidental, or consequential damages arising from use of the platform or third-party services.",
      },
      {
        heading: "6. Governing law",
        body: "These Terms are governed by the laws of India. Courts at Jaunpur, Uttar Pradesh shall have jurisdiction unless otherwise required by consumer protection law.",
      },
    ],
  },
  {
    id: "user-registration-policy",
    title: "User Registration Policy",
    summary: "Requirements and responsibilities when creating a HealthSurya account.",
    lastUpdated: "2026-05-31",
    sections: [
      {
        heading: "1. Eligibility",
        body: "You must be at least 18 years old to register, or use the platform under supervision of a parent/guardian for minor patients. Partner accounts (doctor, lab, pharmacy) must hold valid registrations or licences as applicable in India.",
      },
      {
        heading: "2. Registration methods",
        body: "We support email/password and Google sign-in. Mobile OTP login may be enabled in future releases. Each user may maintain one primary account per role unless approved for multi-location partners.",
      },
      {
        heading: "3. Information accuracy",
        body: "You agree to provide true name, contact details, and role (patient, doctor, lab owner, etc.). False or misleading registration may lead to immediate suspension and reporting to authorities where required.",
      },
      {
        heading: "4. Role-specific terms",
        body: "Patients: bookings and orders are for personal or dependent care. Doctors: you authorize display of public profile fields on your mini website. Labs/Pharmacies: you confirm NABL/drug licence details during verification.",
      },
      {
        heading: "5. Account security",
        body: "Do not share passwords or OTPs. Notify us immediately of unauthorized access at support@healthsurya.com.",
      },
    ],
  },
  {
    id: "data-security-policy",
    title: "Data Security Policy",
    summary: "Technical and organizational measures to protect healthcare and personal data.",
    lastUpdated: "2026-05-31",
    sections: [
      {
        heading: "1. Commitment",
        body: "HealthSurya implements security controls appropriate for a healthcare platform handling personal and sensitive health-related information.",
      },
      {
        heading: "2. Encryption",
        body: "Data in transit is protected using TLS/SSL (HTTPS). Database and file storage use encryption at rest via our cloud providers. Prescription and verification documents are stored in access-controlled buckets.",
      },
      {
        heading: "3. Access control",
        body: "Role-based access (patient, doctor, lab, admin) is enforced through Row Level Security and server-side authorization. Administrative access is limited to verified staff on a need-to-know basis.",
      },
      {
        heading: "4. Monitoring & audit",
        body: "We maintain audit logs for verification decisions, admin actions, and security events. Anomalies are investigated and remediated.",
      },
      {
        heading: "5. Backups",
        body: "Regular automated backups support disaster recovery. Backup retention follows our internal schedule and provider capabilities.",
      },
      {
        heading: "6. Incident response",
        body: "Suspected breaches are contained, investigated, and reported to affected users and regulators as required by law.",
      },
      {
        heading: "7. User responsibilities",
        body: "Use strong passwords, log out on shared devices, and do not upload malware or unauthorized patient records belonging to others.",
      },
    ],
  },
  {
    id: "refund-cancellation-policy",
    title: "Refund & Cancellation Policy",
    summary: "Refunds for lab tests, medicine orders, and appointment requests.",
    lastUpdated: "2026-05-31",
    sections: [
      {
        heading: "1. Lab test bookings",
        body: "Full refund if cancelled before sample collection. No refund after home or lab sample collection has occurred. Home collection dispatch fees may be non-refundable once the phlebotomist is en route.",
      },
      {
        heading: "2. Medicine orders",
        body: "Refunds within 2 days of delivery for damaged, wrong, or missing items with photo proof. Opened medicines, temperature-sensitive items, and prescription medicines generally cannot be returned once dispatched unless required by law.",
      },
      {
        heading: "3. Doctor appointments",
        body: "Appointment requests made through a doctor’s public mini website are between you and the clinic. HealthSurya facilitates the request only. Cancellation and refund rules follow the doctor/clinic’s policy communicated at confirmation.",
      },
      {
        heading: "4. Processing time",
        body: "Approved refunds to wallet or original payment method are processed within 5–7 working days unless banking delays apply.",
      },
      {
        heading: "5. Disputes",
        body: "Email support@healthsurya.com with order/booking ID and evidence. We will coordinate with the partner where applicable.",
      },
    ],
  },
  {
    id: "cookie-policy",
    title: "Cookie Policy",
    summary: "How we use cookies and similar technologies.",
    lastUpdated: "2026-05-31",
    sections: [
      {
        heading: "1. What are cookies",
        body: "Cookies are small text files stored on your device to remember preferences, keep you signed in, and understand how the site is used.",
      },
      {
        heading: "2. Types we use",
        body: "Essential cookies: required for login and security. Analytics cookies: help us improve performance (may be anonymized). Preference cookies: remember language or UI settings.",
      },
      {
        heading: "3. Control",
        body: "You can block cookies in your browser settings; some features may not work without essential cookies.",
      },
    ],
  },
  {
    id: "health-disclaimer",
    title: "Medical & Health Disclaimer",
    summary: "Important limitations regarding medical information on HealthSurya.",
    lastUpdated: "2026-05-31",
    sections: [
      {
        heading: "1. Not medical advice",
        body: "Content on HealthSurya is for information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for emergencies call local emergency services.",
      },
      {
        heading: "2. Emergency",
        body: "Do not use this platform for life-threatening emergencies. In India, dial 112 or local ambulance services.",
      },
      {
        heading: "3. AI & automated features",
        body: "Any AI-assisted verification or suggestions are assistive only and require human review where applicable.",
      },
    ],
  },
  {
    id: "prescription-policy",
    title: "Prescription Medicine Policy",
    summary: "Rules for ordering prescription (Rx) medicines.",
    lastUpdated: "2026-05-31",
    sections: [
      {
        heading: "1. Valid prescription",
        body: "Schedule H/H1 and other prescription-only medicines require a clear, valid prescription uploaded at checkout. Pharmacists may reject orders that do not meet legal requirements.",
      },
      {
        heading: "2. Verification",
        body: "Prescriptions are reviewed for authenticity. Status may be Pending, Approved, or Rejected. We do not dispense without approval where law requires.",
      },
      {
        heading: "3. Patient responsibility",
        body: "You confirm the prescription is issued for you or your dependent and is current. Forged prescriptions are illegal and will be reported.",
      },
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use Policy",
    summary: "Prohibited activities on HealthSurya.",
    lastUpdated: "2026-05-31",
    sections: [
      {
        heading: "1. Prohibited conduct",
        body: "No harassment, hate speech, fake reviews, scraping of personal data, hacking, spam, or posting false medical credentials.",
      },
      {
        heading: "2. Content",
        body: "Gallery and profile images must be professional and lawful. No misleading claims of cures or unapproved treatments.",
      },
      {
        heading: "3. Enforcement",
        body: "Violations may result in content removal, account termination, and legal action.",
      },
    ],
  },
];

export function getPolicyById(id: string): PolicyDoc | undefined {
  return POLICIES.find((p) => p.id === id);
}
