import { RowDataPacket } from "mysql2/promise";
import { defaultWorkspaceCollection } from "@/data/defaultWorkspace";
import { getDatabasePool } from "@/lib/db";
import { normalizeWorkspaceCollection, parseWorkspacePayload } from "@/lib/storage";
import { WorkspaceCollection } from "@/types/workspace";

const getOwnerKey = () => process.env.WORKSPACE_OWNER_KEY || "default";

interface WorkspaceSnapshotRow extends RowDataPacket {
  payload: string;
}

export const getStoredWorkspaceCollection = async () => {
  const pool = await getDatabasePool();
  const [rows] = await pool.query<WorkspaceSnapshotRow[]>(
    `SELECT payload, version
     FROM workspace_snapshots
     WHERE owner_key = ?
     LIMIT 1`,
    [getOwnerKey()]
  );

  if (!rows.length) {
    return null;
  }

  let parsed = null;

  try {
    parsed = parseWorkspacePayload(JSON.parse(rows[0].payload) as unknown);
  } catch {
    parsed = null;
  }

  if (!parsed) {
    return normalizeWorkspaceCollection(defaultWorkspaceCollection);
  }

  return parsed;
};

export const saveStoredWorkspaceCollection = async (collection: WorkspaceCollection) => {
  const normalized = normalizeWorkspaceCollection(collection);
  const pool = await getDatabasePool();

  await pool.query(
    `INSERT INTO workspace_snapshots (owner_key, version, payload, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP(3))
     ON DUPLICATE KEY UPDATE
       version = VALUES(version),
       payload = VALUES(payload),
       updated_at = CURRENT_TIMESTAMP(3)`,
    [getOwnerKey(), normalized.version, JSON.stringify(normalized)]
  );

  return normalized;
};