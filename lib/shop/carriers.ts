export const CARRIERS: Record<string, { label: string; trackUrl: (code: string) => string }> = {
  brt:    { label: 'BRT',             trackUrl: code => `https://vas.brt.it/vas/sped_det_show.hsm?Nspedizione=${encodeURIComponent(code)}` },
  gls:    { label: 'GLS',             trackUrl: code => `https://www.gls-italy.com/it/ricerca-spedizioni?match=${encodeURIComponent(code)}` },
  poste:  { label: 'Poste Italiane',  trackUrl: code => `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${encodeURIComponent(code)}` },
  sda:    { label: 'SDA',             trackUrl: code => `https://www.sda.it/wps/portal/Servizi_online/dettaglio-spedizione?tracing.letteraVettura=${encodeURIComponent(code)}` },
  dhl:    { label: 'DHL',             trackUrl: code => `https://www.dhl.com/it-it/home/tracciabilita.html?tracking-id=${encodeURIComponent(code)}` },
  ups:    { label: 'UPS',             trackUrl: code => `https://www.ups.com/track?tracknum=${encodeURIComponent(code)}` },
  fedex:  { label: 'FedEx',           trackUrl: code => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(code)}` },
}
