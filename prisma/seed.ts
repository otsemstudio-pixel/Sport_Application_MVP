import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

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
    categoriePerformance: string;
    uniteMesure: string;
  }[] = [
    // Renforcement général (utilisable par tous les sports)
    { nom: "Squats", description: "Squats au poids du corps", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "SERIES_X_REPETITIONS" },
    { nom: "Pompes", description: "Pompes au poids du corps", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "SERIES_X_REPETITIONS" },
    { nom: "Tractions", description: "Tractions à la barre", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "SERIES_X_REPETITIONS" },
    { nom: "Abdominaux", description: "Crunchs ou relevés de buste", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "REPETITIONS" },
    { nom: "Fentes", description: "Fentes avant alternées", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "SERIES_X_REPETITIONS" },
    { nom: "Gainage", description: "Gainage ventral (planche)", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "DUREE_SECONDES" },
    { nom: "Burpees", description: "Burpees complets", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "REPETITIONS" },
    { nom: "Planche latérale", description: "Gainage latéral, de chaque côté", categoriePerformance: "RENFORCEMENT_GENERAL", uniteMesure: "DUREE_SECONDES" },
    // Explosivité / puissance
    { nom: "Sprint 30m chronométré", description: "Temps sur un sprint de 30m", categoriePerformance: "EXPLOSIVITE_PUISSANCE", uniteMesure: "DUREE_SECONDES" },
    { nom: "Sauts en longueur", description: "Distance du meilleur saut en longueur sans élan", categoriePerformance: "EXPLOSIVITE_PUISSANCE", uniteMesure: "DISTANCE_METRES" },
    { nom: "Corde à sauter", description: "Nombre de sauts à la corde sans interruption", categoriePerformance: "EXPLOSIVITE_PUISSANCE", uniteMesure: "REPETITIONS" },
    // Endurance
    { nom: "10 km chronométré", description: "Temps sur une distance de 10 km", categoriePerformance: "ENDURANCE", uniteMesure: "DUREE_SECONDES" },
    { nom: "Course en durée (distance parcourue)", description: "Distance parcourue sur un temps fixe (ex. 12 minutes)", categoriePerformance: "ENDURANCE", uniteMesure: "DISTANCE_METRES" },
    // Combat
    { nom: "Mouvements de lutte au sol chronométrés", description: "Enchaînement de mouvements au sol contre la montre", categoriePerformance: "COMBAT", uniteMesure: "DUREE_SECONDES" },
    { nom: "Enchaînement technique combat noté", description: "Enchaînement technique jugé par un coach", categoriePerformance: "COMBAT", uniteMesure: "REPETITIONS" },
  ];

  for (const exercice of EXERCICES) {
    await prisma.exercice.upsert({
      where: { nom: exercice.nom },
      update: {},
      create: exercice as never,
    });
  }

  return sportParNom;
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
    const athlete = await prisma.athlete.upsert({
      where: { email: a.email },
      update: {
        nom: a.nom,
        ville: a.ville,
        sportPrincipalId: sportParNom.get(a.sport)!.id,
      },
      create: {
        email: a.email,
        passwordHash,
        nom: a.nom,
        ville: a.ville,
        dateNaissance: a.dateNaissance,
        sportPrincipalId: sportParNom.get(a.sport)!.id,
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

async function reinitialiserSeancesDemo(athletes: { id: string }[]) {
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
  await prisma.exerciceRealise.deleteMany({ where: { seanceId: { in: idsAnciennes } } });
  await prisma.seanceEntrainement.deleteMany({ where: { id: { in: idsAnciennes } } });

  const exerciceParNom = new Map(
    (await prisma.exercice.findMany()).map((e) => [e.nom, e])
  );

  async function creerSeance(
    athleteId: string,
    date: Date,
    exercices: { nom: string; valeur: number; series?: number }[]
  ) {
    return prisma.seanceEntrainement.create({
      data: {
        athleteId,
        date,
        exercicesRealises: {
          create: exercices.map((e) => ({
            exerciceId: exerciceParNom.get(e.nom)!.id,
            valeur: e.valeur,
            series: e.series ?? null,
          })),
        },
      },
      include: { exercicesRealises: { include: { exercice: true } } },
    });
  }

  const seanceAujourdhuiMamadou = await creerSeance(mamadou.id, joursAvant(0), [
    { nom: "Squats", valeur: 15, series: 3 },
    { nom: "Sprint 30m chronométré", valeur: 4.8 },
    { nom: "Corde à sauter", valeur: 100 },
  ]);
  await creerSeance(mamadou.id, joursAvant(2), [
    { nom: "Pompes", valeur: 20, series: 3 },
    { nom: "Abdominaux", valeur: 50 },
  ]);
  await creerSeance(mamadou.id, joursAvant(5), [
    { nom: "Dribbles en continu", valeur: 15 },
    { nom: "Tirs réussis", valeur: 14 },
  ]);
  await creerSeance(mamadou.id, joursAvant(10), [
    { nom: "Burpees", valeur: 30 },
    { nom: "Gainage", valeur: 60 },
  ]);
  await creerSeance(mamadou.id, joursAvant(35), [{ nom: "Squats", valeur: 12, series: 3 }]);

  await creerSeance(aicha.id, joursAvant(0), [
    { nom: "10 km chronométré", valeur: 2700 },
    { nom: "Course en durée (distance parcourue)", valeur: 2400 },
  ]);
  await creerSeance(aicha.id, joursAvant(3), [{ nom: "5 km chronométré", valeur: 1500 }]);
  await creerSeance(aicha.id, joursAvant(9), [
    { nom: "Planche latérale", valeur: 90 },
    { nom: "Abdominaux", valeur: 40 },
  ]);
  await creerSeance(aicha.id, joursAvant(40), [{ nom: "10 km chronométré", valeur: 2800 }]);

  await creerSeance(modou.id, joursAvant(0), [
    { nom: "Mouvements de lutte au sol chronométrés", valeur: 300 },
    { nom: "Déséquilibres réussis", valeur: 8 },
  ]);
  await creerSeance(modou.id, joursAvant(4), [
    { nom: "Enchaînement technique combat noté", valeur: 7 },
    { nom: "Tractions", valeur: 8, series: 3 },
  ]);

  const resume = seanceAujourdhuiMamadou.exercicesRealises
    .map((er) =>
      er.series
        ? `${er.series}x${er.valeur} ${er.exercice.nom}`
        : `${er.valeur} ${er.exercice.uniteMesure === "DUREE_SECONDES" ? "secondes" : er.exercice.uniteMesure === "DISTANCE_METRES" ? "mètres" : "répétitions"} de ${er.exercice.nom}`
    )
    .join(", ");

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

async function main() {
  const sportParNom = await seedReferentiels();
  const organisateurs = await seedOrganisateurs();
  const athletes = await seedAthletes(sportParNom);

  const { seancePartageable } = await reinitialiserSeancesDemo(athletes);
  await reinitialiserPostsDemo(athletes, organisateurs, seancePartageable);
  await reinitialiserEvenementsDemo(organisateurs, athletes, sportParNom);

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
