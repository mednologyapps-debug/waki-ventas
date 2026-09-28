import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  useNavigate
} from 'react-router-dom'

import {
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Footprints,
  History,
  MapPin,
  Play,
  Route
} from 'lucide-react'

import {
  supabase
} from '../lib/supabase'

import BottomNav
  from '../components/BottomNav'

import SalesSidebar
  from '../components/SalesSidebar'

import '../sales-routes-history.css'


const STATUS_META = {
  planned: {
    label: 'Planificada',
    tone: 'planned'
  },

  in_progress: {
    label: 'En curso',
    tone: 'progress'
  },

  completed: {
    label: 'Completada',
    tone: 'completed'
  },

  cancelled: {
    label: 'Cancelada',
    tone: 'cancelled'
  }
}


function formatDate(
  value
) {
  if (!value) {
    return '—'
  }

  const date =
    new Date(
      `${value}T12:00:00`
    )

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—'
  }

  return date.toLocaleDateString(
    'es-PE',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  )
}


function formatDistance(
  meters
) {
  if (!meters) {
    return '—'
  }

  if (
    meters < 1000
  ) {
    return `${meters} m`
  }

  return `${
    (
      meters /
      1000
    ).toFixed(1)
  } km`
}


function formatDuration(
  seconds
) {
  if (!seconds) {
    return '—'
  }

  const hours =
    Math.floor(
      seconds /
      3600
    )

  const minutes =
    Math.round(
      (
        seconds %
        3600
      ) /
      60
    )

  if (
    hours <= 0
  ) {
    return `${minutes} min`
  }

  return `${hours} h ${minutes} min`
}


