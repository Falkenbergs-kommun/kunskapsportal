'use client'

const AdminPrivacyLink = () => {
  return (
    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
      <a
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#0070f3',
          textDecoration: 'underline',
          fontSize: '14px',
        }}
      >
        Integritetspolicy
      </a>
    </div>
  )
}

export default AdminPrivacyLink
