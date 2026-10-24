// StreetShift live world state. Planners edit scenarios through reducers; the /sim server
// subscribes, recomputes, and publishes results back with `publishResults`. Every client sees
// edits, results, other planners' cursors and the hearing transcript in real time.
import { schema, table, t, SenderError, type InferSchema, type ReducerCtx } from 'spacetimedb/server';

const scenario = table(
  { name: 'scenario', public: true },
  {
    id: t.string().primaryKey(),
    area: t.string(),
    corridorId: t.string(),
    addedSeating: t.bool(),
    programming: t.string(), // none | light | heavy
    revision: t.u32(), // bumps on every edit; results carry the revision they were computed for
    updatedAt: t.timestamp(),
    updatedBy: t.identity(),
  }
);

const closedSegment = table(
  { name: 'closed_segment', public: true },
  {
    id: t.string().primaryKey(), // `${scenarioId}:${segmentId}`
    scenarioId: t.string().index('btree'),
    segmentId: t.string(),
    closedBy: t.identity(),
  }
);

/** Planner tool edits other than closures: add floors, change use, add a park. */
const scenarioEdit = table(
  { name: 'scenario_edit', public: true },
  {
    id: t.string().primaryKey(), // `${scenarioId}:${kind}:${targetId}`
    scenarioId: t.string().index('btree'),
    kind: t.string(), // floors | land_use | park | param (assumption override)
    targetId: t.string(), // segmentId or businessId
    value: t.string(), // floors: "+N residents"; land_use: new category; park: "1"
  }
);

const scenarioResult = table(
  { name: 'scenario_result', public: true },
  {
    scenarioId: t.string().primaryKey(),
    revision: t.u32(),
    computedAt: t.timestamp(),
    elapsedMs: t.u32(),
    verdict: t.string(),
    lingerIndex: t.f64(),
    conversationsPerHour: t.f64(),
    conversationsLo: t.f64(),
    conversationsHi: t.f64(),
    lingerMinutes: t.f64(),
    newConnectionsPerDay: t.f64(),
    newConnectionsLo: t.f64(),
    newConnectionsHi: t.f64(),
    peoplePresent: t.f64(),
    revenueChangePct: t.f64(),
    revenueLo: t.f64(),
    revenueHi: t.f64(),
    addedVehicleHours: t.f64(),
    vehicleHoursLo: t.f64(),
    vehicleHoursHi: t.f64(),
    reroutedVehPerHour: t.f64(),
    beforeConversationsPerHour: t.f64(),
    beforeLingerMinutes: t.f64(),
    beforeNewConnectionsPerDay: t.f64(),
    beforeLingerIndex: t.f64(),
    flags: t.string(), // human-readable caveats joined by " | "
  }
);

const SegmentMetric = t.object('SegmentMetricInput', {
  segmentId: t.string(),
  baseCar: t.f64(),
  afterCar: t.f64(),
  loadPct: t.f64(),
  basePed: t.f64(),
  afterPed: t.f64(),
});

const BusinessMetric = t.object('BusinessMetricInput', {
  businessId: t.string(),
  changePct: t.f64(),
});

const segmentMetric = table(
  { name: 'segment_metric', public: true },
  {
    id: t.string().primaryKey(),
    scenarioId: t.string().index('btree'),
    segmentId: t.string(),
    baseCar: t.f64(),
    afterCar: t.f64(),
    loadPct: t.f64(),
    basePed: t.f64(),
    afterPed: t.f64(),
  }
);

const businessMetric = table(
  { name: 'business_metric', public: true },
  {
    id: t.string().primaryKey(),
    scenarioId: t.string().index('btree'),
    businessId: t.string(),
    changePct: t.f64(),
  }
);

const presence = table(
  { name: 'presence', public: true },
  {
    identity: t.identity().primaryKey(),
    name: t.string(),
    color: t.string(),
    scenarioId: t.string(),
    lng: t.f64(),
    lat: t.f64(),
    tool: t.string(),
    online: t.bool(),
    lastSeen: t.timestamp(),
  }
);

