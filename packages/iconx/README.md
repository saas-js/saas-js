# Iconx

A CLI tool for fetching and generating type-safe React icon components from the extensive [Iconify](https://iconify.design) icon library.

## About

@saas-js/iconify allows you to:

- 🚀 Generate React components from 200,000+ icons across 150+ icon sets
- 📝 Full TypeScript support with proper types and interfaces
- ⚙️ Configurable output directory, icon sizes, and aliases
- 🔧 CLI and MCP (Model Context Protocol) server support
- 🎨 Customizable icon size with runtime override support
- 🏷️ Icon aliasing for better naming conventions (config or inline)
- 📦 Automatic index.ts generation for easy imports

This package wouldn't be possible without the great work of [Vjacheslav Trushkin](https://x.com/slava_trushkin).

### Why does this exist?

**Problems with existing solutions:**

- **Iconify web components** require an internet connection and don't work offline
- **react-icons** is heavy (~2MB+), has poor tree-shaking, and causes performance issues in Next.js
- **Icon fonts** are outdated, not accessible, and hard to customize
- **Manual SVG copying or sprites** is tedious and hard to maintain

**Our approach:**

Similar to [shadcn/ui](https://ui.shadcn.com/) or [sly-cli](https://sly-cli.fly.dev/), we generate the actual source code that you own and control. But instead of a limited set of components, you get access to **200,000+ icons** from the entire Iconify ecosystem.

**Benefits:**

- ✅ **RSC** - Works with React Server Components
- ✅ **Offline-first** - Icons work without internet connection
- ✅ **Perfect tree-shaking** - Only bundle the icons you actually use
- ✅ **Full ownership** - Generated code lives in your codebase
- ✅ **Type-safe** - Complete TypeScript support with proper interfaces
- ✅ **Massive library** - 150+ icon sets vs limited selection in other tools

While there are definitely downsides to using [SVG-in-JS](https://kurtextrem.de/posts/svg-in-js), we feel like the benefits outweight the cons when building React apps and only use a dozen of icons on any screen.

## Installation

```bash
# Using npm
npm install iconx

# Using yarn
yarn add iconx

# Using bun
bun add iconx

# Or run directly with npx (no installation needed)
npx iconx init
npx iconx add --set lucide home user
```

## Quick Start

1. **Initialize configuration:**

   ```bash
   iconx init
   ```

2. **Add icons to your project:**

   ```bash
   # With explicit icon set
   icons add --set lucide home user settings

   # Using default icon set (if configured)
   icons add home user settings
   ```

3. **Use generated components:**

   ```tsx
   // Individual imports
   import { HomeIcon } from './components/icons/home-icon'
   import { SettingsIcon } from './components/icons/settings-icon'
   import { UserIcon } from './components/icons/user-icon'

   // Or with generateIndex enabled, import from index
   import { HomeIcon, UserIcon, SettingsIcon } from './components/icons'

   function App() {
     return (
       <div>
         <HomeIcon size="24px" />
         <UserIcon className="text-blue-500" />
         <SettingsIcon size="1.5rem" />
       </div>
     )
   }
   ```

## CLI Commands

### `init`

Initialize an `icons.json` configuration file in your project root.

```bash
icons init
```

This will prompt you for:

- Output directory for generated icons
- Default icon set (e.g., lucide, heroicons, tabler)
- Default icon size

### `add`

Add icons to your project by generating React components.

```bash
# Basic usage with explicit icon set
icons add --set lucide home user settings

# Using short flag
icons add -s heroicons home user settings

# Using default icon set (if configured in icons.json)
icons add home user settings

# Custom output directory
icons add --set lucide --outdir ./src/icons home user

# Short flags
icons add -s lucide -o ./src/icons home user

# Inline aliases using colon syntax
icons add home:house user:profile settings

# Multiple icons with mixed aliases
icons add home:house user settings:gear
```

**Options:**

- `-s, --set <icon-set>`: Icon set to use (optional if defaultIconSet is configured)
- `-o, --outdir <path>`: Output directory for generated icons

**Inline Aliases:**

You can specify aliases directly in the command using colon syntax (`icon-name:alias-name`). This is useful for one-off aliases without editing `icons.json`:

- `home:house` - Fetches `home` icon, generates `house-icon.tsx` with `HouseIcon` component
- Inline aliases take precedence over `icons.json` aliases
- You can mix aliased and non-aliased icons in the same command

### `mcp`

Start the MCP (Model Context Protocol) server for AI-assisted icon management.

```bash
icons mcp
```

## Configuration

Create an `icons.json` file in your project root to configure default settings:

```json
{
  "$schema": "https://saas-js.dev/icons/schema.json",
  "outputDir": "/src/components/icons",
  "defaultIconSet": "lucide",
  "iconSize": "1em",
  "generateIndex": true,
  "aliases": {
    "house": "home",
    "cog": "settings",
    "user": "profile"
  }
}
```

### Configuration Options

- **`outputDir`** (string): Directory where icon components will be generated

  - Default: `/src/components/icons`
  - Example: `"./components/icons"`, `"/app/icons"`

- **`defaultIconSet`** (string): Default icon set to use when not specified

  - Default: `"lucide"`
  - Popular options: `"lucide"`, `"heroicons"`, `"tabler"`, `"feather"`, `"phosphor"`

- **`iconSize`** (string | number): Default size for generated icons

  - Default: `"1em"`
  - Examples: `"16px"`, `"1.5rem"`, `24`, `"2em"`

- **`aliases`** (object): Icon name aliases for better naming

  - Format: `"actual-icon-name": "desired-alias"`
  - Example: When you run `icons add house`, it will:
    - Fetch the `house` icon from the API
    - Generate a component named `home-icon.tsx` (using the alias)
  - Note: Inline aliases (using colon syntax) take precedence over config aliases

- **`generateIndex`** (boolean): Automatically generate and maintain an `index.ts` file in the output directory
  - Default: `false`
  - When enabled, exports all icons from a single file for easier imports
  - Example: `import { HomeIcon, UserIcon } from './components/icons'`

## Icon Sets

Iconify React supports all icon sets available in the Iconify library. Popular choices include:

- **Lucide** (`lucide`) - Modern, clean icons
- **Heroicons** (`heroicons`) - Tailwind CSS icons
- **Tabler Icons** (`tabler`) - Free SVG icons
- **Feather** (`feather`) - Simple, beautiful icons
- **Phosphor** (`phosphor`) - Flexible icon family
- **Material Design Icons** (`mdi`) - Google's Material Design
- **Font Awesome** (`fa-solid`, `fa-regular`, `fa-brands`) - Popular icon library

Browse all available icons at [Iconify Icon Sets](https://icon-sets.iconify.design/).

## Generated Components

Each generated component includes:

```tsx
import React from 'react'

export interface HomeIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
}

/**
 * home
 * Lucide
 * @url https://icon-sets.iconify.design/lucide
 * @license MIT
 * @version 1.0.0
 */
export const HomeIcon: React.FC<HomeIconProps> = ({
  size = '1em',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* SVG content */}
    </svg>
  )
}
```

## Examples

### Basic Usage

```bash
# Initialize configuration
icons init

# Add some common icons
icons add --set lucide home user settings mail

# Use in your React component
import { HomeIcon } from './components/icons/home-icon'
import { UserIcon } from './components/icons/user-icon'
```

### With Aliases

**Using config aliases:**

```json
{
  "defaultIconSet": "lucide",
  "aliases": {
    "house": "home",
    "cog": "settings"
  }
}
```

```bash
# This will generate home-icon.tsx and settings-icon.tsx
icons add house cog
```

**Using inline aliases:**

```bash
# No need to edit icons.json - use colon syntax
icons add home:house cog:settings

# Mix of aliased and regular icons
icons add home:house user settings:gear
```

### With Index Generation

Enable automatic `index.ts` generation in your `icons.json`:

```json
{
  "outputDir": "/src/components/icons",
  "defaultIconSet": "lucide",
  "generateIndex": true
}
```

```bash
# Add icons
icons add home user settings

# Now you can import from index.ts
import { HomeIcon, UserIcon, SettingsIcon } from './components/icons'
```

The `index.ts` file is automatically maintained and updated whenever you add new icons.

### Custom Configuration

```json
{
  "outputDir": "./src/assets/icons",
  "defaultIconSet": "heroicons",
  "iconSize": "24px",
  "aliases": {
    "home": "house",
    "user-circle": "profile"
  }
}
```

## TypeScript Support

All generated components are fully typed with:

- Proper TypeScript interfaces
- SVG props inheritance
- Size prop with string or number support
- JSDoc comments with icon metadata

## License

Apache 2.0 License - see LICENSE file for details.

## Contributing

Issues and pull requests are welcome. Please ensure your code follows the existing style and includes appropriate tests.
