export function detectPlatform(): string {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Win/.test(ua)) return 'windows'
  if (/Mac/.test(ua)) return 'mac'
  if (/Linux/.test(ua)) return 'linux'
  return 'web'
}
