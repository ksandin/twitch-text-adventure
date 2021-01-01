import { useReducer } from "react";
import { World } from "./types/World";

export const useWorld = (world: World) => {
  const [, forceRender] = useReducer((s) => s + 1, 0);
  return (command: string) => {
    world.perform(command);
    forceRender();
  };
};
