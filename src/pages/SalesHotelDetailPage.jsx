import {

  useEffect,

  useState

} from 'react'



import {

  useNavigate,

  useParams

} from 'react-router-dom'



import {

  ArrowLeft,

  Building2,

  CalendarClock,

  Check,

  CheckCircle2,

  Clock3,

  Copy,

  ExternalLink,

  Globe2,

  Link2,

  Mail,

  MapPin,

  Navigation,

  Phone,

  Pencil,

  Route,

  Save,

  Send,

  StickyNote,

  UserRound,

  X

} from 'lucide-react'



import {

  supabase

} from '../lib/supabase'



import BottomNav

  from '../components/BottomNav'



import SalesSidebar

  from '../components/SalesSidebar'



import '../sales-hotel-detail.css'





const STATUS_META = {

  unvisited: {

    label: 'Sin visitar',

    tone: 'neutral'

  },



  assigned: {

    label: 'En ruta',

    tone: 'route'

  },



  visited: {

    label: 'Visitado',

    tone: 'visited'

  },



  follow_up: {

    label: 'Seguimiento',

    tone: 'follow'

  },



  interested: {

    label: 'Interesado',

    tone: 'interested'

  },



  onboarding_started: {

    label: 'Afiliación iniciada',

    tone: 'onboarding'

  },



  pending_review: {

    label: 'En revisión',

    tone: 'onboarding'

  },



  approved: {

    label: 'Afiliado',

    tone: 'approved'

  },



  not_interested: {

    label: 'No interesado',

    tone: 'rejected'

  }

}





const RESULT_LABELS = {

  no_manager:

    'No estaba el encargado',



  follow_up:

    'Volver a contactar',



  interested:

    'Interesado',



  not_interested:

    'No interesado',



  onboarding_started:

    'Iniciar afiliación'

}





const ONBOARDING_STATUS = {

  started: {

    label: 'Alta iniciada',

    tone: 'started'

  },



  invited: {

    label: 'Invitación generada',

    tone: 'invited'

  },



  claimed: {

    label: 'Acceso activado',

    tone: 'claimed'

  },



  cancelled: {

    label: 'Cancelada',

    tone: 'cancelled'

  }

}





