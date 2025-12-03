// This file provides type definitions for Vite's `import.meta.env` properties.
// The default `/// <reference types="vite/client" />` was removed to resolve
// a "Cannot find type definition file" error, and the necessary types
// are defined explicitly below.

interface ImportMetaEnv {
  /** True when running in development mode. */
  readonly DEV: boolean;
  /** The base URL for the application's API. */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
