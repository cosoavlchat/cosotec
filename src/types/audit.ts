export interface AuditLogEntry {
  id?: string;
  timestamp: string; // ISO 8601
  userId: string;
  userEmail: string;
  entity: "product" | "package" | "pricing" | "travelFee" | "user" | "bank" | "contact";
  entityId: string;
  action: "create" | "update" | "delete" | "toggle_status" | "set_role";
  before: any;
  after: any;
  metadata?: Record<string, any>;
}
