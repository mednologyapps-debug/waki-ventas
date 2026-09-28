import {
  Navigate,
  Route,
  Routes
} from 'react-router-dom'

import SalesHomePage
  from './pages/SalesHomePage'

import SalesLoginPage
  from './pages/SalesLoginPage'

import SalesActiveRoutePage
  from './pages/SalesActiveRoutePage'

  import SalesHotelsPage
  from './pages/SalesHotelsPage'

  import SalesHotelDetailPage
  from './pages/SalesHotelDetailPage'

  import SalesRoutesHistoryPage
  from './pages/SalesRoutesHistoryPage'

  import HotelInvitePage
  from './pages/HotelInvitePage'

  

export default function App() {
  return (
    <Routes>

      <Route
        path="/login"
        element={
          <SalesLoginPage />
        }
      />

      <Route
  path="/hotel/invitacion/:token"
  element={
    <HotelInvitePage />
  }
/>

      <Route
  path="/hoteles"
  element={
    <SalesHotelsPage />
  }
/>

<Route
  path="/historial"
  element={
    <SalesRoutesHistoryPage />
  }
/>

<Route
  path="/hoteles/:hotelId"
  element={
    <SalesHotelDetailPage />
  }
/>

      <Route
        path="/"
        element={
          <SalesHomePage />
        }
      />

      <Route
        path="/ruta"
        element={
          <SalesActiveRoutePage />
        }
      />

      <Route
        path="/ruta/:routeId"
        element={
          <SalesActiveRoutePage />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  )
}
