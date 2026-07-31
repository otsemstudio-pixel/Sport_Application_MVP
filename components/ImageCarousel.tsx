"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="relative h-[480px] w-full overflow-hidden rounded-xl">
        <Image src={images[0]} alt="" fill sizes="(max-width: 640px) 100vw, 600px" className="object-cover" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative h-[480px] w-full overflow-hidden rounded-xl">
        <Image src={images[index]} alt="" fill sizes="(max-width: 640px) 100vw, 600px" className="object-cover" />
      </div>
      <button
        type="button"
        onClick={() => setIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
        aria-label="Image précédente"
        className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => setIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
        aria-label="Image suivante"
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        <ChevronRight size={18} />
      </button>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((img, i) => (
          <span
            key={img}
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: i === index ? "white" : "rgba(255,255,255,0.5)" }}
          />
        ))}
      </div>
    </div>
  );
}
