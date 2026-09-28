import {
  Building2,
  MapPinned,
  Route
} from 'lucide-react'

import {
  useNavigate
} from 'react-router-dom'


export default function BottomNav({
  activeKey = 'map'
}) {
  const navigate =
    useNavigate()


  const items = [
    {
      key: 'map',
      label: 'Inicio',
      icon: MapPinned,
      path: '/'
    },

    {
      key: 'route',
      label: 'Ruta',
      icon: Route,
      path: '/ruta'
    },

    {
      key: 'hotels',
      label: 'Hoteles',
      icon: Building2,
      path: '/hoteles'
    }
  ]


  return (
    <nav className="sales-bottom-nav">

      {
        items.map(
          (item) => {
            const Icon =
              item.icon

            return (
              <button
                key={item.key}
                type="button"
                className={
                  activeKey ===
                  item.key
                    ? 'is-active'
                    : ''
                }
                onClick={() =>
                  navigate(
                    item.path
                  )
                }
              >

                <Icon
                  size={20}
                  strokeWidth={1.8}
                />

                <span>
                  {item.label}
                </span>

              </button>
            )
          }
        )
      }

    </nav>
  )
}