export function connectByClient(id: string): void {
  if (!id) return
  const link = document.createElement('a')
  link.href = `rustdesk://${id}`
  link.target = '_self'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
