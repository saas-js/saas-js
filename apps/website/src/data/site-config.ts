import Logo from '../components/saas-ui'
const baseUrl = 'https://github.com/saas-js/saas-ui'

const siteConfig = {
  logo: Logo,
  copyright: `Copyright © ${new Date().getFullYear()} Appulse Software B.V. All Rights Reserved.`,
  author: {
    name: 'Eelco Wiersma',
    github: 'https://github.com/Pagebakers',
    twitter: 'https://twitter.com/Pagebakers',
    linkedin: 'https://linkedin.com/in/eelcowiersma',
    email: 'hello@saas-ui.dev',
  },
  repo: {
    url: baseUrl,
    editUrl: `${baseUrl}/edit/main/website/pages`,
    blobUrl: `${baseUrl}/blob/main`,
  },
  discord: {
    url: 'https://discord.gg/saas-ui',
  },
  youtube: 'https://www.youtube.com/channel/UCdCi9VPceeFKYkKpS0K0Pjg',
  seo: {
    title: 'Saas.js',
    titleTemplate: '%s - Saas.js',
    description: 'Building blocks for rapid SaaS development.',
    siteUrl: 'https://saas-js.dev',
    twitter: {
      handle: '@Pagebakers',
      site: '@saas_js',
      cardType: 'summary_large_image',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://saas-js.dev',
      title: 'Saas.js',
      description: 'Building blocks for rapid SaaS development.',
      site_name: 'Saas.js: Building blocks for rapid SaaS development.',
      images: [
        {
          url: 'https://saas-js.dev/api/og',
          width: 1200,
          height: 630,
          alt: 'Building blocks for rapid SaaS development.',
        },
      ],
    },
  },
}

export default siteConfig
