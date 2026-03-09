import Seo from '../components/Seo';

export default function PrivacyPolicy() {
  return (
    <div className="container legal-page">
      <Seo
        title="Privacy Policy | Raghvendra.cloud"
        description="Privacy policy for Raghvendra.cloud including GDPR data processing information."
        path="/privacy"
      />
      <h1>Privacy Policy</h1>
      <p>Last updated: February 17, 2026</p>
      <h2>1. Data Controller</h2>
      <p>
        Controller: Raghvendra.cloud. Contact details should be completed with your legal business
        address and email.
      </p>
      <h2>2. Data We Process</h2>
      <p>
        We process technical logs, optional analytics consent data, and submitted business inputs for
        strategy generation responses.
      </p>
      <h2>3. Legal Basis</h2>
      <p>
        Processing is based on legitimate interests and explicit consent for optional analytics cookies.
      </p>
      <h2>4. Third-Party Processors</h2>
      <p>
        Services may include hosting providers, analytics, and AI providers. Personal data minimization
        is applied before AI explanation requests.
      </p>
      <h2>5. Data Retention</h2>
      <p>
        Strategy request and log retention periods should be documented and limited to business necessity.
      </p>
      <h2>6. Your Rights</h2>
      <p>
        You may request access, correction, deletion, restriction, and portability of personal data in
        accordance with GDPR.
      </p>
      <h2>7. Contact and Complaints</h2>
      <p>
        Add your operational contact email and the competent supervisory authority in Germany.
      </p>
    </div>
  );
}
