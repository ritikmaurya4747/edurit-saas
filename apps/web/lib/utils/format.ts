export const getInitials = (name?: string) => {
  if (!name) return "U";

  const words = name
    .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const first = words[0];
  const last = words[words.length - 1];

  if (!first) return "U";
  if (!last || words.length === 1) {
    return first.slice(0, 2).toUpperCase();
  }

  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
};

export const formatRole = (role?: string) => {
  if (!role) return "";

  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};