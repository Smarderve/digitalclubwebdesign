/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KIUTBOT_AGENT_KEY?: string
  readonly VITE_KIUTBOT_SOCKET_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
