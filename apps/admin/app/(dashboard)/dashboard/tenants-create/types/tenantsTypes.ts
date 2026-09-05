
interface TenantSubscriptionPlan {
  name?: string;
}

interface TenantSubscription {
  plan?: TenantSubscriptionPlan;
}

interface TenantCounts {
  students?: number;
  staff?: number;
  branches?: number;
}

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  legalName?: string;
  subscriptions?: TenantSubscription[];
  _count?: TenantCounts;
  [key: string]: unknown;
}

interface CellContext {
  row: {
    original: TenantItem;
  };
}