function formatDate(

  value,

  includeTime = false

) {

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



  if (includeTime) {

    return date.toLocaleString(

      'es-PE',

      {

        day: '2-digit',

        month: 'short',

        year: 'numeric',

        hour: '2-digit',

        minute: '2-digit'

      }

    )

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





export default function SalesHotelDetailPage() {

  const navigate =

    useNavigate()



  const {

    hotelId

  } =

    useParams()





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

    successMessage,

    setSuccessMessage

  ] =

    useState('')



  const [

    showOnboardingForm,

    setShowOnboardingForm

  ] =

    useState(false)




  const [

    editingOnboarding,

    setEditingOnboarding

  ] =

    useState(false)



  const [

    contactName,

    setContactName

  ] =

    useState('')



  const [

    contactRole,

    setContactRole

  ] =

    useState('')



  const [

    contactPhone,

    setContactPhone

  ] =

    useState('')



  const [

    contactEmail,

    setContactEmail

  ] =

    useState('')



  const [

    savingOnboarding,

    setSavingOnboarding

  ] =

    useState(false)



  const [

    generatingInvite,

    setGeneratingInvite

  ] =

    useState(false)



  const [

    copiedInvite,

    setCopiedInvite

  ] =

    useState(false)





  useEffect(() => {

    loadHotel()

  }, [hotelId])





  async function loadHotel() {

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



      if (!hotelId) {

        navigate(

          '/hoteles',

          {

            replace: true

          }

        )



        return

      }



      const {

        data:

          hotelData,



        error

      } =

        await supabase

          .rpc(

            'get_my_sales_hotel_detail',

            {

              target_place_id:

                hotelId

            }

          )



      if (error) {

        throw error

      }



      if (!hotelData?.hotel) {

        throw new Error(

          'No encontramos este hotel.'

        )

      }



      setData(

        hotelData

      )



      if (

        hotelData

          ?.onboarding

      ) {

        setContactName(

          hotelData

            .onboarding

            .contact_name ||

          ''

        )



        setContactRole(

          hotelData

            .onboarding

            .contact_role ||

          ''

        )



        setContactPhone(

          hotelData

            .onboarding

            .contact_phone ||

          ''

        )



        setContactEmail(

          hotelData

            .onboarding

            .contact_email ||

          ''

        )

      }



    } catch (error) {

      console.error(

        'Error cargando hotel:',

        error

      )



      setErrorMessage(

        error?.message ||

        'No pudimos cargar el hotel.'

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





  function openNavigation() {

    const hotel =

      data?.hotel



    if (!hotel) {

      return

    }



    let destination =

      ''



    if (

      hotel.latitude &&

      hotel.longitude

    ) {

      destination =

        `${hotel.latitude},${hotel.longitude}`

    } else {

      destination =

        hotel.address ||

        hotel.name

    }



    const url =

      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`



    window.open(

      url,

      '_blank',

      'noopener,noreferrer'

    )

  }





  function openWebsite() {

    const website =

      data?.hotel?.website



    if (!website) {

      return

    }



    const url =

      website.startsWith(

        'http'

      )

        ? website

        : `https://${website}`



    window.open(

      url,

      '_blank',

      'noopener,noreferrer'

    )

  }





  function openOnboardingForm() {

    setErrorMessage('')
    setSuccessMessage('')
    setEditingOnboarding(false)

    setShowOnboardingForm(
      true
    )

  }





  function openEditOnboardingForm() {

    const onboarding =
      data?.onboarding

    if (!onboarding) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    setContactName(
      onboarding.contact_name ||
      ''
    )

    setContactRole(
      onboarding.contact_role ||
      ''
    )

    setContactPhone(
      onboarding.contact_phone ||
      ''
    )

    setContactEmail(
      onboarding.contact_email ||
      ''
    )

    setEditingOnboarding(true)

    setShowOnboardingForm(
      true
    )

  }





  function closeOnboardingForm() {

    if (
      savingOnboarding
    ) {
      return
    }

    setShowOnboardingForm(
      false
    )

    setEditingOnboarding(false)
    setErrorMessage('')

  }





  async function handleSaveOnboarding(

    event

  ) {

    event.preventDefault()

    if (
      !contactName.trim()
    ) {

      setErrorMessage(
        'Ingresa el nombre del responsable.'
      )

      return
    }

    if (
      !contactEmail.trim()
    ) {

      setErrorMessage(
        'Ingresa el correo del responsable.'
      )

      return
    }

    try {

      setSavingOnboarding(
        true
      )

      setErrorMessage('')
      setSuccessMessage('')

      const rpcName =
        editingOnboarding
          ? 'update_sales_hotel_onboarding_contact'
          : 'start_sales_hotel_onboarding'

      const {
        error
      } =
        await supabase
          .rpc(
            rpcName,
            {
              target_place_id:
                hotelId,

              target_contact_name:
                contactName.trim(),

              target_contact_role:
                contactRole
                  .trim() ||
                null,

              target_contact_phone:
                contactPhone
                  .trim() ||
                null,

              target_contact_email:
                contactEmail.trim()
            }
          )

      if (error) {
        throw error
      }

      setShowOnboardingForm(
        false
      )

      setEditingOnboarding(
        false
      )

      setSuccessMessage(
        editingOnboarding
          ? 'Datos de contacto actualizados correctamente.'
          : 'Alta Express iniciada correctamente.'
      )

      await loadHotel()

    } catch (error) {

      console.error(
        editingOnboarding
          ? 'Error actualizando afiliación:'
          : 'Error iniciando afiliación:',
        error
      )

      let message =
        error?.message ||
        (
          editingOnboarding
            ? 'No pudimos actualizar los datos.'
            : 'No pudimos iniciar la afiliación.'
        )

      if (
        message.includes(
          'CONTACT_NAME_REQUIRED'
        )
      ) {
        message =
          'Ingresa el nombre del responsable.'
      }

      if (
        message.includes(
          'VALID_CONTACT_EMAIL_REQUIRED'
        )
      ) {
        message =
          'Ingresa un correo electrónico válido.'
      }

      if (
        message.includes(
          'ONBOARDING_ALREADY_CLAIMED'
        )
      ) {
        message =
          'Esta afiliación ya fue activada y ya no puede editarse desde Ventas.'
      }

      if (
        message.includes(
          'ONBOARDING_CASE_NOT_FOUND'
        )
      ) {
        message =
          'No encontramos esta afiliación.'
      }

      setErrorMessage(
        message
      )

    } finally {

      setSavingOnboarding(
        false
      )

    }

  }





  function buildInviteUrl(

    token

  ) {

    if (!token) {

      return ''

    }



    return (

      `${window.location.origin}` +

      `/hotel/invitacion/${token}`

    )

  }





  async function handleGenerateInvite() {

    try {

      setGeneratingInvite(

        true

      )



      setCopiedInvite(

        false

      )



      setErrorMessage('')

      setSuccessMessage('')



      const {

        data:

          inviteData,



        error

      } =

        await supabase

          .rpc(

            'mark_sales_hotel_onboarding_invited',

            {

              target_place_id:

                hotelId

            }

          )



      if (error) {

        throw error

      }



      const inviteUrl =

        buildInviteUrl(

          inviteData

            ?.invite_token

        )



      if (!inviteUrl) {

        throw new Error(

          'No pudimos generar el enlace de invitación.'

        )

      }



      await navigator

        .clipboard

        .writeText(

          inviteUrl

        )



      setCopiedInvite(

        true

      )



      setSuccessMessage(

        'Invitación generada y copiada.'

      )



      await loadHotel()



    } catch (error) {

      console.error(

        'Error generando invitación:',

        error

      )



      setErrorMessage(

        error?.message ||

        'No pudimos generar la invitación.'

      )



    } finally {

      setGeneratingInvite(

        false

      )

    }

  }





  async function handleCopyExistingInvite() {

    const token =

      data

        ?.onboarding

        ?.invite_token



    if (!token) {

      return

    }



    try {

      await navigator

        .clipboard

        .writeText(

          buildInviteUrl(

            token

          )

        )



      setCopiedInvite(

        true

      )



      setSuccessMessage(

        'Enlace de invitación copiado.'

      )



    } catch (error) {

      console.error(

        'Error copiando invitación:',

        error

      )



      setErrorMessage(

        'No pudimos copiar el enlace.'

      )

    }

  }





  if (loading) {

    return (

      <div className="sales-auth-loading">



        <div

          className="sales-auth-spinner"

        />



        <p>

          Cargando hotel...

        </p>



      </div>

    )

  }





  const hotel =

    data?.hotel



  const visits =

    Array.isArray(

      data?.visits

    )

      ? data.visits

      : []



  const summary =

    data?.summary ||

    {}



  const onboarding =

    data?.onboarding ||

    null



  const status =

    STATUS_META[

      hotel?.commercial_status

    ] ||

    STATUS_META.unvisited



  const onboardingStatus =

    onboarding

      ? (

          ONBOARDING_STATUS[

            onboarding.status

          ] ||

          ONBOARDING_STATUS.started

        )

      : null



  const canStartOnboarding =

    !onboarding &&

    [

      'interested',

      'onboarding_started'

    ].includes(

      hotel?.commercial_status

    )



  const inviteUrl =

    onboarding

      ?.invite_token

      ? buildInviteUrl(

          onboarding

            .invite_token

        )

      : ''





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





      <main className="sales-hotel-detail-page">



        <header className="sales-hotel-detail-header">



          <button

            type="button"

            className="sales-hotel-detail-back"

            onClick={() =>

              navigate(

                '/hoteles'

              )

            }

          >



            <ArrowLeft

              size={19}

              strokeWidth={1.8}

            />



          </button>





          <div className="sales-hotel-detail-header__copy">



            <h1>

              {hotel?.name}

            </h1>



            <p>



              <MapPin

                size={15}

                strokeWidth={1.8}

              />



              <span>

                {

                  hotel?.district ||

                  'Sin distrito'

                }

              </span>



            </p>



          </div>





          <span

            className={

              `sales-status-badge is-${status.tone}`

            }

          >

            {status.label}

          </span>



        </header>





        {

          errorMessage &&

          (

            <div className="sales-dashboard-error">

              {errorMessage}

            </div>

          )

        }





        {

          successMessage &&

          (

            <div className="sales-hotel-detail-success">



              <CheckCircle2

                size={17}

                strokeWidth={1.8}

              />



              {successMessage}



            </div>

          )

        }





        <section className="sales-hotel-detail-grid">



          <article className="sales-hotel-info-card">



            <div className="sales-hotel-info-card__heading">



              <div className="sales-hotel-info-card__icon">



                <Building2

                  size={21}

                  strokeWidth={1.7}

                />



              </div>



              <div>



                <h2>

                  Información del hotel

                </h2>



                <p>

                  Datos comerciales disponibles

                </p>



              </div>



            </div>





            <div className="sales-hotel-info-list">



              <div>



                <MapPin

                  size={17}

                  strokeWidth={1.8}

                />



                <div>



                  <span>

                    Dirección

                  </span>



                  <strong>

                    {

                      hotel?.address ||

                      'No disponible'

                    }

                  </strong>



                </div>



              </div>





              <div>



                <Phone

                  size={17}

                  strokeWidth={1.8}

                />



                <div>



                  <span>

                    Teléfono

                  </span>



                  <strong>

                    {

                      hotel?.phone ||

                      'No disponible'

                    }

                  </strong>



                </div>



              </div>





              <div>



                <Globe2

                  size={17}

                  strokeWidth={1.8}

                />



                <div>



                  <span>

                    Sitio web

                  </span>



                  <strong>

                    {

                      hotel?.website ||

                      'No disponible'

                    }

                  </strong>



                </div>



              </div>





              <div>



                <Clock3

                  size={17}

                  strokeWidth={1.8}

                />



                <div>



                  <span>

                    Última visita

                  </span>



                  <strong>

                    {

                      formatDate(

                        hotel

                          ?.last_visited_at,

                        true

                      )

                    }

                  </strong>



                </div>



              </div>



            </div>





            <div className="sales-hotel-detail-actions">



              <button

                type="button"

                className="is-primary"

                onClick={

                  openNavigation

                }

              >



                <Navigation

                  size={17}

                  strokeWidth={1.8}

                />



                Abrir navegación



                <ExternalLink

                  size={14}

                  strokeWidth={1.8}

                />



              </button>





              {

                hotel?.website &&

                (

                  <button

                    type="button"

                    onClick={

                      openWebsite

                    }

                  >



                    <Globe2

                      size={17}

                      strokeWidth={1.8}

                    />



                    Sitio web



                  </button>

                )

              }



            </div>



          </article>





          <aside className="sales-hotel-summary-card">



            <h2>

              Resumen comercial

            </h2>





            <div className="sales-hotel-summary-stat">



              <span>

                Visitas registradas

              </span>



              <strong>

                {

                  Number(

                    summary

                      .visit_count ||

                    0

                  )

                }

              </strong>



            </div>





            <div className="sales-hotel-summary-row">



              <CalendarClock

                size={18}

                strokeWidth={1.8}

              />



              <div>



                <span>

                  Próximo seguimiento

                </span>



                <strong>

                  {

                    formatDate(

                      summary

                        .next_follow_up_at,

                      true

                    )

                  }

                </strong>



              </div>



            </div>





            <div className="sales-hotel-summary-row">



              <Building2

                size={18}

                strokeWidth={1.8}

              />



              <div>



                <span>

                  Estado comercial

                </span>



                <strong>

                  {status.label}

                </strong>



              </div>



            </div>





            {

              canStartOnboarding &&

              (

                <button

                  type="button"

                  className="sales-start-onboarding-button"

                  onClick={

                    openOnboardingForm

                  }

                >



                  <UserRound

                    size={17}

                    strokeWidth={1.8}

                  />



                  Iniciar Alta Express



                </button>

              )

            }



          </aside>



        </section>





        {

          onboarding &&

          (

            <section className="sales-onboarding-case">



              <div className="sales-onboarding-case__header">



                <div>



                  <span>

                    Alta Express

                  </span>



                  <h2>

                    Afiliación en proceso

                  </h2>



                </div>





                <span

                  className={

                    `sales-onboarding-case__status is-${onboardingStatus.tone}`

                  }

                >

                  {

                    onboardingStatus

                      .label

                  }

                </span>



              </div>





              <div className="sales-onboarding-contact-grid">



                <div>



                  <UserRound

                    size={17}

                    strokeWidth={1.8}

                  />



                  <div>



                    <span>

                      Responsable

                    </span>



                    <strong>

                      {

                        onboarding

                          .contact_name

                      }

                    </strong>



                  </div>



                </div>





                <div>



                  <Building2

                    size={17}

                    strokeWidth={1.8}

                  />



                  <div>



                    <span>

                      Cargo

                    </span>



                    <strong>

                      {

                        onboarding

                          .contact_role ||

                        'No especificado'

                      }

                    </strong>



                  </div>



                </div>





                <div>



                  <Mail

                    size={17}

                    strokeWidth={1.8}

                  />



                  <div>



                    <span>

                      Correo

                    </span>



                    <strong>

                      {

                        onboarding

                          .contact_email

                      }

                    </strong>



                  </div>



                </div>





                <div>



                  <Phone

                    size={17}

                    strokeWidth={1.8}

                  />



                  <div>



                    <span>

                      Teléfono

                    </span>



                    <strong>

                      {

                        onboarding

                          .contact_phone ||

                        'No especificado'

                      }

                    </strong>



                  </div>



                </div>



              </div>





              {

                onboarding.status !==

                  'claimed' &&

                (

                  <div className="sales-hotel-detail-actions">



                    <button
                      type="button"
                      onClick={
                        openEditOnboardingForm
                      }
                    >

                      <Pencil
                        size={16}
                        strokeWidth={1.8}
                      />

                      Editar datos

                    </button>



                    {
                      onboarding.status ===

                      'started'

                        ? (

                          <button

                            type="button"

                            className="is-primary"

                            disabled={

                              generatingInvite

                            }

                            onClick={

                              handleGenerateInvite

                            }

                          >



                            <Send

                              size={16}

                              strokeWidth={1.8}

                            />



                            {

                              generatingInvite

                                ? 'Generando...'

                                : 'Generar invitación'

                            }



                          </button>

                        )

                        : (

                          <button

                            type="button"

                            className="is-primary"

                            onClick={

                              handleCopyExistingInvite

                            }

                          >



                            {

                              copiedInvite

                                ? (

                                  <Check

                                    size={16}

                                    strokeWidth={1.8}

                                  />

                                )

                                : (

                                  <Copy

                                    size={16}

                                    strokeWidth={1.8}

                                  />

                                )

                            }



                            {

                              copiedInvite

                                ? 'Enlace copiado'

                                : 'Copiar invitación'

                            }



                          </button>

                        )

                    }





                    {

                      inviteUrl &&

                      onboarding.status ===

                        'invited' &&

                      (

                        <button

                          type="button"

                          onClick={() =>

                            window.open(

                              inviteUrl,

                              '_blank',

                              'noopener,noreferrer'

                            )

                          }

                        >



                          <Link2

                            size={16}

                            strokeWidth={1.8}

                          />



                          Vista previa



                        </button>

                      )

                    }



                  </div>

                )

              }





              <div className="sales-onboarding-case__footer">



                <span>

                  Alta creada:

                </span>



                <strong>

                  {

                    formatDate(

                      onboarding

                        .created_at,

                      true

                    )

                  }

                </strong>



                {

                  onboarding

                    .invite_expires_at &&

                  onboarding.status ===

                    'invited' &&

                  (

                    <>

                      <span>

                        · Invitación válida hasta:

                      </span>



                      <strong>

                        {

                          formatDate(

                            onboarding

                              .invite_expires_at,

                            true

                          )

                        }

                      </strong>

                    </>

                  )

                }



              </div>



            </section>

          )

        }





        <section className="sales-hotel-history">



          <div className="sales-hotel-history__header">



            <div>



              <h2>

                Historial de visitas

              </h2>



              <p>

                Actividad comercial registrada

                con este establecimiento.

              </p>



            </div>





            <span>

              {visits.length}

              {' '}

              {

                visits.length === 1

                  ? 'visita'

                  : 'visitas'

              }

            </span>



          </div>





          {

            visits.length === 0

              ? (

                <div className="sales-hotel-history-empty">



                  <Clock3

                    size={27}

                    strokeWidth={1.6}

                  />



                  <strong>

                    Aún no hay visitas

                  </strong>



                  <p>

                    El historial aparecerá

                    cuando registres una visita.

                  </p>



                </div>

              )

              : (

                <div className="sales-hotel-timeline">



                  {

                    visits.map(

                      (

                        visit,

                        index

                      ) => (

                        <article

                          key={

                            visit.id

                          }

                          className="sales-hotel-visit"

                        >



                          <div className="sales-hotel-visit__timeline">



                            <div className="sales-hotel-visit__dot" />



                            {

                              index <

                              visits.length - 1 &&

                              (

                                <div className="sales-hotel-visit__line" />

                              )

                            }



                          </div>





                          <div className="sales-hotel-visit__content">



                            <div className="sales-hotel-visit__top">



                              <div>



                                <strong>

                                  {

                                    RESULT_LABELS[

                                      visit.result

                                    ] ||

                                    visit.result

                                  }

                                </strong>



                                <span>

                                  {

                                    formatDate(

                                      visit

                                        .visited_at,

                                      true

                                    )

                                  }

                                </span>



                              </div>





                              {

                                visit.route_date &&

                                (

                                  <span className="sales-hotel-route-tag">



                                    <Route

                                      size={13}

                                      strokeWidth={1.8}

                                    />



                                    {

                                      visit

                                        .route_district ||

                                      'Ruta'

                                    }



                                  </span>

                                )

                              }



                            </div>





                            {

                              visit.notes &&

                              (

                                <div className="sales-hotel-visit__notes">



                                  <StickyNote

                                    size={15}

                                    strokeWidth={1.7}

                                  />



                                  <p>

                                    {visit.notes}

                                  </p>



                                </div>

                              )

                            }





                            {

                              visit

                                .next_follow_up_at &&

                              (

                                <div className="sales-hotel-visit__follow">



                                  <CalendarClock

                                    size={15}

                                    strokeWidth={1.8}

                                  />



                                  <span>

                                    Próximo seguimiento:

                                  </span>



                                  <strong>

                                    {

                                      formatDate(

                                        visit

                                          .next_follow_up_at,

                                        true

                                      )

                                    }

                                  </strong>



                                </div>

                              )

                            }



                          </div>



                        </article>

                      )

                    )

                  }



                </div>

              )

          }



        </section>





        <div className="sales-mobile-bottom-space" />



      </main>





      <BottomNav

        activeKey="hotels"

      />





      {

        showOnboardingForm &&

        (

          <div className="sales-onboarding-modal">



            <button

              type="button"

              className="sales-onboarding-modal__overlay"

              onClick={

                closeOnboardingForm

              }

              aria-label="Cerrar"

            />





            <section className="sales-onboarding-modal__card">



              <div className="sales-onboarding-modal__header">



                <div>



                  <span>

                    Alta Express

                  </span>



                  <h2>

                    {
                      editingOnboarding
                        ? 'Editar datos de contacto'
                        : 'Iniciar afiliación'
                    }

                  </h2>



                  <p>

                    {
                      editingOnboarding
                        ? 'Actualiza los datos del responsable que recibirá la invitación del hotel.'
                        : 'Registra al responsable que continuará la afiliación del hotel en WAKI.'
                    }

                  </p>



                </div>





                <button

                  type="button"

                  onClick={

                    closeOnboardingForm

                  }

                  aria-label="Cerrar"

                >



                  <X

                    size={20}

                    strokeWidth={1.8}

                  />



                </button>



              </div>





              <form

                onSubmit={

                  handleSaveOnboarding

                }

              >



                <label>



                  <span>

                    Nombre del responsable *

                  </span>



                  <input

                    type="text"

                    value={

                      contactName

                    }

                    placeholder="Ej. María Pérez"

                    onChange={

                      (event) =>

                        setContactName(

                          event.target.value

                        )

                    }

                    required

                  />



                </label>





                <label>



                  <span>

                    Cargo

                  </span>



                  <input

                    type="text"

                    value={

                      contactRole

                    }

                    placeholder="Ej. Administrador"

                    onChange={

                      (event) =>

                        setContactRole(

                          event.target.value

                        )

                    }

                  />



                </label>





                <label>



                  <span>

                    Correo electrónico *

                  </span>



                  <input

                    type="email"

                    value={

                      contactEmail

                    }

                    placeholder="correo@hotel.com"

                    onChange={

                      (event) =>

                        setContactEmail(

                          event.target.value

                        )

                    }

                    required

                  />



                </label>





                <label>



                  <span>

                    Teléfono

                  </span>



                  <input

                    type="tel"

                    value={

                      contactPhone

                    }

                    placeholder="+51 999 999 999"

                    onChange={

                      (event) =>

                        setContactPhone(

                          event.target.value

                        )

                    }

                  />



                </label>





                <div className="sales-onboarding-modal__actions">



                  <button

                    type="button"

                    className="is-secondary"

                    onClick={

                      closeOnboardingForm

                    }

                    disabled={

                      savingOnboarding

                    }

                  >

                    Cancelar

                  </button>





                  <button

                    type="submit"

                    className="is-primary"

                    disabled={

                      savingOnboarding

                    }

                  >



                    <Save

                      size={16}

                      strokeWidth={1.8}

                    />



                    {

                      savingOnboarding

                        ? 'Guardando...'

                        : (
                            editingOnboarding
                              ? 'Guardar cambios'
                              : 'Iniciar Alta Express'
                          )

                    }



                  </button>



                </div>



              </form>



            </section>



          </div>

        )

      }



    </div>

  )

}