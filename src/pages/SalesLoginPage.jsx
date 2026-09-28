import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck
} from 'lucide-react'

import { supabase } from '../lib/supabase'

import wakiLogo from '../assets/waki_logo_full.png'
import wakiMascot from '../assets/waki_admin_access.png'

export default function SalesLoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    checkExistingSession()
  }, [])

  async function checkExistingSession() {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setCheckingSession(false)
        return
      }

      const {
        data: salesAccess,
        error
      } = await supabase.rpc(
        'get_my_sales_access'
      )

      if (error) {
        throw error
      }

      if (
        !Array.isArray(salesAccess) ||
        salesAccess.length === 0
      ) {
        await supabase.auth.signOut()
        setCheckingSession(false)
        return
      }

      navigate('/', {
        replace: true
      })
    } catch (error) {
      console.error(
        'Error verificando sesión de ventas:',
        error
      )

      setCheckingSession(false)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()

    if (!email.trim() || !password) {
      setErrorMessage(
        'Ingresa tu correo electrónico y contraseña.'
      )
      return
    }

    try {
      setLoading(true)
      setErrorMessage('')

      const {
        data: authData,
        error: authError
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (authError) {
        throw authError
      }

      if (!authData?.user) {
        throw new Error(
          'No se pudo identificar al usuario.'
        )
      }

      const {
        data: salesAccess,
        error: salesError
      } = await supabase.rpc(
        'get_my_sales_access'
      )

      if (salesError) {
        throw salesError
      }

      if (
        !Array.isArray(salesAccess) ||
        salesAccess.length === 0
      ) {
        await supabase.auth.signOut()

        setErrorMessage(
          'Esta cuenta no tiene acceso al portal de ventas WAKI.'
        )

        return
      }

      navigate('/', {
        replace: true
      })
    } catch (error) {
      console.error(
        'Error al iniciar sesión:',
        error
      )

      if (
        error?.message ===
        'Invalid login credentials'
      ) {
        setErrorMessage(
          'El correo o la contraseña son incorrectos.'
        )
      } else {
        setErrorMessage(
          error?.message ||
          'No se pudo iniciar sesión. Inténtalo nuevamente.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="sales-auth-loading">
        <div className="sales-auth-spinner" />

        <p>
          Verificando acceso...
        </p>
      </div>
    )
  }

  return (
    <main className="waki-sales-login-page">

      <section className="waki-sales-login-visual">

        <div className="sales-login-decoration sales-login-decoration-one" />
        <div className="sales-login-decoration sales-login-decoration-two" />

        <span className="sales-login-spark sales-login-spark-one">
          ✦
        </span>

        <span className="sales-login-spark sales-login-spark-two">
          ✦
        </span>

        <div className="sales-login-visual-content">

          <img
            src={wakiMascot}
            alt="WAKI Ventas"
            className="sales-login-mascot"
          />

          <div className="sales-login-welcome-copy">

            <span className="sales-login-eyebrow">
              EQUIPO COMERCIAL
            </span>

            <h1>
              WAKI Ventas
            </h1>

            <p>
              Organiza tus visitas, encuentra nuevas
              oportunidades y afilia hoteles desde campo.
            </p>

          </div>

        </div>

        <p className="sales-login-left-footer">
          © 2026 WAKI. Todos los derechos reservados.
        </p>

      </section>


      <section className="waki-sales-login-form-side">

        <div className="sales-login-form-card">

          <div className="sales-login-logo-wrapper">

            <img
              src={wakiLogo}
              alt="WAKI"
              className="sales-login-official-logo"
            />

            <span className="sales-login-badge">
              VENTAS
            </span>

          </div>


          <div className="sales-login-title-area">

            <h2>
              Iniciar sesión
            </h2>

            <p>
              Accede a tu panel comercial WAKI
            </p>

          </div>


          <form
            onSubmit={handleLogin}
            className="sales-login-form"
          >

            <div className="sales-form-field">

              <label htmlFor="sales-email">
                Correo electrónico
              </label>

              <div className="sales-input-with-icon">

                <span className="sales-field-leading-icon">
                  <Mail
                    size={19}
                    strokeWidth={1.8}
                  />
                </span>

                <input
                  id="sales-email"
                  type="email"
                  value={email}
                  placeholder="vendedor@wakipe.com"
                  autoComplete="email"
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                />

              </div>

            </div>


            <div className="sales-form-field">

              <label htmlFor="sales-password">
                Contraseña
              </label>

              <div className="sales-input-with-icon">

                <span className="sales-field-leading-icon">
                  <LockKeyhole
                    size={19}
                    strokeWidth={1.8}
                  />
                </span>

                <input
                  id="sales-password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                />

                <button
                  type="button"
                  className="sales-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                >

                  {showPassword ? (
                    <EyeOff
                      size={19}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <Eye
                      size={19}
                      strokeWidth={1.8}
                    />
                  )}

                </button>

              </div>

            </div>


            {errorMessage && (
              <div className="sales-form-error">
                {errorMessage}
              </div>
            )}


            <button
              type="submit"
              className="sales-login-submit-button"
              disabled={loading}
            >

              {
                loading
                  ? 'Ingresando...'
                  : 'Ingresar'
              }

            </button>

          </form>


          <div className="sales-security-message">

            <ShieldCheck
              size={16}
              strokeWidth={1.7}
            />

            <span>
              Acceso seguro para el equipo comercial WAKI
            </span>

          </div>

        </div>

      </section>

    </main>
  )
}
