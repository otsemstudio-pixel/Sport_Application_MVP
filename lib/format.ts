// Format compact pour les grands nombres (ex. "1,2 k", "3,4 M"), adapté à la
// locale de l'utilisateur via l'API Intl native.
export function formaterNombreCompact(n: number, locale: string = "fr") {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