export default function SalesRoutesHistoryPage() {

  const navigate =
    useNavigate()


  const [
    loading,
    setLoading
  ] =
    useState(true)


  const [
    data,
    setData
  ] =
    useState(null)


  const [
    errorMessage,
    setErrorMessage
  ] =
    useState('')


  useEffect(() => {

    loadRoutes()

  }, [])


  async function loadRoutes() {

    try {

      setLoading(true)

      setErrorMessage('')


      const {
        data: {
          session
        },

        error:
          sessionError

      } =
        await supabase
          .auth
          .getSession()


      if (
        sessionError
      ) {
        throw sessionError
      }


      if (
        !session?.user
      ) {

        navigate(
          '/login',
          {
            replace: true
          }
        )

        return
      }


      const {
        data:
          routesData,

        error

      } =
        await supabase
          .rpc(
            'get_my_sales_routes_history'
          )


      if (
        error
      ) {
        throw error
      }


      setData(
        routesData || {
          active_route: null,
          routes: []
        }
      )

    } catch (
      error
    ) {

      console.error(
        'Error cargando historial de rutas:',
        error
      )


      setErrorMessage(
        error?.message ||
        'No pudimos cargar tus rutas.'
      )

    } finally {

      setLoading(false)

    }

  }


  async function handleLogout() {

    await supabase
      .auth
      .signOut()


    navigate(
      '/login',
      {
        replace: true
      }
    )

  }


  const routes =
    Array.isArray(
      data?.routes
    )
      ? data.routes
      : []


  const activeRoute =
    data?.active_route ||
    null


  const completedRoutes =
    useMemo(
      () =>
        routes.filter(
          (route) =>
            route.status ===
            'completed'
        ),
      [routes]
    )


  const totalVisits =
    useMemo(
      () =>
        routes.reduce(
          (
            sum,
            route
          ) =>
            sum +
            Number(
              route
                .visited_stops ||
              0
            ),
          0
        ),
      [routes]
    )


  if (
    loading
  ) {

    return (

      <div className="sales-auth-loading">

        <div
          className="sales-auth-spinner"
        />

        <p>
          Cargando rutas...
        </p>

      </div>

    )

  }


  return (

    <div className="sales-portal">


      <SalesSidebar
        activeKey="history"
        profileName={
          data
            ?.sales_staff
            ?.display_name ||
          'Equipo WAKI'
        }
        onLogout={
          handleLogout
        }
      />


      <main className="sales-routes-history-page">


        <header className="sales-routes-history-header">

          <div>

            <h1>
              Historial de rutas
            </h1>

            <p>
              Revisa tu actividad comercial
              y retoma rutas pendientes.
            </p>

          </div>

        </header>


        {
          errorMessage &&
          (
            <div className="sales-dashboard-error">

              {errorMessage}

            </div>
          )
        }


        {/* =========================
            RUTA ACTIVA
        ========================= */}

        {
          activeRoute &&
          (
            <section className="sales-active-route-banner">


              <div className="sales-active-route-banner__icon">

                <Route
                  size={23}
                  strokeWidth={1.8}
                />

              </div>


              <div className="sales-active-route-banner__content">

                <span>
                  Ruta pendiente
                </span>

                <h2>
                  {
                    activeRoute
                      .district
                  }
                </h2>

                <p>

                  {
                    Number(
                      activeRoute
                        .visited_stops ||
                      0
                    )
                  }

                  {' de '}

                  {
                    Number(
                      activeRoute
                        .total_stops ||
                      0
                    )
                  }

                  {' visitas realizadas'}

                </p>


                <div className="sales-active-route-progress">

                  <div
                    style={{
                      width:
                        `${
                          activeRoute
                            .total_stops >
                          0
                            ? Math.round(
                                (
                                  activeRoute
                                    .visited_stops /
                                  activeRoute
                                    .total_stops
                                ) *
                                100
                              )
                            : 0
                        }%`
                    }}
                  />

                </div>

              </div>


              <button
                type="button"
                className="sales-continue-route"
                onClick={() =>
                  navigate(
                    `/ruta/${activeRoute.id}`
                  )
                }
              >

                <Play
                  size={17}
                  strokeWidth={1.8}
                />

                Continuar ruta

              </button>


            </section>
          )
        }


        {/* =========================
            RESUMEN
        ========================= */}

        <section className="sales-route-history-stats">


          <article>

            <div>

              <Route
                size={19}
                strokeWidth={1.8}
              />

            </div>

            <span>
              Rutas
            </span>

            <strong>
              {routes.length}
            </strong>

          </article>


          <article>

            <div>

              <CheckCircle2
                size={19}
                strokeWidth={1.8}
              />

            </div>

            <span>
              Completadas
            </span>

            <strong>
              {
                completedRoutes
                  .length
              }
            </strong>

          </article>


          <article>

            <div>

              <MapPin
                size={19}
                strokeWidth={1.8}
              />

            </div>

            <span>
              Visitas
            </span>

            <strong>
              {totalVisits}
            </strong>

          </article>


        </section>


        {/* =========================
            LISTA
        ========================= */}

        <section className="sales-route-history-section">


          <div className="sales-route-history-section__header">

            <div>

              <h2>
                Tus rutas
              </h2>

              <p>
                Historial reciente de
                trabajo en campo.
              </p>

            </div>


            <span>
              {
                routes.length
              }
            </span>

          </div>


          {
            routes.length === 0
              ? (

                <div className="sales-route-history-empty">

                  <History
                    size={29}
                    strokeWidth={1.6}
                  />

                  <h3>
                    Aún no tienes rutas
                  </h3>

                  <p>
                    Genera tu primera ruta
                    desde Inicio.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate('/')
                    }
                  >
                    Ir a Inicio
                  </button>

                </div>

              )
              : (

                <div className="sales-route-history-list">


                  {
                    routes.map(
                      (
                        route
                      ) => {

                        const status =
                          STATUS_META[
                            route.status
                          ] ||
                          STATUS_META
                            .planned


                        const total =
                          Number(
                            route
                              .total_stops ||
                            0
                          )


                        const visited =
                          Number(
                            route
                              .visited_stops ||
                            0
                          )


                        const progress =
                          total > 0
                            ? Math.round(
                                (
                                  visited /
                                  total
                                ) *
                                100
                              )
                            : 0


                        const isActive =
                          [
                            'planned',
                            'in_progress'
                          ].includes(
                            route.status
                          )


                        return (

                          <article
                            key={
                              route.id
                            }
                            className="sales-route-history-card"
                          >


                            <div className="sales-route-history-card__top">


                              <div className="sales-route-history-card__identity">

                                <div className="sales-route-history-card__icon">

                                  <Route
                                    size={20}
                                    strokeWidth={1.8}
                                  />

                                </div>


                                <div>

                                  <h3>
                                    {
                                      route
                                        .district
                                    }
                                  </h3>

                                  <p>

                                    <CalendarDays
                                      size={14}
                                      strokeWidth={1.8}
                                    />

                                    {
                                      formatDate(
                                        route
                                          .route_date
                                      )
                                    }

                                  </p>

                                </div>

                              </div>


                              <span
                                className={
                                  `sales-route-history-status is-${status.tone}`
                                }
                              >

                                {
                                  status.label
                                }

                              </span>


                            </div>


                            <div className="sales-route-history-card__progress">


                              <div className="sales-route-history-card__progress-copy">

                                <span>
                                  Progreso
                                </span>

                                <strong>
                                  {
                                    visited
                                  }
                                  {' / '}
                                  {
                                    total
                                  }
                                </strong>

                              </div>


                              <div className="sales-route-history-track">

                                <div
                                  style={{
                                    width:
                                      `${progress}%`
                                  }}
                                />

                              </div>


                              <small>
                                {
                                  progress
                                }
                                %
                              </small>


                            </div>


                            <div className="sales-route-history-meta">


                              <div>

                                {
                                  route
                                    .travel_mode ===
                                  'walking'
                                    ? (
                                      <Footprints
                                        size={15}
                                        strokeWidth={1.8}
                                      />
                                    )
                                    : (
                                      <Car
                                        size={15}
                                        strokeWidth={1.8}
                                      />
                                    )
                                }

                                <span>

                                  {
                                    route
                                      .travel_mode ===
                                    'walking'
                                      ? 'Caminando'
                                      : 'Vehículo'
                                  }

                                </span>

                              </div>


                              <div>

                                <MapPin
                                  size={15}
                                  strokeWidth={1.8}
                                />

                                <span>
                                  {
                                    formatDistance(
                                      route
                                        .estimated_distance_meters
                                    )
                                  }
                                </span>

                              </div>


                              <div>

                                <Clock3
                                  size={15}
                                  strokeWidth={1.8}
                                />

                                <span>
                                  {
                                    formatDuration(
                                      route
                                        .estimated_duration_seconds
                                    )
                                  }
                                </span>

                              </div>


                            </div>


                            {
                              isActive &&
                              (
                                <button
                                  type="button"
                                  className="sales-route-history-action"
                                  onClick={() =>
                                    navigate(
                                      `/ruta/${route.id}`
                                    )
                                  }
                                >

                                  Continuar ruta

                                  <ChevronRight
                                    size={17}
                                    strokeWidth={1.8}
                                  />

                                </button>
                              )
                            }


                          </article>

                        )

                      }
                    )
                  }


                </div>

              )
          }


        </section>


        <div className="sales-mobile-bottom-space" />


      </main>


      <BottomNav
        activeKey="history"
      />


    </div>

  )

}