import { Container } from "./Container";
import { Entity } from "./Entity";
import { Scene } from "./Scene";

export class World<State = any> {
  public scenes: Record<SceneId, Scene>;
  public state: State;

  private _sceneId: SceneId;
  public get sceneId() {
    return this._sceneId;
  }

  public set sceneId(value: SceneId) {
    if (value in this.scenes) {
      this._sceneId = value;
    } else {
      throw new Error(`Scene does not exist: ${value}`);
    }
  }

  private readonly getEntities = (world: World<State>) =>
    world.scene ? Array.from(world.scene) : [];

  public get scene() {
    return this.scenes[this._sceneId];
  }
  public get entities() {
    return this.getEntities(this);
  }

  constructor(optionsOrEntities: WorldOptions<State> | Entity[]) {
    const options = Array.isArray(optionsOrEntities)
      ? { scenes: { default: optionsOrEntities } }
      : optionsOrEntities;
    this.state = options.state || ({} as State);
    this.scenes = Object.keys(options.scenes).reduce(
      (scenes, sceneId) => ({
        ...scenes,
        [sceneId]: new Container<Entity>(...options.scenes[sceneId]),
      }),
      {}
    );
    this.sceneId = this._sceneId =
      options.sceneId ?? Object.keys(this.scenes)[0];
    if (options.entities) {
      this.getEntities = options.entities;
    }
  }
}

export type WorldOptions<State> = {
  sceneId?: SceneId;
  scenes: Record<SceneId, Entity[]>;
  state?: State;
  entities?: (world: World<State>) => Entity[];
};

type SceneId = string | number;