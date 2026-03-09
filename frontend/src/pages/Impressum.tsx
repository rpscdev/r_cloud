import Seo from '../components/Seo';

export default function Impressum() {
  return (
    <div className="container legal-page">
      <Seo
        title="Impressum | Raghvendra.cloud"
        description="Legal disclosure (Impressum) for Raghvendra.cloud."
        path="/impressum"
      />
      <h1>Impressum</h1>
      <p>
        Please replace this template with legally complete information required by German TMG and related
        regulations.
      </p>
      <h2>Angaben gemaess § 5 TMG</h2>
      <p>Full legal name</p>
      <p>Street and number</p>
      <p>Postal code and city</p>
      <h2>Kontakt</h2>
      <p>Email: legal@example.com</p>
      <p>Phone: +49 ...</p>
      <h2>USt-IdNr.</h2>
      <p>Add VAT ID if applicable.</p>
      <h2>Verantwortlich fuer den Inhalt</h2>
      <p>Add responsible person under applicable law.</p>
    </div>
  );
}
