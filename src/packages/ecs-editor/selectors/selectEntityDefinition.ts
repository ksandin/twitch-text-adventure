import { EditorState } from "../types/EditorState";
import { EntityDefinitionId } from "../../ecs-serializable/types/EntityDefinition";
import { get } from "../../ecs-common/nominal";

export const selectEntityDefinition = (
  { ecs: { entityDefinitions } }: EditorState,
  id?: EntityDefinitionId
) => (id ? get(entityDefinitions, id) : undefined);