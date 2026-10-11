import { controlSchema, operatingWindowAllowed } from "./operating-windows.js";

export interface Revision { name: string; active: boolean }
export interface StopController {
  readControl(): Promise<unknown>;
  revisions(appId: string): Promise<Revision[]>;
  deactivate(appId: string, revision: string): Promise<void>;
}
export async function stopOutsideWindows(
  controller: StopController, appIds: readonly string[], now = Date.now(),
): Promise<{ controlUnavailable: boolean; deactivated: number }> {
  let control: unknown;
  let controlUnavailable = false;
  try { control = controlSchema.parse(await controller.readControl()); }
  catch {
    controlUnavailable = true;
    console.error(JSON.stringify({ event: "operating_control_unavailable", action: "deactivate_all" }));
  }
  let deactivated = 0;
  await Promise.all(appIds.map(async appId => {
    if (!controlUnavailable && operatingWindowAllowed(control, appId, now)) return;
    const revisions = await controller.revisions(appId);
    await Promise.all(revisions.filter(revision => revision.active).map(async revision => {
      await controller.deactivate(appId, revision.name);
      deactivated++;
    }));
  }));
  return { controlUnavailable, deactivated };
}
