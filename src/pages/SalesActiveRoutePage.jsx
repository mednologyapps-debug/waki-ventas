import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  Route,
  Save,
  X
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import SalesSidebar from '../components/SalesSidebar'

const VISIT_RESULTS = [
  {
    value: 'no_manager',
    backendValue: 'follow_up',
    label: 'No estaba el encargado'
  },
  {
    value: 'follow_up',
    label: 'Volver a contactar'
  },
  {
    value: 'interested',
    label: 'Interesado'
  },
  {
    value: 'not_interested',
    label: 'No interesado'
  },
  {
    value: 'onboarding_started',
    label: 'Iniciar afiliación'
  }
]

export default function SalesActiveRoutePage() {
  const navigate = useNavigate()
  const { routeId } = useParams()

  const [loading, setLoading] = useState(true)
  const [routeData, setRouteData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [result, setResult] = useState('')
  const [notes, setNotes] = useState('')
  const [followUpAt, setFollowUpAt] = useState('')
  const [savingVisit, setSavingVisit] = useState(false)
  const [showRemaining, setShowRemaining] = useState(false)

  useEffect(() => {
    loadRoute({ startRoute: true })
  }, [routeId])

  async function loadRoute({ startRoute = false } = {}) {
    try {
      setLoading(true)
      setErrorMessage('')

      if (!routeId) {
        const {
          data,
          error
        } = await supabase.rpc(
          'get_my_latest_sales_route'
        )

        if (error) throw error

        if (!data?.route?.id) {
          setRouteData(null)
          return
        }

        navigate(
          `/ruta/${data.route.id}`,
          { replace: true }
        )

        return
      }

      if (startRoute) {
        const {
          error: startError
        } = await supabase.rpc(
          'start_sales_route',
          {
            target_route_id: routeId
          }
        )

        if (startError) throw startError
      }

      const {
        data,
        error
      } = await supabase.rpc(
        'get_sales_route_detail',
        {
          target_route_id: routeId
        }
      )

      if (error) throw error

      setRouteData(data)
    } catch (error) {
      console.error(
        'Error cargando ruta activa:',
        error
      )

      setErrorMessage(
        error?.message ||
        'No pudimos cargar la ruta.'
      )
    } finally {
      setLoading(false)
    }
  }

  const stops =
    Array.isArray(routeData?.stops)
      ? routeData.stops
      : []

  const visitedStops =
    useMemo(
      () =>
        stops.filter(
          (stop) =>
            stop.status === 'visited'
        ),
      [stops]
    )

  const pendingStops =
    useMemo(
      () =>
        stops.filter(
          (stop) =>
            stop.status === 'pending'
        ),
      [stops]
    )

  const currentStop =
    pendingStops[0] || null

  const totalStops =
    stops.length

  const currentPosition =
    currentStop
      ? visitedStops.length + 1
      : totalStops

  const progress =
    totalStops > 0
      ? Math.round(
          (visitedStops.length / totalStops) * 100
        )
      : 0

  function openNavigation() {
    if (!currentStop) return

    const travelMode =
      routeData?.route?.travel_mode === 'walking'
        ? 'walking'
        : 'driving'

    const destination =
      `${currentStop.latitude},${currentStop.longitude}`

    const url =
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=${travelMode}`

    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    )
  }

  async function handleSaveVisit(event) {
    event.preventDefault()

    if (!currentStop) return

    if (!result) {
      setErrorMessage(
        'Selecciona el resultado de la visita.'
      )
      return
    }

    try {
      setSavingVisit(true)
      setErrorMessage('')

      const selectedResult =
        VISIT_RESULTS.find(
          (item) => item.value === result
        )

      const backendResult =
        selectedResult?.backendValue ||
        selectedResult?.value ||
        result

      const {
        error
      } = await supabase.rpc(
        'register_sales_route_visit',
        {
          target_route_stop_id:
            currentStop.route_stop_id,

          target_result:
            backendResult,

          target_notes:
            notes.trim() || null,

          target_next_follow_up_at:
            followUpAt
              ? new Date(
                  followUpAt
                ).toISOString()
              : null
        }
      )

      if (error) throw error

      setShowVisitForm(false)
      setResult('')
      setNotes('')
      setFollowUpAt('')

      await loadRoute({ startRoute: false })
    } catch (error) {
      console.error(
        'Error registrando visita:',
        error
      )

      setErrorMessage(
        error?.message ||
        'No pudimos registrar la visita.'
      )
    } finally {
      setSavingVisit(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', {
      replace: true
    })
  }

  if (loading) {
    return (
      <div className="sales-auth-loading">
        <div className="sales-auth-spinner" />
        <p>Cargando ruta...</p>
      </div>
    )
  }

  if (!routeData?.route) {
    return (
      <div className="sales-portal">
        <SalesSidebar
          activeKey="routes"
          profileName="Equipo WAKI"
          onLogout={handleLogout}
        />

        <main className="sales-route-page">
          <div className="sales-empty-route">
            <Route
              size={25}
              strokeWidth={1.7}
            />

            <h1>
              No tienes una ruta activa
            </h1>

            <p>
              Genera una ruta desde Inicio para comenzar tus visitas.
            </p>

            <button
              type="button"
              onClick={() => navigate('/')}
            >
              Volver al inicio
            </button>
          </div>
        </main>

        <BottomNav activeKey="route" />
      </div>
    )
  }

  const routeCompleted =
    routeData.route.status === 'completed' ||
    pendingStops.length === 0

  return (
    <div className="sales-portal">

      <SalesSidebar
        activeKey="routes"
        profileName="Equipo WAKI"
        onLogout={handleLogout}
      />


      <main className="sales-route-page">

        <header className="sales-route-page__header">

          <button
            type="button"
            className="sales-route-back"
            onClick={() => navigate('/')}
            aria-label="Volver"
          >
            <ArrowLeft
              size={19}
              strokeWidth={1.8}
            />
          </button>

          <div>
            <h1>
              Ruta de hoy
            </h1>

            <p>
              {routeData.route.district}
            </p>
          </div>

        </header>


        {errorMessage && (
          <div className="sales-dashboard-error">
            {errorMessage}
          </div>
        )}


        <section className="sales-route-progress-card">

          <div className="sales-route-progress-card__top">

            <div>
              <strong>
                {
                  routeCompleted
                    ? `${totalStops} de ${totalStops}`
                    : `${currentPosition} de ${totalStops}`
                }
              </strong>

              <span>
                {
                  routeCompleted
                    ? 'Ruta completada'
                    : 'Visitas'
                }
              </span>
            </div>

            <div className="sales-route-progress-percent">
              {routeCompleted ? 100 : progress}%
            </div>

          </div>


          <div className="sales-route-progress-track">
            <div
              className="sales-route-progress-fill"
              style={{
                width:
                  `${routeCompleted ? 100 : progress}%`
              }}
            />
          </div>

        </section>


        {
          routeCompleted
            ? (
              <section className="sales-route-completed">

                <CheckCircle2
                  size={34}
                  strokeWidth={1.6}
                />

                <h2>
                  Ruta completada
                </h2>

                <p>
                  Registraste las {totalStops} visitas de esta ruta.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                >
                  Volver al inicio
                </button>

              </section>
            )
            : (
              <>
                <section className="sales-current-stop">

                  <div className="sales-current-stop__label">
                    Siguiente parada
                  </div>

                  <div className="sales-current-stop__number">
                    {currentPosition}
                  </div>

                  <h2>
                    {currentStop.name}
                  </h2>

                  <p>
                    <MapPin
                      size={15}
                      strokeWidth={1.8}
                    />

                    <span>
                      {
                        currentStop.address ||
                        currentStop.district ||
                        'Sin dirección'
                      }
                    </span>
                  </p>


                  <button
                    type="button"
                    className="sales-open-navigation"
                    onClick={openNavigation}
                  >
                    <Navigation
                      size={18}
                      strokeWidth={1.8}
                    />

                    Abrir navegación

                    <ExternalLink
                      size={15}
                      strokeWidth={1.7}
                    />
                  </button>


                  <button
                    type="button"
                    className="sales-register-visit"
                    onClick={() =>
                      setShowVisitForm(true)
                    }
                  >
                    Registrar visita
                  </button>

                </section>


                <section className="sales-route-remaining">

                  <button
                    type="button"
                    className="sales-route-remaining__toggle"
                    onClick={() =>
                      setShowRemaining(
                        (current) => !current
                      )
                    }
                  >

                    <div>
                      <strong>
                        Próximas paradas
                      </strong>

                      <span>
                        {
                          Math.max(
                            pendingStops.length - 1,
                            0
                          )
                        } pendientes
                      </span>
                    </div>

                    {
                      showRemaining
                        ? (
                          <ChevronUp
                            size={18}
                            strokeWidth={1.8}
                          />
                        )
                        : (
                          <ChevronDown
                            size={18}
                            strokeWidth={1.8}
                          />
                        )
                    }

                  </button>


                  {
                    showRemaining &&
                    (
                      <div className="sales-route-remaining__list">

                        {
                          pendingStops
                            .slice(1)
                            .map(
                              (stop) => (
                                <div
                                  key={
                                    stop.route_stop_id
                                  }
                                  className="sales-route-mini-stop"
                                >
                                  <div>
                                    {stop.order}
                                  </div>

                                  <span>
                                    {stop.name}
                                  </span>
                                </div>
                              )
                            )
                        }

                      </div>
                    )
                  }

                </section>
              </>
            )
        }


        <div className="sales-mobile-bottom-space" />

      </main>


      {
        showVisitForm &&
        currentStop &&
        (
          <div className="sales-visit-sheet-backdrop">

            <section className="sales-visit-sheet">

              <div className="sales-visit-sheet__handle" />

              <div className="sales-visit-sheet__header">

                <div>
                  <h3>
                    Registrar visita
                  </h3>

                  <p>
                    {currentStop.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowVisitForm(false)
                  }
                  aria-label="Cerrar"
                >
                  <X
                    size={18}
                    strokeWidth={1.8}
                  />
                </button>

              </div>


              <form onSubmit={handleSaveVisit}>

                <div className="sales-visit-options">

                  {
                    VISIT_RESULTS.map(
                      (item) => (
                        <button
                          key={item.value}
                          type="button"
                          className={
                            result === item.value
                              ? 'is-selected'
                              : ''
                          }
                          onClick={() =>
                            setResult(
                              item.value
                            )
                          }
                        >
                          {item.label}
                        </button>
                      )
                    )
                  }

                </div>


                <label className="sales-visit-field">

                  <span>
                    Nota
                  </span>

                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value
                      )
                    }
                    placeholder="Opcional"
                    rows={3}
                  />

                </label>


                {(
                    result === 'no_manager' ||
                    result === 'follow_up'
                  ) && (
                    <label className="sales-visit-field">

                      <span>
                        Próximo seguimiento
                      </span>

                      <div className="sales-follow-up-input">

                        <Clock3
                          size={17}
                          strokeWidth={1.8}
                        />

                        <input
                          type="datetime-local"
                          value={followUpAt}
                          onChange={(event) =>
                            setFollowUpAt(
                              event.target.value
                            )
                          }
                        />

                      </div>

                      </label>
                    )}


                <button
                  type="submit"
                  className="sales-save-visit"
                  disabled={
                    savingVisit ||
                    !result
                  }
                >
                  <Save
                    size={17}
                    strokeWidth={1.8}
                  />

                  {
                    savingVisit
                      ? 'Guardando...'
                      : 'Guardar y continuar'
                  }
                </button>

              </form>

            </section>

          </div>
        )
      }


      <BottomNav activeKey="route" />

    </div>
  )
}
