import { createEditorStateReducer } from "../functions/createEditorStateReducer";
import { ComponentInitializer } from "../../../ecs-serializable/src/definition/ComponentInitializer";
import { ComponentInitializerReducerPayload } from "../types/ComponentInitializerReducerPayload";
import { inheritComponentInitializer } from "../../../ecs-serializable/src/functions/inheritComponentInitializer";

type AddComponentInitializerPayload = ComponentInitializerReducerPayload<{
  component: ComponentInitializer;
}>;

export const addComponentInitializer = createEditorStateReducer<AddComponentInitializerPayload>(
  (state, { payload }) => {
    const {
      ecs: { entityInitializers, entityDefinitions },
    } = state;
    switch (payload.target) {
      case "initializer":
        const init = entityInitializers[payload.id];
        if (!init) {
          throw new Error("Could not find entity initializer");
        }
        init.components.push(payload.component);
        break;
      case "definition":
        const def = entityDefinitions[payload.id];
        if (!def) {
          throw new Error("Could not find entity definition");
        }
        def.components.push(payload.component);
        for (const init of Object.values(state.ecs.entityInitializers).filter(
          (init) => init.definitionId === def.id
        )) {
          init.components.push(inheritComponentInitializer(payload.component));
        }
        break;
    }
  }
);
