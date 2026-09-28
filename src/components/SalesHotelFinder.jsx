import { useMemo, useState } from 'react'
import {
  Check,
  LocateFixed,
  MapPin,
  Plus,
  Search,
  X
} from 'lucide-react'

import { supabase } from '../lib/supabase'

export default function SalesHotelFinder({
  district,
  onHotelAdded
}) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)

  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const canSearch =
    query.trim().length >= 2

  const currentDistrict =
    district === 'Mi ubicación'
      ? ''
      : district

  async function handleSearch(event) {
    event?.preventDefault()

    if (!canSearch) return

    try {
      setSearching(true)
      setErrorMessage('')
      setMessage('')

      const {
        data,
        error
      } = await supabase.rpc(
        'search_sales_places',
        {
          target_query: query.trim(),
          target_district:
            currentDistrict || null
        }
      )

      if (error) throw error

      setResults(
        Array.isArray(data)
          ? data
          : []
      )

      setSearched(true)

    } catch (error) {
      console.error(
        'Error buscando hotel:',
        error
      )

      setErrorMessage(
        error?.message ||
        'No pudimos buscar el hotel.'
      )

    } finally {
      setSearching(false)
    }
  }

  function openAddForm() {
    setName(query.trim())
    setAddress('')
    setCoords(null)
    setMessage('')
    setErrorMessage('')
    setShowAddForm(true)

    requestLocation()
  }

  function closeAddForm() {
    setShowAddForm(false)
    setCoords(null)
    setAddress('')
    setErrorMessage('')
    setMessage('')
  }

  function requestLocation() {
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
        setCoords({
          lat:
            position.coords.latitude,

          lng:
            position.coords.longitude,

          accuracy:
            position.coords.accuracy
        })

        setLocationLoading(false)
      },

      (error) => {
        console.error(
          'Error obteniendo ubicación:',
          error
        )

        setErrorMessage(
          'No pudimos obtener tu ubicación. Revisa los permisos del navegador.'
        )

        setLocationLoading(false)
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    )
  }

  async function handleSaveManual(event) {
    event.preventDefault()

    if (!name.trim()) {
      setErrorMessage(
        'Ingresa el nombre del hotel.'
      )
      return
    }

    if (!currentDistrict) {
      setErrorMessage(
        'Selecciona primero un distrito.'
      )
      return
    }

    if (!coords) {
      setErrorMessage(
        'Necesitamos tu ubicación para guardar el hotel en el mapa.'
      )
      return
    }

    try {
      setSaving(true)
      setErrorMessage('')
      setMessage('')

      const {
        data,
        error
      } = await supabase.rpc(
        'add_manual_sales_place',
        {
          target_name:
            name.trim(),

          target_district:
            currentDistrict,

          target_latitude:
            coords.lat,

          target_longitude:
            coords.lng,

          target_address:
            address.trim() || null
        }
      )

      if (error) {
        throw error
      }

      setMessage(
        'Hotel agregado correctamente.'
      )

      if (onHotelAdded) {
        onHotelAdded(data)
      }

      setResults(
        (current) => [
          data,
          ...current.filter(
            (item) =>
              item.id !== data.id
          )
        ]
      )

      setQuery(data.name)
      setSearched(true)

      window.setTimeout(
        () => {
          setShowAddForm(false)
          setMessage('')
        },
        900
      )

    } catch (error) {
      console.error(
        'Error guardando hotel manual:',
        error
      )

      let message =
        error?.message ||
        'No pudimos guardar el hotel.'

      if (
        message.includes(
          'POSSIBLE_DUPLICATE'
        )
      ) {
        message =
          'Parece que este hotel ya existe cerca de esta ubicación. Búscalo antes de volver a agregarlo.'
      }

      setErrorMessage(message)

    } finally {
      setSaving(false)
    }
  }

  const hasResults =
    results.length > 0

  const emptySearch =
    searched &&
    !searching &&
    !hasResults

  const locationLabel =
    useMemo(
      () => {
        if (locationLoading) {
          return 'Obteniendo ubicación...'
        }

        if (!coords) {
          return 'Usar mi ubicación'
        }

        const accuracy =
          Math.round(
            Number(
              coords.accuracy || 0
            )
          )

        return accuracy > 0
          ? `Ubicación capturada · ±${accuracy} m`
          : 'Ubicación capturada'
      },
      [
        coords,
        locationLoading
      ]
    )

  return (
    <section className="sales-hotel-finder">

      <div className="sales-hotel-finder__heading">

        <div>
          <h3>
            Buscar hotel
          </h3>

          <p>
            Busca primero en WAKI. Si no existe, agrégalo desde tu ubicación actual.
          </p>
        </div>

        <Search
          size={20}
          strokeWidth={1.7}
        />

      </div>


      <form
        className="sales-hotel-finder__search"
        onSubmit={handleSearch}
      >

        <div className="sales-hotel-finder__input">

          <Search
            size={17}
            strokeWidth={1.8}
          />

          <input
            type="search"
            value={query}
            placeholder="Ej. Hotel Venus"
            onChange={(event) => {
              setQuery(
                event.target.value
              )
              setSearched(false)
            }}
          />

          {
            query && (
              <button
                type="button"
                className="sales-hotel-finder__clear"
                onClick={() => {
                  setQuery('')
                  setResults([])
                  setSearched(false)
                }}
                aria-label="Limpiar búsqueda"
              >
                <X
                  size={16}
                  strokeWidth={1.8}
                />
              </button>
            )
          }

        </div>


        <button
          type="submit"
          className="sales-hotel-finder__search-button"
          disabled={
            !canSearch ||
            searching
          }
        >
          {
            searching
              ? 'Buscando...'
              : 'Buscar'
          }
        </button>

      </form>


      {
        errorMessage &&
        !showAddForm &&
        (
          <div className="sales-hotel-finder__error">
            {errorMessage}
          </div>
        )
      }


      {
        hasResults &&
        (
          <div className="sales-hotel-results">

            {results.map(
              (hotel) => (
                <div
                  className="sales-hotel-result"
                  key={hotel.id}
                >

                  <div className="sales-hotel-result__pin">
                    <MapPin
                      size={17}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="sales-hotel-result__copy">
                    <strong>
                      {hotel.name}
                    </strong>

                    <span>
                      {
                        hotel.address ||
                        hotel.district ||
                        'Sin dirección'
                      }
                    </span>

                    <small>
                      {
                        hotel.provider === 'manual'
                          ? 'Agregado por WAKI'
                          : 'Registrado en WAKI'
                      }
                    </small>
                  </div>

                </div>
              )
            )}

          </div>
        )
      }


      {
        emptySearch &&
        (
          <div className="sales-hotel-empty">

            <div>
              <strong>
                No encontramos “{query.trim()}”
              </strong>

              <span>
                Puedes agregarlo manualmente si estás en el hotel o cerca de él.
              </span>
            </div>

            <button
              type="button"
              onClick={openAddForm}
            >
              <Plus
                size={17}
                strokeWidth={1.8}
              />

              Agregar hotel
            </button>

          </div>
        )
      }


      {
        showAddForm &&
        (
          <div className="sales-manual-hotel-panel">

            <div className="sales-manual-hotel-panel__top">

              <div>
                <h4>
                  Agregar hotel
                </h4>

                <p>
                  Guardaremos el punto usando tu ubicación actual.
                </p>
              </div>

              <button
                type="button"
                className="sales-manual-hotel-panel__close"
                onClick={closeAddForm}
                aria-label="Cerrar"
              >
                <X
                  size={17}
                  strokeWidth={1.8}
                />
              </button>

            </div>


            <form
              onSubmit={handleSaveManual}
              className="sales-manual-hotel-form"
            >

              <label>
                <span>
                  Nombre del hotel
                </span>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Nombre del hotel"
                />
              </label>


              <label>
                <span>
                  Distrito
                </span>

                <input
                  type="text"
                  value={
                    currentDistrict ||
                    'Selecciona un distrito'
                  }
                  readOnly
                />
              </label>


              <label>
                <span>
                  Dirección
                </span>

                <input
                  type="text"
                  value={address}
                  onChange={(event) =>
                    setAddress(
                      event.target.value
                    )
                  }
                  placeholder="Opcional"
                />
              </label>


              <div className="sales-manual-location">

                <div className="sales-manual-location__status">

                  <LocateFixed
                    size={19}
                    strokeWidth={1.8}
                  />

                  <div>
                    <strong>
                      {locationLabel}
                    </strong>

                    {
                      coords &&
                      (
                        <span>
                          {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                        </span>
                      )
                    }
                  </div>

                </div>


                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={locationLoading}
                >
                  {
                    coords
                      ? 'Actualizar ubicación'
                      : 'Obtener ubicación'
                  }
                </button>

              </div>


              {
                coords &&
                (
                  <div className="sales-manual-location__confirm">

                    <Check
                      size={16}
                      strokeWidth={1.8}
                    />

                    <span>
                      Confirma que estás frente al hotel antes de guardarlo.
                    </span>

                  </div>
                )
              }


              {
                errorMessage &&
                (
                  <div className="sales-hotel-finder__error">
                    {errorMessage}
                  </div>
                )
              }


              {
                message &&
                (
                  <div className="sales-hotel-finder__success">
                    {message}
                  </div>
                )
              }


              <button
                type="submit"
                className="sales-manual-save"
                disabled={
                  saving ||
                  !coords ||
                  !name.trim()
                }
              >
                {
                  saving
                    ? 'Guardando...'
                    : 'Guardar hotel'
                }
              </button>

            </form>

          </div>
        )
      }

    </section>
  )
}
