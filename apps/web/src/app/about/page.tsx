export default function AboutPage() {
  return (
    <div style={{ padding: '72px 24px', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: 44, margin: '0 0 12px', letterSpacing: -1 }}>About LearnFlow</h1>
      <p style={{ fontSize: 18, color: '#4b5563', lineHeight: 1.6 }}>
        LearnFlow is building an AI-powered learning companion that turns your goals into structured
        courses, bite-sized lessons, and mastery loops (notes → quiz → review).
      </p>

      <div style={{ marginTop: 28, display: 'grid', gap: 16 }}>
        <section style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Mission</h2>
          <p style={{ margin: '8px 0 0', color: '#374151', lineHeight: 1.6 }}>
            Help people learn anything—faster—by pairing great content with agentic study workflows.
          </p>
        </section>
        <section style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Privacy commitment</h2>
          <p style={{ margin: '8px 0 0', color: '#374151', lineHeight: 1.6 }}>
            BYOAI keys are encrypted at rest (AES-256-CBC in the current MVP). We track usage for
            transparency. No keys are logged.
          </p>
        </section>
      </div>
    </div>
  );
}
