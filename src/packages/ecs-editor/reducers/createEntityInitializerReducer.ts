import { EditorStateReducer } from "../types/EditorStateReducer";
import { selectSelectedObjects } from "../selectors/selectSelectedObjects";
import { EntityInitializer } from "../../ecs-serializable/types/EntityInitializer";
import { updateSceneReducer } from "./updateSceneReducer";

export const createEntityInitializerReducer: EditorStateReducer<EntityInitializer> = (
  state,
  entityInitializer
) => {
  const { scene } = selectSelectedObjects(state);
  if (scene) {
    return updateSceneReducer(state, {
      scene,
      update: {
        entities: [...scene.entities, entityInitializer],
      },
    });
  }
  return state;
};
