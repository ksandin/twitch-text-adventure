import { createEditorStateReducer } from "../functions/createEditorStateReducer";
import { EntityDefinition } from "../../../ecs-serializable/src/definition/EntityDefinition";

export const createEntityDefinition = createEditorStateReducer<EntityDefinition>(
  ({ ecs: { entityDefinitions } }, { payload: def }) => {
    entityDefinitions[def.id] = def;
  }
);
