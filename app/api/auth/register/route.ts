import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { role, email, password, nom } = body;

  if (!role || !email || !password || !nom) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 6 caractères." },
      { status: 400 }
    );
  }

  if (role === "ATHLETE") {
    const { dateNaissance, ville, sport } = body;
    if (!dateNaissance || !ville || !sport) {
      return NextResponse.json(
        { error: "Champs manquants pour un profil athlète." },
        { status: 400 }
      );
    }

    const existant = await prisma.athlete.findUnique({ where: { email } });
    if (existant) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 409 }
      );
    }

    const athlete = await prisma.athlete.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        nom,
        dateNaissance: new Date(dateNaissance),
        ville,
        sport,
      },
    });

    await createSession("ATHLETE", athlete.id);
    return NextResponse.json({ id: athlete.id, role: "ATHLETE" }, { status: 201 });
  }

  if (role === "ORGANISATEUR") {
    const existant = await prisma.organisateur.findUnique({ where: { email } });
    if (existant) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 409 }
      );
    }

    const organisateur = await prisma.organisateur.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        nom,
      },
    });

    await createSession("ORGANISATEUR", organisateur.id);
    return NextResponse.json(
      { id: organisateur.id, role: "ORGANISATEUR" },
      { status: 201 }
    );
  }

  return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
}
