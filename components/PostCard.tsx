"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Dumbbell, Eye, Heart, Layers, Maximize2, MessageCircle, Send, ShieldCheck, Trash2, UserRound } from "lucide-react";
import LikeButton from "@/components/LikeButton";
import RecapSeance from "@/components/RecapSeance";
import AbonnementBouton from "@/components/AbonnementBouton";
import SauvegarderBouton from "@/components/SauvegarderBouton";
import Avatar from "@/components/Avatar";
import { hrefProfil } from "@/lib/routes";

export type Post = {
  id: string;
  auteurId: string;
  auteurType: "ATHLETE" | "ORGANISATEUR";
  auteurNom: string;
  auteurAvatarUrl: string | null;
  contenu: string;
  images: string[];
  createdAt: string;
  nombreLikes: number;
  nombreCommentaires: number;
  nombreVues: number;
  likeParMoi: boolean;
  sauvegardeParMoi: boolean;
  abonneParMoi: boolean;
  auteurCestMoi: boolean;
  seance: {
    id: string;
    date: string;
    exercices: {
      id: string;
      nom: string;
      uniteMesure: string;
      series: {
        id: string;
        numeroSerie: number;
        repetitions: number | null;
        poidsKg: number | null;
        dureeSecondes: number | null;
        distanceMetres: number | null;
      }[];
    }[];
  } | null;
};

type Commentaire = {
  id: string;
  auteurId: string;
  auteurType: "ATHLETE" | "ORGANISATEUR";
  auteurNom: string;
  contenu: string;
  createdAt: string;
};

