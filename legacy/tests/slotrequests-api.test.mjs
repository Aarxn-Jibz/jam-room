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
  let allRequests = [];
  let pendingRequest = null;
  let approvedRequest = null;
  let anyRequest = null;
  let rooms = [];

  // ── Step 1: GET /api/requests ──
  await step("GET /api/requests", async () => {
    const res = await api.get("/api/requests");
    assert("returns 200", res.status === 200);
    assert("returns array", Array.isArray(res.data));
    allRequests = res.data;
    if (allRequests.length > 0) {
      anyRequest = allRequests[0];
      pendingRequest = allRequests.find((r) => r.status === "pending") || null;
      approvedRequest = allRequests.find((r) => r.status === "approved") || null;
      assert("has id field", typeof anyRequest.id === "string");
      assert("has user_id field", typeof anyRequest.user_id === "string");
      assert("has status field", typeof anyRequest.status === "string");
      assert("has slot_start field", typeof anyRequest.slot_start === "string");
      assert("has slot_end field", typeof anyRequest.slot_end === "string");
      assert("has user_name field", anyRequest.user_name !== undefined);
      assert("has band_name field", anyRequest.band_name !== undefined);
    } else {
      assert("no requests in DB — skipping field checks", true);
    }
  });

  // ── Step 2: GET /api/requests (filtered by room_id) ──
  await step("GET /api/requests (filtered by room_id)", async () => {
    const roomsRes = await api.get("/api/rooms");
    rooms = roomsRes.data;
    if (rooms.length > 0 && allRequests.length > 0) {
      const roomId = rooms[0].id;
      const res = await api.get("/api/requests", { params: { room_id: roomId } });
      assert("returns 200", res.status === 200);
      assert("returns array", Array.isArray(res.data));
      for (const req of res.data) {
        assert(`request ${req.id} matches room`, req.room_id === roomId, `expected room_id ${roomId}, got ${req.room_id}`);
      }
    } else {
      assert("skip — no rooms or no requests", true);
    }
  });

  // ── Step 3: GET /api/requests (filtered by user_id) ──
  await step("GET /api/requests (filtered by user_id)", async () => {
    if (anyRequest) {
      const res = await api.get("/api/requests", { params: { user_id: anyRequest.user_id } });
      assert("returns 200", res.status === 200);
      assert("returns array", Array.isArray(res.data));
      for (const req of res.data) {
        assert(`request ${req.id} matches user`, req.user_id === anyRequest.user_id, `expected user_id ${anyRequest.user_id}, got ${req.user_id}`);
      }
    } else {
      assert("skip — no requests available", true);
    }
  });

  // ── Step 4: PUT /api/requests (missing id) ──
  await step("PUT /api/requests (missing id)", async () => {
    const res = await api.put("/api/requests", { status: "approved" });
    assert("returns 400", res.status === 400);
  });

  // ── Step 5: PUT /api/requests (not found) ──
  await step("PUT /api/requests (not found)", async () => {
    const res = await api.put("/api/requests?id=00000000-0000-0000-0000-000000000000", { status: "approved" });
    assert("returns 404", res.status === 404);
  });

  // ── Step 6: PUT /api/requests (edit reason) ──
  let editTarget = null;
  let editOriginalReason = null;
  await step("PUT /api/requests (edit reason)", async () => {
    if (!anyRequest) {
      assert("skip — no requests available", true);
      return;
    }
    editTarget = anyRequest;
    editOriginalReason = anyRequest.reason;
    const newReason = `[TEST] Edited reason ${Date.now()}`;
    const res = await api.put(`/api/requests?id=${anyRequest.id}`, { reason: newReason });
    assert("returns 200", res.status === 200);
    assert("response has request object", !!(res.data && res.data.request));
    if (res.data && res.data.request) {
      assert("reason updated", res.data.request.reason === newReason, `expected "${newReason}", got "${res.data.request.reason}"`);
    }
    // Restore original reason
    const restoreRes = await api.put(`/api/requests?id=${anyRequest.id}`, { reason: editOriginalReason });
    assert("restore succeeds", restoreRes.status === 200);
    const verifyRes = await api.get("/api/requests");
    const refreshed = verifyRes.data.find((r) => r.id === anyRequest.id);
    assert("reason restored", refreshed && refreshed.reason === editOriginalReason);
  });

  // ── Step 7: PUT /api/requests (approve pending + restore to pending) ──
  let approveTarget = null;
  await step("PUT /api/requests (approve pending)", async () => {
    if (!pendingRequest) {
      assert("skip — no pending requests", true);
      return;
    }
    approveTarget = pendingRequest;
    // Use far-future dates to avoid any booked-slot conflict
    const futureStart = "2099-12-31T10:00:00.000Z";
    const futureEnd = "2099-12-31T11:30:00.000Z";

    const res = await api.put(`/api/requests?id=${pendingRequest.id}`, {
      status: "approved",
      slot_start: futureStart,
      slot_end: futureEnd,
    });

    assert("returns 200 or 409", res.status === 200 || res.status === 409);
    if (res.status === 200) {
      assert("response has request object", !!(res.data && res.data.request));
      if (res.data && res.data.request) {
        assert("status changed to approved", res.data.request.status === "approved", `expected "approved", got "${res.data.request.status}"`);

        // Cleanup and restore to original pending state
        const restoreRes = await api.put(`/api/requests?id=${pendingRequest.id}`, { status: "pending" });
        // The handler deletes the created slot when moving from approved → non-approved
        assert("restore to pending succeeds", restoreRes.status === 200);
        if (restoreRes.data && restoreRes.data.request) {
          assert("status restored to pending", restoreRes.data.request.status === "pending");
        }
      }
    } else {
      assert("conflict message present", typeof res.data.message === "string");
    }
  });

  // ── Step 8: PUT /api/requests (deny approved) ──
  await step("PUT /api/requests (deny approved)", async () => {
    if (!approvedRequest) {
      assert("skip — no approved requests in DB", true);
      return;
    }
    const target = approvedRequest;

    const res = await api.put(`/api/requests?id=${target.id}`, { status: "denied" });
    assert("returns 200", res.status === 200);
    if (res.data && res.data.request) {
      assert("status changed to denied", res.data.request.status === "denied");

      // Restore to approved
      const restoreRes = await api.put(`/api/requests?id=${target.id}`, { status: "approved" });
      if (restoreRes.status === 200) {
        assert("restore to approved succeeds", true);
      } else {
        // Best-effort: if conflict, leave as-is and note it
        console.log(`  ⚠️  restore returned ${restoreRes.status} — request ${target.id} left as denied`);
      }
    }
  });

  // ── Step 9: DELETE /api/requests (missing id) ──
  await step("DELETE /api/requests (missing id)", async () => {
    const res = await api.delete("/api/requests");
    assert("returns 400", res.status === 400);
  });

  // ── Step 10: DELETE /api/requests (not found) ──
  await step("DELETE /api/requests (not found)", async () => {
    const res = await api.delete("/api/requests?id=00000000-0000-0000-0000-000000000000");
    assert("returns 404", res.status === 404);
  });

  // ── Step 11: GET /api/requests (sanity check after mutations) ──
  await step("GET /api/requests (sanity check)", async () => {
    const res = await api.get("/api/requests");
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
