export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  document: string | null;
  status: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billingCycle: string;
  status: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: string;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  subscriptionId: string;
  customerId: string;
  status: string;
  amount: number;
  dueDate: string | null;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  provider: string;
  providerEventId: string;
  eventType: string;
  status: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorId: string | null;
  createdAt: string;
}

export interface Summary {
  customers: number;
  subscriptions: { total: number; active: number };
  invoices: { total: number; paid: number; open: number };
  revenueCents: number;
}
