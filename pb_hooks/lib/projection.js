/// <reference path="../../pb_data/types.d.ts" />

// Pure-ish fold logic for the character event stream. Required (not captured
// from outer scope) by character_projection.pb.js, because PocketBase runs each
// hook handler in an isolated runtime with no access to file-level bindings.

const ATTR_LIMIT = 5000 // max attributes per character we scan for cycle checks

function def(v, fallback) {
  return v === undefined || v === null ? fallback : v
}

// json fields may arrive as a raw string or an already-decoded value.
function readJSON(v) {
  if (v === undefined || v === null) return {}
  if (typeof v === "string") {
    try { return JSON.parse(v) } catch (_) { return {} }
  }
  return v
}

function findProj(app, collection, charId, key) {
  const rows = app.findRecordsByFilter(
    collection,
    "character = {:c} && key = {:k}",
    "", 1, 0,
    { c: charId, k: key },
  )
  return rows.length ? rows[0] : null
}

function upsertProj(app, collection, charId, key, apply) {
  let rec = findProj(app, collection, charId, key)
  if (!rec) {
    rec = new Record(app.findCollectionByNameOrId(collection))
    rec.set("character", charId)
    rec.set("key", key)
  }
  apply(rec)
  app.save(rec)
  return rec
}

function deleteProj(app, collection, charId, key) {
  const rec = findProj(app, collection, charId, key)
  if (rec) app.delete(rec)
}

// Resolve attribute keys -> attribute record ids (for relation fields).
// Unknown keys are dropped; they simply don't form an edge yet.
function resolveRefs(app, charId, keys) {
  const ids = []
  for (const k of def(keys, [])) {
    const r = findProj(app, "attributes", charId, k)
    if (r) ids.push(r.id)
  }
  return ids
}

// Reject an upsert whose refs would introduce a cycle in the attribute DAG.
function assertAcyclic(app, charId, key, refKeys) {
  const rows = app.findRecordsByFilter("attributes", "character = {:c}", "", ATTR_LIMIT, 0, { c: charId })

  const idToKey = {}
  for (const r of rows) idToKey[r.id] = r.get("key")

  const graph = {}
  for (const r of rows) {
    const edges = def(r.get("refs"), []).map((id) => idToKey[id]).filter(Boolean)
    graph[r.get("key")] = edges
  }
  graph[key] = def(refKeys, []).slice() // apply the proposed node/edges

  const state = {} // undefined=unvisited, 1=on-stack, 2=done
  function dfs(n) {
    state[n] = 1
    for (const m of def(graph[n], [])) {
      if (state[m] === 1) return true
      if (state[m] === undefined && dfs(m)) return true
    }
    state[n] = 2
    return false
  }
  if (dfs(key)) {
    throw new BadRequestError(`attribute "${key}" would create a circular dependency`)
  }
}

// Fold a single event into the projections. Called once per appended event,
// and recursively for action effects.
function applyEvent(app, charId, type, payload) {
  switch (type) {
    case "attr_upsert":
      upsertProj(app, "attributes", charId, payload.key, (r) => {
        r.set("expression", def(payload.expression, null))
        r.set("refs", resolveRefs(app, charId, payload.refs))
        r.set("dirty", true)
      })
      break

    case "attr_set":
      upsertProj(app, "attributes", charId, payload.key, (r) => {
        r.set("value", def(payload.value, null))
        r.set("dirty", false)
      })
      break

    case "attr_delete":
      deleteProj(app, "attributes", charId, payload.key)
      break

    case "cond_upsert":
      upsertProj(app, "conditions", charId, payload.key, (r) => {
        r.set("refs", resolveRefs(app, charId, payload.refs))
        if (r.get("on") === undefined || r.get("on") === null) r.set("on", false)
      })
      break

    case "cond_toggle":
      upsertProj(app, "conditions", charId, payload.key, (r) => {
        r.set("on", !!payload.on)
      })
      break

    case "cond_delete":
      deleteProj(app, "conditions", charId, payload.key)
      break

    case "action_upsert":
      upsertProj(app, "actions", charId, payload.key, (r) => {
        r.set("effects", def(payload.effects, []))
      })
      break

    case "action_delete":
      deleteProj(app, "actions", charId, payload.key)
      break

    case "action_trigger":
      applyActionEffects(app, charId, payload.key)
      break

    default:
      throw new BadRequestError(`unknown event type "${type}"`)
  }
}

// An action's stored `effects` are expanded into the same set/toggle folds.
// Effect shapes:
//   { "set_attribute":   { "key": "hp", "value": 10 } }
//   { "toggle_condition": { "key": "stunned", "on": true } }
function applyActionEffects(app, charId, key) {
  const action = findProj(app, "actions", charId, key)
  if (!action) throw new BadRequestError(`unknown action "${key}"`)
  for (const fx of def(action.get("effects"), [])) {
    if (fx.set_attribute) {
      applyEvent(app, charId, "attr_set", fx.set_attribute)
    } else if (fx.toggle_condition) {
      applyEvent(app, charId, "cond_toggle", fx.toggle_condition)
    }
  }
}

module.exports = { readJSON, assertAcyclic, applyEvent }
