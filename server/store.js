// Where the world is saved.
// With DATABASE_URL set (any Postgres, e.g. a free Neon database) the world survives restarts.
// Without it, the world is kept in a local file, which a free Render server loses when it restarts.
import fs from "node:fs";
import path from "node:path";

export async function createStore() {
  if (process.env.DATABASE_URL) return postgresStore(process.env.DATABASE_URL);
  return fileStore(path.resolve(process.env.DATA_DIR || "data", "world.json"));
}

async function postgresStore(url) {
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false }, max: 3 });
  await pool.query("create table if not exists tp_world (k text primary key, v jsonb not null, updated timestamptz not null default now())");
  return {
    kind: "postgres",
    async load() {
      const { rows } = await pool.query("select k, v from tp_world");
      const out = {};
      for (const r of rows) out[r.k] = r.v;
      return out;
    },
    async save(entries) { // [[key, value]] — only the parts that changed
      if (!entries.length) return;
      const c = await pool.connect();
      try {
        await c.query("begin");
        for (const [k, v] of entries) {
          if (v === null) await c.query("delete from tp_world where k = $1", [k]);
          else await c.query("insert into tp_world (k, v, updated) values ($1, $2, now()) on conflict (k) do update set v = excluded.v, updated = now()", [k, JSON.stringify(v)]);
        }
        await c.query("commit");
      } catch (e) { await c.query("rollback"); throw e; } finally { c.release(); }
    },
  };
}

function fileStore(file) {
  let data = {};
  try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
  return {
    kind: "file",
    async load() { return structuredClone(data); },
    async save(entries) {
      for (const [k, v] of entries) { if (v === null) delete data[k]; else data[k] = v; }
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file + ".tmp", JSON.stringify(data));
      fs.renameSync(file + ".tmp", file);
    },
  };
}
