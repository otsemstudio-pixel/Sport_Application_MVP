import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { recalculerRecordPersonnel } from "../lib/records";
import { galerieSportPour } from "../lib/sportBackgrounds";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const MOT_DE_PASSE_DEMO = "Demo1234!";

const SPORTS = [
  { nom: "Football", categoriePerformance: "COLLECTIF_TACTIQUE" },
  { nom: "Basketball", categoriePerformance: "COLLECTIF_TACTIQUE" },
  { nom: "Athlétisme (sprint/sauts)", categoriePerformance: "EXPLOSIVITE_PUISSANCE" },
  { nom: "Handball", categoriePerformance: "COLLECTIF_TACTIQUE" },
  { nom: "Volleyball", categoriePerformance: "COLLECTIF_TACTIQUE" },
  { nom: "Rugby à 7", categoriePerformance: "COLLECTIF_TACTIQUE" },
  { nom: "Cyclisme sur piste", categoriePerformance: "EXPLOSIVITE_PUISSANCE" },
  { nom: "Athlétisme (fond/demi-fond)", categoriePerformance: "ENDURANCE" },
  { nom: "Cyclisme sur route", categoriePerformance: "ENDURANCE" },
  { nom: "Natation", categoriePerformance: "ENDURANCE" },
  { nom: "Lutte sénégalaise", categoriePerformance: "COMBAT" },
  { nom: "Dambe (boxe traditionnelle nigériane)", categoriePerformance: "COMBAT" },
  { nom: "Judo", categoriePerformance: "COMBAT" },
  { nom: "Taekwondo", categoriePerformance: "COMBAT" },
  { nom: "Boxe", categoriePerformance: "COMBAT" },
] as const;

const BADGES = [
  { code: "regulier", nom: "Régulier", description: "5 séances enregistrées", seuilSeances: 5 },
  { code: "assidu", nom: "Assidu", description: "15 séances enregistrées", seuilSeances: 15 },
  { code: "habitue", nom: "Habitué", description: "30 séances enregistrées", seuilSeances: 30 },
];

async function seedReferentiels() {
  for (const sport of SPORTS) {
    await prisma.sport.upsert({
      where: { nom: sport.nom },
      update: { categoriePerformance: sport.categoriePerformance },
      create: sport,
    });
  }

  for (const badge of BADGES) {
    await prisma.badge.upsert({ where: { code: badge.code }, update: {}, create: badge });
  }

  const sportParNom = new Map(
    (await prisma.sport.findMany()).map((s) => [s.nom, s])
  );

  const EXERCICES: {
    nom: string;
    description: string;
    beneficePerformance: string;
    categoriePerformance: string;
    uniteMesure: string;
    sensAmelioration: string;
  }[] = [
    // Renforcement général (utilisable par tous les sports)
    { nom: "Squats", description: "Squats au poids du corps", beneficePerformance: "Renforce les jambes et les fessiers, la base de tout démarrage explosif.", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "REPETITIONS", sensAmelioration: "PLUS_HAUT_MIEUX" },
    { nom: "Pompes", description: "Pompes au poids du corps", beneficePerformance: "Développe la force du haut du corps utile dans la plupart des sports de contact et de lancer.", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "REPETITIONS", sensAmelioration: "PLUS_HAUT_MIEUX" },
    { nom: "Tractions", description: "Tractions à la barre", beneficePerformance: "Construit la force du dos et des bras, essentielle pour la lutte et les duels physiques.", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "REPETITIONS", sensAmelioration: "PLUS_HAUT_MIEUX" },
    { nom: "Abdominaux", description: "Crunchs ou relevés de buste", beneficePerformance: "Stabilise le tronc, la base de tout transfert de force entre le bas et le haut du corps.", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "REPETITIONS", sensAmelioration: "PLUS_HAUT_MIEUX" },
    { nom: "Fentes", description: "Fentes avant alternées", beneficePerformance: "Améliore l'équilibre et la puissance unilatérale des jambes.", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "REPETITIONS", sensAmelioration: "PLUS_HAUT_MIEUX" },
    { nom: "Gainage", description: "Gainage ventral (planche)", beneficePerformance: "Renforce la sangle abdominale profonde pour protéger le dos à l'effort.", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "DUREE_SECONDES", sensAmelioration: "PLUS_HAUT_MIEUX" },
    { nom: "Burpees", description: "Burpees complets", beneficePerformance: "Travaille le cardio et la puissance en même temps, pour tenir sur la durée d'un match.", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "REPETITIONS", sensAmelioration: "PLUS_HAUT_MIEUX" },
    { nom: "Planche latérale", description: "Gainage latéral, de chaque côté", beneficePerformance: "Renforce les obliques, utiles pour la stabilité lors des changements de direction.", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "DUREE_SECONDES", sensAmelioration: "PLUS_HAUT_MIEUX" },
    // Explosivité / puissance
    { nom: "Sprint 30m chronométré", description: "Temps sur un sprint de 30m", beneficePerformance: "Développe la vitesse pure, décisive dans les phases de démarrage.", categoriePerformance: "EXPLOSIVITE_PUISSANCE", uniteMesure: "DUREE_SECONDES", sensAmelioration: "PLUS_BAS_MIEUX" },
    { nom: "Sauts en longueur", description: "Distance du meilleur saut en longueur sans élan", beneficePerformance: "Mesure et développe la puissance explosive des jambes.", categoriePerformance: "EXPLOSIVITE_PUISSANCE", uniteMesure: "DISTANCE_METRES", sensAmelioration: "PLUS_HAUT_MIEUX" },
    { nom: "Corde à sauter", description: "Nombre de sauts à la corde sans interruption", beneficePerformance: "Améliore la coordination et le rythme, utiles pour l'explosivité répétée.", categoriePerformance: "EXPLOSIVITE_PUISSANCE", uniteMesure: "REPETITIONS", sensAmelioration: "PLUS_HAUT_MIEUX" },
    // Endurance
    { nom: "10 km chronométré", description: "Temps sur une distance de 10 km", beneficePerformance: "Développe l'endurance fondamentale, la capacité à tenir l'effort sur la durée.", categoriePerformance: "ENDURANCE", uniteMesure: "DUREE_SECONDES", sensAmelioration: "PLUS_BAS_MIEUX" },
    { nom: "5 km chronométré", description: "Temps sur une distance de 5 km", beneficePerformance: "Développe la vitesse de fond, un bon complément aux sorties longues.", categoriePerformance: "ENDURANCE", uniteMesure: "DUREE_SECONDES", sensAmelioration: "PLUS_BAS_MIEUX" },
    { nom: "Course en durée (distance parcourue)", description: "Distance parcourue sur un temps fixe (ex. 12 minutes)", beneficePerformance: "Évalue la capacité aérobie et sa progression dans le temps.", categoriePerformance: "ENDURANCE", uniteMesure: "DISTANCE_METRES", sensAmelioration: "PLUS_HAUT_MIEUX" },
    // Combat
    { nom: "Mouvements de lutte au sol chronométrés", description: "Enchaînement de mouvements au sol contre la montre", beneficePerformance: "Développe l'endurance spécifique au combat au sol.", categoriePerformance: "COMBAT", uniteMesure: "DUREE_SECONDES", sensAmelioration: "PLUS_BAS_MIEUX" },
    { nom: "Enchaînement technique combat noté", description: "Enchaînement technique jugé par un coach", beneficePerformance: "Affine la précision technique évaluée en conditions proches de la compétition.", categoriePerformance: "COMBAT", uniteMesure: "REPETITIONS", sensAmelioration: "PLUS_HAUT_MIEUX" },
    { nom: "Déséquilibres réussis", description: "Nombre de déséquilibres réussis à l'entraînement", beneficePerformance: "Travaille le placement et le timing, la clé des projections en lutte.", categoriePerformance: "COMBAT", uniteMesure: "REPETITIONS", sensAmelioration: "PLUS_HAUT_MIEUX" },
    // Collectif / tactique
    { nom: "Dribbles en continu", description: "Nombre de dribbles réalisés sans perdre le contrôle du ballon", beneficePerformance: "Améliore le contrôle de balle sous pression, utile en match.", categoriePerformance: "COLLECTIF_TACTIQUE", uniteMesure: "REPETITIONS", sensAmelioration: "PLUS_HAUT_MIEUX" },
    { nom: "Tirs réussis", description: "Nombre de tirs réussis sur une série", beneficePerformance: "Mesure et développe la précision de finition, décisive en match.", categoriePerformance: "COLLECTIF_TACTIQUE", uniteMesure: "REPETITIONS", sensAmelioration: "PLUS_HAUT_MIEUX" },
  ];

  for (const exercice of EXERCICES) {
    await prisma.exercice.upsert({
      where: { nom: exercice.nom },
      update: { sensAmelioration: exercice.sensAmelioration as never, beneficePerformance: exercice.beneficePerformance },
      create: exercice as never,
    });
  }

  return sportParNom;
}

