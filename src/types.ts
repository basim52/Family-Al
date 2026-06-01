export type ProjectCategory = 'maintenance' | 'improvement' | 'furnishing' | 'events' | 'emergency' | 'other';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed';

export type PriorityLevel = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  projectId: string;
  text: string;
  completed: boolean;
  assignedTo: string;
  dueDate?: string;
  priority: PriorityLevel;
}

export interface Expense {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: PriorityLevel;
  leader: string;
  budget: number;
  spent: number;
  dueDate: string;
  createdAt: string;
  photoUrl?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  type: 'announcement' | 'decision' | 'note';
}

export interface FamilyContributionByMember {
  member: string;
  amount: number;
}

export interface DevelopmentPlan {
  id: string;
  title: string;
  description: string;
  suggestedBy: string;
  estimatedCost: number;
  votes: string[]; // Names of family members who voted for this plan
  status: 'studying' | 'approved' | 'deferred';
  category: string;
  createdAt: string;
  feasibility?: {
    score: number;
    effort: 'high' | 'medium' | 'low';
    steps: string[];
    pros: string[];
    cons: string[];
    verdict: string;
  };
}

export type VaultTransactionType = 'spend' | 'payment' | 'deposit';

export interface VaultTransaction {
  id: string;
  type: VaultTransactionType;
  amount: number;
  member: string;
  description: string;
  date: string;
  voucherNumber: string;
  projectId?: string;
}
