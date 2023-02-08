import { AppProps } from 'next/app'
import Script from 'next/script'
import Layout from '@/components/layout'

import theme from '../styles/theme'

import { SaasProvider, ModalsProvider, AuthProvider } from '@saas-ui/react'
import { NProgressNextRouter } from '@saas-ui/nprogress'

import Footer from '@/components/footer'
import { useRouter } from 'next/router'

const MyApp = ({ Component, pageProps }: AppProps<any>) => {
  const router = useRouter()
  return (
    <SaasProvider
      theme={theme}
      colorModeManager={{
        get: () => 'dark',
        set: () => {},
        type: 'localStorage',
      }}
    >
      <AuthProvider>
        <ModalsProvider>
          <Layout
            announcement={pageProps.announcement}
            header={pageProps.header}
            footer={pageProps.footer !== false ? <Footer /> : null}
          >
            <Script
              id="pirschjs"
              strategy="afterInteractive"
              src="https://api.pirsch.io/pirsch.js"
              data-code="0wmOd91WUKqHhN2foO6rJdvW4Ak2Wscq"
            />
            <Script
              id="pirscheventsjs"
              strategy="afterInteractive"
              src="https://api.pirsch.io/pirsch-events.js"
              data-code="0wmOd91WUKqHhN2foO6rJdvW4Ak2Wscq"
            />
            <NProgressNextRouter router={router} />
            <Component {...pageProps} />
          </Layout>
        </ModalsProvider>
      </AuthProvider>
    </SaasProvider>
  )
}

export default MyApp

export function getServerSideProps({ req }) {
  return {
    props: {
      // first time users will not have any cookies and you may not return
      // undefined here, hence ?? is necessary
      cookies: req.headers.cookie ?? '',
    },
  }
}