const hearingMessage = table(
  { name: 'hearing_message', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    scenarioId: t.string().index('btree'),
    speaker: t.string(),
    role: t.string(),
    text: t.string(),
    createdAt: t.timestamp(),
  }
);

const spacetimedb = schema({
  scenario, closedSegment, scenarioEdit, scenarioResult, segmentMetric, businessMetric, presence, hearingMessage,
});
export default spacetimedb;

const PROGRAMMING = ['none', 'light', 'heavy'];
const EDIT_KINDS = ['floors', 'land_use', 'park', 'param'];

type Ctx = ReducerCtx<InferSchema<typeof spacetimedb>>;

function touch(ctx: Ctx, id: string) {
  const s = ctx.db.scenario.id.find(id);
  if (!s) throw new SenderError(`no scenario ${id}`);
  ctx.db.scenario.id.update({ ...s, revision: s.revision + 1, updatedAt: ctx.timestamp, updatedBy: ctx.sender });
}

export const onConnect = spacetimedb.clientConnected((ctx) => {
  const p = ctx.db.presence.identity.find(ctx.sender);
  if (p) ctx.db.presence.identity.update({ ...p, online: true, lastSeen: ctx.timestamp });
});

export const onDisconnect = spacetimedb.clientDisconnected((ctx) => {
  const p = ctx.db.presence.identity.find(ctx.sender);
  if (p) ctx.db.presence.identity.update({ ...p, online: false, lastSeen: ctx.timestamp });
});

/** Create the scenario if missing (idempotent), e.g. one shared scenario per corridor. */
export const ensureScenario = spacetimedb.reducer(
  { id: t.string(), area: t.string(), corridorId: t.string() },
  (ctx, { id, area, corridorId }) => {
    if (ctx.db.scenario.id.find(id)) return;
    ctx.db.scenario.insert({ id, area, corridorId, addedSeating: true, programming: 'light', revision: 0,
      updatedAt: ctx.timestamp, updatedBy: ctx.sender });
  }
);

export const setSegmentClosed = spacetimedb.reducer(
  { scenarioId: t.string(), segmentId: t.string(), closed: t.bool() },
  (ctx, { scenarioId, segmentId, closed }) => {
    const key = `${scenarioId}:${segmentId}`;
    const existing = ctx.db.closedSegment.id.find(key);
    if (closed && !existing) ctx.db.closedSegment.insert({ id: key, scenarioId, segmentId, closedBy: ctx.sender });
    else if (!closed && existing) ctx.db.closedSegment.id.delete(key);
    else return;
    touch(ctx, scenarioId);
  }
);

export const clearScenario = spacetimedb.reducer({ scenarioId: t.string() }, (ctx, { scenarioId }) => {
  for (const c of [...ctx.db.closedSegment.scenarioId.filter(scenarioId)]) ctx.db.closedSegment.id.delete(c.id);
  for (const e of [...ctx.db.scenarioEdit.scenarioId.filter(scenarioId)]) ctx.db.scenarioEdit.id.delete(e.id);
  touch(ctx, scenarioId);
});

export const setOptions = spacetimedb.reducer(
  { scenarioId: t.string(), addedSeating: t.bool(), programming: t.string() },
  (ctx, { scenarioId, addedSeating, programming }) => {
    if (!PROGRAMMING.includes(programming)) throw new SenderError('programming must be none|light|heavy');
    const s = ctx.db.scenario.id.find(scenarioId);
    if (!s) throw new SenderError(`no scenario ${scenarioId}`);
    ctx.db.scenario.id.update({ ...s, addedSeating, programming, revision: s.revision + 1, updatedAt: ctx.timestamp, updatedBy: ctx.sender });
  }
);

