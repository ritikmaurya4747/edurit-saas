import type { MetadataRoute } from "next";

const siteUrl = "https://edurit.ritikmaurya.in";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    // Apne baaki public marketing pages yahan add karo:
    // {
    //   url: `${siteUrl}/pricing`,
    //   lastModified: new Date(),
    //   changeFrequency: "monthly",
    //   priority: 0.8,
    // },
    // {
    //   url: `${siteUrl}/features`,
    //   lastModified: new Date(),
    //   changeFrequency: "monthly",
    //   priority: 0.8,
    // },
  ];
}