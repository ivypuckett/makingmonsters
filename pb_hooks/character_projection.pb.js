/// <reference path="../pb_data/types.d.ts" />

// Fold every appended `events` record into the projection collections.
//
// This runs inside the same transaction as the event insert (e.app is the
// transactional app, and e.next() performs the persist). Any throw — a stale
// sequence, a would-be cycle, an unknown action — rolls back the event too, so
// the log and the projections never diverge.
onRecordCreate((e) => {
  const { readJSON, assertAcyclic, applyEvent } = require(`${__hooks}/lib/projection.js`)

  const app = e.app
  const ev = e.record

  const charId = ev.get("character")
  const type = ev.get("type")
  const seq = ev.getInt("seq")
  const payload = readJSON(ev.get("payload"))

  // Optimistic concurrency: seq must be exactly head_seq + 1. The unique
  // (character, seq) index is the hard guard; this gives a friendlier error.
  const character = app.findRecordById("characters", charId)
  const expected = character.getInt("head_seq") + 1
  if (seq !== expected) {
    throw new BadRequestError(`stale write for character ${charId}: expected seq ${expected}, got ${seq}`)
  }

  // Reject cyclic attribute graphs before the event is ever persisted.
  if (type === "attr_upsert") {
    assertAcyclic(app, charId, payload.key, payload.refs)
  }

  e.next() // persist the event

  applyEvent(app, charId, type, payload) // update read models (throws -> rollback)

  character.set("head_seq", seq)
  app.save(character)
}, "events")
