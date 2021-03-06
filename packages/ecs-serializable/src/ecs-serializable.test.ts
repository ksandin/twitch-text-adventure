import * as zod from "zod";
import { Entity } from "../../ecs/src/Entity";
import { Component } from "../../ecs/src/Component";
import { InstanceOf } from "../../property-bag/src/types/PropertyBagInstance";
import { System } from "../../ecs/src/System";
import { updateSystem as realUpdateSystem } from "./functions/updateSystem";
import { createSystem as realCreateSystem } from "./functions/createSystem";
import {
  EntityInitializer,
  EntityInitializerId,
} from "./definition/EntityInitializer";
import {
  ComponentDefinition,
  ComponentDefinitionId,
} from "./definition/ComponentDefinition";
import {
  EntityDefinition,
  EntityDefinitionId,
} from "./definition/EntityDefinition";
import { SystemDefinition } from "./definition/SystemDefinition";
import { DeserializationMemory } from "./DeserializationMemory";
import { ComponentInitializer } from "./definition/ComponentInitializer";
import { createComponentPropertyDefinition } from "./functions/createComponentPropertyDefinition";
import { createECSDefinition } from "./functions/createECSDefinition";
import { ECSDefinition } from "./definition/ECSDefinition";
import { NativeComponents } from "./types/NativeComponents";

class Foo extends Component.extend({
  text: { type: zod.string().optional() },
  fn: { type: zod.function(zod.tuple([]), zod.number()).optional() },
}) {
  calculate(x: number) {
    return this.fn ? this.fn() * x : 0;
  }
}

const nativeComponents = {
  foo: Foo,
};

