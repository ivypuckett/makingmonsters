/// <reference path="../pb_data/types.d.ts" />

// Character event-sourcing schema.
//
// Source of truth : `characters` + append-only `events`.
// Read models     : `attributes`, `conditions`, `actions` (rebuildable from events).
//
// The projection collections are server-managed: their API create/update/delete
// rules are null (superuser-only), and the `character_projection` hook is the only
// writer. Clients read them and append to `events`.

migrate((app) => {
  const users = app.findCollectionByNameOrId("users")

  const ownerScoped = (path) => `@request.auth.id != "" && ${path} = @request.auth.id`

  // --- 1. characters (aggregate root) ---------------------------------------
  const characters = new Collection({
    type: "base",
    name: "characters",
    listRule:   ownerScoped("owner"),
    viewRule:   ownerScoped("owner"),
    createRule: ownerScoped("owner"),
    updateRule: ownerScoped("owner"),
    deleteRule: ownerScoped("owner"),
    fields: [
      { type: "text",     name: "name",     required: true, max: 200 },
      { type: "relation", name: "owner",    required: true, maxSelect: 1, cascadeDelete: true, collectionId: users.id },
      // last applied event sequence — bumped by the projection hook.
      { type: "number",   name: "head_seq", required: false, onlyInt: true, min: 0 },
      { type: "autodate", name: "created",  onCreate: true },
      { type: "autodate", name: "updated",  onCreate: true, onUpdate: true },
    ],
  })
  app.save(characters)

  const charRel = (name) => ({
    type: "relation", name, required: true,
    maxSelect: 1, cascadeDelete: true, collectionId: characters.id,
  })

  // --- 2. events (append-only source of truth) ------------------------------
  const events = new Collection({
    type: "base",
    name: "events",
    listRule:   ownerScoped("character.owner"),
    viewRule:   ownerScoped("character.owner"),
    createRule: ownerScoped("character.owner"),
    updateRule: null, // history is immutable
    deleteRule: null, // history is immutable
    fields: [
      charRel("character"),
      { type: "number", name: "seq", required: true, onlyInt: true, min: 1 },
      { type: "select", name: "type", required: true, maxSelect: 1, values: [
        "attr_upsert", "attr_delete", "attr_set",
        "cond_upsert", "cond_delete", "cond_toggle",
        "action_upsert", "action_delete", "action_trigger",
      ] },
      { type: "json",     name: "payload", required: true, maxSize: 100000 },
      { type: "relation", name: "actor",   required: false, maxSelect: 1, cascadeDelete: false, collectionId: users.id },
      { type: "autodate", name: "created",  onCreate: true },
    ],
    indexes: [
      // one event per (character, seq): the real optimistic-concurrency guard.
      "CREATE UNIQUE INDEX `idx_events_char_seq` ON `events` (`character`, `seq`)",
    ],
  })
  app.save(events)

  // --- 3. attributes projection ---------------------------------------------
  // `refs` is a self-relation (the dependency DAG); added after the first save
  // so the collection has an id to point at.
  const attributes = new Collection({
    type: "base",
    name: "attributes",
    listRule:   ownerScoped("character.owner"),
    viewRule:   ownerScoped("character.owner"),
    createRule: null, updateRule: null, deleteRule: null, // server-managed
    fields: [
      charRel("character"),
      { type: "text", name: "key",        required: true, max: 100 },
      { type: "json", name: "expression", required: false, maxSize: 100000 },
      { type: "json", name: "value",      required: false, maxSize: 100000 },
      { type: "bool", name: "dirty" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_attributes_char_key` ON `attributes` (`character`, `key`)",
    ],
  })
  app.save(attributes)
  attributes.fields.add(new RelationField({
    name: "refs", required: false, minSelect: 0, maxSelect: 999,
    cascadeDelete: false, collectionId: attributes.id,
  }))
  app.save(attributes)

  // --- 4. conditions projection ---------------------------------------------
  const conditions = new Collection({
    type: "base",
    name: "conditions",
    listRule:   ownerScoped("character.owner"),
    viewRule:   ownerScoped("character.owner"),
    createRule: null, updateRule: null, deleteRule: null,
    fields: [
      charRel("character"),
      { type: "text",     name: "key",  required: true, max: 100 },
      { type: "bool",     name: "on" },
      { type: "relation", name: "refs", required: false, minSelect: 0, maxSelect: 999, cascadeDelete: false, collectionId: attributes.id },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_conditions_char_key` ON `conditions` (`character`, `key`)",
    ],
  })
  app.save(conditions)

  // --- 5. actions projection ------------------------------------------------
  const actions = new Collection({
    type: "base",
    name: "actions",
    listRule:   ownerScoped("character.owner"),
    viewRule:   ownerScoped("character.owner"),
    createRule: null, updateRule: null, deleteRule: null,
    fields: [
      charRel("character"),
      { type: "text", name: "key",     required: true, max: 100 },
      { type: "json", name: "effects", required: false, maxSize: 100000 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_actions_char_key` ON `actions` (`character`, `key`)",
    ],
  })
  app.save(actions)
}, (app) => {
  // rollback — reverse dependency order
  for (const name of ["actions", "conditions", "attributes", "events", "characters"]) {
    try { app.delete(app.findCollectionByNameOrId(name)) } catch (_) { /* already gone */ }
  }
})
