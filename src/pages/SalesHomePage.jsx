import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Car,
  ChevronRight,
  Footprints,
  LocateFixed,
  LogOut,
  MapPin,
  RefreshCw,
  Route,
  Search
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import SalesSidebar from '../components/SalesSidebar'
import SalesMap from '../components/SalesMap'
import SalesHotelFinder from '../components/SalesHotelFinder'

const DISTRICTS = [
  { name: 'Lince', center: { lat: -12.0836, lng: -77.0337 } },
  { name: 'Miraflores', center: { lat: -12.1211, lng: -77.0297 } },
  { name: 'San Isidro', center: { lat: -12.0972, lng: -77.0369 } },
  { name: 'Barranco', center: { lat: -12.1483, lng: -77.0201 } },
  { name: 'San Miguel', center: { lat: -12.0773, lng: -77.0956 } },
  { name: 'Magdalena', center: { lat: -12.0912, lng: -77.0674 } }
]

export default function SalesHomePage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState(null)
  const [district, setDistrict] = useState('Lince')
  const [mapCenter, setMapCenter] = useState(DISTRICTS[0].center)
  const [search, setSearch] = useState('')
  const [hotelCount, setHotelCount] = useState(15)
  const [travelMode, setTravelMode] = useState('driving')
  const [errorMessage, setErrorMessage] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)

  const [places, setPlaces] = useState([])
  const [discovering, setDiscovering] = useState(false)
  const [discoverySource, setDiscoverySource] = useState('')
  const [refreshedAt, setRefreshedAt] = useState(null)

  const [routeLoading, setRouteLoading] = useState(false)
  const [generatedRoute, setGeneratedRoute] = useState(null)

  useEffect(() => {
    loadPage()
  }, [])

  async function loadPage() {
    try {
      setLoading(true)
      setErrorMessage('')

      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError

      if (!session?.user) {
        navigate('/login', { replace: true })
        return
      }

      const { data, error } =
        await supabase.rpc('get_my_sales_access')

      if (error) throw error

      if (!Array.isArray(data) || data.length === 0) {
        await supabase.auth.signOut()
        navigate('/login', { replace: true })
        return
      }

      setAccess(data[0])
    } catch (error) {
      console.error('Error cargando portal de ventas:', error)

      setErrorMessage(
        error?.message ||
        'No pudimos cargar el portal.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  function handleSelectDistrict(item) {
    setDistrict(item.name)
    setMapCenter(item.center)
    setPlaces([])
    setDiscoverySource('')
    setRefreshedAt(null)
    setGeneratedRoute(null)
    setErrorMessage('')
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setErrorMessage(
        'Tu navegador no permite obtener la ubicación.'
      )
      return
    }

    setLocationLoading(true)
    setErrorMessage('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })

        setDistrict('Mi ubicación')
        setPlaces([])
        setDiscoverySource('')
        setRefreshedAt(null)
        setGeneratedRoute(null)
        setLocationLoading(false)
      },

      (error) => {
        console.error('Error geolocalización:', error)

        setErrorMessage(
          'No pudimos acceder a tu ubicación. Revisa los permisos del navegador.'
        )

        setLocationLoading(false)
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  async function handleDiscoverHotels() {
    if (district === 'Mi ubicación') {
      setErrorMessage(
        'Por ahora la búsqueda de hoteles funciona por distrito. Selecciona una zona disponible.'
      )
      return
    }

    try {
      setDiscovering(true)
      setErrorMessage('')
      setGeneratedRoute(null)

      const { data, error } =
        await supabase.functions.invoke(
          'sales-discover-hotels',
          {
            body: { district }
          }
        )

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setPlaces(
        Array.isArray(data?.places)
          ? data.places
          : []
      )

      setDiscoverySource(
        data?.source || ''
      )

      setRefreshedAt(
        data?.refreshed_at || null
      )
    } catch (error) {
      console.error('Error buscando hoteles:', error)

      let message =
        error?.message ||
        'No pudimos cargar los hoteles.'

      if (
        message.includes(
          'DAILY_SEARCH_LIMIT_REACHED'
        )
      ) {
        message =
          'Alcanzaste el límite diario de búsquedas nuevas. Los distritos guardados siguen disponibles.'
      }

      setErrorMessage(message)
    } finally {
      setDiscovering(false)
    }
  }

  function handleManualHotelAdded(hotel) {
    setPlaces((current) => {
      const withoutDuplicate =
        current.filter(
          (item) =>
            item.id !== hotel.id
        )

      return [
        hotel,
        ...withoutDuplicate
      ]
    })

    setMapCenter({
      lat: Number(hotel.latitude),
      lng: Number(hotel.longitude)
    })

    setGeneratedRoute(null)
  }

  function getCurrentLocationForRoute() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(mapCenter)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        () => {
          resolve(mapCenter)
        },
        {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 60000
        }
      )
    })
  }

  async function handleGenerateRoute() {
    if (candidatePlaces.length < 2) {
      setErrorMessage(
        'Necesitas al menos 2 hoteles disponibles para generar una ruta.'
      )
      return
    }

    try {
      setRouteLoading(true)
      setErrorMessage('')

      const origin =
        await getCurrentLocationForRoute()

      const { data, error } =
        await supabase.functions.invoke(
          'sales-generate-route',
          {
            body: {
              district,
              travel_mode: travelMode,
              origin,
              place_ids:
                candidatePlaces.map(
                  (place) => place.id
                )
            }
          }
        )

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setGeneratedRoute(data)
    } catch (error) {
      console.error('Error generando ruta:', error)

      let message =
        error?.message ||
        'No pudimos generar la ruta.'

      if (
        message.includes(
          'PLACE_ALREADY_ASSIGNED'
        )
      ) {
        message =
          'Uno de los hoteles ya fue asignado a otro vendedor. Actualiza la zona e inténtalo nuevamente.'
      }

      if (
        message.includes(
          'GOOGLE_ROUTES_ERROR'
        )
      ) {
        message =
          'Google no pudo calcular la ruta. Intenta nuevamente.'
      }

      setErrorMessage(message)
    } finally {
      setRouteLoading(false)
    }
  }

  const visibleDistricts =
    useMemo(() => {
      const normalized =
        search.trim().toLowerCase()

      if (!normalized) {
        return DISTRICTS
      }

      return DISTRICTS.filter(
        (item) =>
          item
            .name
            .toLowerCase()
            .includes(normalized)
      )
    }, [search])

  const candidatePlaces =
    useMemo(() => {
      return places
        .filter(
          (place) =>
            ![
              'approved',
              'not_interested'
            ].includes(
              place.commercial_status
            )
        )
        .slice(
          0,
          hotelCount
        )
    }, [places, hotelCount])

  function formatDistance(meters) {
    if (!meters) return '—'

    if (meters < 1000) {
      return `${meters} m`
    }

    return `${(meters / 1000).toFixed(1)} km`
  }

  function formatDuration(seconds) {
    if (!seconds) return '—'

    const hours =
      Math.floor(seconds / 3600)

    const minutes =
      Math.round(
        (seconds % 3600) / 60
      )

    if (hours <= 0) {
      return `${minutes} min`
    }

    return `${hours} h ${minutes} min`
  }

  if (loading) {
    return (
      <div className="sales-auth-loading">
        <div className="sales-auth-spinner" />
        <p>Cargando tu espacio de ventas...</p>
      </div>
    )
  }

  return (
    <div className="sales-portal">

      <SalesSidebar
        activeKey="home"
        profileName={
          access?.display_name ||
          'Equipo WAKI'
        }
        onLogout={handleLogout}
      />


      <main className="sales-dashboard">

        <header className="sales-dashboard-header">

          <div className="sales-dashboard-header__copy">
            <h1>
              Hola, {
                access
                  ?.display_name
                  ?.split(' ')[0] ||
                'equipo'
              }
            </h1>

            <p>
              Elige una zona y prepara una ruta eficiente
              para tus visitas de hoy.
            </p>
          </div>

          <button
            type="button"
            className="sales-header-logout"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} strokeWidth={1.8} />
          </button>

        </header>


        {errorMessage && (
          <div className="sales-dashboard-error">
            {errorMessage}
          </div>
        )}


        <section className="sales-card">

          <div className="sales-card__heading">
            <div>
              <h3>Selecciona un distrito</h3>
            </div>

            <MapPin size={20} strokeWidth={1.7} />
          </div>

          <label className="sales-search-field">
            <Search size={18} strokeWidth={1.8} />

            <input
              type="search"
              value={search}
              placeholder="Buscar distrito"
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </label>

          <div className="sales-district-list">
            {visibleDistricts.map(
              (item) => (
                <button
                  type="button"
                  key={item.name}
                  className={
                    district === item.name
                      ? 'is-selected'
                      : ''
                  }
                  onClick={() =>
                    handleSelectDistrict(item)
                  }
                >
                  <MapPin size={16} strokeWidth={1.8} />
                  <span>{item.name}</span>
                </button>
              )
            )}
          </div>

          <button
            type="button"
            className="sales-use-location"
            onClick={handleUseCurrentLocation}
            disabled={locationLoading}
          >
            <LocateFixed size={18} strokeWidth={1.8} />

            {
              locationLoading
                ? 'Obteniendo ubicación...'
                : 'Usar mi ubicación'
            }
          </button>

        </section>


        <SalesHotelFinder
          district={district}
          onHotelAdded={
            handleManualHotelAdded
          }
        />


        <div className="sales-discovery-row">

          <div>
            <strong>
              Hoteles de {district}
            </strong>

            <span>
              {
                places.length > 0
                  ? `${places.length} disponibles en WAKI`
                  : 'Carga los hoteles disponibles para esta zona'
              }
            </span>
          </div>

          <button
            type="button"
            className="sales-discover-button"
            onClick={handleDiscoverHotels}
            disabled={
              discovering ||
              district === 'Mi ubicación'
            }
          >
            <RefreshCw
              size={17}
              strokeWidth={1.8}
              className={
                discovering
                  ? 'is-spinning'
                  : ''
              }
            />

            {
              discovering
                ? 'Cargando...'
                : places.length > 0
                  ? 'Actualizar'
                  : 'Cargar hoteles'
            }
          </button>

        </div>


        {
          places.length > 0 &&
          (
            <div className="sales-cache-status">
              <span>
                {
                  discoverySource === 'cache'
                    ? 'Datos guardados en WAKI'
                    : discoverySource === 'google'
                      ? 'Datos actualizados desde Google'
                      : 'Datos disponibles en WAKI'
                }
              </span>

              {
                refreshedAt &&
                (
                  <small>
                    Última actualización: {
                      new Date(
                        refreshedAt
                      ).toLocaleDateString(
                        'es-PE'
                      )
                    }
                  </small>
                )
              }
            </div>
          )
        }


        <SalesMap
          center={mapCenter}
          district={district}
          places={places}
          onUseCurrentLocation={
            handleUseCurrentLocation
          }
        />


        <section className="sales-card">

          <div className="sales-card__heading">
            <div>
              <h3>Configura la ruta</h3>
            </div>

            <Route size={20} strokeWidth={1.7} />
          </div>

          <div className="sales-route-count">

            <div>
              <strong>Hoteles por visitar</strong>
              <small>Recomendado para campo: 15</small>
            </div>

            <div className="sales-route-counter">
              <button
                type="button"
                onClick={() =>
                  setHotelCount(
                    (current) =>
                      Math.max(
                        5,
                        current - 1
                      )
                  )
                }
              >
                −
              </button>

              <strong>{hotelCount}</strong>

              <button
                type="button"
                onClick={() =>
                  setHotelCount(
                    (current) =>
                      Math.min(
                        15,
                        current + 1
                      )
                  )
                }
              >
                +
              </button>
            </div>

          </div>

          <div className="sales-travel-mode">

            <button
              type="button"
              className={
                travelMode === 'driving'
                  ? 'is-active'
                  : ''
              }
              onClick={() =>
                setTravelMode('driving')
              }
            >
              <Car size={19} strokeWidth={1.8} />
              <span>Vehículo</span>
            </button>

            <button
              type="button"
              className={
                travelMode === 'walking'
                  ? 'is-active'
                  : ''
              }
              onClick={() =>
                setTravelMode('walking')
              }
            >
              <Footprints size={19} strokeWidth={1.8} />
              <span>Caminando</span>
            </button>

          </div>

        </section>


        <section className="sales-route-preview">

          <div className="sales-route-preview__icon">
            <Route size={20} strokeWidth={1.8} />
          </div>

          <div className="sales-route-preview__copy">
            <strong>
              {district} · {
                candidatePlaces.length > 0
                  ? candidatePlaces.length
                  : hotelCount
              } hoteles
            </strong>

            <small>
              {
                travelMode === 'driving'
                  ? 'Recorrido en vehículo'
                  : 'Recorrido caminando'
              }
            </small>
          </div>

          <ChevronRight size={20} strokeWidth={1.8} />

        </section>


        <button
          type="button"
          className="sales-primary-action"
          disabled={
            places.length === 0 ||
            routeLoading
          }
          onClick={handleGenerateRoute}
        >
          <Route size={19} strokeWidth={1.9} />

          {
            routeLoading
              ? 'Calculando ruta...'
              : `Generar ruta de ${candidatePlaces.length || hotelCount} hoteles`
          }
        </button>


        {
          generatedRoute?.route &&
          (
            <section className="sales-generated-route">

              <div className="sales-generated-route__summary">

                <div>
                  <span>Distancia</span>
                  <strong>
                    {
                      formatDistance(
                        generatedRoute
                          .route
                          .estimated_distance_meters
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>Traslado estimado</span>
                  <strong>
                    {
                      formatDuration(
                        generatedRoute
                          .route
                          .estimated_duration_seconds
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>Paradas</span>
                  <strong>
                    {
                      generatedRoute
                        .stops
                        ?.length || 0
                    }
                  </strong>
                </div>

              </div>


              <div className="sales-generated-route__stops">

                {
                  generatedRoute
                    .stops
                    ?.map(
                      (stop) => (
                        <div
                          key={stop.id}
                          className="sales-route-stop-row"
                        >

                          <div className="sales-route-stop-number">
                            {stop.order}
                          </div>

                          <div className="sales-route-stop-copy">
                            <strong>
                              {stop.name}
                            </strong>

                            <span>
                              {stop.address}
                            </span>
                          </div>

                        </div>
                      )
                    )
                }

              </div>

              <button
                type="button"
                className="sales-start-route-button"
                onClick={() =>
                  navigate(
                    `/ruta/${generatedRoute.route.id}`
                  )
                }
              >
                Iniciar ruta
              </button>

            </section>
          )
        }


        <div className="sales-mobile-bottom-space" />

      </main>


      <BottomNav activeKey="map" />

    </div>
  )
}
