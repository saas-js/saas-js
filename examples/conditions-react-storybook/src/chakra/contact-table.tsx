import { Box, Flex, HStack, Stack, Text } from '@chakra-ui/react'
import { Braces, ChevronDown, UsersRound } from 'lucide-react'

import { contacts, formatContactValue } from '../shared/definition.ts'
import { base } from './conditions-hook.ts'

export function ContactTable() {
  const conditions = base.useConditionsContext()
  const matches = conditions.useFilter(contacts)
  return (
    <Box
      as="section"
      bg="white"
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
      aria-label="Matching contacts"
    >
      <Flex
        align="center"
        justify="space-between"
        px="4"
        py="3"
        borderBottomWidth="1px"
      >
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            Contacts
          </Text>
          <Text mt="0.5" fontSize="xs" color="gray.500">
            Live results from the portable condition query
          </Text>
        </Box>
        <Text
          px="2"
          py="1"
          borderRadius="md"
          bg="gray.100"
          color="gray.600"
          fontFamily="mono"
          fontSize="xs"
        >
          {matches.length} of {contacts.length}
        </Text>
      </Flex>
      <Box overflowX="auto">
        <Box minW="620px">
          <Box
            display="grid"
            gridTemplateColumns="minmax(12rem,1.5fr) minmax(10rem,1fr) 7rem 9rem"
            gap="4"
            px="4"
            py="2"
            borderBottomWidth="1px"
            bg="gray.50"
            color="gray.500"
            fontSize="10px"
            fontWeight="medium"
            letterSpacing="wide"
            textTransform="uppercase"
          >
            <Text>Contact</Text>
            <Text>Status</Text>
            <Text>ARR</Text>
            <Text>Owner</Text>
          </Box>
          {matches.map((contact) => (
            <Box
              key={contact.id}
              display="grid"
              gridTemplateColumns="minmax(12rem,1.5fr) minmax(10rem,1fr) 7rem 9rem"
              alignItems="center"
              gap="4"
              px="4"
              py="3"
              borderBottomWidth="1px"
              fontSize="sm"
              _hover={{ bg: 'gray.50' }}
            >
              <HStack minW="0" gap="3">
                <Flex
                  boxSize="8"
                  flexShrink="0"
                  align="center"
                  justify="center"
                  borderRadius="full"
                  bg="gray.100"
                  color="gray.600"
                  fontSize="xs"
                  fontWeight="semibold"
                >
                  {contact.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </Flex>
                <Box minW="0">
                  <Text truncate fontWeight="medium">
                    {contact.name}
                  </Text>
                  <Text truncate fontSize="xs" color="gray.500">
                    {contact.company}
                  </Text>
                </Box>
              </HStack>
              <HStack gap="2">
                <Box
                  boxSize="2"
                  borderRadius="full"
                  bg={
                    contact.status === 'customer'
                      ? 'purple.500'
                      : contact.status === 'lead'
                        ? 'yellow.400'
                        : 'gray.400'
                  }
                />
                <Text textTransform="capitalize">{contact.status}</Text>
              </HStack>
              <Text fontFamily="mono" fontSize="xs">
                {formatContactValue('arr', contact.arr)}
              </Text>
              <Text truncate color="gray.600">
                {formatContactValue('owner', contact.owner).split(' ')[0]}
              </Text>
            </Box>
          ))}
          {!matches.length ? (
            <Stack align="center" gap="1" py="14">
              <Box color="gray.400">
                <UsersRound size={20} />
              </Box>
              <Text mt="2" fontSize="sm" fontWeight="medium">
                No matching contacts
              </Text>
              <Text fontSize="xs" color="gray.500">
                Try widening or removing a filter.
              </Text>
            </Stack>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}

export function QueryDetails() {
  const conditions = base.useConditionsContext()
  const query = conditions.useValue()
  return (
    <Box
      as="details"
      bg="white"
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
    >
      <HStack
        as="summary"
        cursor="pointer"
        px="4"
        py="3"
        gap="2"
        fontSize="sm"
        fontWeight="medium"
        css={{ '&::-webkit-details-marker': { display: 'none' } }}
      >
        <Box color="gray.500">
          <Braces size={16} />
        </Box>
        <Text>Current query</Text>
        <Box ms="auto" color="gray.400">
          <ChevronDown size={16} />
        </Box>
      </HStack>
      <Box
        as="pre"
        maxH="288px"
        overflow="auto"
        m="0"
        p="4"
        borderTopWidth="1px"
        bg="gray.950"
        color="gray.100"
        fontFamily="mono"
        fontSize="xs"
        lineHeight="5"
      >
        {JSON.stringify(query, null, 2)}
      </Box>
    </Box>
  )
}
