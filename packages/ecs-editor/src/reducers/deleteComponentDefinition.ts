import { removeNominal } from "../../../ecs-common/src/removeNominal";
import { createEditorStateReducer } from "../functions/createEditorStateReducer";
import {
  ComponentDefinition,
  ComponentDefinitionId,
} from "../../../ecs-serializable/src/definition/ComponentDefinition";
import { core } from "../core";
import { EditorState } from "../types/EditorState";
import { deleteComponentInitializer } from "./deleteComponentInitializer";

export const deleteComponentDefinition = createEditorStateReducer<ComponentDefinitionId>(
  (state, { payload: id }) => {
    const def = state.ecs.componentDefinitions[id];
    if (!def) {
      throw new Error("Could not delete component definition");
    }

    // Remove related components from all entity definitions in the same system
    for (const [entity, component] of Array.from(relatedEntities(state, def))) {
      deleteComponentInitializer(
        state,
        core.actions.deleteComponentInitializer({
          target: "definition",
          id: entity.id,
          componentId: component.id,
        })
      );
    }

    // Remove related file
    core.caseReducers.closeCodeFile(state, core.actions.closeCodeFile(id));

    // Remove component definition
    removeNominal(state.ecs.componentDefinitions, id);
  }
);

function* relatedEntities(
  state: EditorState,
  componentDefinition: ComponentDefinition
) {
  for (const entityDefinition of Object.values(
    state.ecs.entityDefinitions
  ).filter((def) => def.systemId === componentDefinition.systemId)) {
    for (const componentInitializer of entityDefinition.components) {
      if (componentInitializer.definitionId === componentDefinition.id) {
        yield [entityDefinition, componentInitializer] as const;
      }
    }
  }
}
