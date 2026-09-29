export type NavLink = {
  label: string;
  href: string;
  description?: string;
};

export const primaryNav: NavLink[] = [
  { label: "Product", href: "/features" },
  { label: "Solutions", href: "/solutions" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
  { label: "About", href: "/about" },
];

export const footerNav = {
  product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Security", href: "/features#security" },
    { label: "Mobile access", href: "/features#mobile" },
  ],
  solutions: [
    { label: "For school leaders", href: "/solutions#roles" },
    { label: "For teachers", href: "/solutions#roles" },
    { label: "For parents", href: "/solutions#roles" },
    { label: "For school groups", href: "/solutions#school-types" },
  ],
  resources: [
    { label: "Help centre", href: "/resources#guides" },
    { label: "Setup guide", href: "/resources#featured" },
    { label: "Support", href: "/resources#support" },
    { label: "FAQ", href: "/pricing#faq" },
  ],
  company: [
    { label: "About us", href: "/about" },
    { label: "Contact sales", href: "/contact" },
    { label: "Book a demo", href: "/demo" },
    { label: "Support", href: "/contact" },
  ],
};
