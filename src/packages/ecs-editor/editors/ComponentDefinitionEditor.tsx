import { ComponentDefinition } from "../../ecs-serializable/types/ComponentDefinition";
import { PanelHeader } from "../components/PanelHeader";
import { PanelName } from "../components/PanelName";
import { InspectedObjectInfo } from "../components/InspectedObjectInfo";
import { ComponentDefinitionIcon } from "../components/icons";

export type ComponentDefinitionEditorProps = {
  value: ComponentDefinition;
};

export const ComponentDefinitionEditor = ({
  value,
}: ComponentDefinitionEditorProps) => (
  <>
    <PanelHeader title={PanelName.Inspector} />
    <InspectedObjectInfo icon={<ComponentDefinitionIcon />} name={value.name} />
  </>
);