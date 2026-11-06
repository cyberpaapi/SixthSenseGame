"use strict";
const { credential } = require("./identities");
async function deleteIdentity(sql, body) {
  if (body.confirmation !== "DELETE") throw Object.assign(new Error("Type DELETE to confirm account deletion."), { status: 400 });
  const tokenHash = credential(body.identityToken);
  // Authenticate every mutation with the credential hash, never a supplied id.
  // The transaction rolls back every change on error and makes retries harmless.
  await sql.transaction([
    sql`SELECT id FROM sixth_sense_identities WHERE token_hash=${tokenHash} FOR UPDATE`,
    sql`SELECT code FROM sixth_sense_rooms WHERE code IN (
      SELECT room_code FROM sixth_sense_players WHERE identity_id IN (
        SELECT id FROM sixth_sense_identities WHERE token_hash=${tokenHash}
      )
    ) ORDER BY code FOR UPDATE`,
    // Other seats' cached snapshots can contain this player's old display name.
    sql`DELETE FROM sixth_sense_actions WHERE room_code IN (
      SELECT room_code FROM sixth_sense_players WHERE identity_id IN (
        SELECT id FROM sixth_sense_identities WHERE token_hash=${tokenHash}
      )
    )`,
    sql`UPDATE sixth_sense_rooms SET status='finished', revision=revision+1,
      host_player_id=CASE WHEN host_player_id IN (
        SELECT id FROM sixth_sense_players WHERE identity_id IN (SELECT id FROM sixth_sense_identities WHERE token_hash=${tokenHash})
      ) THEN gen_random_uuid() ELSE host_player_id END,
      winner_player_id=NULL, last_round_winner_player_id=NULL
      WHERE code IN (
        SELECT room_code FROM sixth_sense_players WHERE identity_id IN (
          SELECT id FROM sixth_sense_identities WHERE token_hash=${tokenHash}
        )
      )`,
    // Presence events cascade from these seats. Other players are retained.
    sql`DELETE FROM sixth_sense_players WHERE identity_id IN (
      SELECT id FROM sixth_sense_identities WHERE token_hash=${tokenHash}
    )`,
    sql`DELETE FROM sixth_sense_identities WHERE token_hash=${tokenHash}`
  ]);
  return { deleted: true };
}
module.exports = { deleteIdentity };
