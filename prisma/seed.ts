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

  const defis: {
    nom: string;
    description: string;
    unite: string;
    sportId?: string;
    categoriePerformance?: string;
  }[] = [
    // Défis sport-spécifiques (basketball, déjà existants dans le MVP initial)
    { nom: "Dribbles en continu", description: "Enchaîner des dribbles sans perdre le ballon", unite: "dribbles", sportId: sportParNom.get("Basketball")!.id },
    { nom: "Tirs réussis", description: "Nombre de tirs réussis sur 20 tentatives", unite: "tirs", sportId: sportParNom.get("Basketball")!.id },
    { nom: "Sprint navette", description: "Temps sur un sprint navette 20m", unite: "secondes", sportId: sportParNom.get("Basketball")!.id },
    { nom: "Passes précises", description: "Passes réussies sur une cible sur 15 tentatives", unite: "passes", sportId: sportParNom.get("Basketball")!.id },
    // Nouveaux défis sport-spécifiques pour les athlètes de démo
    { nom: "Déséquilibres réussis", description: "Nombre de déséquilibres réussis à l'entraînement", unite: "déséquilibres", sportId: sportParNom.get("Lutte sénégalaise")!.id },
    { nom: "5 km chronométré", description: "Temps sur une distance de 5 km", unite: "minutes", sportId: sportParNom.get("Athlétisme (fond/demi-fond)")!.id },
    { nom: "Tirs au but réussis", description: "Tirs au but réussis sur 15 tentatives", unite: "tirs", sportId: sportParNom.get("Handball")!.id },
    { nom: "Rounds tenus", description: "Nombre de rounds tenus à l'entraînement", unite: "rounds", sportId: sportParNom.get("Dambe (boxe traditionnelle nigériane)")!.id },
    // Défis réutilisables au niveau d'une catégorie de performance
    { nom: "Sprint 40m chronométré", description: "Temps sur un sprint de 40m, défi commun aux sports explosifs", unite: "secondes", categoriePerformance: "EXPLOSIVITE_PUISSANCE" },
    { nom: "Test Cooper 12 minutes", description: "Distance parcourue en 12 minutes, défi commun aux sports d'endurance", unite: "mètres", categoriePerformance: "ENDURANCE" },
    { nom: "Match d'application", description: "Séance de match réduit pour travailler le collectif", unite: "séances", categoriePerformance: "COLLECTIF_TACTIQUE" },
    { nom: "Enchaînement technique noté", description: "Enchaînement technique jugé par un coach, défi commun aux sports de combat", unite: "points", categoriePerformance: "COMBAT" },
  ];

  for (const defi of defis) {
    await prisma.defi.upsert({
      where: { nom: defi.nom },
      update: {},
      create: defi as never,
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

async function reinitialiserPostsDemo(athletes: { id: string }[], organisateurs: { id: string }[]) {
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
  await prisma.post.deleteMany({ where: { id: { in: idsAnciens } } });

  const [mamadou, modou, aicha, chinedu, ibrahim] = athletes;
  const [clubBasket, fedLutte, academieLagos] = organisateurs;

  const contenus: { auteur: (typeof auteurs)[number]; contenu: string; likes: (typeof auteurs)[number][]; commentaires?: { auteur: (typeof auteurs)[number]; contenu: string }[] }[] = [
    {
      auteur: { id: mamadou.id, type: "ATHLETE" },
      contenu: "Séance de tirs ce matin à Dakar, 18/20 sur les lancers ! On continue de progresser 🏀",
      likes: [{ id: modou.id, type: "ATHLETE" }, { id: aicha.id, type: "ATHLETE" }, { id: clubBasket.id, type: "ORGANISATEUR" }],
      commentaires: [{ auteur: { id: clubBasket.id, type: "ORGANISATEUR" }, contenu: "Excellent Mamadou, continue comme ça !" }],
    },
    {
      auteur: { id: clubBasket.id, type: "ORGANISATEUR" },
      contenu: "Le Tournoi Quartier Basketball ouvre ses inscriptions ! Ouvert à tous, débutants bienvenus, sans club requis.",
      likes: [{ id: mamadou.id, type: "ATHLETE" }, { id: chinedu.id, type: "ATHLETE" }],
    },
    {
      auteur: { id: modou.id, type: "ATHLETE" },
      contenu: "Entraînement de déséquilibres avec les anciens du quartier à Thiès. La lutte sénégalaise, c'est aussi une école de patience.",
      likes: [{ id: fedLutte.id, type: "ORGANISATEUR" }],
      commentaires: [
        { auteur: { id: fedLutte.id, type: "ORGANISATEUR" }, contenu: "Beau travail, on te suit pour la sélection nationale." },
        { auteur: { id: ibrahim.id, type: "ATHLETE" }, contenu: "Respect grand frère 💪" },
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

  await reinitialiserPostsDemo(athletes, organisateurs);
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
