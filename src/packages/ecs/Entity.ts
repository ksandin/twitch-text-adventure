import { ComponentInstance } from "./Component";
import { System } from "./System";
import { Container } from "./Container";
import { trustedUndefined } from "./trustedUndefined";
import { connectObservableArray } from "./connectObservableArray";

export class Entity {
  system: System = trustedUndefined();
  name: string = "";

  readonly components = new Container<ComponentInstance>();

  constructor(components?: readonly ComponentInstance[]) {
    connectObservableArray(this.components, (added, removed) => {
      added.forEach((component) => component.configure({ entity: this }));
      removed.forEach((component) =>
        component.configure({ entity: trustedUndefined() })
      );
    });
    if (components) {
      this.components.push(...(components as ComponentInstance[]));
    }
  }
}