const PROGRAMMES = [
  {
    nom: "Renforcement général 4 semaines",
    description: "Deux séances par semaine pour construire une base de force générale, tous sports confondus.",
    dureeSemaines: 4,
    categoriePerformance: "RENFORCEMENT_GENERAL",
    seances: [
      { numeroSemaine: 1, numeroJour: 1, nomSeance: "Haut du corps", exercices: [
        { nom: "Pompes", seriesPrevues: 3, repetitionsPrevues: 15 },
        { nom: "Tractions", seriesPrevues: 3, repetitionsPrevues: 6 },
      ] },
      { numeroSemaine: 1, numeroJour: 4, nomSeance: "Bas du corps et gainage", exercices: [
        { nom: "Squats", seriesPrevues: 3, repetitionsPrevues: 15 },
        { nom: "Gainage", seriesPrevues: 3, dureePrevueSecondes: 45 },
      ] },
      { numeroSemaine: 2, numeroJour: 1, nomSeance: "Haut du corps", exercices: [
        { nom: "Pompes", seriesPrevues: 3, repetitionsPrevues: 18 },
        { nom: "Tractions", seriesPrevues: 3, repetitionsPrevues: 7 },
      ] },
      { numeroSemaine: 2, numeroJour: 4, nomSeance: "Bas du corps et gainage", exercices: [
        { nom: "Squats", seriesPrevues: 3, repetitionsPrevues: 18 },
        { nom: "Gainage", seriesPrevues: 3, dureePrevueSecondes: 60 },
      ] },
      { numeroSemaine: 3, numeroJour: 1, nomSeance: "Full body", exercices: [
        { nom: "Burpees", seriesPrevues: 4, repetitionsPrevues: 12 },
        { nom: "Fentes", seriesPrevues: 3, repetitionsPrevues: 12 },
      ] },
      { numeroSemaine: 3, numeroJour: 4, nomSeance: "Haut du corps et gainage", exercices: [
        { nom: "Pompes", seriesPrevues: 4, repetitionsPrevues: 20 },
        { nom: "Planche latérale", seriesPrevues: 2, dureePrevueSecondes: 40 },
      ] },
      { numeroSemaine: 4, numeroJour: 1, nomSeance: "Full body", exercices: [
        { nom: "Burpees", seriesPrevues: 4, repetitionsPrevues: 15 },
        { nom: "Squats", seriesPrevues: 4, repetitionsPrevues: 20 },
      ] },
      { numeroSemaine: 4, numeroJour: 4, nomSeance: "Bilan", exercices: [
        { nom: "Tractions", seriesPrevues: 3, repetitionsPrevues: 10 },
        { nom: "Gainage", seriesPrevues: 3, dureePrevueSecondes: 75 },
      ] },
    ],
  },
  {
    nom: "Explosivité 3 semaines",
    description: "Développe la vitesse et la puissance avec des séances courtes et intenses, deux fois par semaine.",
    dureeSemaines: 3,
    categoriePerformance: "EXPLOSIVITE_PUISSANCE",
    seances: [
      { numeroSemaine: 1, numeroJour: 2, nomSeance: "Vitesse", exercices: [
        { nom: "Sprint 30m chronométré", seriesPrevues: 5, dureePrevueSecondes: 5.2 },
      ] },
      { numeroSemaine: 1, numeroJour: 5, nomSeance: "Puissance", exercices: [
        { nom: "Sauts en longueur", seriesPrevues: 4, distancePrevueMetres: 2.2 },
        { nom: "Corde à sauter", seriesPrevues: 3, repetitionsPrevues: 80 },
      ] },
      { numeroSemaine: 2, numeroJour: 2, nomSeance: "Vitesse", exercices: [
        { nom: "Sprint 30m chronométré", seriesPrevues: 5, dureePrevueSecondes: 5.0 },
      ] },
      { numeroSemaine: 2, numeroJour: 5, nomSeance: "Puissance", exercices: [
        { nom: "Sauts en longueur", seriesPrevues: 4, distancePrevueMetres: 2.4 },
        { nom: "Corde à sauter", seriesPrevues: 3, repetitionsPrevues: 100 },
      ] },
      { numeroSemaine: 3, numeroJour: 2, nomSeance: "Vitesse", exercices: [
        { nom: "Sprint 30m chronométré", seriesPrevues: 6, dureePrevueSecondes: 4.8 },
      ] },
      { numeroSemaine: 3, numeroJour: 5, nomSeance: "Bilan puissance", exercices: [
        { nom: "Sauts en longueur", seriesPrevues: 5, distancePrevueMetres: 2.5 },
        { nom: "Corde à sauter", seriesPrevues: 4, repetitionsPrevues: 120 },
      ] },
    ],
  },
  {
    nom: "Endurance progressive 4 semaines",
    description: "Construit le fond avec des sorties longues et un fractionné chronométré, deux séances par semaine.",
    dureeSemaines: 4,
    categoriePerformance: "ENDURANCE",
    seances: [
      { numeroSemaine: 1, numeroJour: 1, nomSeance: "Sortie combinée", exercices: [
        { nom: "10 km chronométré", dureePrevueSecondes: 2700 },
        { nom: "Course en durée (distance parcourue)", distancePrevueMetres: 2400 },
      ] },
      { numeroSemaine: 1, numeroJour: 4, nomSeance: "Fractionné", exercices: [
        { nom: "10 km chronométré", dureePrevueSecondes: 2650 },
      ] },
      { numeroSemaine: 2, numeroJour: 1, nomSeance: "Sortie longue", exercices: [
        { nom: "Course en durée (distance parcourue)", distancePrevueMetres: 2600 },
      ] },
      { numeroSemaine: 2, numeroJour: 4, nomSeance: "Fractionné", exercices: [
        { nom: "10 km chronométré", dureePrevueSecondes: 2600 },
      ] },
      { numeroSemaine: 3, numeroJour: 1, nomSeance: "Sortie longue", exercices: [
        { nom: "Course en durée (distance parcourue)", distancePrevueMetres: 2800 },
      ] },
      { numeroSemaine: 3, numeroJour: 4, nomSeance: "Fractionné", exercices: [
        { nom: "10 km chronométré", dureePrevueSecondes: 2550 },
      ] },
      { numeroSemaine: 4, numeroJour: 1, nomSeance: "Sortie longue", exercices: [
        { nom: "Course en durée (distance parcourue)", distancePrevueMetres: 3000 },
      ] },
      { numeroSemaine: 4, numeroJour: 4, nomSeance: "Bilan", exercices: [
        { nom: "10 km chronométré", dureePrevueSecondes: 2500 },
      ] },
    ],
  },
] as const;

async function seedProgrammes() {
  const exerciceParNom = new Map((await prisma.exercice.findMany()).map((e) => [e.nom, e]));

  const anciennesSeances = await prisma.programmeSeance.findMany({
    where: { programme: { nom: { in: PROGRAMMES.map((p) => p.nom) } } },
    select: { id: true },
  });
  const idsAnciennesSeances = anciennesSeances.map((s) => s.id);
  await prisma.seanceEntrainement.updateMany({
    where: { programmeSeanceId: { in: idsAnciennesSeances } },
    data: { programmeSeanceId: null },
  });
  await prisma.programmeExercice.deleteMany({ where: { programmeSeanceId: { in: idsAnciennesSeances } } });
  await prisma.programmeSeance.deleteMany({ where: { id: { in: idsAnciennesSeances } } });
  await prisma.athleteProgramme.deleteMany({ where: { programme: { nom: { in: PROGRAMMES.map((p) => p.nom) } } } });
  await prisma.programme.deleteMany({ where: { nom: { in: PROGRAMMES.map((p) => p.nom) } } });

  const programmesParNom = new Map<string, { id: string }>();
  const seancesParCle = new Map<string, { id: string }>();

  for (const p of PROGRAMMES) {
    const programme = await prisma.programme.create({
      data: {
        nom: p.nom,
        description: p.description,
        dureeSemaines: p.dureeSemaines,
        categoriePerformance: p.categoriePerformance as never,
      },
    });
    programmesParNom.set(p.nom, programme);

    for (const s of p.seances) {
      const seance = await prisma.programmeSeance.create({
        data: {
          programmeId: programme.id,
          numeroSemaine: s.numeroSemaine,
          numeroJour: s.numeroJour,
          nomSeance: s.nomSeance,
          exercicesPrevus: {
            create: s.exercices.map((e) => ({
              exerciceId: exerciceParNom.get(e.nom)!.id,
              seriesPrevues: "seriesPrevues" in e ? e.seriesPrevues : null,
              repetitionsPrevues: "repetitionsPrevues" in e ? e.repetitionsPrevues : null,
              dureePrevueSecondes: "dureePrevueSecondes" in e ? e.dureePrevueSecondes : null,
              distancePrevueMetres: "distancePrevueMetres" in e ? e.distancePrevueMetres : null,
            })),
          },
        },
      });
      seancesParCle.set(`${p.nom}::${s.numeroSemaine}::${s.numeroJour}`, seance);
    }
  }

  return { programmesParNom, seancesParCle };
}

