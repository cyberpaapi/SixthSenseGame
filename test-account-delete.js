"use strict";
const assert = require("node:assert/strict");
const { randomUUID, randomBytes } = require("node:crypto");
const { PGlite } = require("@electric-sql/pglite");
const identities = require("./lib/identities");
const { deleteIdentity } = require("./lib/delete-identity");
const { ensureSchema } = require("./api/multiplayer");
const handler = require("./api/delete-identity");
(async () => {
  const db = new PGlite();
  try {
    // Run the application's actual Postgres schema and parameterized statements.
    const parameters = [];
    const sql = (strings, ...values) => {
      const text = strings.reduce((s, part, i) => s + (i ? `$${i}` : "") + part, "");
      parameters.push(...values);
      return { text, values, then: (resolve, reject) => db.query(text, values).then(r => r.rows).then(resolve, reject) };
    };
    let transactions = 0, failAfter = -1;
    sql.transaction = queries => db.transaction(async tx => {
      transactions++;
      const results = [];
      for (let i = 0; i < queries.length; i++) {
        if (i === failAfter) throw new Error("Simulated database interruption");
        results.push((await tx.query(queries[i].text, queries[i].values)).rows);
      }
      return results;
    });
    await ensureSchema(sql);
    const token = randomBytes(32).toString("hex"), otherToken = randomBytes(32).toString("hex");
    const owner = await identities.claim(sql, "Delete Test", token);
    const other = await identities.claim(sql, "Keep Test", otherToken);
    const seat = randomUUID(), otherSeat = randomUUID();
    for (const [code, host] of [["DELETE", seat], ["KEEPIT", otherSeat]]) {
      await sql`INSERT INTO sixth_sense_rooms (code,mode,difficulty,word_count,capacity,host_player_id,status,expires_at)
        VALUES (${code},'race','easy',3,8,${host},'running',now()+interval '1 day')`;
    }
    for (const [id, room, profile, name, index] of [[seat,"DELETE",owner.id,"Delete Test",1], [otherSeat,"DELETE",other.id,"Keep Test",2], [randomUUID(),"KEEPIT",other.id,"Keep Test",1]]) {
      await sql`INSERT INTO sixth_sense_players (id,room_code,resume_hash,display_name,avatar,accent,seat,identity_id)
        VALUES (${id},${room},'hash',${name},'fox','coral',${index},${profile})`;
    }
    await sql`INSERT INTO sixth_sense_presence_events (event_id,player_id,sequence) VALUES (${randomUUID()},${seat},1)`;
    for (const code of ["DELETE", "KEEPIT"]) await sql`INSERT INTO sixth_sense_actions (action_id,room_code,player_id,response) VALUES (${randomUUID()},${code},${otherSeat},'{"players":["Delete Test"]}'::jsonb)`;
    const count = async table => Number((await db.query(`SELECT count(*) AS n FROM ${table}`)).rows[0].n);
    await assert.rejects(deleteIdentity(sql, { identityToken: token, confirmation: "delete" }), e => e.status === 400);
    await assert.rejects(deleteIdentity(sql, { identityToken: "invalid", confirmation: "DELETE" }), e => e.status === 401);
    assert.equal(transactions, 0, "Invalid confirmation/credentials must not start a transaction");
    // A forged victim id or name cannot authorize any deletion.
    await deleteIdentity(sql, { identityToken: "0".repeat(64), identityId: owner.id, name: owner.display_name, confirmation: "DELETE" });
    assert.equal(await count("sixth_sense_identities"), 2);
    failAfter = 5;
    await assert.rejects(deleteIdentity(sql, { identityToken: token, confirmation: "DELETE" }), /interruption/);
    assert.equal(await count("sixth_sense_players"), 3, "Deleting seats must roll back if deleting the profile fails");
    assert.equal(await count("sixth_sense_presence_events"), 1);
    assert.equal(await count("sixth_sense_actions"), 2);
    assert.equal((await db.query("SELECT status FROM sixth_sense_rooms WHERE code='DELETE'")).rows[0].status, "running");
    failAfter = -1;
    assert.deepEqual(await deleteIdentity(sql, { identityToken: token, confirmation: "DELETE" }), { deleted: true });
    assert.equal(await count("sixth_sense_identities"), 1);
    assert.equal(await count("sixth_sense_players"), 2);
    assert.equal(await count("sixth_sense_presence_events"), 0);
    assert.equal(await count("sixth_sense_actions"), 1);
    const rooms = (await db.query("SELECT code,status,host_player_id FROM sixth_sense_rooms ORDER BY code")).rows;
    assert.equal(rooms[0].status, "finished"); assert.notEqual(rooms[0].host_player_id, seat);
    assert.equal(rooms[1].status, "running");
    await assert.rejects(identities.authenticate(sql, token), e => e.status === 401);
    assert.equal((await identities.authenticate(sql, otherToken)).id, other.id);
    await deleteIdentity(sql, { identityToken: token, confirmation: "DELETE" });
    assert.equal(await count("sixth_sense_identities"), 1, "Retry must not affect another account");
    assert.equal((await identities.claim(sql, "Delete Test", randomBytes(32).toString("hex"))).display_name, "Delete Test");
    assert.equal(parameters.includes(token), false, "Raw recovery credentials must not enter SQL");
    for (const [request, expected] of [[{ method:"GET" },405], [{ method:"OPTIONS" },204], [{ method:"POST",body:"{" },400], [{ method:"POST",body:{ identityToken:"bad",confirmation:"DELETE" } },401]]) {
      const response = { setHeader(){},status(code){this.code=code;return this;},json(){return this;},end(){return this;} };
      await handler(request,response); assert.equal(response.code,expected);
    }
    console.log("Account deletion: real Postgres schema, credential ownership, cascades, room isolation, rollback, retries and released username passed.");
  } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
