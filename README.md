# LWC + Vite POC

This is a proof-of-concept project demonstrating the integration of:
- **Vite** - Fast build tool
- **LWC** (Lightning Web Components) - Component framework
- **vite-plugin-lwc** - Vite plugin for LWC support
- **lightning-base-components** - Salesforce's component library
- **SLDS** (@salesforce-ux/design-system) - Salesforce Lightning Design System

## Features

The demo app showcases various Lightning Base Components including:

### Input Components
- Text Input
- Email Input
- Phone Number Input
- Date Picker

### Selection Components
- Checkbox Group
- Radio Group
- Combobox
- Toggle Switch

### Other Components
- Slider Control
- Text Area
- Various Button Variants (Base, Brand, Success, Neutral, Destructive)
- Icon Buttons
- Badges
- Loading Spinner

## Project Structure

```
salesforce-ui/
├── src/
│   ├── modules/
│   │   ├── main/
│   │   │   └── app/             # App shell (main-app)
│   │   ├── page/                # Route-level views (page-*)
│   │   │   ├── home/
│   │   │   ├── user/
│   │   │   ├── settings/
│   │   │   └── iconTest/
│   │   ├── ui/                  # Reusable building blocks (ui-*)
│   │   │   └── example/
│   │   └── lightning/            # Reserved — do not use
│   ├── router.js
│   └── index.js                 # App entry point
├── index.html                   # HTML entry point
├── vite.config.js               # Vite configuration
└── package.json
```

### Component namespaces

This template uses **folder-based namespaces** so component roles are obvious. LWC turns the first folder under `src/modules/` into the tag prefix.

| Folder   | Tag prefix | Use for |
|----------|------------|--------|
| **page/** | `page-*`   | Route-level views (one per URL). e.g. `page-user` → `/users/:id`. |
| **ui/**   | `ui-*`     | Reusable building blocks (cards, buttons, modals, form controls). Used inside pages or other components. |
| **main/** | `main-*`   | App shell only (e.g. `main-app`). Not for feature pages. |
| **lightning/** | — | **Do not use.** Reserved for lightning-base-components and required template setup (e.g. icon templates). |

Only add components under **page/** or **ui/**; do not use **lightning/** (reserved for the template and lightning-base-components).

**Examples:** Add `src/modules/page/dashboard/` → use in router as `page-dashboard`, route e.g. `/dashboard`. Add `src/modules/ui/card/` → use in templates as `<ui-card>`. Keep **page/** for full-screen views and **ui/** for smaller, reusable pieces.

## Running the Project

### Development Mode
```bash
npm run dev
```
This will start the Vite dev server on http://localhost:3000 and automatically open your browser.

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## How It Works

1. **Vite Configuration**: The `vite.config.js` file configures Vite to work with LWC using the `vite-plugin-lwc` plugin.

2. **LWC Components**: Components are organized in the `src/modules` directory following LWC naming conventions (namespace/componentName).

3. **Synthetic Shadow DOM**: Configured to use synthetic shadow DOM (like Salesforce platform) instead of native shadow DOM, allowing global styles to penetrate component boundaries.

4. **SLDS Styling**: The Salesforce Lightning Design System provides the visual styling framework, loaded globally to work with synthetic shadow.

5. **Lightning Base Components**: Pre-built Salesforce components provide form inputs, buttons, and other UI elements.

## Component Interaction

The app component demonstrates:
- Two-way data binding with tracked properties
- Event handling for various input types
- Dynamic rendering of component states
- Form value collection and logging

Click the "Base Button" to see all collected form values in the console!

## Dependencies

- `vite`: Fast build tool
- `vite-plugin-lwc`: LWC plugin for Vite
- `lwc`: Lightning Web Components framework
- `lightning-base-components`: Salesforce component library
- `@salesforce-ux/design-system`: Salesforce design system

## Shadow DOM Configuration

This project is configured to use **Synthetic Shadow DOM** to match the Salesforce platform behavior:

### Synthetic Shadow vs Native Shadow

| Feature | Synthetic Shadow (Current) | Native Shadow |
|---------|---------------------------|---------------|
| Platform Match | ✅ Matches Salesforce | ❌ Different from platform |
| Global Styles | ✅ Penetrate components | ❌ Blocked by shadow boundary |
| DOM Queries | ✅ Can query inside components | ❌ Cannot query inside |
| shadowRoot | Returns `null` | Returns ShadowRoot object |
| Performance | Slightly slower | Faster |
| CSS Isolation | Partial | Complete |

### Verifying Shadow Mode

Open the browser console at http://localhost:3000 and run:
```javascript
// Quick check
document.querySelector('demo-app').shadowRoot
// Returns null = Synthetic Shadow ✅
// Returns object = Native Shadow ❌
```

Or copy and run the contents of `verify-shadow.js` in the console for a complete test.

### Switching Shadow Modes

To switch between shadow modes, edit `vite.config.js`:

```javascript
// For Synthetic Shadow (Salesforce platform-like) - CURRENT
disableSyntheticShadowSupport: false

// For Native Shadow (standard web components)
disableSyntheticShadowSupport: true
```

### Why Synthetic Shadow?

1. **Platform Accuracy**: Salesforce uses synthetic shadow on their platform
2. **Style Inheritance**: Global SLDS styles can penetrate into components
3. **DOM Access**: Allows testing tools and scripts to query component internals
4. **Migration Path**: Easier to migrate existing Salesforce components

## Notes

This POC demonstrates that all these technologies can work together seamlessly in a local development environment, providing a modern development experience with hot module replacement, fast builds, and access to the full Salesforce component ecosystem.

The synthetic shadow configuration ensures that your local development matches the actual Salesforce platform behavior, making the transition from local to platform deployment smoother.