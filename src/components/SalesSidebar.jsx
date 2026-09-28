import {
  Building2,
  LogOut,
  MapPinned,
  Menu,
  Route,
  X
} from 'lucide-react'

import {
  useEffect,
  useState
} from 'react'

import {
  useNavigate
} from 'react-router-dom'

import wakiLogo
  from '../assets/waki_logo_full.png'

import wakiSidebarBackground
  from '../assets/waki_sidebar_background_hd.png'


export default function SalesSidebar({
  activeKey = 'home',
  profileName = 'Equipo WAKI',
  onLogout
}) {
  const navigate =
    useNavigate()

  const [
    mobileOpen,
    setMobileOpen
  ] =
    useState(false)


  const initial =
    profileName
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() ||
    'W'


  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow =
        ''

      return undefined
    }


    document.body.style.overflow =
      'hidden'


    function handleEscape(
      event
    ) {
      if (
        event.key ===
        'Escape'
      ) {
        setMobileOpen(
          false
        )
      }
    }


    window.addEventListener(
      'keydown',
      handleEscape
    )


    return () => {
      document.body.style.overflow =
        ''

      window.removeEventListener(
        'keydown',
        handleEscape
      )
    }
  }, [mobileOpen])


  function goTo(
    route
  ) {
    setMobileOpen(
      false
    )

    navigate(
      route
    )
  }


  async function handleLogout() {
    setMobileOpen(
      false
    )

    if (onLogout) {
      await onLogout()
    }
  }


  return (
    <>

      <header className="sales-mobile-nav">

        <div className="sales-mobile-nav__brand">

          <img
            src={wakiLogo}
            alt="WAKI"
          />

          <span>
            VENTAS
          </span>

        </div>


        <button
          type="button"
          className="sales-mobile-nav__toggle"
          aria-label={
            mobileOpen
              ? 'Cerrar menú'
              : 'Abrir menú'
          }
          aria-expanded={
            mobileOpen
          }
          onClick={() =>
            setMobileOpen(
              (current) =>
                !current
            )
          }
        >

          {
            mobileOpen
              ? (
                <X
                  size={23}
                  strokeWidth={1.9}
                />
              )
              : (
                <Menu
                  size={24}
                  strokeWidth={1.9}
                />
              )
          }

        </button>

      </header>


      <button
        type="button"
        className={[
          'sales-mobile-drawer-overlay',

          mobileOpen
            ? 'is-open'
            : ''
        ].join(' ')}
        aria-label="Cerrar menú"
        onClick={() =>
          setMobileOpen(
            false
          )
        }
      />


      <aside
        className={[
          'sales-sidebar',
          'sales-sidebar--reference',

          mobileOpen
            ? 'is-mobile-open'
            : ''
        ].join(' ')}
        style={{
          '--waki-sales-sidebar-background':
            `url(${wakiSidebarBackground})`
        }}
      >

        <div className="sales-sidebar-ref__top">

          <div className="sales-sidebar-ref__brand">

            <img
              src={wakiLogo}
              alt="WAKI"
            />

            <span>
              VENTAS
            </span>

          </div>


          <div className="sales-sidebar-ref__profile">

            <div className="sales-sidebar-ref__avatar">

              {initial}

            </div>


            <div className="sales-sidebar-ref__profile-copy">

              <strong>
                {profileName}
              </strong>

              <span>
                Equipo comercial
              </span>

            </div>

          </div>


          <nav className="sales-sidebar-ref__menu">

            <button
              type="button"
              className={[
                'sales-sidebar-ref__item',

                activeKey ===
                'home'
                  ? 'is-active'
                  : ''
              ].join(' ')}
              onClick={() =>
                goTo('/')
              }
            >

              <MapPinned
                size={18}
                strokeWidth={1.8}
              />

              <span>
                Inicio
              </span>

            </button>


            <button
              type="button"
              className={[
                'sales-sidebar-ref__item',

                activeKey ===
                'routes'
                  ? 'is-active'
                  : ''
              ].join(' ')}
              onClick={() =>
                goTo('/ruta')
              }
            >

              <Route
                size={18}
                strokeWidth={1.8}
              />

              <span>
                Mi ruta
              </span>

            </button>


            <button
              type="button"
              className={[
                'sales-sidebar-ref__item',

                activeKey ===
                'hotels'
                  ? 'is-active'
                  : ''
              ].join(' ')}
              onClick={() =>
                goTo(
                  '/hoteles'
                )
              }
            >

              <Building2
                size={18}
                strokeWidth={1.8}
              />

              <span>
                Hoteles
              </span>

            </button>

          </nav>

        </div>


        <div className="sales-sidebar-ref__bottom">

          <button
            type="button"
            className="sales-sidebar-ref__logout"
            onClick={
              handleLogout
            }
          >

            <LogOut
              size={17}
              strokeWidth={1.8}
            />

            <span>
              Cerrar sesión
            </span>

          </button>

        </div>

      </aside>

    </>
  )
}