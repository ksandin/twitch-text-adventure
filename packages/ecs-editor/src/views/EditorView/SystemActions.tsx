import { IconButton, Toolbar, Tooltip } from "@material-ui/core";
import styled from "styled-components";
import { saveAs } from "file-saver";
import {
  DeleteIcon,
  EditIcon,
  WindowsIcon,
  PublishIcon,
  SaveIcon,
  UnpublishIcon,
  ViewPublishedIcon,
} from "../../components/icons";
import { useDispatch, useStore } from "../../store";
import { useCrudDialogs } from "../../hooks/useCrudDialogs";
import { SystemDefinition } from "../../../../ecs-serializable/src/definition/SystemDefinition";
import { core } from "../../core";
import { zipECSDefinition } from "../../storage/zipECSDefinition";
import { getECSDefinitionForSystem } from "../../../../ecs-serializable/src/functions/getECSDefinitionForSystem";
import { useSystemPublisher } from "../../hooks/useSystemPublisher";
import { viewerRoute } from "../../routes/viewerRoute";
import { createDeleteSystemDefinitionAction } from "../../actions/createDeleteSystemDefinitionAction";
import { MenuFor } from "../../components/MenuFor";
import { useWindowMenuItems } from "../../features/window/useWindowMenuItems";

export type SystemActionsProps = {
  system: SystemDefinition;
};

export const SystemActions = ({ system }: SystemActionsProps) => {
  const dispatch = useDispatch();
  const store = useStore();
  const windowMenuItems = useWindowMenuItems();
  const {
    isPublished,
    canPublish,
    canUnpublish,
    publish,
    unpublish,
    snackbar,
  } = useSystemPublisher(system.id);

  const [{ showRenameDialog, showDeleteDialog }] = useCrudDialogs(
    "system",
    (system) => system.name,
    { rename: handleSystemRename, remove: handleSystemDelete }
  );

  function handleSystemRename(system: SystemDefinition, name: string) {
    dispatch(
      core.actions.renameSystemDefinition({ systemId: system.id, name })
    );
  }

  function handleSystemDelete(system: SystemDefinition) {
    for (const action of createDeleteSystemDefinitionAction(system.id, store)) {
      dispatch(action);
    }
  }

  async function saveECSDefinitionToDisk() {
    const selectedECS = getECSDefinitionForSystem(
      store.getState().editor.present.ecs,
      system.id
    );
    const zipped = await zipECSDefinition(selectedECS);
    saveAs(zipped, `${system!.name}.zip`);
  }

  return (
    <Row>
      <MenuFor items={windowMenuItems}>
        {(props) => (
          <Tooltip title="Windows">
            <IconButton {...props}>
              <WindowsIcon />
            </IconButton>
          </Tooltip>
        )}
      </MenuFor>
      <Tooltip title={isPublished ? "View published" : "Publish to view"}>
        <span>
          <IconButton
            disabled={!isPublished}
            component="a"
            href={viewerRoute.href({ id: system.id })}
            target="_blank"
          >
            <ViewPublishedIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={canUnpublish ? "Unpublish" : "Not published"}>
        <span>
          <IconButton disabled={!canUnpublish} onClick={unpublish}>
            <UnpublishIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={canPublish ? "Publish" : "Sign in to publish"}>
        <span>
          <IconButton disabled={!canPublish} onClick={publish}>
            <PublishIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Save to disk">
        <IconButton onClick={saveECSDefinitionToDisk}>
          <SaveIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Rename system">
        <IconButton onClick={() => showRenameDialog(system)}>
          <EditIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete system">
        <IconButton edge="end" onClick={() => showDeleteDialog(system)}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
      {snackbar}
    </Row>
  );
};

const Row = styled(Toolbar)`
  display: flex;
  justify-content: flex-end;
`;
