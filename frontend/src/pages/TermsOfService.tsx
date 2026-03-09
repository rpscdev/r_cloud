import Seo from '../components/Seo';

export default function TermsOfService() {
  return (
    <div className="container legal-page">
      <Seo
        title="Terms of Service | Raghvendra.cloud"
        description="Terms of service for use of Raghvendra.cloud and its AI strategy tools."
        path="/terms"
      />
      <h1>Terms of Service</h1>
      <p>Last updated: February 17, 2026</p>
      <h2>1. Scope</h2>
      <p>
        These terms govern access to and use of this website, including blog, dashboards, and AI tools.
      </p>
      <h2>2. Acceptable Use</h2>
      <p>
        Users must not misuse the service, attempt unauthorized access, or submit malicious payloads.
      </p>
      <h2>3. AI Decision Disclaimer</h2>
      <p>
        Generated strategy outputs are informational and do not constitute legal, tax, or financial advice.
      </p>
      <h2>4. Intellectual Property</h2>
      <p>
        Content and software are owned by Raghvendra.cloud unless otherwise stated.
      </p>
      <h2>5. Liability</h2>
      <p>
        Liability limitations apply to the extent permitted by applicable German and EU law.
      </p>
      <h2>6. Governing Law</h2>
      <p>
        Add your governing jurisdiction and dispute venue according to your legal setup in Germany.
      </p>
    </div>
  );
}
