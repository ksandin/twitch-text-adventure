import { System } from "../../../ecs/src/System";
import { Entity } from "../../../ecs/src/Entity";
import { Interactive } from "../interactive/Interactive";
import { Describable } from "./Describable";
import { describeSystem } from "./describeSystem";

test("The default description is empty string", () => {
  const d = new Describable();
  expect(d.description).toEqual("");
});

test("Describable entities are presented as text", () => {
  const entity = new Entity([
    new Describable({ description: "A visible entity" }),
  ]);
  expect(describeSystem(new System(entity))).toEqual("A visible entity");
});

test("Actions are presented as a text list", () => {
  const entity = new Entity([
    new Interactive({ action: "Foo" }),
    new Interactive({ action: "Bar" }),
  ]);
  expect(describeSystem(new System(entity))).toEqual(`Actions:
- Foo
- Bar`);
});

test("Interaction results are presented as a text above all other text output", () => {
  const entity = new Entity([
    new Interactive({ action: "Foo" }),
    new Interactive({ action: "Bar" }),
  ]);
  expect(describeSystem(new System(entity))).toEqual(`Actions:
- Foo
- Bar`);
});
