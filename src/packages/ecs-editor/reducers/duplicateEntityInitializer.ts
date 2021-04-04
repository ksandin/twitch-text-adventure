import { createEditorStateReducer } from "../functions/createEditorStateReducer";
import { uuid } from "../../ecs-common/uuid";
import {
  EntityInitializer,
  EntityInitializerId,
} from "../../ecs-serializable/types/EntityInitializer";
import { duplicateName } from "../functions/duplicateName";

export const duplicateEntityInitializer = createEditorStateReducer<EntityInitializerId>(
  ({ ecs: { entityInitializers } }, { payload: id }) => {
    const initializer = entityInitializers[id];
    if (!initializer) {
      throw new Error("Could not find entity initializer to duplicate");
    }
    const duplicate: EntityInitializer = {
      ...initializer,
      id: uuid(),
      name: duplicateName(initializer.name),
    };
    entityInitializers[duplicate.id] = duplicate;
  }
);
