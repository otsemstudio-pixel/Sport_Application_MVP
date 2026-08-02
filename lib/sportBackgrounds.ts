// Une image de fond par sport (photo Wikimedia Commons, libre de droits),
// utilisée par <FondSport> derrière /fil, /entrainement et /evenements/[id].
// Clé = Sport.nom exact (même valeur naturelle que prisma/seed.ts).
//
// Les licences CC BY / CC BY-SA exigent une attribution : la liste complète
// (auteur, licence, lien) est affichée sur /credits-photos, référencée depuis
// les réglages d'apparence.
export type CreditPhotoSport = {
  sport: string;
  url: string;
  licence: string;
  attribution: string;
};

export const CREDITS_PHOTOS_SPORT: CreditPhotoSport[] = [
  {
    sport: "Football",
    url: "https://upload.wikimedia.org/wikipedia/commons/2/24/Football_match_at_Wincham_Park_Stadium_%28geograph_4383139%29.jpg",
    licence: "CC BY-SA 2.0",
    attribution: "Bill Boaden",
  },
  {
    sport: "Basketball",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Euroleague_-_LE_Roma_vs_Toulouse_IC-23.jpg/1920px-Euroleague_-_LE_Roma_vs_Toulouse_IC-23.jpg",
    licence: "CC BY-SA 3.0",
    attribution: "Pierre-Selim Huard",
  },
  {
    sport: "Athlétisme (sprint/sauts)",
    url: "https://upload.wikimedia.org/wikipedia/commons/5/57/US_Navy_111208-F-UI176-619_A_runner_sprints_for_the_finish_line_during_the_29th_annual_Grand_Bara_15K_race_in_the_Grand_Bara_Desert%2C_Djibouti.jpg",
    licence: "Domaine public (US Navy)",
    attribution: "Staff Sgt. Jonathan Steffen / U.S. Navy",
  },
  {
    sport: "Handball",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Handball_golakeeper.ahcp.00.jpg/1920px-Handball_golakeeper.ahcp.00.jpg",
    licence: "CC0 1.0",
    attribution: "Marciljoni",
  },
  {
    sport: "Volleyball",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Volleyball_at_the_London_Olympics_%281%29.jpg/1920px-Volleyball_at_the_London_Olympics_%281%29.jpg",
    licence: "CC BY 2.0",
    attribution: "Francisco Antunes",
  },
  {
    sport: "Rugby à 7",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/46/RUGBY_SEVEN_STADE_DE_FRANCE_PARIS_JO_2024_%2853886715456%29.jpg",
    licence: "CC BY-SA 2.0",
    attribution: "Eric Salard",
  },
  {
    sport: "Cyclisme sur piste",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Anna_Meares%2C_Becky_James%2C_Kristina_Vogel_Rio_2016.jpg/1920px-Anna_Meares%2C_Becky_James%2C_Kristina_Vogel_Rio_2016.jpg",
    licence: "CC BY 3.0 (Brésil)",
    attribution: "Fernando Frazão / Agência Brasil",
  },
  {
    sport: "Athlétisme (fond/demi-fond)",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/800metresOlympicTrials2020.jpg/1920px-800metresOlympicTrials2020.jpg",
    licence: "CC BY 2.0",
    attribution: "Chuck Aragon",
  },
  {
    sport: "Cyclisme sur route",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/CH.ZH.Affoltern-am-Albis_2024-03-30_road-bike-racing.jpg/1920px-CH.ZH.Affoltern-am-Albis_2024-03-30_road-bike-racing.jpg",
    licence: "CC BY-SA 4.0",
    attribution: "Roy Egloff",
  },
  {
    sport: "Natation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/40._Schwimmzonen-_und_Mastersmeeting_Enns_2017_100m_Butterfly-9318.jpg/1920px-40._Schwimmzonen-_und_Mastersmeeting_Enns_2017_100m_Butterfly-9318.jpg",
    licence: "CC BY-SA 4.0",
    attribution: "Isiwal",
  },
  {
    sport: "Lutte sénégalaise",
    url: "https://upload.wikimedia.org/wikipedia/commons/1/19/Lutte_s%C3%A9n%C3%A9galaise_Bercy_2013_-_Mame_Balla-Pape_Mor_L%C3%B4_-_07.jpg",
    licence: "CC BY-SA 3.0",
    attribution: "Pierre-Yves Beaudouin",
  },
  {
    sport: "Dambe (boxe traditionnelle nigériane)",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Dambe_poses_-_Deidei_2010.jpg/1920px-Dambe_poses_-_Deidei_2010.jpg",
    licence: "CC BY 2.0",
    attribution: "Jeremy Weate",
  },
  {
    sport: "Judo",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/2018_World_Judo_Championships_61.jpg/1920px-2018_World_Judo_Championships_61.jpg",
    licence: "CC BY 3.0 (Brésil)",
    attribution: "Rodolfo Vilela / Rede do Esporte",
  },
  {
    sport: "Taekwondo",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Korea_Taekwondo_Lee_Daehoon_04_%287771940240%29.jpg/1920px-Korea_Taekwondo_Lee_Daehoon_04_%287771940240%29.jpg",
    licence: "CC BY-SA 2.0",
    attribution: "Korea.net / Korean Culture and Information Service",
  },
  {
    sport: "Boxe",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Rio_2016_-_Boxe-Boxing._%2828477150604%29.jpg/1920px-Rio_2016_-_Boxe-Boxing._%2828477150604%29.jpg",
    licence: "CC BY-SA 2.0",
    attribution: "Jonas de Carvalho",
  },
];

export const FONDS_SPORT: Record<string, string> = Object.fromEntries(
  CREDITS_PHOTOS_SPORT.map((c) => [c.sport, c.url])
);

export function fondSportPour(nomSport: string): string | null {
  return FONDS_SPORT[nomSport] ?? null;
}
