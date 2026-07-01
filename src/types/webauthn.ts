export interface PublicKeyCredentialCreationOptionsJSON {
  challenge: string
  rp: { name: string; id?: string }
  user: { id: string; name: string; displayName: string }
  pubKeyCredParams: { type: 'public-key'; alg: number }[]
  timeout?: number
  excludeCredentials?: { type: 'public-key'; id: string; transports?: string[] }[]
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform'
    residentKey?: 'discouraged' | 'preferred' | 'required'
    requireResidentKey?: boolean
    userVerification?: 'discouraged' | 'preferred' | 'required'
  }
  attestation?: 'none' | 'indirect' | 'direct'
  extensions?: Record<string, unknown>
}

export interface PublicKeyCredentialRequestOptionsJSON {
  challenge: string
  rpId?: string
  timeout?: number
  allowCredentials?: { type: 'public-key'; id: string; transports?: string[] }[]
  userVerification?: 'discouraged' | 'preferred' | 'required'
  extensions?: Record<string, unknown>
}

export interface AuthenticatorAttestationResponseJSON {
  clientDataJSON: string
  attestationObject: string
  transports?: string[]
}

export interface AuthenticatorAssertionResponseJSON {
  clientDataJSON: string
  authenticatorData: string
  signature: string
  userHandle?: string | null
}

export interface PublicKeyCredentialJSON {
  id: string
  rawId: string
  type: 'public-key'
  response: AuthenticatorAttestationResponseJSON | AuthenticatorAssertionResponseJSON
  authenticatorAttachment?: 'platform' | 'cross-platform'
  clientExtensionResults?: Record<string, unknown>
}
