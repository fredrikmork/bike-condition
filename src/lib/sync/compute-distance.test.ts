import { describe, expect, it } from "vitest";
import {
  type ActivityDistanceInput,
  type ComponentDistanceInput,
  computeComponentDistance,
  computeComponentDistanceAcrossMounts,
  type MountDistanceInput,
} from "./compute-distance";

const INSTALL_DATE = "2026-05-16T00:00:00Z";

function makeComponent(
  type: string,
  overrides: Partial<ComponentDistanceInput> = {}
): ComponentDistanceInput {
  return {
    type,
    bike_distance_at_install: 0,
    installed_at: INSTALL_DATE,
    ...overrides,
  };
}

function ride(distance: number, daysFromInstall = 1): ActivityDistanceInput {
  const start = new Date(INSTALL_DATE);
  start.setDate(start.getDate() + daysFromInstall);
  return { distance, activity_type: "Ride", start_date: start.toISOString() };
}

function virtualRide(distance: number, daysFromInstall = 1): ActivityDistanceInput {
  const start = new Date(INSTALL_DATE);
  start.setDate(start.getDate() + daysFromInstall);
  return { distance, activity_type: "VirtualRide", start_date: start.toISOString() };
}

// Indoor ride recorded as a plain "Ride" but flagged by Strava as a trainer ride.
function trainerRide(distance: number, daysFromInstall = 1): ActivityDistanceInput {
  const start = new Date(INSTALL_DATE);
  start.setDate(start.getDate() + daysFromInstall);
  return { distance, activity_type: "Ride", start_date: start.toISOString(), trainer: true };
}

describe("computeComponentDistance — wheel components on bikes without VirtualRide", () => {
  // Regression: commit 7ed5f7d (re-)introduced an unconditional gear-fallback
  // skip for TRAINER_PAUSE_TYPES, which left wheel components at 0 km whenever
  // a user signed up with a bike that already had Strava mileage but no rides
  // logged in the app yet. Christoffer Mørk's KTM (1,420 km Strava total) and
  // Velo Vie 300SE (6,766 km) both reproduced this in production on 2026-06-07.

  it("first sync, no activities — wheels inherit bike.total_distance via gear fallback", () => {
    const tire = makeComponent("tire_front");
    const distance = computeComponentDistance(tire, [], 1_420_000);
    expect(distance).toBe(1_420_000);
  });

  it("first sync with only outdoor rides — wheels use MAX(activity, gear)", () => {
    const tire = makeComponent("tire_rear");
    // Bike total (2,051 km) > activity sum (166 km) → gear wins
    const distance = computeComponentDistance(tire, [ride(166_290)], 2_051_281);
    expect(distance).toBe(2_051_281);
  });

  it("brake_cables are also covered by the bug fix", () => {
    const cables = makeComponent("brake_cables");
    const distance = computeComponentDistance(cables, [], 6_766_015);
    expect(distance).toBe(6_766_015);
  });
});

describe("computeComponentDistance — wheel components on bikes WITH VirtualRide", () => {
  it("wheels exclude virtual rides AND skip the gear fallback", () => {
    const tire = makeComponent("tire_front");
    const activities = [
      ride(100_000),
      virtualRide(500_000), // excluded from wheels
    ];
    // Bike total reflects both rides (600 km), but wheels see only outdoor (100 km)
    // and the gear fallback is skipped to keep trainer km off the wheel.
    const distance = computeComponentDistance(tire, activities, 600_000);
    expect(distance).toBe(100_000);
  });

  it("a single VirtualRide on the bike is enough to skip the fallback", () => {
    const tire = makeComponent("tire_rear");
    const activities = [virtualRide(50_000)];
    const distance = computeComponentDistance(tire, activities, 38_704_000);
    expect(distance).toBe(0);
  });
});

describe("computeComponentDistance — trainer-flagged indoor rides", () => {
  // Strava marks stationary-trainer rides with trainer:true even when the sport
  // type is a plain "Ride" (not VirtualRide). These must behave like VirtualRide
  // for wheel/cable components: excluded from the sum and skipping the fallback.

  it("wheels exclude trainer rides AND skip the gear fallback", () => {
    const tire = makeComponent("tire_front");
    const activities = [ride(100_000), trainerRide(500_000)];
    // Outdoor 100 km counts; trainer 500 km excluded; gear fallback skipped.
    const distance = computeComponentDistance(tire, activities, 600_000);
    expect(distance).toBe(100_000);
  });

  it("a single trainer ride is enough to skip the fallback for wheels", () => {
    const tire = makeComponent("tire_rear");
    const distance = computeComponentDistance(tire, [trainerRide(50_000)], 38_704_000);
    expect(distance).toBe(0);
  });

  it("brake_cables also exclude trainer rides", () => {
    const cables = makeComponent("brake_cables");
    const activities = [ride(80_000), trainerRide(300_000)];
    const distance = computeComponentDistance(cables, activities, 380_000);
    expect(distance).toBe(80_000);
  });

  it("drivetrain still counts trainer rides", () => {
    const cassette = makeComponent("cassette");
    const activities = [ride(100_000), trainerRide(500_000)];
    // Both ride types count for drivetrain; MAX(600k activity, 600k gear) = 600k.
    const distance = computeComponentDistance(cassette, activities, 600_000);
    expect(distance).toBe(600_000);
  });
});

