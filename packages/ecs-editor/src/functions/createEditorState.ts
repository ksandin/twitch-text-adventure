import { EditorState } from "../types/EditorState";
import { createECSDefinition } from "../../../ecs-serializable/src/functions/createECSDefinition";

export const createEditorState = (): EditorState => ({
  ecs: createECSDefinition(),
  themeType: "dark",
  codeFiles: {
    ids: [],
    entities: {},
  },
  windows: null,
});
