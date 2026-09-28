import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  Building2,
  CalendarClock,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  UserCheck
} from 'lucide-react'

import {
  useNavigate
} from 'react-router-dom'

import {
  supabase
} from '../lib/supabase'

import BottomNav
  from '../components/BottomNav'

import SalesSidebar
  from '../components/SalesSidebar'

import '../sales-hotels.css'


const STATUS_META = {
  unvisited: {
    label: 'Sin visitar',
    tone: 'neutral'
  },

  assigned: {
    label: 'En ruta',
    tone: 'assigned'
  },

  visited: {
    label: 'Visitado',
    tone: 'visited'
  },

  follow_up: {
    label: 'Seguimiento',
    tone: 'follow_up'
  },

  interested: {
    label: 'Interesado',
    tone: 'interested'
  },

  onboarding_started: {
    label: 'Afiliación iniciada',
    tone: 'onboarding_started'
  },

  pending_review: {
    label: 'En revisión',
    tone: 'pending_review'
  },

  approved: {
    label: 'Afiliado',
    tone: 'approved'
  },

  not_interested: {
    label: 'No interesado',
    tone: 'not_interested'
  }
}


const FILTERS = [
  {
    value: 'all',
    label: 'Todos'
  },
  {
    value: 'follow_up',
    label: 'Seguimiento'
  },
  {
    value: 'interested',
    label: 'Interesados'
  },
  {
    value: 'onboarding',
    label: 'Afiliación'
  },
  {
    value: 'not_interested',
    label: 'No interesados'
  }
]


function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date =
    new Date(value)

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


function formatDateTime(value) {
  if (!value) {
    return '—'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—'
  }

  return date.toLocaleString(
    'es-PE',
    {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }
  )
}


