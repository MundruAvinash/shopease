
import { createHash } from "crypto";
import { db } from "@/lib/db";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

function getIdentifier(email: string): string {
  return createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
}

interface RateLimitRow {
  attempts: number;
  window_expired: number;
  is_blocked: number;
  retry_after: number | null;
}

async function getLockedRecord(
  connection: Awaited<ReturnType<typeof db.getConnection>>,
  identifier: string
): Promise<RateLimitRow> {
  await connection.execute(
    `INSERT IGNORE INTO login_rate_limits
     (identifier, attempts, window_started_at, blocked_until)
     VALUES (?, 0, NOW(), NULL)`,
    [identifier]
  );

  const [rows] = await connection.execute(
    `SELECT
       attempts,
       (window_started_at <= DATE_SUB(NOW(), INTERVAL ${WINDOW_MINUTES} MINUTE))
         AS window_expired,
       (blocked_until IS NOT NULL AND blocked_until > NOW())
         AS is_blocked,
       GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), blocked_until))
         AS retry_after
     FROM login_rate_limits
     WHERE identifier = ?
     FOR UPDATE`,
    [identifier]
  );

  return (rows as RateLimitRow[])[0];
}

export async function checkLoginRateLimit(email: string) {
  const identifier = getIdentifier(email);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const record = await getLockedRecord(connection, identifier);

    if (record.window_expired) {
      await connection.execute(
        `UPDATE login_rate_limits
         SET attempts = 0, window_started_at = NOW(), blocked_until = NULL
         WHERE identifier = ?`,
        [identifier]
      );
    }

    await connection.commit();

    return {
      blocked: !record.window_expired && Boolean(record.is_blocked),
      retryAfter: Number(record.retry_after ?? 0),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function recordFailedLogin(email: string) {
  const identifier = getIdentifier(email);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const record = await getLockedRecord(connection, identifier);

    const attempts = record.window_expired
      ? 1
      : Number(record.attempts) + 1;

    const isBlocked = attempts >= MAX_ATTEMPTS;

    await connection.execute(
      `UPDATE login_rate_limits
       SET attempts = ?,
           window_started_at = ${
             record.window_expired ? "NOW()" : "window_started_at"
           },
           blocked_until = ${
             isBlocked
               ? `DATE_ADD(NOW(), INTERVAL ${WINDOW_MINUTES} MINUTE)`
               : "NULL"
           }
       WHERE identifier = ?`,
      [attempts, identifier]
    );

    await connection.commit();

    return {
      blocked: isBlocked,
      attempts,
      retryAfter: isBlocked ? WINDOW_MINUTES * 60 : 0,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function resetLoginAttempts(email: string) {
  const identifier = getIdentifier(email);

  await db.execute(
    `DELETE FROM login_rate_limits WHERE identifier = ?`,
    [identifier]
  );
}
