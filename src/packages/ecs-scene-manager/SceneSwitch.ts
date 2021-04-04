import * as zod from "zod";
import {
  Interactive,
  interactiveProperties,
} from "../ecs-interactive/Interactive";
import { SceneManager } from "./SceneManager";

export class SceneSwitch extends Interactive.extend({
  targetSceneName: { type: zod.string(), defaultValue: "" },
  effect: { ...interactiveProperties.effect, hidden: true },
}) {
  get sceneManager() {
    return this.entity?.system?.entities.findComponent(SceneManager);
  }
  get targetScene() {
    return this.sceneManager?.scenes?.find(
      (scene) => scene.name === this.targetSceneName
    );
  }
  constructor() {
    super({
      action: () => `Go to ${this.targetSceneName}`,
      effect: () => {
        if (this.sceneManager) {
          this.sceneManager.sceneId = this.targetScene?.id;
        }
      },
    });
  }
}