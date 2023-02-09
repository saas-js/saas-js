import { Flex, HStack, IconButton, Stack, Text } from '@chakra-ui/react'
import { Link } from '@saas-ui/react'
import { FaDiscord, FaGithub, FaTwitter } from 'react-icons/fa'
import Footer, { Copyright, FooterLink } from './layout/footer'

import Logo from './saas-ui'

const CustomFooter = () => {
  return (
    <Footer columns={{ base: 1, sm: 2 }}>
      <Stack flex="1">
        <Stack alignItems="flex-start">
          <Flex width="100px">
            <Logo />
          </Flex>
        </Stack>
        <Copyright>
          Built by{' '}
          <FooterLink href="https://twitter.com/Pagebakers">
            Eelco Wiersma
          </FooterLink>
        </Copyright>
      </Stack>
      <Stack flexDirection={{ base: 'column-reverse' }}>
        <Stack
          justify="flex-end"
          spacing="4"
          alignSelf={{ base: 'flex-start', sm: 'flex-end' }}
          alignItems={{ base: 'flex-start', sm: 'flex-end' }}
          direction="row"
        >
          <FooterLink href="mailto:hello@saas-ui.dev">Contact</FooterLink>
          <FooterLink href="/terms">Terms</FooterLink>
          <FooterLink href="/privacy">Privacy</FooterLink>
        </Stack>
        <HStack />
        <HStack spacing="4" alignSelf={{ base: 'flex-start', sm: 'flex-end' }}>
          <IconButton
            variant="ghost"
            aria-label="discord"
            icon={<FaDiscord size="14" />}
            borderRadius="md"
            as={Link}
            href="https://discord.gg/4PmJGFcAjX"
          />

          <IconButton
            variant="ghost"
            aria-label="twitter"
            icon={<FaTwitter size="14" />}
            borderRadius="md"
            as={Link}
            href="https://twitter.com/saas_js"
          />

          <IconButton
            variant="ghost"
            aria-label="github"
            icon={<FaGithub size="14" />}
            borderRadius="md"
            as={Link}
            href="https://github.com/saas-js/saas-js"
          />
        </HStack>
      </Stack>
    </Footer>
  )
}

export default CustomFooter
