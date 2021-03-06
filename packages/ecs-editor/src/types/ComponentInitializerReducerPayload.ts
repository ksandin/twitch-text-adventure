import { EntityInitializerId } from "../../../ecs-serializable/src/definition/EntityInitializer";
import { EntityDefinitionId } from "../../../ecs-serializable/src/definition/EntityDefinition";

/**
 * Common payload for component initializer reducers
 */
export type ComponentInitializerReducerPayload<Props> =
  | Payload<"initializer", EntityInitializerId, Props>
  | Payload<"definition", EntityDefinitionId, Props>;

type Target = "initializer" | "definition";

type Payload<T extends Target, Id, Props> = {
  id: Id;
  target: T;
} & Props;
