// domain/model/FlowEdge.ts
import { EdgeId, StatementId } from "./ids";

export interface FlowEdge {
  id: EdgeId;
  from: StatementId;
  to: StatementId;
}
