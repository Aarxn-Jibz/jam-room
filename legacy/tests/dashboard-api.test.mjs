import axios from "axios";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const api = axios.create({ baseURL: BASE, validateStatus: () => true });

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

async function step(name, fn) {
  console.log(`\n${name}`);
  await fn();
}

async function main() {
  let configs = [];
  let firstConfig = null;

  // ── Step 1: GET /api/slotconfig ──
  await step("GET /api/slotconfig", async () => {
    const res = await api.get("/api/slotconfig");
    assert("returns 200", res.status === 200);
    assert("returns array", Array.isArray(res.data));
    configs = res.data;
    if (configs.length > 0) {
      firstConfig = configs[0];
      assert("has id field", typeof firstConfig.id === "string");
      assert("has start_time field", typeof firstConfig.start_time === "string");
      assert("has end_time field", typeof firstConfig.end_time === "string");
      assert("has enabled field", typeof firstConfig.enabled === "boolean");
      assert("ordered by start_time", () => {
        for (let i = 1; i < configs.length; i++) {
          if (configs[i].start_time < configs[i - 1].start_time) return false;
        }
        return true;
      });
    } else {
      assert("no configs in DB — skipping field checks", true);
    }
  });

  // ── Step 2: POST /api/slotconfig (missing start_time) ──
  await step("POST /api/slotconfig (missing start_time)", async () => {
    const res = await api.post("/api/slotconfig", { end_time: "07:00", enabled: true });
    assert("returns 400", res.status === 400);
  });

  // ── Step 3: POST /api/slotconfig (missing end_time) ──
  await step("POST /api/slotconfig (missing end_time)", async () => {
    const res = await api.post("/api/slotconfig", { start_time: "06:00", enabled: true });
    assert("returns 400", res.status === 400);
  });

  // ── Step 4: POST /api/slotconfig (success + auto cleanup) ──
  let testConfigId = null;
  await step("POST /api/slotconfig (success)", async () => {
    const res = await api.post("/api/slotconfig", {
      start_time: "00:00",
      end_time: "00:30",
      enabled: true,
    });
    assert("returns 201", res.status === 201);
    assert("has id field", typeof res.data.id === "string");
    if (res.status === 201) {
      testConfigId = res.data.id;
      assert("start_time matches", res.data.start_time.startsWith("00:00"), `expected "00:00...", got "${res.data.start_time}"`);
      assert("end_time matches", res.data.end_time.startsWith("00:30"), `expected "00:30...", got "${res.data.end_time}"`);
      assert("enabled is true", res.data.enabled === true);
    }
    // Cleanup: delete the created config
    if (testConfigId) {
      const delRes = await api.delete(`/api/slotconfig?id=${testConfigId}`);
      assert("cleanup delete succeeds", delRes.status === 200);
      // Verify it's gone
      const getRes = await api.get("/api/slotconfig");
      assert("config removed after delete", !getRes.data.find(c => c.id === testConfigId));
      testConfigId = null;
    }
  });

  // ── Step 5: PUT /api/slotconfig (missing id) ──
  await step("PUT /api/slotconfig (missing id)", async () => {
    const res = await api.put("/api/slotconfig", { enabled: false });
    assert("returns 400", res.status === 400);
  });

  // ── Step 6: PUT /api/slotconfig (not found) ──
  await step("PUT /api/slotconfig (not found)", async () => {
    const res = await api.put("/api/slotconfig", { id: "00000000-0000-0000-0000-000000000000", enabled: true });
    assert("returns 404", res.status === 404);
  });

  // ── Step 7: PUT /api/slotconfig (toggle enabled) ──
  await step("PUT /api/slotconfig (toggle enabled)", async () => {
    if (!firstConfig) {
      assert("skip — no configs available", true);
      return;
    }
    const originalEnabled = firstConfig.enabled;

    // Toggle
    const res = await api.put("/api/slotconfig", { id: firstConfig.id, enabled: !originalEnabled });
    assert("returns 200", res.status === 200);
    assert("enabled toggled", res.data.enabled === !originalEnabled, `expected ${!originalEnabled}, got ${res.data.enabled}`);

    // Restore original
    const restoreRes = await api.put("/api/slotconfig", { id: firstConfig.id, enabled: originalEnabled });
    assert("restore succeeds", restoreRes.status === 200);
    assert("enabled restored", restoreRes.data.enabled === originalEnabled);
  });

  // ── Step 8: PUT /api/slotconfig (update times) ──
  await step("PUT /api/slotconfig (update times)", async () => {
    if (!firstConfig) {
      assert("skip — no configs available", true);
      return;
    }
    const originalStart = firstConfig.start_time;
    const originalEnd = firstConfig.end_time;

    // Use times unlikely to exist on any real config
    const newStart = "00:01";
    const newEnd = "00:31";

    const res = await api.put("/api/slotconfig", { id: firstConfig.id, start_time: newStart, end_time: newEnd });
    assert("returns 200", res.status === 200);
    assert("start_time updated", res.data.start_time.startsWith(newStart), `expected "${newStart}...", got "${res.data.start_time}"`);
    assert("end_time updated", res.data.end_time.startsWith(newEnd), `expected "${newEnd}...", got "${res.data.end_time}"`);

    // Restore original
    const restoreRes = await api.put("/api/slotconfig", { id: firstConfig.id, start_time: originalStart, end_time: originalEnd });
    assert("restore succeeds", restoreRes.status === 200);
    // Re-fetch to verify
    const getRes = await api.get("/api/slotconfig");
    const refreshed = getRes.data.find(c => c.id === firstConfig.id);
    assert("start_time restored", refreshed && refreshed.start_time === originalStart);
    assert("end_time restored", refreshed && refreshed.end_time === originalEnd);
  });

  // ── Step 9: DELETE /api/slotconfig (missing id) ──
  await step("DELETE /api/slotconfig (missing id)", async () => {
    const res = await api.delete("/api/slotconfig");
    assert("returns 400", res.status === 400);
  });

  // ── Step 10: DELETE /api/slotconfig (not found) ──
  await step("DELETE /api/slotconfig (not found)", async () => {
    const res = await api.delete("/api/slotconfig?id=00000000-0000-0000-0000-000000000000");
    assert("returns 404", res.status === 404);
  });

  // ── Step 11: GET /api/slotconfig (sanity check after mutations) ──
  await step("GET /api/slotconfig (sanity check)", async () => {
    const res = await api.get("/api/slotconfig");
    assert("returns 200 after mutations", res.status === 200);
    assert("returns array", Array.isArray(res.data));
  });

  // ── Summary ──
  const total = passed + failed;
  console.log(`\n${"=".repeat(40)}`);
  console.log(`Results: ${passed}/${total} passed`);
  if (failed > 0) {
    console.log(`Failed: ${failed}/${total}`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
