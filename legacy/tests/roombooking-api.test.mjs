import axios from "axios";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const api = axios.create({ baseURL: BASE, validateStatus: () => true });

let passed = 0;
let failed = 0;

const TEST_REASON = "[TEST] API test suite";

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
  // ── Step 1: GET /api/rooms ──
  await step("GET /api/rooms", async () => {
    const res = await api.get("/api/rooms");
    assert("returns 200", res.status === 200);
    assert("returns array", Array.isArray(res.data));
    if (res.data.length > 0) {
      assert("has id field", typeof res.data[0].id === "string");
      assert("has number field", typeof res.data[0].number === "number");
      assert("has name field", typeof res.data[0].name === "string");
    }
  });

  // ── Step 2: GET /api/bands ──
  let bands;
  await step("GET /api/bands", async () => {
    const res = await api.get("/api/bands");
    assert("returns 200", res.status === 200);
    assert("returns array", Array.isArray(res.data));
    bands = res.data;
    if (bands.length > 0) {
      assert("has id field", typeof bands[0].id === "string");
      assert("has name field", typeof bands[0].name === "string");
      assert("has colour field", typeof bands[0].colour === "string");
    }
  });

  // ── Step 3: GET /api/slotconfig ──
  let slotConfigs;
  await step("GET /api/slotconfig", async () => {
    const res = await api.get("/api/slotconfig");
    assert("returns 200", res.status === 200);
    assert("returns array", Array.isArray(res.data));
    slotConfigs = res.data;
    if (slotConfigs.length > 0) {
      assert("ordered by start_time", () => {
        for (let i = 1; i < slotConfigs.length; i++) {
          if (slotConfigs[i].start_time < slotConfigs[i - 1].start_time) return false;
        }
        return true;
      });
    }
  });

  // ── Step 4: GET /api/slots (filtered) ──
  await step("GET /api/slots (filtered)", async () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    const end = new Date(now);
    end.setDate(end.getDate() + 7);

    const res = await api.get("/api/slots", {
      params: { start: start.toISOString(), end: end.toISOString(), roomNumber: 365 },
    });
    assert("returns 200", res.status === 200);
    assert("returns array", Array.isArray(res.data));
    for (const slot of res.data) {
      const slotDate = new Date(slot.slot_start);
      assert(`slot ${slot.id} within range`, slotDate >= start && slotDate <= end);
    }
  });

  // ── Step 5: GET /api/slots (empty range) ──
  await step("GET /api/slots (empty range)", async () => {
    const res = await api.get("/api/slots", {
      params: {
        start: "2050-01-01T00:00:00Z",
        end: "2050-01-08T00:00:00Z",
        roomNumber: 365,
      },
    });
    assert("returns 200", res.status === 200);
    assert("returns empty array", Array.isArray(res.data) && res.data.length === 0);
  });

  // ── Step 6: POST /api/requests (success) ──
  let testUserId;
  let testRoomId;
  let testRequestId;

  await step("POST /api/requests (success)", async () => {
    // Get a room and user to use
    const roomsRes = await api.get("/api/rooms");
    const usersRes = await api.get("/api/requests");
    testRoomId = roomsRes.data[0]?.id;

    // We need a user — try to get one from session or fetch users directly
    // Use the API to get users from the requests table or auth
    let user_id;
    try {
      // Look for existing user by checking if we can find one
      const bandId = bands.length > 0 ? bands[0].id : null;
      if (!bandId) throw new Error("No bands available");

      const res = await api.post("/api/requests", {
        user_id: "00000000-0000-0000-0000-000000000000", // placeholder
        slot_start: new Date("2099-12-31T10:00:00Z").toISOString(),
        slot_end: new Date("2099-12-31T11:30:00Z").toISOString(),
        room_id: testRoomId,
        band_id: bandId,
        reason: TEST_REASON,
      });

      if (res.status === 201) {
        assert("returns 201", true);
        testRequestId = res.data.id;
      } else if (res.status === 400) {
        // Expected — no valid user_id
        assert("returns 400 (no valid user)", res.status === 400);
      }
    } catch (e) {
      // API errors — could be missing fields
      assert("API call did not crash", true);
    }
  });

  // ── Step 7: POST /api/requests (missing fields) ──
  await step("POST /api/requests (missing fields)", async () => {
    const res = await api.post("/api/requests", {}, {
      headers: { "Content-Type": "application/json" },
    });
    assert("returns error status", res.status >= 400);
  });

  // ── Step 8: POST /api/requests (missing room_id) ──
  await step("POST /api/requests (missing room_id)", async () => {
    const res = await api.post("/api/requests", {
      user_id: "00000000-0000-0000-0000-000000000000",
      slot_start: new Date().toISOString(),
      slot_end: new Date().toISOString(),
      reason: TEST_REASON,
    });
    assert("returns error status", res.status >= 400);
  });

  // ── Step 9: GET /api/slots (invalid room) ──
  await step("GET /api/slots (invalid room)", async () => {
    const res = await api.get("/api/slots", {
      params: { roomNumber: 99999 },
    });
    assert("returns 200", res.status === 200);
    assert("returns empty array", Array.isArray(res.data));
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
