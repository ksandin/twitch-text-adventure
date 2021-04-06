import { IconButton, Tooltip, Typography } from "@material-ui/core";
import React from "react";
import { TextSystem } from "../../ecs-text-adventure/renderer/TextSystem";
import { useSystemSync } from "../hooks/useSystemSync";
import { ResetIcon } from "../icons";
import { FlatPanel } from "../components/FlatPanel";
import { Panel } from "../components/Panel";
import { PanelName } from "../types/PanelName";
import { PanelHeader } from "../components/PanelHeader";

export const RuntimePanel = () => {
  const [system, resetSystem] = useSystemSync();

  if (!system) {
    return (
      <FlatPanel>
        <Typography>No system available</Typography>
      </FlatPanel>
    );
  }

  return (
    <Panel name={PanelName.Runtime}>
      <PanelHeader title={PanelName.Runtime}>
        <Tooltip title="Reset runtime" onClick={resetSystem}>
          <IconButton edge="end" aria-label="Reset runtime">
            <ResetIcon />
          </IconButton>
        </Tooltip>
      </PanelHeader>
      <TextSystem system={system} />
    </Panel>
  );
};