export const setEdit = spacetimedb.reducer(
  { scenarioId: t.string(), kind: t.string(), targetId: t.string(), value: t.string() },
  (ctx, { scenarioId, kind, targetId, value }) => {
    if (!EDIT_KINDS.includes(kind)) throw new SenderError('kind must be floors|land_use|park|param');
    const id = `${scenarioId}:${kind}:${targetId}`;
    const existing = ctx.db.scenarioEdit.id.find(id);
    if (value === '') { if (existing) ctx.db.scenarioEdit.id.delete(id); }
    else if (existing) ctx.db.scenarioEdit.id.update({ ...existing, value });
    else ctx.db.scenarioEdit.insert({ id, scenarioId, kind, targetId, value });
    touch(ctx, scenarioId);
  }
);

/** Written by the /sim server after it recomputes a scenario. */
export const publishResults = spacetimedb.reducer(
  {
    scenarioId: t.string(), revision: t.u32(), elapsedMs: t.u32(), verdict: t.string(), lingerIndex: t.f64(),
    conversationsPerHour: t.f64(), conversationsLo: t.f64(), conversationsHi: t.f64(), lingerMinutes: t.f64(),
    newConnectionsPerDay: t.f64(), newConnectionsLo: t.f64(), newConnectionsHi: t.f64(), peoplePresent: t.f64(),
    revenueChangePct: t.f64(), revenueLo: t.f64(), revenueHi: t.f64(),
    addedVehicleHours: t.f64(), vehicleHoursLo: t.f64(), vehicleHoursHi: t.f64(), reroutedVehPerHour: t.f64(),
    beforeConversationsPerHour: t.f64(), beforeLingerMinutes: t.f64(), beforeNewConnectionsPerDay: t.f64(), beforeLingerIndex: t.f64(),
    flags: t.string(), segments: t.array(SegmentMetric), businesses: t.array(BusinessMetric),
  },
  (ctx, a) => {
    const s = ctx.db.scenario.id.find(a.scenarioId);
    if (!s) throw new SenderError(`no scenario ${a.scenarioId}`);
    if (a.revision < s.revision) return; // stale: a newer edit is already being computed
    const { segments, businesses, ...summary } = a;
    const row = { ...summary, computedAt: ctx.timestamp };
    if (ctx.db.scenarioResult.scenarioId.find(a.scenarioId)) ctx.db.scenarioResult.scenarioId.update(row);
    else ctx.db.scenarioResult.insert(row);
    for (const m of [...ctx.db.segmentMetric.scenarioId.filter(a.scenarioId)]) ctx.db.segmentMetric.id.delete(m.id);
    for (const m of segments) ctx.db.segmentMetric.insert({ id: `${a.scenarioId}:${m.segmentId}`, scenarioId: a.scenarioId, ...m });
    for (const m of [...ctx.db.businessMetric.scenarioId.filter(a.scenarioId)]) ctx.db.businessMetric.id.delete(m.id);
    for (const m of businesses) ctx.db.businessMetric.insert({ id: `${a.scenarioId}:${m.businessId}`, scenarioId: a.scenarioId, ...m });
  }
);

/** Multiplayer cursors: each planner upserts their own presence row. */
export const updatePresence = spacetimedb.reducer(
  { name: t.string(), color: t.string(), scenarioId: t.string(), lng: t.f64(), lat: t.f64(), tool: t.string() },
  (ctx, a) => {
    const row = { identity: ctx.sender, ...a, online: true, lastSeen: ctx.timestamp };
    if (ctx.db.presence.identity.find(ctx.sender)) ctx.db.presence.identity.update(row);
    else ctx.db.presence.insert(row);
  }
);

export const postHearingMessage = spacetimedb.reducer(
  { scenarioId: t.string(), speaker: t.string(), role: t.string(), text: t.string() },
  (ctx, a) => {
    if (a.text.length > 4000) throw new SenderError('message too long');
    ctx.db.hearingMessage.insert({ id: 0n, ...a, createdAt: ctx.timestamp });
  }
);

export const clearHearing = spacetimedb.reducer({ scenarioId: t.string() }, (ctx, { scenarioId }) => {
  for (const m of [...ctx.db.hearingMessage.scenarioId.filter(scenarioId)]) ctx.db.hearingMessage.id.delete(m.id);
});
