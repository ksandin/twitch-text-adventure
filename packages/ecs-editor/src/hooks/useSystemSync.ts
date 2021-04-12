import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { createSystem } from "../../../ecs-serializable/src/functions/createSystem";
import { useSelector } from "../store";
import { selectAll } from "../selectors/selectAll";
import { NativeComponentsContext } from "../NativeComponentsContext";
import { updateSystem } from "../../../ecs-serializable/src/functions/updateSystem";
import { getECSDefinitionForSystem } from "../../../ecs-serializable/src/functions/getECSDefinitionForSystem";
import { useAsRef } from "../../../ecs-common/src/useAsRef";
import { DeserializationMemory } from "../../../ecs-serializable/src/DeserializationMemory";
import { ECSDefinition } from "../../../ecs-serializable/src/definition/ECSDefinition";
import { SystemDefinitionId } from "../../../ecs-serializable/src/definition/SystemDefinition";
import { NativeComponents } from "../../../ecs-serializable/src/types/NativeComponents";
import { createECSDefinition } from "../../../ecs-serializable/src/functions/createECSDefinition";
import { System } from "../../../ecs/src/System";

/**
 * Automates system initialization and updates.
 */
export const useSystemSync = () => {
  const nativeComponents = useContext(NativeComponentsContext);
  const { ecs, selection } = useSelector(selectAll);
  const [[system, memory], setSystemAndMemory] = useState(() =>
    createSystemWithMemory(ecs, selection.system, nativeComponents)
  );
  const [, forceUpdate] = useReducer((n) => n + 1, 0);
  const ref = useAsRef({ system, memory });

  const updateRuntime = () => {
    const { system, memory } = ref.current;
    updateSystem(
      system,
      getSelectedECS(ecs, selection.system),
      memory,
      nativeComponents
    );
    forceUpdate();
  };

  const resetRuntime = () => {
    system.dispose();
    memory.clear();
    setSystemAndMemory(
      createSystemWithMemory(ecs, selection.system, nativeComponents)
    );
    forceUpdate();
  };

  useEffect(updateRuntime, [ecs, ref, selection.system, nativeComponents]);

  return [system, resetRuntime] as const;
};

const getSelectedECS = (
  ecs: ECSDefinition,
  selectedSystem?: SystemDefinitionId
) =>
  selectedSystem
    ? getECSDefinitionForSystem(ecs, selectedSystem)
    : createECSDefinition();

const createSystemWithMemory = (
  ecs: ECSDefinition,
  selectedSystem: SystemDefinitionId | undefined,
  nativeComponents: NativeComponents
) => {
  const memory = new DeserializationMemory();
  const system = createSystem(
    getSelectedECS(ecs, selectedSystem),
    memory,
    nativeComponents
  );
  return [system, memory] as const;
};

export const SystemSyncContext = createContext<readonly [System, () => void]>([
  new System(),
  () => {},
]);