describe("computeComponentDistance — non-wheel components", () => {
  it("drivetrain always uses MAX(activity, gear) regardless of virtual rides", () => {
    const cassette = makeComponent("cassette");
    const activities = [ride(100_000), virtualRide(500_000)];
    // Both ride types count, gear fallback applies → MAX(600k, 600k) = 600k
    const distance = computeComponentDistance(cassette, activities, 600_000);
    expect(distance).toBe(600_000);
  });

  it("drivetrain inherits bike.total_distance on first sync with no activities", () => {
    const chain = makeComponent("chain");
    const distance = computeComponentDistance(chain, [], 1_420_000);
    expect(distance).toBe(1_420_000);
  });
});

describe("computeComponentDistance — installed_at filtering", () => {
  it("activities before installed_at are ignored for the activity sum", () => {
    const cassette = makeComponent("cassette", { installed_at: "2026-05-20T00:00:00Z" });
    const activities = [
      // 10 days BEFORE install — ignored
      { distance: 1_000_000, activity_type: "Ride", start_date: "2026-05-10T00:00:00Z" },
      // 1 day AFTER install — counted
      { distance: 50_000, activity_type: "Ride", start_date: "2026-05-21T00:00:00Z" },
    ];
    // Activity sum (post-install) = 50k. Gear distance = 2,000k - 0 = 2,000k. MAX = 2,000k.
    const distance = computeComponentDistance(cassette, activities, 2_000_000);
    expect(distance).toBe(2_000_000);
  });

  it("bike_distance_at_install reduces the gear fallback", () => {
    const chain = makeComponent("chain", { bike_distance_at_install: 1_885_000 });
    const activities = [ride(166_290)];
    // Gear distance = 2,051 - 1,885 = 166k. Activity = 166k. MAX = 166k.
    const distance = computeComponentDistance(chain, activities, 2_051_281);
    expect(distance).toBe(166_290);
  });
});

