import { ref } from 'vue'

const isMobile = ref(false)

function checkMobile(): void {
  isMobile.value = window.innerWidth < 768
}

if (typeof window !== 'undefined') {
  checkMobile()
  window.addEventListener('resize', checkMobile)
}

export function useIsMobile() {
  return { isMobile }
}
