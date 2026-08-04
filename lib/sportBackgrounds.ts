// Une image de fond par sport, re-hébergée sur Vercel Blob (redimensionnée à
// 1280px de large, JPEG qualité 72) plutôt que servie directement
// depuis Wikimedia Commons — les originaux pesaient jusqu'à plusieurs Mo,
// inadaptés à un chargement fluide en 3G/4G. Utilisée par <FondSport>
// derrière /fil, /entrainement, /actualites et /evenements/[id].
// Clé = Sport.nom exact (même valeur naturelle que prisma/seed.ts).
//
// Les licences CC BY / CC BY-SA exigent une attribution : la liste complète
// (auteur, licence, lien vers l'original Wikimedia) est affichée sur
// /credits-photos, référencée depuis les réglages d'apparence. `sourceUrl`
// pointe vers l'original Wikimedia (attribution) ; `url` sert à l'affichage.
export type CreditPhotoSport = {
  sport: string;
  url: string;
  sourceUrl: string;
  licence: string;
  attribution: string;
};

export const CREDITS_PHOTOS_SPORT: CreditPhotoSport[] = [
  {
    sport: "Football",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/football-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/2/24/Football_match_at_Wincham_Park_Stadium_%28geograph_4383139%29.jpg",
    licence: "CC BY-SA 2.0",
    attribution: "Bill Boaden",
  },
  {
    sport: "Football",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/football-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Brentford_vs_Hartlepool_United%2C_Griffin_Park%2C_April_2006.jpg",
    licence: "CC BY-SA 3.0",
    attribution: "Beatpoet",
  },
  {
    sport: "Football",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/football-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/1/15/Jamie_Maclaren_Goal.jpg",
    licence: "CC BY-SA 4.0",
    attribution: "Lmr 94",
  },
  {
    sport: "Basketball",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/basketball-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Euroleague_-_LE_Roma_vs_Toulouse_IC-23.jpg/1920px-Euroleague_-_LE_Roma_vs_Toulouse_IC-23.jpg",
    licence: "CC BY-SA 3.0",
    attribution: "Pierre-Selim Huard",
  },
  {
    sport: "Basketball",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/basketball-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5b/CIBACOPA_match_at_Estadio_CUM_Los_Mochis_-_Pioneros_vs_Venados_-_Feb_2026.jpg",
    licence: "CC0 1.0",
    attribution: "Elehzar",
  },
  {
    sport: "Basketball",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/basketball-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Nevada_vs_San_Diego_State_basketball_2018.jpg",
    licence: "CC BY-SA 2.0",
    attribution: "Ken Lund",
  },
  {
    sport: "Athlétisme (sprint/sauts)",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/athletisme-sprint-sauts-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/5/57/US_Navy_111208-F-UI176-619_A_runner_sprints_for_the_finish_line_during_the_29th_annual_Grand_Bara_15K_race_in_the_Grand_Bara_Desert%2C_Djibouti.jpg",
    licence: "Domaine public (US Navy)",
    attribution: "Staff Sgt. Jonathan Steffen / U.S. Navy",
  },
  {
    sport: "Athlétisme (sprint/sauts)",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/athletisme-sprint-sauts-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e8/US_Navy_100519-N-7367K-001_A_Sailor_and_a_Soldier_based_in_southern_Mississippi_sprint_to_the_finish_line_during_the_Run_for_Relief_5K_Challenge.jpg",
    licence: "Domaine public (US Navy)",
    attribution: "Mass Communication Specialist 1st Class Demetrius Kennon / U.S. Navy",
  },
  {
    sport: "Athlétisme (sprint/sauts)",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/athletisme-sprint-sauts-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/GAFPB%2C_competition_on_a_different_level_160203-A-DP082-050.jpg/1920px-GAFPB%2C_competition_on_a_different_level_160203-A-DP082-050.jpg",
    licence: "Domaine public (US Army)",
    attribution: "Sgt. Youtoy Martin / U.S. Army Central",
  },
  {
    sport: "Handball",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/handball-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Handball_golakeeper.ahcp.00.jpg/1920px-Handball_golakeeper.ahcp.00.jpg",
    licence: "CC0 1.0",
    attribution: "Marciljoni",
  },
  {
    sport: "Handball",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/handball-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Cotonou_Confrontation_handball.jpg",
    licence: "CC BY-SA 4.0",
    attribution: "Homo Anchorus",
  },
  {
    sport: "Handball",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/handball-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/7/74/Falta_a_favor_del_Aranjuez._Imagen_destacada.jpg",
    licence: "CC BY-SA 4.0",
    attribution: "Jorge4412 (Jorge Barbero Mora)",
  },
  {
    sport: "Volleyball",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/volleyball-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Volleyball_at_the_London_Olympics_%281%29.jpg/1920px-Volleyball_at_the_London_Olympics_%281%29.jpg",
    licence: "CC BY 2.0",
    attribution: "Francisco Antunes",
  },
  {
    sport: "Volleyball",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/volleyball-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/2/24/Arena_Carioca_1_-_V%C3%B4lei_-_Brasil_X_It%C3%A1lia_-_Grand_Prix_2016.jpg",
    licence: "CC BY-SA 4.0",
    attribution: "Sir Velpertex di Crantx",
  },
  {
    sport: "Volleyball",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/volleyball-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/4/48/Sada_Cruzeiro_UPCN_2013-10-19.jpg",
    licence: "CC BY-SA 3.0",
    attribution: "Igordebraga",
  },
  {
    sport: "Rugby à 7",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/rugby-a-7-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/4/46/RUGBY_SEVEN_STADE_DE_FRANCE_PARIS_JO_2024_%2853886715456%29.jpg",
    licence: "CC BY-SA 2.0",
    attribution: "Eric Salard",
  },
  {
    sport: "Rugby à 7",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/rugby-a-7-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/8/80/Rugby_World_Cup_Sevens_2018_San_Francisco.jpg",
    licence: "CC BY-SA 4.0",
    attribution: "Cacetudo",
  },
  {
    sport: "Rugby à 7",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/rugby-a-7-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/3/33/Drop_%2824790259018%29.jpg",
    licence: "CC BY 2.0",
    attribution: "istolethetv",
  },
  {
    sport: "Cyclisme sur piste",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/cyclisme-sur-piste-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Anna_Meares%2C_Becky_James%2C_Kristina_Vogel_Rio_2016.jpg/1920px-Anna_Meares%2C_Becky_James%2C_Kristina_Vogel_Rio_2016.jpg",
    licence: "CC BY 3.0 (Brésil)",
    attribution: "Fernando Frazão / Agência Brasil",
  },
  {
    sport: "Cyclisme sur piste",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/cyclisme-sur-piste-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Deutsche_Meisterschaften_im_Bahnradsport_2024_156.jpg",
    licence: "CC BY-SA 4.0",
    attribution: "Nicola",
  },
  {
    sport: "Cyclisme sur piste",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/cyclisme-sur-piste-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Commonwealth_Games%2C_Glasgow_2014.jpg",
    licence: "CC BY-SA 4.0",
    attribution: "Vicsw93",
  },
  {
    sport: "Athlétisme (fond/demi-fond)",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/athletisme-fond-demi-fond-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/800metresOlympicTrials2020.jpg/1920px-800metresOlympicTrials2020.jpg",
    licence: "CC BY 2.0",
    attribution: "Chuck Aragon",
  },
  {
    sport: "Athlétisme (fond/demi-fond)",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/athletisme-fond-demi-fond-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/1/15/Conner_Mantz_2025_Chicago_Marathon.jpg",
    licence: "CC0 1.0",
    attribution: "Photoguy1212",
  },
  {
    sport: "Athlétisme (fond/demi-fond)",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/athletisme-fond-demi-fond-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ec/2005_London_Marathon_Lel-Rutto-Gharib.jpg",
    licence: "CC BY-SA 3.0",
    attribution: "Nickt",
  },
  {
    sport: "Cyclisme sur route",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/cyclisme-sur-route-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/CH.ZH.Affoltern-am-Albis_2024-03-30_road-bike-racing.jpg/1920px-CH.ZH.Affoltern-am-Albis_2024-03-30_road-bike-racing.jpg",
    licence: "CC BY-SA 4.0",
    attribution: "Roy Egloff",
  },
  {
    sport: "Cyclisme sur route",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/cyclisme-sur-route-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Igor_Arrieta_2025_urteko_Ordiziako_Klasika_irabazten..jpg",
    licence: "CC BY-SA 4.0",
    attribution: "Txapisotegi",
  },
  {
    sport: "Cyclisme sur route",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/cyclisme-sur-route-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/2/25/20180927_UCI_Road_World_Championships_Innsbruck_Women_Juniors_Road_Race_Laura_Stigger_850_0408.jpg",
    licence: "CC BY-SA 4.0",
    attribution: "Granada",
  },
  {
    sport: "Natation",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/natation-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/40._Schwimmzonen-_und_Mastersmeeting_Enns_2017_100m_Butterfly-9318.jpg/1920px-40._Schwimmzonen-_und_Mastersmeeting_Enns_2017_100m_Butterfly-9318.jpg",
    licence: "CC BY-SA 4.0",
    attribution: "Isiwal",
  },
  {
    sport: "Natation",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/natation-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7c/2008_LEN_European_Championships_Final_400m_Freestyle_Women.JPG",
    licence: "CC BY 3.0",
    attribution: "Miho NL",
  },
  {
    sport: "Natation",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/natation-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Swimming_competition_2019.jpg",
    licence: "CC0 1.0",
    attribution: "Miguel Angel Omaña Rojas",
  },
  {
    sport: "Lutte sénégalaise",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/lutte-senegalaise-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/1/19/Lutte_s%C3%A9n%C3%A9galaise_Bercy_2013_-_Mame_Balla-Pape_Mor_L%C3%B4_-_07.jpg",
    licence: "CC BY-SA 3.0",
    attribution: "Pierre-Yves Beaudouin",
  },
  {
    sport: "Lutte sénégalaise",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/lutte-senegalaise-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Lutte_s%C3%A9n%C3%A9galaise_Bercy_2013_-_Elton_-_05.jpg/1920px-Lutte_s%C3%A9n%C3%A9galaise_Bercy_2013_-_Elton_-_05.jpg",
    licence: "CC BY-SA 3.0",
    attribution: "Pierre-Yves Beaudouin",
  },
  {
    sport: "Lutte sénégalaise",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/lutte-senegalaise-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Lutte_s%C3%A9n%C3%A9galaise_Bercy_2013_-_Elton_-_10.jpg/1920px-Lutte_s%C3%A9n%C3%A9galaise_Bercy_2013_-_Elton_-_10.jpg",
    licence: "CC BY-SA 3.0",
    attribution: "Pierre-Yves Beaudouin",
  },
  {
    sport: "Dambe (boxe traditionnelle nigériane)",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/dambe-boxe-traditionnelle-nigeriane-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Dambe_poses_-_Deidei_2010.jpg/1920px-Dambe_poses_-_Deidei_2010.jpg",
    licence: "CC BY 2.0",
    attribution: "Jeremy Weate",
  },
  {
    sport: "Dambe (boxe traditionnelle nigériane)",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/dambe-boxe-traditionnelle-nigeriane-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Concentration_Dambe_match-Deidei_2010.jpg/1920px-Concentration_Dambe_match-Deidei_2010.jpg",
    licence: "CC BY 2.0",
    attribution: "Jeremy Weate",
  },
  {
    sport: "Dambe (boxe traditionnelle nigériane)",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/dambe-boxe-traditionnelle-nigeriane-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Dambe_match2_-_Deidei_2010.jpg/1920px-Dambe_match2_-_Deidei_2010.jpg",
    licence: "CC BY 2.0",
    attribution: "Jeremy Weate",
  },
  {
    sport: "Judo",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/judo-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/2018_World_Judo_Championships_61.jpg/1920px-2018_World_Judo_Championships_61.jpg",
    licence: "CC BY 3.0 (Brésil)",
    attribution: "Rodolfo Vilela / Rede do Esporte",
  },
  {
    sport: "Judo",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/judo-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/1/15/Judo_newaza.jpg",
    licence: "Domaine public (US Marine Corps)",
    attribution: "Sgt. Donald Bohanner / USMC",
  },
  {
    sport: "Judo",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/judo-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8e/%E8%A9%A6%E5%90%881.jpg",
    licence: "Domaine public",
    attribution: "Gotcha2",
  },
  {
    sport: "Taekwondo",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/taekwondo-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Korea_Taekwondo_Lee_Daehoon_04_%287771940240%29.jpg/1920px-Korea_Taekwondo_Lee_Daehoon_04_%287771940240%29.jpg",
    licence: "CC BY-SA 2.0",
    attribution: "Korea.net / Korean Culture and Information Service",
  },
  {
    sport: "Taekwondo",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/taekwondo-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Campeonato_mundial_de_Taekwondo.JPG/1920px-Campeonato_mundial_de_Taekwondo.JPG",
    licence: "CC BY-SA 3.0",
    attribution: "Danielllerandi",
  },
  {
    sport: "Taekwondo",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/taekwondo-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/5/52/Combattimento.jpg",
    licence: "CC BY-SA 4.0",
    attribution: "RaffaeleCito",
  },
  {
    sport: "Boxe",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/boxe-1.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Rio_2016_-_Boxe-Boxing._%2828477150604%29.jpg/1920px-Rio_2016_-_Boxe-Boxing._%2828477150604%29.jpg",
    licence: "CC BY-SA 2.0",
    attribution: "Jonas de Carvalho",
  },
  {
    sport: "Boxe",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/boxe-2.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/1/13/2023_Saint_Patrick%27s_Day_Boxing_Invitational_%287693784%29.jpg",
    licence: "Domaine public (US Army)",
    attribution: "Spc. Donovon Lynch / U.S. Army JMRC",
  },
  {
    sport: "Boxe",
    url: "https://uarbydcuanfgdicq.public.blob.vercel-storage.com/sport-photos/boxe-3.jpg",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6e/1st_ACB_Soldiers_pull_no_punches_DVIDS197504.jpg",
    licence: "Domaine public (US Army)",
    attribution: "Staff Sgt. Nathan Hoskins / U.S. Army",
  },
];

// Une entrée "par défaut" par sport (la première de la liste) : utilisée
// quand l'athlète n'a pas choisi de photo personnalisée.
export const FONDS_SPORT: Record<string, string> = {};
for (const credit of CREDITS_PHOTOS_SPORT) {
  if (!(credit.sport in FONDS_SPORT)) FONDS_SPORT[credit.sport] = credit.url;
}

export function fondSportPour(nomSport: string): string | null {
  return FONDS_SPORT[nomSport] ?? null;
}

// Toutes les photos d'un sport (galerie proposée dans le sélecteur de photo
// de profil/bannière/fond d'écran).
export function galerieSportPour(nomSport: string): string[] {
  return CREDITS_PHOTOS_SPORT.filter((c) => c.sport === nomSport).map((c) => c.url);
}

// Résout la photo de fond à utiliser pour un athlète : sa photo choisie en
// priorité, sinon celle par défaut de son sport principal.
export function resoudreFondEcran(athlete: { fondEcranUrl: string | null; sportPrincipal: { nom: string } }) {
  return athlete.fondEcranUrl ?? fondSportPour(athlete.sportPrincipal.nom);
}
