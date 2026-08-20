const modules = [
  'auth',
  'customers',
  'plans',
  'subscriptions',
  'invoices',
  'payments',
  'webhooks',
  'billing',
  'notifications',
  'audit',
];

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '4rem 1.5rem',
      }}
    >
      <p style={{ color: 'var(--ok)', fontWeight: 600, letterSpacing: 0.4 }}>● system online</p>
      <h1 style={{ fontSize: '2.25rem', marginTop: '0.5rem', lineHeight: 1.15 }}>
        Subscription Billing System
      </h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.75rem', fontSize: '1.05rem' }}>
        SaaS subscription lifecycle — modular monolith with asynchronous workers, RabbitMQ,
        PostgreSQL and idempotent webhooks. The admin console is built in a later phase.
      </p>

      <section
        style={{
          marginTop: '2rem',
          background: 'var(--panel)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
        }}
      >
        <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Domain modules
        </h2>
        <ul
          style={{
            listStyle: 'none',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginTop: '0.75rem',
          }}
        >
          {modules.map((m) => (
            <li
              key={m}
              style={{
                fontSize: '0.85rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 999,
                background: 'rgba(110,168,254,0.12)',
                color: 'var(--accent)',
              }}
            >
              {m}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
