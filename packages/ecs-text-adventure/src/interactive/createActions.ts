import { System } from "../../../ecs/src/System";
import { Action } from "./Action";
import { Interactive } from "./Interactive";
import { InteractionMemory } from "./InteractionMemory";

export const createActions = (system: System) => {
  const actions: Action[] = [];
  for (const entity of system.entities) {
    for (const component of entity.components.filterType(Interactive)) {
      if (!component.isActive) {
        continue;
      }
      const name = component.action;
      if (name) {
        actions.push(
          wrapAction(system, {
            name,
            perform: () => component.effect,
          })
        );
      }
    }
  }
  return actions;
};

/**
 * Wrapped actions can only perform once and will signal a system update once performed.
 */
const wrapAction = (system: System, { name, perform }: Action): Action => {
  let performed = false;
  return {
    name,
    perform: () => {
      if (performed) {
        throw new Error("Actions can only be performed once");
      }
      const result = perform();
      const memory = system.entities.findComponent(InteractionMemory);
      if (memory) {
        memory.push(result);
      }
      system.update();
      performed = true;
      return result;
    },
  };
};
