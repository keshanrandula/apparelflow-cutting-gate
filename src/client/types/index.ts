export type Role = 'cutting_supervisor' | 'cutting_verifier' | 'sewing_supervisor';

export type OrderStatus =
  | 'IN_PROGRESS'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SEWING_STARTED';

export type ItemStatus = 'GREEN' | 'YELLOW' | 'RED';
export type Decision = 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface RecipeComponent {
  id: string;
  recipeId: string;
  componentName: string;
  piecesPerGarment: number;
  imageUrl?: string | null;
}

export interface Recipe {
  id: string;
  recipeCode: string;
  name: string;
  stdFabricYards: number;
  wastageCap: number;
  components?: RecipeComponent[];
}

export interface VerificationItem {
  id: string;
  orderId: string;
  componentId: string;
  expectedQty: number;
  actualQty: number;
  status: ItemStatus;
  component: RecipeComponent;
}

export interface VerificationLog {
  id: string;
  orderId: string;
  verifierId: string;
  decision: Decision;
  rejectionNote?: string | null;
  wastagePct?: number | null;
  timestamp: string;
  verifier: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface SewingJob {
  id: string;
  orderId: string;
  startedById: string;
  startedAt: string;
  notes?: string | null;
  startedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CuttingOrder {
  id: string;
  orderNo: string;
  recipeId: string;
  recipe: Recipe;
  targetQty: number;
  fabricRollId: string;
  actualFabricYds: number;
  status: OrderStatus;
  createdById: string;
  createdBy: User;
  verifiedById?: string | null;
  verifiedBy?: User | null;
  verifiedAt?: string | null;
  wastagePct?: number | null;
  items: VerificationItem[];
  verificationLogs?: VerificationLog[];
  sewingJobs?: SewingJob[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpectedComponentCalculation {
  recipe: Recipe;
  targetQty: number;
  expectedFabricYds: number;
  components: Array<{
    componentId: string;
    componentName: string;
    piecesPerGarment: number;
    expectedQty: number;
  }>;
}