async function seedOrganisateurs() {
  const donnees = [
    { email: "club.basket.dakar@demo.scoutapp", nom: "Club Basket Dakar", verifie: true },
    { email: "federation.lutte.sn@demo.scoutapp", nom: "Fédération Lutte Sénégalaise", verifie: true },
    { email: "academie.sport.lagos@demo.scoutapp", nom: "Académie Sport Lagos", verifie: false },
  ];

  const passwordHash = await bcrypt.hash(MOT_DE_PASSE_DEMO, 10);
  const organisateurs = [];
  for (const o of donnees) {
    organisateurs.push(
      await prisma.organisateur.upsert({
        where: { email: o.email },
        update: { nom: o.nom, verifie: o.verifie },
        create: { ...o, passwordHash },
      })
    );
  }
  return organisateurs;
}

async function seedAthletes(sportParNom: Map<string, { id: string }>) {
  const donnees = [
    {
      email: "mamadou.diallo@demo.scoutapp",
      nom: "Mamadou Diallo",
      ville: "Dakar",
      sport: "Basketball",
      dateNaissance: new Date("2005-03-12"),
      mineur: false,
      themeFond: "SPORT" as const,
    },
    {
      email: "modou.fall@demo.scoutapp",
      nom: "Modou Fall",
      ville: "Thiès",
      sport: "Lutte sénégalaise",
      dateNaissance: new Date("2001-09-02"),
      mineur: false,
    },
    {
      email: "aicha.kone@demo.scoutapp",
      nom: "Aïcha Koné",
      ville: "Abidjan",
      sport: "Athlétisme (fond/demi-fond)",
      dateNaissance: new Date("2003-11-20"),
      mineur: false,
    },
    {
      email: "chinedu.okafor@demo.scoutapp",
      nom: "Chinedu Okafor",
      ville: "Lagos",
      sport: "Handball",
      dateNaissance: new Date("2010-06-15"),
      mineur: true,
    },
    {
      email: "ibrahim.musa@demo.scoutapp",
      nom: "Ibrahim Musa",
      ville: "Kano",
      sport: "Dambe (boxe traditionnelle nigériane)",
      dateNaissance: new Date("1999-01-30"),
      mineur: false,
    },
  ];

  const passwordHash = await bcrypt.hash(MOT_DE_PASSE_DEMO, 10);
  const athletes = [];
  for (const a of donnees) {
    const themeFond = "themeFond" in a ? a.themeFond : undefined;
    const athlete = await prisma.athlete.upsert({
      where: { email: a.email },
      update: {
        nom: a.nom,
        ville: a.ville,
        sportPrincipalId: sportParNom.get(a.sport)!.id,
        ...(themeFond ? { themeFond, onboardingComplete: true } : {}),
      },
      create: {
        email: a.email,
        passwordHash,
        nom: a.nom,
        ville: a.ville,
        dateNaissance: a.dateNaissance,
        sportPrincipalId: sportParNom.get(a.sport)!.id,
        ...(themeFond ? { themeFond, onboardingComplete: true } : {}),
      },
    });
    athletes.push(athlete);

    if (a.mineur) {
      await prisma.consentementParental.upsert({
        where: { athleteId: athlete.id },
        update: { codeValide: true, dateValidation: new Date() },
        create: {
          athleteId: athlete.id,
          telephoneParent: "+234700000000",
          code: "000000",
          codeValide: true,
          dateValidation: new Date(),
        },
      });
    }
  }
  return athletes;
}

