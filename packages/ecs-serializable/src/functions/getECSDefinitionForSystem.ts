import { ECSDefinition } from "../definition/ECSDefinition";
import { SystemDefinitionId } from "../definition/SystemDefinition";
import { createECSDefinition } from "./createECSDefinition";

export const getECSDefinitionForSystem = (
  multiECS: ECSDefinition,
  systemId: SystemDefinitionId
): ECSDefinition => {
  const singleECS = createECSDefinition();
  const belongsToSystem = (o: HasSystemId) => o.systemId === systemId;
  transfer("entityDefinitions", singleECS, multiECS, belongsToSystem);
  transfer("componentDefinitions", singleECS, multiECS, belongsToSystem);
  transfer("libraryFolders", singleECS, multiECS, belongsToSystem);
  transfer("entityInitializers", singleECS, multiECS, belongsToSystem);
  transfer("entityDefinitions", singleECS, multiECS, belongsToSystem);
  transfer("systems", singleECS, multiECS, ({ id }) => id === systemId);
  return singleECS;
};

type HasSystemId = { systemId: SystemDefinitionId };

const transfer = <K extends keyof ECSDefinition>(
  key: K,
  singleECS: ECSDefinition,
  multiECS: ECSDefinition,
  shouldTransfer: (instance: ValueOf<ECSDefinition[K]>) => boolean
) => {
  type InstanceId = keyof ECSDefinition[K];
  const singleRecord = singleECS[key];
  const multiRecord = multiECS[key];
  for (const instance of values(multiRecord)) {
    if (shouldTransfer(instance)) {
      singleRecord[instance.id as InstanceId] = instance as Exclude<
        ValueOf<typeof singleECS>,
        unknown // No clue where this comes from
      >;
    }
  }
};

const values = <T extends Record<keyof any, unknown>>(o: T) =>
  Object.values(o) as ValueOf<T>[];

type ValueOf<T> = T extends Record<keyof any, infer V> ? V : never;
