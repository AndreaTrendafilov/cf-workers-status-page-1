export async function getCheckLocation(request) {
  const allowedRegions = [
    'GB', 'DE', 'FR', 'IT', 'ES', 'BG', 'RO', 'RS', 'GR', 'HR', 'SI', 'MK',
    'AL', 'ME', 'BA',
  ]

  if (request) {
    const regionHeader = request.headers.get('CF-IPCountry')
    if (regionHeader && !allowedRegions.includes(regionHeader)) {
      throw new Error('Region not allowed')
    }
  }

  const res = await fetch('https://cloudflare-dns.com/dns-query', {
    method: 'OPTIONS',
  })
  const ray = res.headers.get('cf-ray')
  if (!ray) {
    return 'unknown'
  }
  const parts = ray.split('-')
  return parts[1] ?? parts[0] ?? 'unknown'
}
