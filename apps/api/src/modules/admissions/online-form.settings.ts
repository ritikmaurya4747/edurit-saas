// Online admission form settings, stored in TenantSettings.themeConfig.admissions.
// Shared by the admissions settings endpoints and the public form (PublicModule).

export const ONLINE_FORM_SOURCE = 'ONLINE_FORM';
export const ONLINE_FORM_PUBLIC_PATH = '/apply';

export interface OnlineFormSettings {
  onlineFormEnabled: boolean;
  formMessage: string;
  // Class names; empty = every class of the school.
  classesOpen: string[];
  academicYearLabel: string;
}

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export function readOnlineFormSettings(themeConfig: unknown): OnlineFormSettings {
  const theme = isPlainObject(themeConfig) ? themeConfig : {};
  const stored = isPlainObject(theme.admissions) ? theme.admissions : {};
  return {
    onlineFormEnabled: stored.onlineFormEnabled === true,
    formMessage: typeof stored.formMessage === 'string' ? stored.formMessage : '',
    classesOpen: Array.isArray(stored.classesOpen)
      ? stored.classesOpen.filter((c): c is string => typeof c === 'string' && c.trim() !== '')
      : [],
    academicYearLabel: typeof stored.academicYearLabel === 'string' ? stored.academicYearLabel : '',
  };
}

// "Class 2" before "Class 10".
export const naturalCompare = (a: string, b: string) =>
  a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });

// Unique (case-insensitive), trimmed and naturally sorted.
export function uniqueSorted(names: string[]): string[] {
  const seen = new Map<string, string>();
  for (const raw of names) {
    const name = raw.trim();
    if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
  }
  return [...seen.values()].sort(naturalCompare);
}
