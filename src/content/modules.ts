import rawModules from "../../content/modules.json";
import rawLayout from "../../content/airport-layout.json";
import type { AirportLayout, Level, ModuleDef, ModuleStatus } from "./types";

type RawModule = {
  id: string;
  code: string;
  level: string;
  title: string;
  building: string;
  status: string;
  stations?: string[];
};

export const layout = rawLayout as unknown as AirportLayout;

export function buildModules(raw: RawModule[], world: AirportLayout): ModuleDef[] {
  return raw.map((m) => {
    const place = world.buildings[m.id];
    if (!place) throw new Error(`No layout for module ${m.id}`);
    return {
      id: m.id,
      code: m.code,
      level: m.level as Level,
      title: m.title,
      status: m.status as ModuleStatus,
      stations: m.stations ?? [],
      building: { name: m.building, ...place },
    };
  });
}

export const programme = { name: rawModules.programme, world: rawModules.world };
export const modules: ModuleDef[] = buildModules(rawModules.modules, layout);
