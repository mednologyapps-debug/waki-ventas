import { useEffect, useRef, useState } from 'react'
import {
  LocateFixed,
  MapPin
} from 'lucide-react'

const GOOGLE_MAPS_SCRIPT_ID =
  'waki-google-maps-script'

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps)
      return
    }

    const existingScript =
      document.getElementById(
        GOOGLE_MAPS_SCRIPT_ID
      )

    if (existingScript) {
      existingScript.addEventListener(
        'load',
        () => resolve(window.google.maps),
        { once: true }
      )

      existingScript.addEventListener(
        'error',
        () => reject(
          new Error(
            'No se pudo cargar Google Maps.'
          )
        ),
        { once: true }
      )

      return
    }

    const script =
      document.createElement('script')

    script.id =
      GOOGLE_MAPS_SCRIPT_ID

    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`

    script.async = true
    script.defer = true

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps)
      } else {
        reject(
          new Error(
            'Google Maps no quedó disponible.'
          )
        )
      }
    }

    script.onerror = () => {
      reject(
        new Error(
          'No se pudo cargar Google Maps.'
        )
      )
    }

    document.head.appendChild(script)
  })
}

export default function SalesMap({
  center,
  district,
  places = [],
  onUseCurrentLocation
}) {
  const mapElementRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const centerMarkerRef = useRef(null)
  const hotelMarkersRef = useRef([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    initializeMap()
  }, [])

  useEffect(() => {
    if (
      !mapInstanceRef.current ||
      !window.google?.maps ||
      !center
    ) {
      return
    }

    mapInstanceRef.current.panTo(center)
    mapInstanceRef.current.setZoom(15)

    if (centerMarkerRef.current) {
      centerMarkerRef.current.setPosition(center)
      centerMarkerRef.current.setTitle(district)
    }
  }, [
    center?.lat,
    center?.lng,
    district
  ])

  useEffect(() => {
    renderHotelMarkers()
  }, [places])

  async function initializeMap() {
    try {
      setLoading(true)
      setErrorMessage('')

      const apiKey =
        import.meta.env
          .VITE_GOOGLE_MAPS_API_KEY

      if (!apiKey) {
        throw new Error(
          'Falta VITE_GOOGLE_MAPS_API_KEY en el archivo .env.'
        )
      }

      const maps =
        await loadGoogleMaps(apiKey)

      const map =
        new maps.Map(
          mapElementRef.current,
          {
            center,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            clickableIcons: false,
            gestureHandling: 'greedy',
            zoomControl: true
          }
        )

      const centerMarker =
        new maps.Marker({
          position: center,
          map,
          title: district
        })

      mapInstanceRef.current = map
      centerMarkerRef.current = centerMarker

      renderHotelMarkers()

    } catch (error) {
      console.error(
        'Error cargando mapa:',
        error
      )

      setErrorMessage(
        error?.message ||
        'No pudimos cargar el mapa.'
      )

    } finally {
      setLoading(false)
    }
  }

  function clearHotelMarkers() {
    hotelMarkersRef.current.forEach(
      (marker) => marker.setMap(null)
    )

    hotelMarkersRef.current = []
  }

  function renderHotelMarkers() {
    clearHotelMarkers()

    if (
      !mapInstanceRef.current ||
      !window.google?.maps ||
      !Array.isArray(places) ||
      places.length === 0
    ) {
      return
    }

    const bounds =
      new window.google.maps.LatLngBounds()

    places.forEach((place) => {
      const position = {
        lat: Number(place.latitude),
        lng: Number(place.longitude)
      }

      if (
        !Number.isFinite(position.lat) ||
        !Number.isFinite(position.lng)
      ) {
        return
      }

      const marker =
        new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: place.name,
          label: {
            text: 'H',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '700'
          }
        })

      const infoWindow =
        new window.google.maps.InfoWindow({
          content: `
            <div style="max-width:220px;font-family:Arial,sans-serif;">
              <strong style="display:block;margin-bottom:5px;">
                ${escapeHtml(place.name || 'Hotel')}
              </strong>
              <span style="font-size:12px;color:#6f6678;line-height:1.4;">
                ${escapeHtml(place.address || '')}
              </span>
            </div>
          `
        })

      marker.addListener(
        'click',
        () => {
          infoWindow.open({
            map: mapInstanceRef.current,
            anchor: marker
          })
        }
      )

      hotelMarkersRef.current.push(marker)
      bounds.extend(position)
    })

    if (
      hotelMarkersRef.current.length > 0
    ) {
      mapInstanceRef.current.fitBounds(bounds)

      window.setTimeout(
        () => {
          const currentZoom =
            mapInstanceRef.current?.getZoom()

          if (
            currentZoom &&
            currentZoom > 16
          ) {
            mapInstanceRef.current.setZoom(16)
          }
        },
        150
      )
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  }

  return (
    <section className="sales-map-card">

      <div className="sales-map-card__header">

        <div>
          <h3>
            {district}
          </h3>

          <p>
            {
              places.length > 0
                ? `${places.length} hoteles cargados`
                : 'Vista de la zona seleccionada'
            }
          </p>
        </div>

        <button
          type="button"
          className="sales-map-location-button"
          onClick={onUseCurrentLocation}
        >
          <LocateFixed
            size={17}
            strokeWidth={1.8}
          />

          <span>
            Mi ubicación
          </span>
        </button>

      </div>


      <div className="sales-map-frame">

        <div
          ref={mapElementRef}
          className="sales-map-canvas"
        />


        {loading && (
          <div className="sales-map-state">
            <div className="sales-map-loader" />

            <span>
              Cargando mapa...
            </span>
          </div>
        )}


        {errorMessage && (
          <div className="sales-map-state sales-map-state--error">

            <MapPin
              size={21}
              strokeWidth={1.8}
            />

            <span>
              {errorMessage}
            </span>

          </div>
        )}

      </div>

    </section>
  )
}