describe("computeComponentDistanceAcrossMounts — parts moved between bikes", () => {
  const BIKE_A = "bike-a";
  const BIKE_B = "bike-b";

  function rideOn(distance: number, daysFromInstall: number): ActivityDistanceInput {
    return ride(distance, daysFromInstall);
  }

  function mount(overrides: Partial<MountDistanceInput> = {}): MountDistanceInput {
    return {
      bike_id: BIKE_A,
      mounted_at: INSTALL_DATE,
      unmounted_at: null,
      bike_distance_at_mount: 0,
      bike_distance_at_unmount: null,
      ...overrides,
    };
  }

  function component(type: string, overrides: Partial<ComponentDistanceInput> = {}) {
    return { ...makeComponent(type, overrides), bike_id: BIKE_A, replaced_at: null };
  }

  it("a never-moved part matches the single-bike calculation exactly", () => {
    const chain = component("chain");
    const activities = [rideOn(166_290, 1)];

    const viaMounts = computeComponentDistanceAcrossMounts(
      chain,
      [mount()],
      new Map([[BIKE_A, activities]]),
      new Map([[BIKE_A, 2_051_281]])
    );

    expect(viaMounts).toBe(computeComponentDistance(chain, activities, 2_051_281));
  });

  it("sums distance from both bikes a part has sat on", () => {
    // 100 km on bike A, then moved to bike B where it did 250 km more.
    const mounts = [
      mount({
        unmounted_at: ride(0, 10).start_date,
        bike_distance_at_unmount: 100_000,
      }),
      mount({
        bike_id: BIKE_B,
        mounted_at: ride(0, 10).start_date,
        bike_distance_at_mount: 5_000_000,
      }),
    ];

    const distance = computeComponentDistanceAcrossMounts(
      component("cassette"),
      mounts,
      new Map([
        [BIKE_A, [rideOn(100_000, 1)]],
        [BIKE_B, [rideOn(250_000, 15)]],
      ]),
      new Map([
        [BIKE_A, 100_000],
        [BIKE_B, 5_250_000],
      ])
    );

    expect(distance).toBe(350_000);
  });

  it("rides on a bike outside the mount window do not count", () => {
    // The part left bike A on day 10; A kept being ridden afterwards.
    const mounts = [
      mount({ unmounted_at: ride(0, 10).start_date, bike_distance_at_unmount: 100_000 }),
    ];

    const distance = computeComponentDistanceAcrossMounts(
      component("chain"),
      mounts,
      new Map([
        [
          BIKE_A,
          [
            rideOn(100_000, 1), // during the mount — counts
            rideOn(900_000, 30), // after it came off — must not count
          ],
        ],
      ]),
      new Map([[BIKE_A, 1_000_000]])
    );

    expect(distance).toBe(100_000);
  });

  it("keeps pre-app Strava mileage after a move via bike_distance_at_unmount", () => {
    // Regression guard: the bike had 2,051 km on Strava but only 166 km of
    // synced activities. Before the snapshot column existed, moving the part
    // dropped it from 2,051 km to 166 km.
    const mounts = [
      mount({
        unmounted_at: ride(0, 10).start_date,
        bike_distance_at_unmount: 2_051_281,
      }),
    ];

    const distance = computeComponentDistanceAcrossMounts(
      component("chain"),
      mounts,
      new Map([[BIKE_A, [rideOn(166_290, 1)]]]),
      new Map([[BIKE_A, 2_051_281]])
    );

    expect(distance).toBe(2_051_281);
  });

  it("a banked part (no open mount) stops accumulating", () => {
    const mounts = [
      mount({ unmounted_at: ride(0, 10).start_date, bike_distance_at_unmount: 100_000 }),
    ];

    const banked = { ...component("chain"), bike_id: null };
    const distance = computeComponentDistanceAcrossMounts(
      banked,
      mounts,
      new Map([[BIKE_A, [rideOn(100_000, 1), rideOn(900_000, 30)]]]),
      new Map([[BIKE_A, 1_000_000]])
    );

    expect(distance).toBe(100_000);
  });

  it("wheels still exclude indoor rides across every mount", () => {
    const mounts = [
      mount({ unmounted_at: ride(0, 10).start_date, bike_distance_at_unmount: 600_000 }),
      mount({
        bike_id: BIKE_B,
        mounted_at: ride(0, 10).start_date,
        bike_distance_at_mount: 0,
      }),
    ];

    const distance = computeComponentDistanceAcrossMounts(
      component("tire_front"),
      mounts,
      new Map([
        [BIKE_A, [rideOn(100_000, 1), virtualRide(500_000, 2)]],
        [BIKE_B, [rideOn(80_000, 15), virtualRide(400_000, 16)]],
      ]),
      new Map([
        [BIKE_A, 600_000],
        [BIKE_B, 480_000],
      ])
    );

    // Outdoor only: 100 km on A + 80 km on B. Both bikes have indoor rides, so
    // the gear fallback is skipped on both.
    expect(distance).toBe(180_000);
  });

  it("falls back to the pre-rotation shape when a part has no mount rows", () => {
    const chain = component("chain");
    const activities = [rideOn(166_290, 1)];

    const distance = computeComponentDistanceAcrossMounts(
      chain,
      [],
      new Map([[BIKE_A, activities]]),
      new Map([[BIKE_A, 2_051_281]])
    );

    expect(distance).toBe(computeComponentDistance(chain, activities, 2_051_281));
  });
});

describe("computeComponentDistance — production scenario fixtures", () => {
  // Mirror of Christoffer Mørk's three affected bikes on 2026-06-07, before
  // the fix landed. If any of these regress to 0, the wheel-distance bug is
  // back.

  const wheelTypes = [
    "tire_front",
    "tire_rear",
    "inner_tube_front",
    "inner_tube_rear",
    "brake_pads_front",
    "brake_pads_rear",
    "brake_rotor_front",
    "brake_rotor_rear",
  ];

  it.each(wheelTypes)("KTM (1,420 km, no activities) — %s gets full bike total", (type) => {
    const distance = computeComponentDistance(makeComponent(type), [], 1_420_000);
    expect(distance).toBe(1_420_000);
  });

  it.each(wheelTypes)("Velo Vie (6,766 km, no activities) — %s gets full bike total", (type) => {
    const distance = computeComponentDistance(makeComponent(type), [], 6_766_015);
    expect(distance).toBe(6_766_015);
  });

  it.each(wheelTypes)("Winspace (2,051 km, only Ride) — %s uses gear fallback", (type) => {
    const distance = computeComponentDistance(makeComponent(type), [ride(166_290)], 2_051_281);
    expect(distance).toBe(2_051_281);
  });

  it.each(wheelTypes)("Rulle (trainer, only VirtualRide) — %s stays at 0", (type) => {
    const distance = computeComponentDistance(
      makeComponent(type),
      [virtualRide(230_316)],
      38_703_754
    );
    expect(distance).toBe(0);
  });
});
