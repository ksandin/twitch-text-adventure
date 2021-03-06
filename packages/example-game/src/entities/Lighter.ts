import { Interactive } from "../../../ecs-text-adventure/src/interactive/Interactive";
import { System } from "../../../ecs/src/System";
import { Inventory } from "../../../ecs-text-adventure/src/collectable/Inventory";
import { Entity } from "../../../ecs/src/Entity";
import { SceneManager } from "../../../ecs-scene-manager/src/SceneManager";

export type LighterState = "lit" | "unlit";

export class Lighter extends Entity {
  state: LighterState = "unlit";

  get sceneManager() {
    return this.system?.entities.findComponent(SceneManager);
  }

  get actionText() {
    return this.state === "lit" ? "Stop using lighter" : "Use lighter";
  }

  get isLit() {
    return this.state === "lit";
  }

  toggle() {
    this.state = this.state === "lit" ? "unlit" : "lit";
  }

  constructor() {
    super();
    this.components.push(
      new Interactive({
        isActive: () => this.sceneManager?.sceneId === "pit",
        action: () => this.actionText,
        effect: () => this.toggle(),
      })
    );
  }

  static isLit(system?: System) {
    const inventory = system?.entities.findComponent(Inventory);
    const lighter = inventory?.items.findType(Lighter);
    return lighter ? lighter.isLit : false;
  }
}
