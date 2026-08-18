import { Box, ChakraProvider, Flex, Stack, Text, defaultSystem } from '@chakra-ui/react'

import { type ContactsQuery } from '../shared/definition.ts'
import { base } from './conditions-hook.ts'
import { ContactTable, QueryDetails } from './contact-table.tsx'
import {
  ClearButton,
  ConditionTree,
  GroupNode,
  MobileFilterHeader,
} from './filter-bar.tsx'
import { FilterChip } from './filter-chip.tsx'
import {
  ChakraCurrencyEditor,
  ChakraDateEditor,
  ChakraStringEditor,
} from './value-editors.tsx'

export const chakraConditions = base.extendConditions({
  valueEditors: { string: ChakraStringEditor, date: ChakraDateEditor },
  fieldValueEditors: { arr: ChakraCurrencyEditor },
  conditionComponents: { FilterChip },
  groupComponents: { GroupNode },
  conditionsComponents: { ConditionTree, ClearButton },
})

export interface ChakraBuilderProps {
  defaultValue?: ContactsQuery
  value?: ContactsQuery
  onValueChange?(value: ContactsQuery): void
  eyebrow?: string
}

function ChakraBuilderInner({
  defaultValue,
  value,
  onValueChange,
  eyebrow = 'Contact filters',
}: ChakraBuilderProps) {
  const conditions = chakraConditions.useConditions({
    defaultValue,
    value,
    onValueChange: (details) => onValueChange?.(details.value),
  })
  return (
    <Box minH="100vh" bg="#f7f7f8" color="gray.950">
      <conditions.Root>
        <Box as="header" bg="white" borderBottomWidth="1px">
          <Flex
            maxW="6xl"
            mx="auto"
            align="center"
            justify="space-between"
            px={{ base: '4', md: '8' }}
            py="4"
          >
            <Box>
              <Text fontSize="md" fontWeight="semibold" letterSpacing="tight">
                Contacts
              </Text>
              <Text fontSize="xs" color="gray.500">
                {eyebrow}
              </Text>
            </Box>
            <Flex
              boxSize="8"
              align="center"
              justify="center"
              borderRadius="full"
              bg="gray.900"
              color="white"
              fontSize="10px"
              fontWeight="semibold"
            >
              SJ
            </Flex>
          </Flex>
        </Box>
        <Box bg="gray.100" borderBottomWidth="1px">
          <Box maxW="6xl" mx="auto" px={{ base: '4', md: '8' }} py="3">
            <MobileFilterHeader />
            <Flex align="start" gap="2">
              <Box minW="0" flex="1">
                <conditions.ConditionTree />
              </Box>
              <Box display={{ base: 'none', sm: 'block' }}>
                <conditions.ClearButton />
              </Box>
            </Flex>
          </Box>
        </Box>
        <Stack
          maxW="6xl"
          mx="auto"
          gap="4"
          px={{ base: '4', md: '8' }}
          py={{ base: '6', md: '8' }}
        >
          <ContactTable />
          <QueryDetails />
        </Stack>
      </conditions.Root>
    </Box>
  )
}

export function ChakraBuilder(props: ChakraBuilderProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ChakraBuilderInner {...props} />
    </ChakraProvider>
  )
}
