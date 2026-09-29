import type { Metadata } from "next";
import { SITE } from "./constants";

type PageMetaInput = {
  title: string;
  description: string;
  path?: string;
};

export function pageMeta({ title, description, path = "" }: PageMetaInput): Metadata {
  const url = `${SITE.url}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} · ${SITE.name}`,
      description,
      url,
      siteName: SITE.name,
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE.name}`,
      description,
    },
  };
}
