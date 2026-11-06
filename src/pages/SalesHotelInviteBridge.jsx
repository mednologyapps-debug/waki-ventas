import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import HotelInvitePage from './HotelInvitePage'

// Existing invitation URLs in previously sent emails point to Sales.
// Redirect new visits to the Hotel portal but retain this origin to finish
// email-confirmation callbacks started here (PKCE verifier + pending claim
// are stored in the originating domain's localStorage).
export default function SalesHotelInviteBridge() {
  const { token } = useParams()
  const params = new URLSearchParams(window.location.search)
  const hasAuthCallback = params.has('code') || params.has('token_hash') ||
    params.has('access_token') || window.location.hash.includes('access_token=')
  let hasPendingClaim = false
  try {
    hasPendingClaim = Boolean(token && window.localStorage.getItem(`waki_hotel_claim_${token}`))
  } catch {
    // Private-window storage may be unavailable; redirect fresh invitations.
  }
  const remainInSales = hasAuthCallback || hasPendingClaim
  useEffect(() => {
    if (!remainInSales && token && /^[0-9a-f-]{36}$/i.test(token)) {
      window.location.replace(`https://hotel.wakipe.com/invitacion/${token}`)
    }
  }, [remainInSales, token])

  if (remainInSales) return <HotelInvitePage />
  return (
    <main className="hotel-invite-page">
      <section className="hotel-invite-card">
        <h1>Abriendo WAKI Hotel…</h1>
        <p>Tu invitación se completará en el portal del hotel.</p>
        <a href={`https://hotel.wakipe.com/invitacion/${encodeURIComponent(token || '')}`}>
          Continuar al registro
        </a>
      </section>
    </main>
  )
}