describe("creating a deserialized system", () => {
  it("can instantiate an entity using an EntityDefinition", () => {
    const entity: Omit<EntityDefinition, "systemId"> = {
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const system = mockSystem([entity]);
    expect(system.entities.length).toBe(1);
    expect(system.entities[0]).toBeInstanceOf(Entity);
  });

  it("can instantiate an entity without an EntityDefinition", () => {
    const initializer: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Entity A",
      id: uid(),
      components: [],
    };
    const system = mockSystem([], [], [initializer]);
    expect(system.entities.length).toBe(1);
    expect(system.entities[0]).toBeInstanceOf(Entity);
  });

  it("sets entity.isActive to false when EntityInitializer.isActive is false", () => {
    const initializer: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Entity A",
      isActive: false,
      id: uid(),
      components: [],
    };
    const system = mockSystem([], [], [initializer]);
    expect(system.root.descendants[0].isActive).toBe(false);
  });

  it("sets entity.isActive to true when EntityInitializer.isActive is true", () => {
    const initializer: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Entity A",
      isActive: true,
      id: uid(),
      components: [],
    };
    const system = mockSystem([], [], [initializer]);
    expect(system.root.descendants[0].isActive).toBe(true);
  });

  it("entity.isActive defaults to true when EntityInitializer.isActive is undefined", () => {
    const initializer: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Entity A",
      id: uid(),
      components: [],
    };
    const system = mockSystem([], [], [initializer]);
    expect(system.root.descendants[0].isActive).toBe(true);
  });

  it("instantiated entity use specified EntityInitializerId as id", () => {
    const initializer: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Entity A",
      id: uid(),
      components: [],
    };
    const system = mockSystem([], [], [initializer]);
    const [entity] = system.entities;
    expect(entity.id).toBe(initializer.id);
  });

  it("can instantiate an entity with a parent", () => {
    const parent: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Entity A",
      id: uid(),
      components: [],
    };
    const child: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Child",
      id: uid(),
      parentId: parent.id,
      components: [],
    };

    const system = mockSystem([], [], [parent, child]);
    expect(system.entities.length).toBe(2);

    const parentEntity = system.entities.find((e) => e.id === parent.id);
    const childEntity = system.entities.find((e) => e.id === child.id);
    expect(childEntity!.parent).toBe(parentEntity);
    expect(parentEntity!.children).toContain(childEntity);
  });

  it("can name an entity instance", () => {
    const definition: Omit<EntityDefinition, "systemId"> = {
      name: "Entity",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const entity1: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      definitionId: definition.id,
      name: "Initial",
      components: [],
    };
    const system = mockSystem([definition], [], [entity1]);
    expect(system.entities[0].name).toBe("Initial");
  });

  it("can instantiate a component", () => {
    const component: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const entity: Omit<EntityDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Entity A",
      components: [
        {
          id: uid(),
          definitionId: component.id,
          properties: {},
        },
      ],
    };
    const system = mockSystem([entity], [component]);
    expect(system.entities[0].components[0]).toBeInstanceOf(Foo);
  });

  it("can instantiate a component with properties", () => {
    const component: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const entity: Omit<EntityDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Entity A",
      components: [
        {
          id: uid(),
          definitionId: component.id,
          properties: { fn: createComponentPropertyDefinition(() => 2) },
        },
      ],
    };
    const system = mockSystem([entity], [component]);
    expect((system.entities[0].components[0] as Foo).calculate(5)).toBe(10);
  });

  it("can instantiate two entities with different ids", () => {
    const entity1: Omit<EntityDefinition, "systemId"> = {
      nodeId: uid(),
      name: "Entity A",
      id: uid(),
      components: [],
    };
    const entity2: Omit<EntityDefinition, "systemId"> = {
      nodeId: uid(),
      name: "Entity A",
      id: uid(),
      components: [],
    };
    const system = mockSystem([entity1, entity2]);
    expect(system.entities.length).toBe(2);
  });

  it("throws error when referencing entity definition that doesn't exist", () => {
    const system: SystemDefinition = {
      id: uid(),
      name: "System A",
    };
    const entity: EntityInitializer = {
      id: uid(),
      systemId: system.id,
      order: 0,
      definitionId: "bogus" as EntityDefinitionId,
      name: "entity",
      components: [],
    };
    const ecs = createECSDefinition({
      systems: { [system.id]: system },
      entityInitializers: { [entity.id]: entity },
    });

    expect(() => createSystem(ecs)).toThrow();
  });

  it("can instantiate two components with different ids", () => {
    const component1: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const component2: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const entity: Omit<EntityDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Entity A",
      components: [
        {
          id: uid(),
          definitionId: component1.id,
          properties: {},
        },
        {
          id: uid(),
          definitionId: component2.id,
          properties: {},
        },
      ],
    };
    const system = mockSystem([entity], [component1, component2]);
    expect(system.entities[0].components.length).toBe(2);
  });

  it("throws error when referencing component that doesn't exist", () => {
    const entity: Omit<EntityDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Entity A",
      components: [
        {
          id: uid(),
          definitionId: "bogus" as ComponentDefinitionId,
          properties: {},
        },
      ],
    };
    expect(() => mockSystem([entity], [])).toThrow();
  });

  test("two entities of the same definition inherit components and imperative properties", () => {
    const componentDefinition: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const entityDefinition: Omit<EntityDefinition, "systemId"> = {
      nodeId: uid(),
      name: "Entity",
      id: uid(),
      components: [
        {
          id: uid(),
          definitionId: componentDefinition.id,
          properties: { isActive: false },
        },
      ],
    };
    const entity1: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: "Entity 1",
      definitionId: entityDefinition.id,
      components: [],
    };
    const entity2: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: "Entity 2",
      definitionId: entityDefinition.id,
      components: [],
    };
    const system = mockSystem(
      [entityDefinition],
      [componentDefinition],
      [entity1, entity2]
    );
    expect(system.entities[0].components[0].isActive).toBe(false);
    expect(system.entities[1].components[0].isActive).toBe(false);
  });

  test("two entities of the same definition inherit components and declarative properties", () => {
    const componentDefinition: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const entityDefinition: Omit<EntityDefinition, "systemId"> = {
      nodeId: uid(),
      name: "Entity",
      id: uid(),
      components: [
        {
          id: uid(),
          definitionId: componentDefinition.id,
          properties: {
            isActive: createComponentPropertyDefinition(() => false),
          },
        },
      ],
    };
    const entity1: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: "Entity 1",
      definitionId: entityDefinition.id,
      components: [],
    };
    const entity2: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: "Entity 2",
      definitionId: entityDefinition.id,
      components: [],
    };
    const system = mockSystem(
      [entityDefinition],
      [componentDefinition],
      [entity1, entity2]
    );
    expect(system.entities[0].components[0].isActive).toBe(false);
    expect(system.entities[1].components[0].isActive).toBe(false);
  });
});