function joursAvant(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

type SerieDemo = { repetitions?: number; poidsKg?: number; dureeSecondes?: number; distanceMetres?: number };

async function reinitialiserSeancesDemo(
  athletes: { id: string }[],
  programmesParNom: Map<string, { id: string }>,
  seancesParCle: Map<string, { id: string }>
) {
  const [mamadou, modou, aicha] = athletes;

  const idsDemo = [mamadou.id, modou.id, aicha.id];
  const anciennesSeances = await prisma.seanceEntrainement.findMany({
    where: { athleteId: { in: idsDemo } },
    select: { id: true },
  });
  const idsAnciennes = anciennesSeances.map((s) => s.id);
  await prisma.post.updateMany({
    where: { seanceEntrainementId: { in: idsAnciennes } },
    data: { seanceEntrainementId: null },
  });
  await prisma.retourSeance.deleteMany({ where: { seanceId: { in: idsAnciennes } } });
  await prisma.serie.deleteMany({ where: { exerciceRealise: { seanceId: { in: idsAnciennes } } } });
  await prisma.exerciceRealise.deleteMany({ where: { seanceId: { in: idsAnciennes } } });
  await prisma.seanceEntrainement.deleteMany({ where: { id: { in: idsAnciennes } } });
  await prisma.recordPersonnel.deleteMany({ where: { athleteId: { in: idsDemo } } });
  await prisma.objectif.deleteMany({ where: { athleteId: { in: idsDemo } } });
  await prisma.athleteProgramme.deleteMany({ where: { athleteId: { in: idsDemo } } });

  const exerciceParNom = new Map(
    (await prisma.exercice.findMany()).map((e) => [e.nom, e])
  );

  async function creerSeance(
    athleteId: string,
    date: Date,
    exercices: { nom: string; series: SerieDemo[] }[],
    programmeSeanceId?: string
  ) {
    return prisma.seanceEntrainement.create({
      data: {
        athleteId,
        date,
        programmeSeanceId: programmeSeanceId ?? null,
        exercicesRealises: {
          create: exercices.map((e) => ({
            exerciceId: exerciceParNom.get(e.nom)!.id,
            series: {
              create: e.series.map((s, index) => ({
                numeroSerie: index + 1,
                repetitions: s.repetitions ?? null,
                poidsKg: s.poidsKg ?? null,
                dureeSecondes: s.dureeSecondes ?? null,
                distanceMetres: s.distanceMetres ?? null,
              })),
            },
          })),
        },
      },
      include: { exercicesRealises: { include: { exercice: true, series: { orderBy: { numeroSerie: "asc" } } } } },
    });
  }

  // Aïcha suit activement le programme "Endurance progressive" depuis aujourd'hui :
  // sa séance du jour est liée à la séance de programme prévue (semaine 1, jour 1).
  const programmeEndurance = programmesParNom.get("Endurance progressive 4 semaines")!;
  await prisma.athleteProgramme.create({
    data: { athleteId: aicha.id, programmeId: programmeEndurance.id, dateDebut: joursAvant(0), statut: "EN_COURS" },
  });
  const seanceProgrammeAujourdhui = seancesParCle.get("Endurance progressive 4 semaines::1::1")!;

  const seanceAujourdhuiMamadou = await creerSeance(mamadou.id, joursAvant(0), [
    { nom: "Squats", series: [{ repetitions: 15 }, { repetitions: 15 }, { repetitions: 12 }] },
    { nom: "Sprint 30m chronométré", series: [{ dureeSecondes: 4.8 }] },
    { nom: "Corde à sauter", series: [{ repetitions: 100 }] },
  ]);
  await creerSeance(mamadou.id, joursAvant(2), [
    { nom: "Pompes", series: [{ repetitions: 20 }, { repetitions: 18 }, { repetitions: 15 }] },
    { nom: "Abdominaux", series: [{ repetitions: 50 }] },
  ]);
  await creerSeance(mamadou.id, joursAvant(5), [
    { nom: "Dribbles en continu", series: [{ repetitions: 15 }] },
    { nom: "Tirs réussis", series: [{ repetitions: 14 }] },
  ]);
  await creerSeance(mamadou.id, joursAvant(10), [
    { nom: "Burpees", series: [{ repetitions: 30 }] },
    { nom: "Gainage", series: [{ dureeSecondes: 60 }] },
  ]);
  await creerSeance(mamadou.id, joursAvant(35), [
    { nom: "Squats", series: [{ repetitions: 12 }, { repetitions: 12 }, { repetitions: 10 }] },
  ]);

  // Historique plus long (jusqu'à 5 mois en arrière) pour que le calendrier
  // de régularité et les graphiques de progression par exercice soient
  // visuellement parlants sur plusieurs mois, pas seulement les derniers jours.
  // Les valeurs progressent légèrement avec le temps pour illustrer une vraie
  // courbe de progression sur les graphiques.
  for (let jours = 150; jours >= 45; jours -= 4) {
    const progres = (150 - jours) / 150; // 0 (le plus ancien) -> 1 (le plus récent de cette plage)
    if (jours % 8 < 4) {
      const squatsReps = Math.round(10 + progres * 8);
      await creerSeance(mamadou.id, joursAvant(jours), [
        { nom: "Squats", series: [{ repetitions: squatsReps }, { repetitions: squatsReps - 2 }] },
        { nom: "Sprint 30m chronométré", series: [{ dureeSecondes: Math.round((5.6 - progres * 0.6) * 10) / 10 }] },
      ]);
    } else {
      const pompesReps = Math.round(12 + progres * 10);
      await creerSeance(mamadou.id, joursAvant(jours), [
        { nom: "Pompes", series: [{ repetitions: pompesReps }, { repetitions: pompesReps - 3 }] },
        { nom: "Abdominaux", series: [{ repetitions: Math.round(30 + progres * 15) }] },
      ]);
    }
  }

  const seanceAujourdhuiAicha = await creerSeance(
    aicha.id,
    joursAvant(0),
    [
      { nom: "10 km chronométré", series: [{ dureeSecondes: 2700 }] },
      { nom: "Course en durée (distance parcourue)", series: [{ distanceMetres: 2400 }] },
    ],
    seanceProgrammeAujourdhui.id
  );
  await creerSeance(aicha.id, joursAvant(3), [{ nom: "5 km chronométré", series: [{ dureeSecondes: 1500 }] }]);
  await creerSeance(aicha.id, joursAvant(9), [
    { nom: "Planche latérale", series: [{ dureeSecondes: 90 }] },
    { nom: "Abdominaux", series: [{ repetitions: 40 }] },
  ]);
  const seance15Aicha = await creerSeance(aicha.id, joursAvant(15), [
    { nom: "10 km chronométré", series: [{ dureeSecondes: 2820 }] },
  ]);
  const seance25Aicha = await creerSeance(aicha.id, joursAvant(25), [
    { nom: "10 km chronométré", series: [{ dureeSecondes: 2850 }] },
  ]);
  await creerSeance(aicha.id, joursAvant(40), [{ nom: "10 km chronométré", series: [{ dureeSecondes: 2800 }] }]);

  await creerSeance(modou.id, joursAvant(0), [
    { nom: "Mouvements de lutte au sol chronométrés", series: [{ dureeSecondes: 300 }] },
    { nom: "Déséquilibres réussis", series: [{ repetitions: 8 }] },
  ]);
  await creerSeance(modou.id, joursAvant(4), [
    { nom: "Enchaînement technique combat noté", series: [{ repetitions: 7 }] },
    { nom: "Tractions", series: [{ repetitions: 8 }, { repetitions: 7 }, { repetitions: 6 }] },
  ]);

  function libelleUnite(uniteMesure: string) {
    return uniteMesure === "DUREE_SECONDES" ? "secondes" : uniteMesure === "DISTANCE_METRES" ? "mètres" : "répétitions";
  }
  function valeurPrincipale(
    s: { repetitions: number | null; dureeSecondes: number | null; distanceMetres: number | null },
    uniteMesure: string
  ) {
    if (uniteMesure === "DUREE_SECONDES") return s.dureeSecondes;
    if (uniteMesure === "DISTANCE_METRES") return s.distanceMetres;
    return s.repetitions;
  }
  const resume = seanceAujourdhuiMamadou.exercicesRealises
    .map(
      (er) =>
        `${er.series.map((s) => valeurPrincipale(s, er.exercice.uniteMesure)).join("/")} ${libelleUnite(er.exercice.uniteMesure)} de ${er.exercice.nom}`
    )
    .join(", ");

  // Calcule les records personnels à partir des séances qu'on vient de créer,
  // puis sème quelques objectifs (un en cours, un déjà atteint) qui s'appuient dessus.
  const pairesAthleteExercice = new Map<string, { athleteId: string; exerciceId: string }>();
  const toutesLesSeances = await prisma.exerciceRealise.findMany({
    where: { seance: { athleteId: { in: idsDemo } } },
    select: { exerciceId: true, seance: { select: { athleteId: true } } },
  });
  for (const l of toutesLesSeances) {
    pairesAthleteExercice.set(`${l.seance.athleteId}::${l.exerciceId}`, { athleteId: l.seance.athleteId, exerciceId: l.exerciceId });
  }
  for (const { athleteId, exerciceId } of pairesAthleteExercice.values()) {
    await recalculerRecordPersonnel(athleteId, exerciceId);
  }

  const pompes = exerciceParNom.get("Pompes")!;
  const cordeASauter = exerciceParNom.get("Corde à sauter")!;
  const dixKm = exerciceParNom.get("10 km chronométré")!;

  // Objectif en cours : record actuel de Mamadou aux pompes (20) sous la cible (50).
  await prisma.objectif.create({
    data: { athleteId: mamadou.id, exerciceId: pompes.id, valeurCible: 50, atteint: false },
  });
  // Objectif déjà atteint : record de Mamadou à la corde à sauter (100) dépasse la cible (80).
  await prisma.objectif.create({
    data: {
      athleteId: mamadou.id,
      exerciceId: cordeASauter.id,
      valeurCible: 80,
      atteint: true,
      dateAtteint: joursAvant(0),
    },
  });
  // Objectif en cours illustrant un exercice "plus bas = mieux" : record d'Aïcha (2700s) pas encore sous la cible (2600s).
  await prisma.objectif.create({
    data: { athleteId: aicha.id, exerciceId: dixKm.id, valeurCible: 2600, atteint: false },
  });

  // Ressentis de démonstration : trois séances consécutives "difficile" sur le
  // 10 km chronométré d'Aïcha pour illustrer la suggestion de réduction de
  // charge de la mascotte (tâche du jour), plus quelques ressentis variés
  // ailleurs pour montrer le fonctionnement général.
  await prisma.retourSeance.create({ data: { seanceId: seanceAujourdhuiAicha.id, ressenti: "DIFFICILE" } });
  await prisma.retourSeance.create({ data: { seanceId: seance15Aicha.id, ressenti: "DIFFICILE" } });
  await prisma.retourSeance.create({ data: { seanceId: seance25Aicha.id, ressenti: "DIFFICILE" } });
  await prisma.retourSeance.create({ data: { seanceId: seanceAujourdhuiMamadou.id, ressenti: "CORRECT" } });

  return {
    seancePartageable: {
      id: seanceAujourdhuiMamadou.id,
      auteurId: mamadou.id,
      contenu: `Séance du jour : ${resume} 💪`,
    },
  };
}

async function reinitialiserPostsDemo(
  athletes: { id: string }[],
  organisateurs: { id: string }[],
  seancePartageable: { id: string; auteurId: string; contenu: string }
) {
  const auteurs = [
    ...athletes.map((a) => ({ id: a.id, type: "ATHLETE" as const })),
    ...organisateurs.map((o) => ({ id: o.id, type: "ORGANISATEUR" as const })),
  ];

  const anciensPosts = await prisma.post.findMany({
    where: { OR: auteurs.map((a) => ({ auteurId: a.id, auteurType: a.type })) },
    select: { id: true },
  });
  const idsAnciens = anciensPosts.map((p) => p.id);
  await prisma.postCommentaire.deleteMany({ where: { postId: { in: idsAnciens } } });
  await prisma.postLike.deleteMany({ where: { postId: { in: idsAnciens } } });
  await prisma.postVue.deleteMany({ where: { postId: { in: idsAnciens } } });
  await prisma.postSauvegarde.deleteMany({ where: { postId: { in: idsAnciens } } });
  await prisma.postImage.deleteMany({ where: { postId: { in: idsAnciens } } });
  await prisma.post.deleteMany({ where: { id: { in: idsAnciens } } });

  const [mamadou, modou, aicha, chinedu, ibrahim] = athletes;
  const [clubBasket, fedLutte, academieLagos] = organisateurs;

  const contenus: { auteur: (typeof auteurs)[number]; contenu: string; likes: (typeof auteurs)[number][]; commentaires?: { auteur: (typeof auteurs)[number]; contenu: string }[]; images?: string[] }[] = [
    {
      auteur: { id: mamadou.id, type: "ATHLETE" },
      contenu: "Séance de tirs ce matin à Dakar, 18/20 sur les lancers ! On continue de progresser 🏀",
      likes: [{ id: modou.id, type: "ATHLETE" }, { id: aicha.id, type: "ATHLETE" }, { id: clubBasket.id, type: "ORGANISATEUR" }],
      commentaires: [{ auteur: { id: clubBasket.id, type: "ORGANISATEUR" }, contenu: "Excellent Mamadou, continue comme ça !" }],
      images: [
        "https://picsum.photos/seed/basket-seance-1/900/700",
        "https://picsum.photos/seed/basket-seance-2/900/700",
      ],
    },
    {
      auteur: { id: clubBasket.id, type: "ORGANISATEUR" },
      contenu: "Le Tournoi Quartier Basketball ouvre ses inscriptions ! Ouvert à tous, débutants bienvenus, sans club requis.",
      likes: [{ id: mamadou.id, type: "ATHLETE" }, { id: chinedu.id, type: "ATHLETE" }],
      images: ["https://picsum.photos/seed/tournoi-quartier/900/700"],
    },
    {
      auteur: { id: modou.id, type: "ATHLETE" },
      contenu: "Entraînement de déséquilibres avec les anciens du quartier à Thiès. La lutte sénégalaise, c'est aussi une école de patience.",
      likes: [{ id: fedLutte.id, type: "ORGANISATEUR" }],
      commentaires: [
        { auteur: { id: fedLutte.id, type: "ORGANISATEUR" }, contenu: "Beau travail, on te suit pour la sélection nationale." },
        { auteur: { id: ibrahim.id, type: "ATHLETE" }, contenu: "Respect grand frère 💪" },
      ],
      images: [
        "https://picsum.photos/seed/lutte-1/900/700",
        "https://picsum.photos/seed/lutte-2/900/700",
        "https://picsum.photos/seed/lutte-3/900/700",
      ],
    },
    {
      auteur: { id: aicha.id, type: "ATHLETE" },
      contenu: "5km bouclés ce matin à Abidjan sous la pluie. La régularité paie, badge Assidu débloqué cette semaine !",
      likes: [{ id: mamadou.id, type: "ATHLETE" }, { id: modou.id, type: "ATHLETE" }, { id: chinedu.id, type: "ATHLETE" }],
    },
    {
      auteur: { id: fedLutte.id, type: "ORGANISATEUR" },
      contenu: "Le Championnat National de Lutte Sénégalaise - Élite approche. Places limitées, niveau avancé exigé.",
      likes: [{ id: modou.id, type: "ATHLETE" }],
    },
    {
      auteur: { id: chinedu.id, type: "ATHLETE" },
      contenu: "Premiers tirs au but de la saison à Lagos, 12/15 ! Merci à mon club pour le soutien.",
      likes: [{ id: aicha.id, type: "ATHLETE" }],
      commentaires: [{ auteur: { id: academieLagos.id, type: "ORGANISATEUR" }, contenu: "Bravo Chinedu, belle progression cette saison." }],
    },
    {
      auteur: { id: academieLagos.id, type: "ORGANISATEUR" },
      contenu: "Notre académie recherche de jeunes talents à Lagos, toutes disciplines. Le Cross de la ville est une belle occasion de se montrer.",
      likes: [],
    },
    {
      auteur: { id: ibrahim.id, type: "ATHLETE" },
      contenu: "8 rounds tenus aujourd'hui à Kano. Le Dambe demande une préparation physique complète, pas seulement technique.",
      likes: [{ id: modou.id, type: "ATHLETE" }, { id: chinedu.id, type: "ATHLETE" }],
    },
    {
      auteur: { id: mamadou.id, type: "ATHLETE" },
      contenu: "Question pour les basketteurs : quel exercice pour améliorer la détente verticale ? Je stagne un peu en ce moment.",
      likes: [],
      commentaires: [{ auteur: { id: clubBasket.id, type: "ORGANISATEUR" }, contenu: "On regarde ça ensemble à la prochaine séance." }],
    },
    {
      auteur: { id: aicha.id, type: "ATHLETE" },
      contenu: "Inscrite au Cross de la ville - Semi-marathon ! Objectif : finir dans le top 3.",
      likes: [{ id: academieLagos.id, type: "ORGANISATEUR" }, { id: mamadou.id, type: "ATHLETE" }],
    },
  ];

  for (const c of contenus) {
    const post = await prisma.post.create({
      data: { auteurId: c.auteur.id, auteurType: c.auteur.type, contenu: c.contenu },
    });
    for (const [index, url] of (c.images ?? []).entries()) {
      await prisma.postImage.create({ data: { postId: post.id, url, ordre: index } });
    }
    for (const like of c.likes) {
      await prisma.postLike.create({
        data: { postId: post.id, auteurId: like.id, auteurType: like.type },
      });
    }
    for (const commentaire of c.commentaires ?? []) {
      await prisma.postCommentaire.create({
        data: {
          postId: post.id,
          auteurId: commentaire.auteur.id,
          auteurType: commentaire.auteur.type,
          contenu: commentaire.contenu,
        },
      });
    }
  }

  // Post "séance partagée" : illustre la fonctionnalité de partage avec encart structuré.
  const postSeancePartagee = await prisma.post.create({
    data: {
      auteurId: seancePartageable.auteurId,
      auteurType: "ATHLETE",
      contenu: seancePartageable.contenu,
      seanceEntrainementId: seancePartageable.id,
    },
  });
  await prisma.postLike.create({
    data: { postId: postSeancePartagee.id, auteurId: modou.id, auteurType: "ATHLETE" },
  });
  await prisma.postCommentaire.create({
    data: {
      postId: postSeancePartagee.id,
      auteurId: clubBasket.id,
      auteurType: "ORGANISATEUR",
      contenu: "Belle intensité, continue comme ça !",
    },
  });
}

async function reinitialiserEvenementsDemo(
  organisateurs: { id: string }[],
  athletes: { id: string }[],
  sportParNom: Map<string, { id: string }>
) {
  const anciensEvenements = await prisma.evenement.findMany({
    where: { organisateurId: { in: organisateurs.map((o) => o.id) } },
    select: { id: true },
  });
  const idsAnciens = anciensEvenements.map((e) => e.id);
  await prisma.resultat.deleteMany({ where: { evenementId: { in: idsAnciens } } });
  await prisma.inscription.deleteMany({ where: { evenementId: { in: idsAnciens } } });
  await prisma.evenementImage.deleteMany({ where: { evenementId: { in: idsAnciens } } });
  await prisma.evenement.deleteMany({ where: { id: { in: idsAnciens } } });

  const [clubBasket, fedLutte, academieLagos] = organisateurs;
  const [mamadou, modou, aicha] = athletes;

  const tournoiQuartier = await prisma.evenement.create({
    data: {
      organisateurId: clubBasket.id,
      nom: "Tournoi Quartier Basketball",
      sportId: sportParNom.get("Basketball")!.id,
      lieu: "Dakar",
      date: new Date("2026-09-20"),
      placesMax: 20,
      description:
        "Tournoi 3x3 ouvert à tous les niveaux, organisé par le Club Basket Dakar. Ambiance quartier, inscriptions gratuites.",
      niveauRequis: "TOUS_NIVEAUX",
      clubRequis: false,
      fraisInscription: 0,
      equipementFourni: "Ballons fournis, prévoir tenue de sport",
      images: {
        create: [
          { url: "https://picsum.photos/seed/evenement-basket-1/1000/700", ordre: 0 },
          { url: "https://picsum.photos/seed/evenement-basket-2/1000/700", ordre: 1 },
        ],
      },
    },
  });

  await prisma.evenement.create({
    data: {
      organisateurId: fedLutte.id,
      nom: "Championnat National Lutte Sénégalaise - Élite",
      sportId: sportParNom.get("Lutte sénégalaise")!.id,
      lieu: "Thiès",
      date: new Date("2026-11-08"),
      placesMax: 16,
      description:
        "Compétition élite réservée aux lutteurs licenciés en club, sélection pour l'équipe régionale.",
      niveauRequis: "AVANCE",
      clubRequis: true,
      ageMin: 18,
      fraisInscription: 5000,
      images: {
        create: [{ url: "https://picsum.photos/seed/evenement-lutte-1/1000/700", ordre: 0 }],
      },
    },
  });

  const cross = await prisma.evenement.create({
    data: {
      organisateurId: academieLagos.id,
      nom: "Cross de la ville - Semi-marathon",
      sportId: sportParNom.get("Athlétisme (fond/demi-fond)")!.id,
      lieu: "Lagos",
      date: new Date("2026-10-05"),
      placesMax: 50,
      description:
        "Semi-marathon ouvert aux athlètes confirmés de la région, parcours urbain de 21km.",
      niveauRequis: "INTERMEDIAIRE",
      clubRequis: false,
      ageMin: 16,
      fraisInscription: 2000,
    },
  });

  await prisma.inscription.create({
    data: { evenementId: cross.id, athleteId: aicha.id, statut: "CONFIRME" },
  });
  await prisma.inscription.create({
    data: { evenementId: cross.id, athleteId: mamadou.id, statut: "EN_ATTENTE" },
  });
  await prisma.inscription.create({
    data: { evenementId: cross.id, athleteId: modou.id, statut: "CONFIRME" },
  });
  await prisma.resultat.create({
    data: { evenementId: cross.id, athleteId: aicha.id, classement: 1, score: 78.4 },
  });

  return { tournoiQuartier };
}

// Athlète de démonstration avec le suivi de mensurations activé, plusieurs
// entrées de poids réparties dans le temps.
async function reinitialiserMensurationsDemo(athletes: { id: string }[]) {
  const ibrahim = athletes[4];

  await prisma.athlete.update({ where: { id: ibrahim.id }, data: { suiviMensurationsActive: true } });
  await prisma.mensuration.deleteMany({ where: { athleteId: ibrahim.id } });

  const entrees = [
    { jours: 120, poidsKg: 78.5, tailleCm: 178 },
    { jours: 100, poidsKg: 78.0 },
    { jours: 80, poidsKg: 77.2 },
    { jours: 60, poidsKg: 76.8 },
    { jours: 40, poidsKg: 76.0 },
    { jours: 20, poidsKg: 75.4 },
    { jours: 3, poidsKg: 75.0 },
  ];
  for (const e of entrees) {
    await prisma.mensuration.create({
      data: { athleteId: ibrahim.id, date: joursAvant(e.jours), poidsKg: e.poidsKg, tailleCm: e.tailleCm ?? null },
    });
  }
}

// Quelques relations d'abonnement entre comptes démo, mélangeant athlètes et
// organisateurs, pour peupler les compteurs abonnés/abonnements.
async function reinitialiserAbonnementsDemo(
  athletes: { id: string }[],
  organisateurs: { id: string }[]
) {
  const [mamadou, modou, aicha, chinedu] = athletes;
  const [clubBasket, fedLutte, academieLagos] = organisateurs;

  const comptes = [
    ...athletes.map((a) => ({ id: a.id, type: "ATHLETE" as const })),
    ...organisateurs.map((o) => ({ id: o.id, type: "ORGANISATEUR" as const })),
  ];
  await prisma.abonnement.deleteMany({
    where: { OR: comptes.map((c) => ({ suiveurId: c.id, suiveurType: c.type })) },
  });

  const relations: { suiveur: { id: string; type: "ATHLETE" | "ORGANISATEUR" }; suivi: { id: string; type: "ATHLETE" | "ORGANISATEUR" } }[] = [
    { suiveur: { id: mamadou.id, type: "ATHLETE" }, suivi: { id: modou.id, type: "ATHLETE" } },
    { suiveur: { id: mamadou.id, type: "ATHLETE" }, suivi: { id: aicha.id, type: "ATHLETE" } },
    { suiveur: { id: mamadou.id, type: "ATHLETE" }, suivi: { id: clubBasket.id, type: "ORGANISATEUR" } },
    { suiveur: { id: aicha.id, type: "ATHLETE" }, suivi: { id: mamadou.id, type: "ATHLETE" } },
    { suiveur: { id: aicha.id, type: "ATHLETE" }, suivi: { id: fedLutte.id, type: "ORGANISATEUR" } },
    { suiveur: { id: modou.id, type: "ATHLETE" }, suivi: { id: mamadou.id, type: "ATHLETE" } },
    { suiveur: { id: chinedu.id, type: "ATHLETE" }, suivi: { id: mamadou.id, type: "ATHLETE" } },
    { suiveur: { id: chinedu.id, type: "ATHLETE" }, suivi: { id: academieLagos.id, type: "ORGANISATEUR" } },
    { suiveur: { id: clubBasket.id, type: "ORGANISATEUR" }, suivi: { id: mamadou.id, type: "ATHLETE" } },
    { suiveur: { id: fedLutte.id, type: "ORGANISATEUR" }, suivi: { id: modou.id, type: "ATHLETE" } },
  ];

  for (const r of relations) {
    await prisma.abonnement.create({
      data: {
        suiveurId: r.suiveur.id,
        suiveurType: r.suiveur.type,
        suiviId: r.suivi.id,
        suiviType: r.suivi.type,
      },
    });
  }
}

// Quelques vues sur les posts démo pour que le compteur de vues ne soit pas
// à zéro pendant une démo.
async function reinitialiserVuesDemo(
  athletes: { id: string }[],
  organisateurs: { id: string }[]
) {
  const comptes = [
    ...athletes.map((a) => ({ id: a.id, type: "ATHLETE" as const })),
    ...organisateurs.map((o) => ({ id: o.id, type: "ORGANISATEUR" as const })),
  ];

  const posts = await prisma.post.findMany({
    where: { OR: comptes.map((c) => ({ auteurId: c.id, auteurType: c.type })) },
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  const idsPosts = posts.map((p) => p.id);
  await prisma.postVue.deleteMany({ where: { postId: { in: idsPosts } } });

  for (const [index, post] of posts.entries()) {
    // Un nombre de spectateurs qui varie d'un post à l'autre (3 à 8).
    const spectateurs = comptes.slice(0, Math.min(comptes.length, 3 + index));
    for (const spectateur of spectateurs) {
      await prisma.postVue.create({
        data: { postId: post.id, spectateurId: spectateur.id, spectateurType: spectateur.type },
      });
    }
  }
}

// Contenu éditorial du menu Actualités : un article par sport du catalogue,
// signé par des médias fictifs (pas de nom de vraie rédaction, pour ne pas
// attribuer du contenu inventé à un organe de presse réel). Photo tirée de
// la même galerie par sport que les fonds d'écran (CREDITS_PHOTOS_SPORT),
// pour rester cohérent avec le reste de l'app et rester sur des images déjà
// vérifiées.
async function reinitialiserArticlesDemo(sportParNom: Map<string, { id: string }>) {
  const idsAnciens = (await prisma.article.findMany({ select: { id: true } })).map((a) => a.id);
  await prisma.articleCommentaire.deleteMany({ where: { articleId: { in: idsAnciens } } });
  await prisma.articleLike.deleteMany({ where: { articleId: { in: idsAnciens } } });
  await prisma.articleVue.deleteMany({ where: { articleId: { in: idsAnciens } } });
  await prisma.article.deleteMany({ where: { id: { in: idsAnciens } } });

  const photo = (nomSport: string, index = 0) => galerieSportPour(nomSport)[index] ?? galerieSportPour(nomSport)[0];

  const ARTICLES: {
    sport: string;
    titre: string;
    chapo: string;
    contenu: string;
    source: string;
    joursAvant: number;
    photoIndex?: number;
  }[] = [
    {
      sport: "Football",
      titre: "Les Lions locaux enchaînent une troisième victoire de rang",
      chapo:
        "La sélection nationale basée sur le championnat local confirme sa bonne forme avant les éliminatoires, avec un jeu collectif retrouvé.",
      contenu:
        "Portée par un milieu de terrain retrouvé et une défense plus solide, l'équipe a dominé la rencontre de bout en bout. Le sélectionneur a salué « une équipe qui a enfin trouvé son équilibre » et a insisté sur l'importance de garder ce collectif pour les prochaines échéances.\n\nLes prochains matchs amicaux serviront à roder les automatismes avant le début officiel des éliminatoires, avec plusieurs joueurs évoluant à l'étranger attendus en renfort.",
      source: "Teranga Sport",
      joursAvant: 1,
    },
    {
      sport: "Basketball",
      titre: "Le championnat régional s'ouvre sur une belle affluence",
      chapo:
        "Le coup d'envoi de la saison a rassemblé un public nombreux, signe de l'engouement grandissant pour la discipline dans la sous-région.",
      contenu:
        "Plusieurs clubs historiques ont dévoilé des effectifs renforcés, avec un accent mis sur la formation des jeunes joueurs. Les organisateurs espèrent que cette dynamique permettra de faire émerger de nouveaux talents en vue des prochaines compétitions continentales.\n\nLe format de la compétition reste inchangé cette saison, avec une phase de poules suivie de playoffs à élimination directe.",
      source: "AfriSport Mag",
      joursAvant: 2,
    },
    {
      sport: "Athlétisme (sprint/sauts)",
      titre: "Un temps prometteur sur 100m lors du meeting national",
      chapo:
        "Un jeune sprinteur s'est illustré lors du meeting national avec un temps proche de son record personnel, confirmant sa progression cette saison.",
      contenu:
        "Encadré par un nouveau préparateur physique depuis le début de l'année, l'athlète explique avoir revu entièrement sa phase de départ. « Le travail sur les premiers appuis commence à payer », a-t-il confié après la course.\n\nLa fédération voit dans ces résultats un signal encourageant à quelques mois des sélections pour les compétitions internationales.",
      source: "Dakar Sport Actu",
      joursAvant: 1,
    },
    {
      sport: "Handball",
      titre: "La sélection féminine termine invaincue le tournoi de préparation",
      chapo:
        "L'équipe nationale féminine a bouclé son tournoi de préparation sans défaite, avec une défense particulièrement solide sur l'ensemble de la compétition.",
      contenu:
        "Le staff technique a profité de ces matchs pour tester plusieurs systèmes défensifs, avec une rotation importante sur l'ensemble de l'effectif. Les résultats collectifs sont jugés encourageants avant le tournoi qualificatif à venir.\n\nUne dernière session d'entraînement en altitude est prévue avant le grand rendez-vous.",
      source: "Sud Sport Hebdo",
      joursAvant: 3,
    },
    {
      sport: "Volleyball",
      titre: "Un nouveau pôle de formation ouvre ses portes",
      chapo:
        "Un centre de formation dédié au volleyball a ouvert ses portes cette semaine, avec pour objectif de structurer la détection des jeunes talents.",
      contenu:
        "Le centre accueillera une première promotion d'une trentaine de jeunes joueuses et joueurs, encadrés par des entraîneurs formés aux méthodes internationales les plus récentes.\n\nLes responsables espèrent que cette structure permettra, à terme, d'alimenter directement les sélections nationales jeunes.",
      source: "Continental Sport",
      joursAvant: 5,
    },
    {
      sport: "Rugby à 7",
      titre: "Le circuit régional annonce une nouvelle étape",
      chapo:
        "Une nouvelle étape du circuit régional de rugby à 7 a été annoncée, avec l'espoir d'attirer davantage d'équipes universitaires cette saison.",
      contenu:
        "La discipline continue de gagner du terrain, portée notamment par sa présence aux Jeux Olympiques qui inspire de nouvelles vocations chez les jeunes joueurs.\n\nLes organisateurs misent sur un format rapide et spectaculaire pour continuer à élargir le public de ce sport encore émergent dans la région.",
      source: "Teranga Sport",
      joursAvant: 4,
    },
    {
      sport: "Cyclisme sur piste",
      titre: "Un vélodrome flambant neuf accueille ses premières compétitions",
      chapo:
        "Le tout nouveau vélodrome de la capitale a accueilli ses premières compétitions officielles, une infrastructure très attendue par les coureurs locaux.",
      contenu:
        "Longtemps contraints de s'entraîner sur route faute d'infrastructure adaptée, les spécialistes de la piste saluent unanimement cette avancée. Plusieurs records nationaux pourraient tomber dans les prochains mois grâce à ces nouvelles conditions d'entraînement.\n\nUn stage de détection est prévu dès la rentrée pour repérer de nouveaux talents.",
      source: "AfriSport Mag",
      joursAvant: 6,
    },
    {
      sport: "Athlétisme (fond/demi-fond)",
      titre: "Le semi-marathon urbain attire un record de participants",
      chapo:
        "La dernière édition du semi-marathon urbain a rassemblé un nombre record de coureurs, entre athlètes confirmés et amateurs venus découvrir la discipline.",
      contenu:
        "Le tracé, redessiné cette année pour traverser plusieurs quartiers emblématiques de la ville, a été salué par les participants. Le vainqueur a bouclé le parcours dans des conditions climatiques difficiles, saluant « un public venu très nombreux encourager les coureurs ».\n\nLes organisateurs annoncent déjà vouloir doubler la capacité d'accueil pour l'édition suivante.",
      source: "Dakar Sport Actu",
      joursAvant: 2,
    },
    {
      sport: "Cyclisme sur route",
      titre: "Une étape de montagne a fait la différence au classement général",
      chapo:
        "L'étape reine du tour national, disputée en altitude, a rebattu les cartes du classement général à deux jours de l'arrivée.",
      contenu:
        "Isolé dans les derniers kilomètres, le coureur qui s'est emparé du maillot de leader a dû gérer un écart serré avec son plus proche poursuivant. « C'est dans ce genre d'étape que se gagnent les tours », a-t-il expliqué à l'arrivée.\n\nLe classement pourrait encore évoluer lors du contre-la-montre final.",
      source: "Sud Sport Hebdo",
      joursAvant: 3,
    },
    {
      sport: "Natation",
      titre: "Une nageuse s'approche du record national du 200m nage libre",
      chapo:
        "À seulement quelques centièmes du record national, la jeune nageuse confirme une saison de progrès constants en bassin.",
      contenu:
        "Son entraîneur évoque une préparation axée sur l'endurance spécifique et le travail technique des virages, souvent négligé par les nageurs plus jeunes. « Le record est clairement à sa portée d'ici la fin de la saison », estime-t-il.\n\nLa nageuse participera prochainement à une compétition régionale qualificative.",
      source: "Continental Sport",
      joursAvant: 1,
    },
    {
      sport: "Lutte sénégalaise",
      titre: "Un combat très attendu programmé pour la fin de saison",
      chapo:
        "Deux lutteurs parmi les plus populaires du moment se sont officiellement engagés pour un combat qui s'annonce comme l'un des évènements majeurs de la saison.",
      contenu:
        "L'annonce a été accueillie avec enthousiasme par les amateurs de la discipline, qui attendaient cette confrontation depuis plusieurs mois. Les deux camps ont d'ores et déjà entamé leur préparation dans des écuries reconnues.\n\nLa billetterie devrait ouvrir dans les prochaines semaines, avec une forte affluence attendue dans l'arène.",
      source: "Teranga Sport",
      joursAvant: 4,
    },
    {
      sport: "Dambe (boxe traditionnelle nigériane)",
      titre: "Le dambe gagne en visibilité au-delà de ses terres d'origine",
      chapo:
        "Longtemps cantonné à certaines régions, le dambe attire un public de plus en plus large, porté par une nouvelle génération de combattants.",
      contenu:
        "Les organisateurs de galas mettent en avant l'intensité et le spectacle offerts par cette discipline traditionnelle, qui combine puissance de frappe et rituels ancestraux avant chaque combat.\n\nPlusieurs académies de formation commencent à voir le jour dans les grandes villes, loin des bassins historiques de la discipline.",
      source: "AfriSport Mag",
      joursAvant: 7,
    },
    {
      sport: "Judo",
      titre: "Une médaille d'or au tournoi international des jeunes espoirs",
      chapo:
        "Le judoka, âgé de 17 ans seulement, a créé la surprise en s'imposant face à des adversaires plus expérimentés lors du tournoi international des jeunes espoirs.",
      contenu:
        "Son club salue « un travail acharné depuis plusieurs saisons » qui commence enfin à porter ses fruits au plus haut niveau international junior. Le jeune athlète devrait intégrer le groupe de préparation olympique dès la rentrée.\n\nLa fédération y voit un signe positif pour le renouvellement des générations dans la discipline.",
      source: "Dakar Sport Actu",
      joursAvant: 5,
    },
    {
      sport: "Taekwondo",
      titre: "Le championnat national se dispute ce week-end",
      chapo:
        "Toutes les catégories de poids seront représentées lors du championnat national, avec une forte participation de clubs venus de tout le pays.",
      contenu:
        "Le comité d'organisation a mis l'accent sur la sécurité des combattants, avec un dispositif médical renforcé pour cette édition. Les meilleurs athlètes de chaque catégorie intégreront la présélection en vue des prochaines compétitions internationales.\n\nL'entrée sera gratuite pour les familles des athlètes engagés.",
      source: "Sud Sport Hebdo",
      joursAvant: 2,
    },
    {
      sport: "Boxe",
      titre: "Un boxeur local décroche sa ceinture régionale",
      chapo:
        "Après un combat disputé sur la distance, le boxeur local est reparti avec la ceinture régionale de sa catégorie, une première pour son club.",
      contenu:
        "Le combat, longtemps indécis, a basculé dans les derniers rounds grâce à un gros travail au corps qui a fini par payer aux points. « C'est toute une salle qui gagne cette ceinture avec moi », a déclaré le boxeur à l'issue de la rencontre.\n\nUne défense de titre est déjà évoquée pour la fin d'année.",
      source: "Continental Sport",
      joursAvant: 6,
    },
  ];

  for (const a of ARTICLES) {
    const sport = sportParNom.get(a.sport);
    if (!sport) continue;
    await prisma.article.create({
      data: {
        titre: a.titre,
        chapo: a.chapo,
        contenu: a.contenu,
        source: a.source,
        imageUrl: photo(a.sport, a.photoIndex),
        sportId: sport.id,
        publieLe: joursAvant(a.joursAvant),
      },
    });
  }
}

// Scores/progressions de démonstration pour la carte "en direct" du menu
// Actualités — instantané figé (pas de flux temps réel). Trois formats selon
// la discipline : EQUIPE (score classique), DUEL (combat individuel, avec ou
// sans points selon la discipline) et COURSE (plusieurs concurrents classés,
// pas de face-à-face) — un score à deux équipes n'a pas de sens pour
// l'athlétisme, la natation, le cyclisme ou la lutte/dambe.
async function reinitialiserMatchsDemo(sportParNom: Map<string, { id: string }>) {
  const idsAnciens = (await prisma.matchDemo.findMany({ select: { id: true } })).map((m) => m.id);
  await prisma.matchParticipant.deleteMany({ where: { matchId: { in: idsAnciens } } });
  await prisma.matchDemo.deleteMany({ where: { id: { in: idsAnciens } } });

  const photo = (nomSport: string, index = 0) => galerieSportPour(nomSport)[index] ?? galerieSportPour(nomSport)[0];

  const MATCHS: {
    sport: string;
    type: "EQUIPE" | "DUEL" | "COURSE";
    equipeA: string;
    equipeB: string;
    scoreA: number;
    scoreB: number;
    statutTexte: string | null;
    statut: "A_VENIR" | "EN_COURS" | "TERMINE";
    minuteAffichee: string | null;
    lieu: string;
    joursDecalage: number;
    photoIndex?: number;
    participants?: { position: number; nom: string; resultat: string }[];
  }[] = [
    {
      sport: "Football",
      type: "EQUIPE",
      equipeA: "AS Douanes",
      equipeB: "Jaraaf",
      scoreA: 1,
      scoreB: 1,
      statutTexte: null,
      statut: "EN_COURS",
      minuteAffichee: "67'",
      lieu: "Stade Iba Mar Diop",
      joursDecalage: 0,
      photoIndex: 1,
    },
    {
      sport: "Basketball",
      type: "EQUIPE",
      equipeA: "DUC",
      equipeB: "AS Douanes",
      scoreA: 58,
      scoreB: 54,
      statutTexte: null,
      statut: "EN_COURS",
      minuteAffichee: "3e quart-temps",
      lieu: "Salle Marius Ndiaye",
      joursDecalage: 0,
      photoIndex: 2,
    },
    {
      sport: "Handball",
      type: "EQUIPE",
      equipeA: "Sénégal",
      equipeB: "Côte d'Ivoire",
      scoreA: 0,
      scoreB: 0,
      statutTexte: null,
      statut: "A_VENIR",
      minuteAffichee: "Coup d'envoi 18h00",
      lieu: "Dakar Arena",
      joursDecalage: -1,
    },
    {
      sport: "Volleyball",
      type: "EQUIPE",
      equipeA: "Sénégal",
      equipeB: "Cameroun",
      scoreA: 0,
      scoreB: 0,
      statutTexte: null,
      statut: "A_VENIR",
      minuteAffichee: "Coup d'envoi 20h00",
      lieu: "Complexe Léopold Sédar Senghor",
      joursDecalage: -2,
    },
    {
      sport: "Rugby à 7",
      type: "EQUIPE",
      equipeA: "Sénégal",
      equipeB: "Kenya",
      scoreA: 21,
      scoreB: 14,
      statutTexte: null,
      statut: "TERMINE",
      minuteAffichee: "Match terminé",
      lieu: "Stade Léopold Sédar Senghor",
      joursDecalage: 1,
    },
    {
      sport: "Football",
      type: "EQUIPE",
      equipeA: "Casa Sports",
      equipeB: "Teungueth FC",
      scoreA: 2,
      scoreB: 0,
      statutTexte: null,
      statut: "TERMINE",
      minuteAffichee: "Match terminé",
      lieu: "Stade Aline Sitoé Diatta",
      joursDecalage: 2,
    },
    // Duels individuels : pas de "vs équipe", un athlète contre un autre.
    {
      sport: "Lutte sénégalaise",
      type: "DUEL",
      equipeA: "El Hadji Ndoye",
      equipeB: "Serigne Fall",
      scoreA: 0,
      scoreB: 0,
      statutTexte: "Combat engagé",
      statut: "EN_COURS",
      minuteAffichee: null,
      lieu: "Arène nationale",
      joursDecalage: 0,
      photoIndex: 0,
    },
    {
      sport: "Dambe (boxe traditionnelle nigériane)",
      type: "DUEL",
      equipeA: "Yusuf Danladi",
      equipeB: "Chukwu Okoro",
      scoreA: 0,
      scoreB: 0,
      statutTexte: "Round 2",
      statut: "EN_COURS",
      minuteAffichee: null,
      lieu: "Kano",
      joursDecalage: 0,
      photoIndex: 0,
    },
    {
      sport: "Judo",
      type: "DUEL",
      equipeA: "Aissatou Ba",
      equipeB: "Fatou Sarr",
      scoreA: 1,
      scoreB: 0,
      statutTexte: "Waza-ari",
      statut: "EN_COURS",
      minuteAffichee: null,
      lieu: "Dojo national",
      joursDecalage: 0,
      photoIndex: 1,
    },
    {
      sport: "Taekwondo",
      type: "DUEL",
      equipeA: "Cheikh Diouf",
      equipeB: "Omar Thiam",
      scoreA: 12,
      scoreB: 9,
      statutTexte: "3e round",
      statut: "EN_COURS",
      minuteAffichee: null,
      lieu: "Gymnase Marius Ndiaye",
      joursDecalage: 0,
    },
    {
      sport: "Boxe",
      type: "DUEL",
      equipeA: "Pape Ndiaye",
      equipeB: "Souleymane Camara",
      scoreA: 0,
      scoreB: 0,
      statutTexte: "Ceinture régionale — vainqueur aux points",
      statut: "TERMINE",
      minuteAffichee: null,
      lieu: "Salle Alioune Coly",
      joursDecalage: 3,
    },
    // Courses/épreuves à plusieurs concurrents : pas de face-à-face, un
    // classement en direct à la place (voir MatchParticipant).
    {
      sport: "Athlétisme (sprint/sauts)",
      type: "COURSE",
      equipeA: "Finale 100m Messieurs",
      equipeB: "",
      scoreA: 0,
      scoreB: 0,
      statutTexte: "Ligne d'arrivée franchie",
      statut: "EN_COURS",
      minuteAffichee: null,
      lieu: "Stade Léopold Sédar Senghor",
      joursDecalage: 0,
      photoIndex: 1,
      participants: [
        { position: 1, nom: "Amadou Sy", resultat: "10.14s" },
        { position: 2, nom: "Bouba Diatta", resultat: "10.22s" },
        { position: 3, nom: "Landry Mbeki", resultat: "10.31s" },
      ],
    },
    {
      sport: "Natation",
      type: "COURSE",
      equipeA: "Finale 200m nage libre",
      equipeB: "",
      scoreA: 0,
      scoreB: 0,
      statutTexte: "2e longueur sur 4",
      statut: "EN_COURS",
      minuteAffichee: null,
      lieu: "Piscine olympique de Dakar",
      joursDecalage: 0,
      photoIndex: 0,
      participants: [
        { position: 1, nom: "Khady Diagne", resultat: "En tête" },
        { position: 2, nom: "Mariam Toure", resultat: "+0.4s" },
        { position: 3, nom: "Nadia Fofana", resultat: "+0.9s" },
      ],
    },
    {
      sport: "Cyclisme sur route",
      type: "COURSE",
      equipeA: "Tour national — Étape 4",
      equipeB: "",
      scoreA: 0,
      scoreB: 0,
      statutTexte: "Reste 18 km",
      statut: "EN_COURS",
      minuteAffichee: null,
      lieu: "Thiès — Mbour",
      joursDecalage: 0,
      photoIndex: 1,
      participants: [
        { position: 1, nom: "Idrissa Sow", resultat: "Leader" },
        { position: 2, nom: "Moustapha Gueye", resultat: "+00:18" },
        { position: 3, nom: "Habib Kane", resultat: "+00:41" },
      ],
    },
    {
      sport: "Athlétisme (fond/demi-fond)",
      type: "COURSE",
      equipeA: "Finale 5000m",
      equipeB: "",
      scoreA: 0,
      scoreB: 0,
      statutTexte: "Résultats définitifs",
      statut: "TERMINE",
      minuteAffichee: null,
      lieu: "Stade Iba Mar Diop",
      joursDecalage: 1,
      participants: [
        { position: 1, nom: "Ousmane Faye", resultat: "13:58.2" },
        { position: 2, nom: "Ibrahima Ndoye", resultat: "13:59.7" },
        { position: 3, nom: "Cheikh Ba", resultat: "14:03.5" },
      ],
    },
    {
      sport: "Cyclisme sur piste",
      type: "COURSE",
      equipeA: "Finale vitesse individuelle",
      equipeB: "",
      scoreA: 0,
      scoreB: 0,
      statutTexte: "Qualifications en cours",
      statut: "A_VENIR",
      minuteAffichee: null,
      lieu: "Vélodrome de Dakar",
      joursDecalage: -1,
      participants: [
        { position: 1, nom: "Serigne Mbaye", resultat: "10.9s (série)" },
        { position: 2, nom: "Alpha Diallo", resultat: "11.1s (série)" },
      ],
    },
  ];

  for (const m of MATCHS) {
    const sport = sportParNom.get(m.sport);
    if (!sport) continue;
    await prisma.matchDemo.create({
      data: {
        sportId: sport.id,
        type: m.type,
        equipeA: m.equipeA,
        equipeB: m.equipeB,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        statutTexte: m.statutTexte,
        statut: m.statut,
        minuteAffichee: m.minuteAffichee,
        lieu: m.lieu,
        dateMatch: joursAvant(m.joursDecalage),
        imageUrl: photo(m.sport, m.photoIndex),
        participants: m.participants ? { create: m.participants } : undefined,
      },
    });
  }
}

async function main() {
  const sportParNom = await seedReferentiels();
  const { programmesParNom, seancesParCle } = await seedProgrammes();
  const organisateurs = await seedOrganisateurs();
  const athletes = await seedAthletes(sportParNom);

  const { seancePartageable } = await reinitialiserSeancesDemo(athletes, programmesParNom, seancesParCle);
  await reinitialiserPostsDemo(athletes, organisateurs, seancePartageable);
  await reinitialiserEvenementsDemo(organisateurs, athletes, sportParNom);
  await reinitialiserArticlesDemo(sportParNom);
  await reinitialiserMatchsDemo(sportParNom);
  await reinitialiserMensurationsDemo(athletes);
  await reinitialiserAbonnementsDemo(athletes, organisateurs);
  await reinitialiserVuesDemo(athletes, organisateurs);

  console.log("Seed de démonstration terminé.");
  console.log(`Comptes démo (mot de passe partagé : ${MOT_DE_PASSE_DEMO}) :`);
  console.log("  Athlètes : mamadou.diallo, modou.fall, aicha.kone, chinedu.okafor, ibrahim.musa @demo.scoutapp");
  console.log("  Organisateurs : club.basket.dakar, federation.lutte.sn, academie.sport.lagos @demo.scoutapp");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