export default function SalesHotelsPage() {
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

  const [
    search,
    setSearch
  ] =
    useState('')

  const [
    filter,
    setFilter
  ] =
    useState('all')


  useEffect(() => {
    loadHotels()
  }, [])


  async function loadHotels() {
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

      if (sessionError) {
        throw sessionError
      }

      if (!session?.user) {
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
          hotelsData,

        error
      } =
        await supabase
          .rpc(
            'get_my_sales_hotels_v2'
          )

      if (error) {
        throw error
      }

      setData(
        hotelsData || {
          sales_staff: null,
          hotels: []
        }
      )

    } catch (error) {
      console.error(
        'Error cargando hoteles:',
        error
      )

      setErrorMessage(
        error?.message ||
        'No pudimos cargar tus hoteles.'
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


  const hotels =
    Array.isArray(
      data?.hotels
    )
      ? data.hotels
      : []


  const stats =
    useMemo(
      () => ({
        total:
          hotels.length,

        followUp:
          hotels.filter(
            (hotel) =>
              hotel.commercial_status ===
              'follow_up'
          ).length,

        interested:
          hotels.filter(
            (hotel) =>
              hotel.commercial_status ===
              'interested'
          ).length,

        onboarding:
          hotels.filter(
            (hotel) =>
              [
                'onboarding_started',
                'pending_review',
                'approved'
              ].includes(
                hotel.commercial_status
              ) ||
              hotel.is_converted
          ).length
      }),
      [hotels]
    )


  const visibleHotels =
    useMemo(
      () => {
        const normalized =
          search
            .trim()
            .toLowerCase()

        return hotels.filter(
          (hotel) => {
            const matchesSearch =
              !normalized ||
              hotel.name
                ?.toLowerCase()
                ?.includes(
                  normalized
                ) ||
              hotel.district
                ?.toLowerCase()
                ?.includes(
                  normalized
                ) ||
              hotel.address
                ?.toLowerCase()
                ?.includes(
                  normalized
                )

            let matchesFilter =
              true

            if (
              filter ===
              'follow_up'
            ) {
              matchesFilter =
                hotel
                  .commercial_status ===
                'follow_up'
            }

            if (
              filter ===
              'interested'
            ) {
              matchesFilter =
                hotel
                  .commercial_status ===
                'interested'
            }

            if (
              filter ===
              'onboarding'
            ) {
              matchesFilter =
                [
                  'onboarding_started',
                  'pending_review',
                  'approved'
                ].includes(
                  hotel
                    .commercial_status
                ) ||
                hotel.is_converted
            }

            if (
              filter ===
              'not_interested'
            ) {
              matchesFilter =
                hotel
                  .commercial_status ===
                'not_interested'
            }

            return (
              matchesSearch &&
              matchesFilter
            )
          }
        )
      },
      [
        hotels,
        search,
        filter
      ]
    )


  if (loading) {
    return (
      <div className="sales-auth-loading">

        <div className="sales-auth-spinner" />

        <p>
          Cargando hoteles...
        </p>

      </div>
    )
  }


  return (
    <div className="sales-portal">

      <SalesSidebar
        activeKey="hotels"
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


      <main className="sales-hotels-page">

        <header className="sales-hotels-header">

          <span className="sales-hotels-eyebrow">
            Cartera comercial
          </span>

          <h1>
            Hoteles
          </h1>

          <p>
            Consulta los hoteles que ya forman parte de tu trabajo comercial sin volver a cargar el mapa.
          </p>

        </header>


        {
          errorMessage &&
          (
            <div className="sales-dashboard-error">
              {errorMessage}
            </div>
          )
        }


        <section className="sales-hotels-stats">

          <div>
            <strong>
              {stats.total}
            </strong>

            <span>
              Hoteles trabajados
            </span>
          </div>


          <div>
            <strong>
              {stats.followUp}
            </strong>

            <span>
              En seguimiento
            </span>
          </div>


          <div>
            <strong>
              {stats.interested}
            </strong>

            <span>
              Interesados
            </span>
          </div>


          <div>
            <strong>
              {stats.onboarding}
            </strong>

            <span>
              En afiliación
            </span>
          </div>

        </section>


        <div className="sales-hotels-search">

          <Search
            size={18}
            strokeWidth={1.8}
          />

          <input
            type="search"
            value={search}
            placeholder="Buscar por hotel, distrito o dirección"
            onChange={
              (event) =>
                setSearch(
                  event.target.value
                )
            }
          />

        </div>


        <div className="sales-hotels-filters">

          {
            FILTERS.map(
              (item) => (
                <button
                  key={item.value}
                  type="button"
                  className={
                    filter ===
                    item.value
                      ? 'is-active'
                      : ''
                  }
                  onClick={() =>
                    setFilter(
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


        {
          visibleHotels.length === 0
            ? (
              <section className="sales-hotels-empty">

                <Building2
                  size={30}
                  strokeWidth={1.6}
                />

                <strong>
                  No encontramos hoteles
                </strong>

                <span>
                  Prueba otro filtro o vuelve a Inicio cuando quieras descubrir hoteles nuevos.
                </span>

              </section>
            )

            : (
              <section className="sales-hotels-list">

                {
                  visibleHotels.map(
                    (hotel) => {
                      const status =
                        STATUS_META[
                          hotel
                            .commercial_status
                        ] ||
                        STATUS_META.unvisited

                      const followUpDate =
                        hotel
                          .next_follow_up_at
                            ? new Date(
                                hotel
                                  .next_follow_up_at
                              )
                            : null

                      const overdue =
                        followUpDate &&
                        followUpDate <
                          new Date()

                      return (
                        <button
                          key={hotel.id}
                          type="button"
                          className="sales-hotel-card"
                          onClick={() =>
                            navigate(
                              `/hoteles/${hotel.id}`
                            )
                          }
                        >

                          <div className="sales-hotel-card__top">

                            <div className="sales-hotel-card__icon">

                              <Building2
                                size={19}
                                strokeWidth={1.8}
                              />

                            </div>


                            <div className="sales-hotel-card__copy">

                              <div className="sales-hotel-card__title-row">

                                <strong>
                                  {hotel.name}
                                </strong>

                                <span
                                  className={
                                    `sales-hotel-status sales-hotel-status--${status.tone}`
                                  }
                                >
                                  {status.label}
                                </span>

                              </div>


                              <div className="sales-hotel-card__address">

                                <MapPin
                                  size={14}
                                  strokeWidth={1.8}
                                />

                                <span>
                                  {
                                    [
                                      hotel.district,
                                      hotel.address
                                    ]
                                      .filter(
                                        Boolean
                                      )
                                      .join(' · ') ||
                                    'Ubicación no disponible'
                                  }
                                </span>

                              </div>

                            </div>


                            <ChevronRight
                              size={18}
                              strokeWidth={1.8}
                            />

                          </div>


                          <div className="sales-hotel-card__meta">

                            <div>
                              <span>
                                Última visita
                              </span>

                              <strong>
                                {
                                  formatDate(
                                    hotel
                                      .last_visited_at
                                  )
                                }
                              </strong>
                            </div>


                            <div>
                              <span>
                                Visitas
                              </span>

                              <strong>
                                {
                                  Number(
                                    hotel
                                      .visit_count ||
                                    0
                                  )
                                }
                              </strong>
                            </div>

                          </div>


                          {
                            hotel
                              .next_follow_up_at &&
                            (
                              <div
                                className={
                                  `sales-hotel-follow-up ${
                                    overdue
                                      ? 'is-overdue'
                                      : ''
                                  }`
                                }
                              >

                                <CalendarClock
                                  size={15}
                                  strokeWidth={1.8}
                                />

                                <span>
                                  {
                                    overdue
                                      ? 'Seguimiento pendiente: '
                                      : 'Próximo seguimiento: '
                                  }

                                  {
                                    formatDateTime(
                                      hotel
                                        .next_follow_up_at
                                    )
                                  }
                                </span>

                              </div>
                            )
                          }


                          {
                            hotel
                              .last_notes &&
                            (
                              <div className="sales-hotel-last-note">

                                <Clock3
                                  size={14}
                                  strokeWidth={1.7}
                                />

                                <span>
                                  {
                                    hotel
                                      .last_notes
                                  }
                                </span>

                              </div>
                            )
                          }


                          {
                            hotel
                              .is_converted &&
                            (
                              <div className="sales-hotel-converted">

                                <UserCheck
                                  size={14}
                                  strokeWidth={1.8}
                                />

                                Acceso de hotel activado

                              </div>
                            )
                          }

                        </button>
                      )
                    }
                  )
                }

              </section>
            )
        }


        <div className="sales-mobile-bottom-space" />

      </main>


      <BottomNav
        activeKey="hotels"
      />

    </div>
  )
}