describe("updating a deserialized system", () => {
  it("sets entity.isActive to false when EntityInitializer.isActive changes from true to false", () => {
    const initializer: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Entity A",
      isActive: true,
      id: uid(),
      components: [],
    };
    const deactivated = {
      ...initializer,
      isActive: false,
    };
    const ecs1 = mockECS([], [], [initializer]);
    const ecs2 = mockECS([], [], [deactivated]);
    const system = createSystem(ecs1);
    expect(system.root.descendants[0].isActive).toBe(true);
    updateSystem(system, ecs2);
    expect(system.root.descendants[0].isActive).toBe(false);
  });

  it("sets entity.isActive to true when EntityInitializer.isActive changes from false to true", () => {
    const initializer: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Entity A",
      isActive: false,
      id: uid(),
      components: [],
    };
    const deactivated = {
      ...initializer,
      isActive: true,
    };
    const ecs1 = mockECS([], [], [initializer]);
    const ecs2 = mockECS([], [], [deactivated]);
    const system = createSystem(ecs1);
    expect(system.root.descendants[0].isActive).toBe(false);
    updateSystem(system, ecs2);
    expect(system.root.descendants[0].isActive).toBe(true);
  });

  it("stops controlling entity.isActive when EntityInitializer.isActive changes from boolean to undefined", () => {
    const initializer: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Entity A",
      isActive: false,
      id: uid(),
      components: [],
    };
    const deactivated = {
      ...initializer,
      isActive: undefined,
    };
    const ecs1 = mockECS([], [], [initializer]);
    const ecs2 = mockECS([], [], [deactivated]);
    const system = createSystem(ecs1);
    system.root.descendants[0].isActive = true;
    updateSystem(system, ecs2);
    expect(system.root.descendants[0].isActive).toBe(true);
  });

  it("can change the entity parent", () => {
    const parentA: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Parent A",
      id: uid(),
      components: [],
    };
    const parentB: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Parent B",
      id: uid(),
      components: [],
    };
    const childInA: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Child",
      id: uid(),
      parentId: parentA.id,
      components: [],
    };
    const childInB: Omit<EntityInitializer, "order" | "systemId"> = {
      ...childInA,
      parentId: parentB.id,
    };

    const ecs1 = mockECS([], [], [parentA, parentB, childInA]);
    const ecs2 = mockECS([], [], [parentA, parentB, childInB]);

    const system = createSystem(ecs1);
    const parentEntityA = system.entities.find((e) => e.id === parentA.id);
    const parentEntityB = system.entities.find((e) => e.id === parentB.id);
    const childEntity = system.entities.find((e) => e.id === childInA.id);

    expect(childEntity!.parent).toBe(parentEntityA);
    updateSystem(system, ecs2);
    expect(childEntity!.parent).toBe(parentEntityB);
  });

  it("removing entity parentId gives the entity the system root as parent", () => {
    const parent: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Parent A",
      id: uid(),
      components: [],
    };
    const child: Omit<EntityInitializer, "order" | "systemId"> = {
      name: "Child",
      id: uid(),
      parentId: parent.id,
      components: [],
    };
    const childInRoot: Omit<EntityInitializer, "order" | "systemId"> = {
      ...child,
      parentId: undefined,
    };

    const ecs1 = mockECS([], [], [parent, child]);
    const ecs2 = mockECS([], [], [parent, childInRoot]);

    const system = createSystem(ecs1);
    const parentEntity = system.entities.find((e) => e.id === parent.id);
    const childEntity = system.entities.find((e) => e.id === child.id);

    expect(childEntity!.parent).toBe(parentEntity);
    updateSystem(system, ecs2);
    expect(childEntity!.parent).toBe(system.root);
  });

  it("can rename an entity instance", () => {
    const definition: Omit<EntityDefinition, "systemId"> = {
      name: "Entity",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const entity1: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      definitionId: definition.id,
      name: "Initial",
      components: [],
    };
    const entity2: Omit<EntityInitializer, "order" | "systemId"> = {
      ...entity1,
      name: "Updated",
    };
    const ecs1 = mockECS([definition], [], [entity1]);
    const ecs2 = mockECS([definition], [], [entity2]);
    const system = createSystem(ecs1);
    expect(system.entities[0].name).toBe("Initial");
    updateSystem(system, ecs2);
    expect(system.entities[0].name).toBe("Updated");
  });

  it("can add entity constructor", () => {
    const entity: EntityDefinition = {
      systemId: uid(),
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const ecsWithEntity = createECSDefinition({
      entityDefinitions: { [entity.id]: entity },
    });
    const system = createSystem(createECSDefinition());
    updateSystem(system, ecsWithEntity);
    expect(system.memory.entityConstructors.size).toBe(1);
  });

  it("can remove entity constructor", () => {
    const entity: EntityDefinition = {
      systemId: uid(),
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const ecsWithEntity = createECSDefinition({
      entityDefinitions: { [entity.id]: entity },
    });
    const system = createSystem(ecsWithEntity);
    updateSystem(system, createECSDefinition());
    expect(system.memory.entityConstructors.size).toBe(0);
  });

  it("can add component constructor", () => {
    const component: ComponentDefinition = {
      systemId: uid(),
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const ecsWithComponent = createECSDefinition({
      componentDefinitions: { [component.id]: component },
    });
    const system = createSystem(createECSDefinition());
    updateSystem(system, ecsWithComponent);
    expect(system.memory.componentConstructors.size).toBe(1);
  });

  it("can remove component constructor", () => {
    const component: ComponentDefinition = {
      systemId: uid(),
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const ecsWithComponent = createECSDefinition({
      componentDefinitions: { [component.id]: component },
    });
    const system = createSystem(ecsWithComponent);
    updateSystem(system, createECSDefinition());
    expect(system.memory.componentConstructors.size).toBe(0);
  });

  it("can add entity instance", () => {
    const entity: Omit<EntityDefinition, "systemId"> = {
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const ecsWithEntity = mockECS([entity]);
    const system = createSystem(createECSDefinition());
    updateSystem(system, ecsWithEntity);
    expect(system.entities.length).toBe(1);
  });

  it("can maintain entity instances across updates", () => {
    const entity: Omit<EntityDefinition, "systemId"> = {
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const ecsWithEntity = mockECS([entity]);
    const system = createSystem(ecsWithEntity);
    const instanceBeforeUpdate = system.entities[0];
    updateSystem(system, ecsWithEntity);
    const instanceAfterUpdate = system.entities[0];
    expect(instanceAfterUpdate).toBe(instanceBeforeUpdate);
  });

  it("can remove entity instance", () => {
    const entity: Omit<EntityDefinition, "systemId"> = {
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const ecsWithEntity = mockECS([entity]);
    const system = createSystem(ecsWithEntity);
    updateSystem(system, createECSDefinition());
    expect(system.entities.length).toBe(0);
  });

  it("can add component to entity definition", () => {
    const component: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const entityWithoutComponent: Omit<EntityDefinition, "systemId"> = {
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const entityWithComponent: Omit<EntityDefinition, "systemId"> = {
      ...entityWithoutComponent,
      components: [
        {
          id: uid(),
          properties: {},
          definitionId: component.id,
        },
      ],
    };
    const ecs1 = mockECS([entityWithoutComponent], []);
    const ecs2 = mockECS([entityWithComponent], [component]);

    const system = createSystem(ecs1);
    expect(system.entities[0].components.length).toBe(0);

    updateSystem(system, ecs2);
    expect(system.entities[0].components.length).toBe(1);
  });

  it("can remove component from entity definition", () => {
    const component: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const entityWithoutComponent: Omit<EntityDefinition, "systemId"> = {
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const entityWithComponent: Omit<EntityDefinition, "systemId"> = {
      ...entityWithoutComponent,
      components: [
        {
          id: uid(),
          properties: {},
          definitionId: component.id,
        },
      ],
    };
    const ecs1 = mockECS([entityWithComponent], [component]);
    const ecs2 = mockECS([entityWithoutComponent], []);

    const system = createSystem(ecs1);
    expect(system.entities[0].components.length).toBe(1);

    updateSystem(system, ecs2);
    expect(system.entities[0].components.length).toBe(0);
  });

  it("can update component properties in entity definition", () => {
    const componentDefinition: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const componentInitializer: ComponentInitializer = {
      id: uid(),
      properties: {},
      definitionId: componentDefinition.id,
    };
    const entity1: Omit<EntityDefinition, "systemId"> = {
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [
        {
          ...componentInitializer,
          properties: { isActive: false },
        },
      ],
    };
    const entity2: Omit<EntityDefinition, "systemId"> = {
      ...entity1,
      components: [
        {
          ...componentInitializer,
          properties: { isActive: true },
        },
      ],
    };

    const ecs1 = mockECS([entity1], [componentDefinition]);
    const ecs2 = mockECS([entity2], [componentDefinition]);

    const system = createSystem(ecs1);
    expect(system.entities[0].components[0].isActive).toBe(false);

    updateSystem(system, ecs2);
    expect(system.entities[0].components[0].isActive).toBe(true);
  });

  it("can add component to entity initializer", () => {
    const component: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const entityDefinition: Omit<EntityDefinition, "systemId"> = {
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const noComponent: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: entityDefinition.name,
      definitionId: entityDefinition.id,
      components: [],
    };
    const hasComponent: typeof noComponent = {
      ...noComponent,
      components: [
        {
          id: uid(),
          properties: {},
          definitionId: component.id,
        },
      ],
    };
    const ecs1 = mockECS([entityDefinition], [], [noComponent]);
    const ecs2 = mockECS([entityDefinition], [component], [hasComponent]);

    const system = createSystem(ecs1);
    expect(system.entities[0].components.length).toBe(0);

    updateSystem(system, ecs2);
    expect(system.entities[0].components.length).toBe(1);
  });

  it("can remove component from entity initializer", () => {
    const component: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const entityDefinition: Omit<EntityDefinition, "systemId"> = {
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const noComponent: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: entityDefinition.name,
      definitionId: entityDefinition.id,
      components: [],
    };
    const hasComponent: typeof noComponent = {
      ...noComponent,
      components: [
        {
          id: uid(),
          properties: {},
          definitionId: component.id,
        },
      ],
    };
    const ecs1 = mockECS([entityDefinition], [component], [hasComponent]);
    const ecs2 = mockECS([entityDefinition], [], [noComponent]);

    const system = createSystem(ecs1);
    expect(system.entities[0].components.length).toBe(1);

    updateSystem(system, ecs2);
    expect(system.entities[0].components.length).toBe(0);
  });

  it("can update component properties in entity initializer", () => {
    const component: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const entityDefinition: Omit<EntityDefinition, "systemId"> = {
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const entity1: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: entityDefinition.name,
      definitionId: entityDefinition.id,
      components: [
        {
          id: uid(),
          properties: { isActive: false },
          definitionId: component.id,
        },
      ],
    };
    const entity2: typeof entity1 = {
      ...entity1,
      components: entity1.components.map((comp) => ({
        ...comp,
        properties: { isActive: true },
      })),
    };
    const ecs1 = mockECS([entityDefinition], [component], [entity1]);
    const ecs2 = mockECS([entityDefinition], [component], [entity2]);

    const system = createSystem(ecs1);
    expect(system.entities[0].components[0].isActive).toBe(false);

    updateSystem(system, ecs2);
    expect(system.entities[0].components[0].isActive).toBe(true);
  });

  it("can reset component properties in entity initializer", () => {
    const componentDefinition: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const componentInitializer: Omit<ComponentInitializer, "properties"> = {
      id: uid(),
      definitionId: componentDefinition.id,
    };
    const entityDefinition: Omit<EntityDefinition, "systemId"> = {
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [
        {
          ...componentInitializer,
          properties: { isActive: false },
        },
      ],
    };
    const entity1: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: entityDefinition.name,
      definitionId: entityDefinition.id,
      components: [
        {
          ...componentInitializer,
          properties: { isActive: true },
        },
      ],
    };
    const entity2: typeof entity1 = {
      ...entity1,
      components: [
        {
          ...componentInitializer,
          properties: {},
        },
      ],
    };
    const ecs1 = mockECS([entityDefinition], [componentDefinition], [entity1]);
    const ecs2 = mockECS([entityDefinition], [componentDefinition], [entity2]);

    const system = createSystem(ecs1);
    expect(system.entities[0].components[0].isActive).toBe(true);

    updateSystem(system, ecs2);
    expect(system.entities[0].components[0].isActive).toBe(false);
  });

  it("can reset component properties that has defaults in entity initializer", () => {
    const nativeComponentsWithDefault = {
      foo: Component.extend({
        isActive: { type: zod.boolean(), defaultValue: true },
      }),
    };
    const componentDefinition: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const componentInitializer: Omit<ComponentInitializer, "properties"> = {
      id: uid(),
      definitionId: componentDefinition.id,
    };
    const entityDefinition: Omit<EntityDefinition, "systemId"> = {
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [
        {
          ...componentInitializer,
          properties: {},
        },
      ],
    };
    const entity1: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: entityDefinition.name,
      definitionId: entityDefinition.id,
      components: [
        {
          ...componentInitializer,
          properties: { isActive: false },
        },
      ],
    };
    const entity2: typeof entity1 = {
      ...entity1,
      components: [
        {
          ...componentInitializer,
          properties: {},
        },
      ],
    };
    const ecs1 = mockECS([entityDefinition], [componentDefinition], [entity1]);
    const ecs2 = mockECS([entityDefinition], [componentDefinition], [entity2]);

    const system = createSystem(ecs1, nativeComponentsWithDefault);
    expect(system.entities[0].components[0].isActive).toBe(false);

    updateSystem(system, ecs2);
    expect(system.entities[0].components[0].isActive).toBe(true);
  });

  it("updating a component property only changes that specific property", () => {
    const component: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const entityDefinition: Omit<EntityDefinition, "systemId"> = {
      name: "Entity A",
      nodeId: uid(),
      id: uid(),
      components: [],
    };
    const entity1: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: entityDefinition.name,
      definitionId: entityDefinition.id,
      components: [
        {
          id: uid(),
          properties: { isActive: true },
          definitionId: component.id,
        },
      ],
    };
    const entity2: typeof entity1 = {
      ...entity1,
      components: entity1.components.map((comp) => ({
        ...comp,
        properties: { isActive: false },
      })),
    };
    const ecs1 = mockECS([entityDefinition], [component], [entity1]);
    const ecs2 = mockECS([entityDefinition], [component], [entity2]);

    const system = createSystem(ecs1);
    const instance = system.entities[0].components[0] as InstanceOf<typeof Foo>;
    instance.configure({ text: "hello" });
    updateSystem(system, ecs2);
    expect(instance.text).toBe("hello");
  });

  test("adding a second entity of an existing definition inherit components and imperative properties", () => {
    const cDef: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const eDef: Omit<EntityDefinition, "systemId"> = {
      nodeId: uid(),
      name: "Entity",
      id: uid(),
      components: [
        {
          id: uid(),
          definitionId: cDef.id,
          properties: { isActive: false },
        },
      ],
    };
    const entity1: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: "Entity 1",
      definitionId: eDef.id,
      components: [],
    };
    const entity2: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: "Entity 2",
      definitionId: eDef.id,
      components: [],
    };
    const ecs1 = mockECS([eDef], [cDef], [entity1]);
    const ecs2 = mockECS([eDef], [cDef], [entity1, entity2]);
    const system = createSystem(ecs1);
    expect(system.entities[0].components[0].isActive).toBe(false);
    updateSystem(system, ecs2);
    expect(system.entities[0].components[0].isActive).toBe(false);
    expect(system.entities[1].components[0].isActive).toBe(false);
  });

  test("adding a second entity of an existing definition inherit components and declarative properties", () => {
    const cDef: Omit<ComponentDefinition, "systemId"> = {
      nodeId: uid(),
      id: uid(),
      name: "Foo",
      nativeComponent: "foo",
    };
    const eDef: Omit<EntityDefinition, "systemId"> = {
      nodeId: uid(),
      name: "Entity",
      id: uid(),
      components: [
        {
          id: uid(),
          definitionId: cDef.id,
          properties: {
            isActive: createComponentPropertyDefinition(() => false),
          },
        },
      ],
    };
    const entity1: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: "Entity 1",
      definitionId: eDef.id,
      components: [],
    };
    const entity2: Omit<EntityInitializer, "order" | "systemId"> = {
      id: uid(),
      name: "Entity 2",
      definitionId: eDef.id,
      components: [],
    };
    const ecs1 = mockECS([eDef], [cDef], [entity1]);
    const ecs2 = mockECS([eDef], [cDef], [entity1, entity2]);
    const system = createSystem(ecs1);
    expect(system.entities[0].components[0].isActive).toBe(false);
    updateSystem(system, ecs2);
    expect(system.entities[0].components[0].isActive).toBe(false);
    expect(system.entities[1].components[0].isActive).toBe(false);
  });
});

let idCounter = 0;
const uid = <T extends string>() => ("id" + idCounter++) as T;

const mockECS = (
  entityDefinitions: Array<Omit<EntityDefinition, "systemId">>,
  componentDefinitions: Array<Omit<ComponentDefinition, "systemId">> = [],
  entityInitializers?: Array<Omit<EntityInitializer, "order" | "systemId">>
) => {
  const ecs = createECSDefinition();

  const system: SystemDefinition = {
    id: uid(),
    name: "System A",
  };
  ecs.systems[system.id] = system;

  if (!entityInitializers) {
    entityInitializers = entityDefinitions.map(({ id, components }, index) => ({
      name: `entity${index}`,
      id: `initializer${index}` as EntityInitializerId,
      definitionId: id,
      components: [],
    }));
  }

  entityInitializers.forEach((entity, order) => {
    ecs.entityInitializers[entity.id] = {
      ...entity,
      order,
      systemId: system.id,
    };
  });

  componentDefinitions.forEach((component) => {
    ecs.componentDefinitions[component.id] = {
      ...component,
      systemId: system.id,
    };
  });

  entityDefinitions.forEach((entity) => {
    ecs.entityDefinitions[entity.id] = {
      ...entity,
      systemId: system.id,
    };
  });
  return ecs;
};

const mockSystem = (
  entities: Array<Omit<EntityDefinition, "systemId">>,
  components: Array<Omit<ComponentDefinition, "systemId">> = [],
  entityInitializers?: Array<Omit<EntityInitializer, "order" | "systemId">>
) => createSystem(mockECS(entities, components, entityInitializers));

type SystemWithMemory = System<EntityInitializerId> & {
  memory: DeserializationMemory;
  nativeComponents: NativeComponents;
};

const createSystem = (
  ecs: ECSDefinition,
  nc: NativeComponents = nativeComponents
) => {
  const memory = new DeserializationMemory();
  const system = realCreateSystem(ecs, memory, nc) as SystemWithMemory;
  system.nativeComponents = nc;
  system.memory = memory;
  return system;
};

const updateSystem = (system: SystemWithMemory, ecs: ECSDefinition) =>
  realUpdateSystem(system, ecs, system.memory, system.nativeComponents);
