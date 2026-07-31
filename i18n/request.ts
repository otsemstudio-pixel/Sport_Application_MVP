import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const LOCALES = ["fr", "en", "it", "de", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_PAR_DEFAUT: Locale = "fr";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const valeurCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = (LOCALES as readonly string[]).includes(valeurCookie ?? "")
    ? (valeurCookie as Locale)
    : LOCALE_PAR_DEFAUT;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
