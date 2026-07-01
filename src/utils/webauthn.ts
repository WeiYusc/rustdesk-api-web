import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  PublicKeyCredentialJSON,
  AuthenticatorAttestationResponseJSON,
  AuthenticatorAssertionResponseJSON,
} from '@/types/webauthn'

export function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function base64urlDecode(str: string): ArrayBuffer {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export function parseCreationOptions(
  json: PublicKeyCredentialCreationOptionsJSON,
): PublicKeyCredentialCreationOptions {
  const options: PublicKeyCredentialCreationOptions = {
    challenge: base64urlDecode(json.challenge),
    rp: json.rp,
    user: {
      ...json.user,
      id: base64urlDecode(json.user.id),
    },
    pubKeyCredParams: json.pubKeyCredParams,
  }
  if (json.timeout) options.timeout = json.timeout
  if (json.excludeCredentials) {
    options.excludeCredentials = json.excludeCredentials.map((c) => ({
      type: 'public-key' as const,
      id: base64urlDecode(c.id),
      transports: c.transports as AuthenticatorTransport[] | undefined,
    }))
  }
  if (json.authenticatorSelection) options.authenticatorSelection = json.authenticatorSelection
  if (json.attestation) options.attestation = json.attestation
  if (json.extensions) options.extensions = json.extensions as AuthenticationExtensionsClientInputs
  return options
}

export function parseRequestOptions(
  json: PublicKeyCredentialRequestOptionsJSON,
): PublicKeyCredentialRequestOptions {
  const options: PublicKeyCredentialRequestOptions = {
    challenge: base64urlDecode(json.challenge),
  }
  if (json.rpId) options.rpId = json.rpId
  if (json.timeout) options.timeout = json.timeout
  if (json.allowCredentials && json.allowCredentials.length > 0) {
    options.allowCredentials = json.allowCredentials.map((c) => ({
      type: 'public-key' as const,
      id: base64urlDecode(c.id),
      transports: c.transports as AuthenticatorTransport[] | undefined,
    }))
  }
  if (json.userVerification) options.userVerification = json.userVerification
  if (json.extensions) options.extensions = json.extensions as AuthenticationExtensionsClientInputs
  return options
}

export function serializeCredential(
  credential: PublicKeyCredential,
): PublicKeyCredentialJSON {
  const rawId = base64urlEncode(credential.rawId)
  const response = credential.response

  if (response instanceof AuthenticatorAttestationResponse) {
    const attResp = response as AuthenticatorAttestationResponse
    const serialized: AuthenticatorAttestationResponseJSON = {
      clientDataJSON: base64urlEncode(attResp.clientDataJSON),
      attestationObject: base64urlEncode(attResp.attestationObject),
    }
    const transports = attResp.getTransports?.()
    if (transports && transports.length > 0) {
      serialized.transports = transports
    }
    return {
      id: credential.id,
      rawId,
      type: 'public-key',
      response: serialized,
      authenticatorAttachment: (credential.authenticatorAttachment ?? undefined) as 'platform' | 'cross-platform' | undefined,
      clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>,
    }
  }

  const assertResp = response as AuthenticatorAssertionResponse
  const serialized: AuthenticatorAssertionResponseJSON = {
    clientDataJSON: base64urlEncode(assertResp.clientDataJSON),
    authenticatorData: base64urlEncode(assertResp.authenticatorData),
    signature: base64urlEncode(assertResp.signature),
  }
  if (assertResp.userHandle) {
    serialized.userHandle = base64urlEncode(assertResp.userHandle)
  } else {
    serialized.userHandle = null
  }
  return {
    id: credential.id,
    rawId,
    type: 'public-key',
    response: serialized,
    authenticatorAttachment: (credential.authenticatorAttachment ?? undefined) as 'platform' | 'cross-platform' | undefined,
    clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>,
  }
}

export interface PasskeySupport {
  secure: boolean
  api: boolean
  platformAuthenticator: boolean
  conditionalMediation: boolean
}

export async function getPasskeySupport(): Promise<PasskeySupport> {
  const secure = window.isSecureContext
  const api = !!window.PublicKeyCredential && !!navigator.credentials
  if (!api) {
    return { secure, api: false, platformAuthenticator: false, conditionalMediation: false }
  }
  const platformAuthenticator = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false)
  const conditionalMediation =
    'isConditionalMediationAvailable' in PublicKeyCredential
      ? await PublicKeyCredential.isConditionalMediationAvailable().catch(() => false)
      : false
  return { secure, api, platformAuthenticator, conditionalMediation }
}
