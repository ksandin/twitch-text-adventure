import { EntityInitializer } from "../../../ecs-serializable/src/definition/EntityInitializer";

export function compareEntityInitializers(
  a: EntityInitializer,
  b: EntityInitializer
) {
  return a.order === b.order ? 0 : a.order < b.order ? -1 : 1;
}
