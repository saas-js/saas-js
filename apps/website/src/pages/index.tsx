import * as React from 'react'

import { Box } from '@chakra-ui/layout'
import { Container, Stack, useColorModeValue } from '@chakra-ui/react'

import Hero from '@/components/marketing/hero'

import { SignupForm } from '@/components/signup-form'
import { Em, Br } from '@/components/typography'

import { FallInPlace } from '@/components/motion/fall-in-place'

import SEO from '@/components/seo'

import { BackgroundGradientRadial } from '@/components/background-gradient-radial'

const Home = () => {
  const [animateGlow, setAnimate] = React.useState()
  return (
    <Box>
      <SEO
        title="Saas.js"
        description="Building blocks for rapid SaaS development."
        titleTemplate="%s - Building blocks for rapid SaaS development."
      />

      <Box mb={8} w="full" position="relative" overflow="hidden">
        <BackgroundGradientRadial
          top="-1000px"
          opacity="0.3"
          _dark={{ opacity: 0.6 }}
          height="500px"
        />
        <Box _dark={{ bg: 'black' }} minH="100vh" pt="16">
          <Container
            maxW="container.xl"
            py={{ base: 10, lg: 20, xl: 40 }}
            position="relative"
          >
            <Stack
              direction="column"
              alignItems="center"
              position="relative"
              zIndex="2"
            >
              <Hero
                as={Stack}
                id="home"
                alignItems="center"
                textAlign="center"
                title={
                  <FallInPlace
                    textAlign="center"
                    initialInView
                    background="linear-gradient(to right bottom, rgb(255, 255, 255) 30%, rgba(255, 255, 255, 0.30))"
                    sx={{
                      '-webkit-background-clip': 'text',
                      '-webkit-text-fill-color': 'transparent',
                    }}
                  >
                    Building blocks for rapid SaaS development
                  </FallInPlace>
                }
                description={
                  <FallInPlace
                    delay={0.4}
                    fontWeight="regular"
                    textAlign="center"
                    initialInView
                  >
                    Saas.js is an ecosystem of patterns, tools and packages
                    <Br hidden={{ base: true, sm: false }} /> that help you
                    build modern SaaS products with speed.
                  </FallInPlace>
                }
              ></Hero>
              <FallInPlace delay={0.5} initialInView>
                <Box
                  width="80vw"
                  maxW="1100px"
                  margin="0 auto"
                  alignItems="center"
                  position="relative"
                  zIndex="2"
                >
                  <RequestAccess />
                </Box>
              </FallInPlace>
            </Stack>
            <BackgroundGradientRadial bottom="-20%" opacity="0.2" />
          </Container>
        </Box>
      </Box>
    </Box>
  )
}

const RequestAccess = () => {
  return (
    <Container
      borderRadius="md"
      bg={useColorModeValue('white', 'whiteAlpha.50')}
      borderWidth="1px"
      borderColor={useColorModeValue('gray.300', 'grayAlpha.700')}
      p={8}
      width={['80vw', null, 'md']}
    >
      <SignupForm />
    </Container>
  )
}

export default Home

export async function getStaticProps() {
  return {
    props: {
      header: {
        position: 'fixed',
        variant: 'dark',
      },
    },
  }
}
