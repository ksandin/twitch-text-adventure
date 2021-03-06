import { ComponentDefinition } from "../definition/ComponentDefinition";
import { NativeComponents } from "../types/NativeComponents";
import { Component } from "../../../ecs/src/Component";

/**
 * Returns a Component class representing the specified ComponentDefinition.
 */
export const defineComponent = (
  definition: ComponentDefinition,
  nativeComponents: NativeComponents
): Component => {
  const constructor = nativeComponents[definition.nativeComponent];
  if (!constructor) {
    throw new Error(
      `Native component not available: ${definition.nativeComponent}`
    );
  }
  return constructor;
};
