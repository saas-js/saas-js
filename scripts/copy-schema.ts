#!/usr/bin/env tsx
import { copyFile, mkdir } from 'fs/promises'
import { dirname, resolve } from 'path'

async function copyIconifySchema() {
  const sourceSchema = resolve(__dirname, '../packages/iconify-react/icons.schema.json')
  const targetDir = resolve(__dirname, '../website/public/icons')
  const targetSchema = resolve(targetDir, 'schema.json')

  try {
    // Ensure target directory exists
    await mkdir(dirname(targetSchema), { recursive: true })
    
    // Copy schema file
    await copyFile(sourceSchema, targetSchema)
    
    console.log('✅ Successfully copied iconify-react schema to website/public/icons/schema.json')
  } catch (error) {
    console.error('❌ Failed to copy schema:', error)
    process.exit(1)
  }
}

copyIconifySchema()