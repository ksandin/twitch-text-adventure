import { removeNominal } from "../../../ecs-common/src/removeNominal";
import { createEditorStateReducer } from "../functions/createEditorStateReducer";
import { SystemDefinitionId } from "../../../ecs-serializable/src/definition/SystemDefinition";
import { core } from "../core";
import { deleteEntityDefinition } from "./deleteEntityDefinition";
import { deleteLibraryFolder } from "./deleteLibraryFolder";
import { deleteComponentDefinition } from "./deleteComponentDefinition";

export const deleteSystemDefinition = createEditorStateReducer<SystemDefinitionId>(
  (state, { payload: id }) => {
    if (!removeNominal(state.ecs.systems, id)) {
      throw new Error("Could not delete system");
    }
    // Delete related objects
    for (const def of Object.values(state.ecs.entityDefinitions).filter(
      (def) => def.systemId === id
    )) {
      deleteEntityDefinition(
        state,
        core.actions.deleteEntityDefinition(def.id)
      );
    }
    for (const def of Object.values(state.ecs.componentDefinitions).filter(
      (def) => def.systemId === id
    )) {
      deleteComponentDefinition(
        state,
        core.actions.deleteComponentDefinition(def.id)
      );
    }

    // Delete only root folders because deleteLibraryFolder deletes ancestors already
    const rootFolders = Object.values(state.ecs.libraryFolders).filter(
      (folder) => !folder.parentNodeId && folder.systemId === id
    );
    for (const folder of rootFolders) {
      deleteLibraryFolder(state, core.actions.deleteLibraryFolder(folder.id));
    }
  }
);