function GrillePhotos({ images }: { images: string[] }) {
  if (images.length < 2) return null;
  return (
    <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
      {images.map((url) => (
        <div key={url} className="relative h-36 w-full">
          <Image src={url} alt="" fill sizes="(max-width: 640px) 50vw, 300px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

// Image unique : mise en avant avec actions flottantes (aime/enregistrer) et,
// pour une séance partagée, un résumé chiffré en overlay — inspiré des
// aperçus de réseaux fitness, mais uniquement avec des données réelles
// (aucune calorie/score inventé, non suivis par l'app).
function PhotoUnique({ post }: { post: Post }) {
  const t = useTranslations("fil");
  if (post.images.length !== 1) return null;
  const nombreSeries = post.seance?.exercices.reduce((n, e) => n + e.series.length, 0) ?? 0;

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-xl">
      <Image src={post.images[0]} alt="" fill sizes="(max-width: 640px) 100vw, 600px" className="object-cover" />

      <div
        className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-white"
        style={{ background: "color-mix(in srgb, black 35%, transparent)" }}
      >
        <Maximize2 size={13} />
      </div>

      <div className="absolute right-2.5 top-2.5" onClick={(e) => e.stopPropagation()}>
        <LikeButton postId={post.id} likeInitial={post.likeParMoi} nombreInitial={post.nombreLikes} flottant />
      </div>

      <div className="absolute bottom-2.5 right-2.5" onClick={(e) => e.stopPropagation()}>
        <SauvegarderBouton postId={post.id} sauvegardeInitiale={post.sauvegardeParMoi} flottant />
      </div>

      {post.seance && (
        <div
          className="absolute inset-x-0 bottom-0 flex items-center gap-4 px-3 py-2.5"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,.7), transparent)" }}
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <Dumbbell size={13} />
            {t("nombreExercices", { n: post.seance.exercices.length })}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <Layers size={13} />
            {t("nombreSeries", { n: nombreSeries })}
          </span>
        </div>
      )}
    </div>
  );
}

export default function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("fil");
  const tCommun = useTranslations("commun");
  const [nbCommentaires, setNbCommentaires] = useState(post.nombreCommentaires);
  const [afficherCommentaires, setAfficherCommentaires] = useState(false);
  const [commentaires, setCommentaires] = useState<Commentaire[] | null>(null);
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [supprime, setSupprime] = useState(false);

  async function ouvrirCommentaires() {
    setAfficherCommentaires((v) => !v);
    if (commentaires === null) {
      const res = await fetch(`/api/posts/${post.id}/commentaires`);
      if (res.ok) setCommentaires(await res.json());
    }
  }

  async function envoyerCommentaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nouveauCommentaire.trim()) return;
    setErreur(null);

    const res = await fetch(`/api/posts/${post.id}/commentaires`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenu: nouveauCommentaire }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? tCommun("erreurGenerique"));
      return;
    }
    const commentaire = await res.json();
    setCommentaires((prev) => [...(prev ?? []), commentaire]);
    setNbCommentaires((n) => n + 1);
    setNouveauCommentaire("");
  }

  async function supprimerPost(e: React.MouseEvent) {
    e.stopPropagation();
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      setSupprime(true);
      router.refresh();
    }
  }

  if (supprime) return null;

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div
        onClick={() => router.push(`/posts/${post.id}`)}
        className="flex cursor-pointer flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
            <Link href={hrefProfil(post.auteurType, post.auteurId)}>
              <Avatar url={post.auteurAvatarUrl} nom={post.auteurNom} taille={36} />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link href={hrefProfil(post.auteurType, post.auteurId)} className="text-sm font-semibold hover:underline">
                  {post.auteurNom}
                </Link>
                <span className={`chip ${post.auteurType === "ORGANISATEUR" ? "chip-gold" : "chip-neutral"}`}>
                  {post.auteurType === "ORGANISATEUR" ? (
                    <ShieldCheck size={11} />
                  ) : (
                    <UserRound size={11} />
                  )}
                  {post.auteurType === "ORGANISATEUR" ? t("organisateur") : t("athlete")}
                </span>
              </div>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {new Date(post.createdAt).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
            {!post.auteurCestMoi && (
              <AbonnementBouton
                type={post.auteurType === "ATHLETE" ? "athlete" : "organisateur"}
                id={post.auteurId}
                abonneInitial={post.abonneParMoi}
                compact
              />
            )}
            {post.auteurCestMoi && (
              <button onClick={supprimerPost} aria-label={t("supprimer")} className="btn btn-ghost !p-1.5">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.contenu}</p>

        {post.seance && <RecapSeance exercices={post.seance.exercices} />}

        <PhotoUnique post={post} />
        <GrillePhotos images={post.images} />
      </div>

      {erreur && <p className="chip chip-danger self-start">{erreur}</p>}

      <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        {post.images.length !== 1 && (
          <LikeButton postId={post.id} likeInitial={post.likeParMoi} nombreInitial={post.nombreLikes} />
        )}
        <button
          onClick={ouvrirCommentaires}
          className="chip chip-neutral"
          style={afficherCommentaires ? { background: "var(--primary-soft)", color: "var(--primary)" } : undefined}
        >
          <MessageCircle size={14} />
          {nbCommentaires}
        </button>
        {post.images.length === 1 && (
          <span className="chip chip-neutral" style={{ color: "var(--muted)" }}>
            <Heart size={13} fill={post.likeParMoi ? "var(--primary)" : "none"} style={post.likeParMoi ? { color: "var(--primary)" } : undefined} />
            {post.nombreLikes}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
          <Eye size={14} />
          {post.nombreVues}
        </span>
      </div>

      {afficherCommentaires && (
        <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          {commentaires === null && (
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {t("chargementEnCours")}
            </p>
          )}
          {commentaires?.map((c) => (
            <div key={c.id} className="text-sm">
              <Link
                href={hrefProfil(c.auteurType, c.auteurId)}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold hover:underline"
              >
                {c.auteurNom}
              </Link>{" "}
              <span style={{ color: "var(--foreground)" }}>{c.contenu}</span>
            </div>
          ))}
          <form onSubmit={envoyerCommentaire} className="flex gap-2 pt-1">
            <input
              value={nouveauCommentaire}
              onChange={(e) => setNouveauCommentaire(e.target.value)}
              placeholder={t("ajouterCommentaire")}
              className="input flex-1 !py-1.5 text-sm"
            />
            <button type="submit" className="btn btn-primary !px-3">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
