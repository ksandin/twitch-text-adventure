import { Switch, TextField } from "@material-ui/core";
import { ZodTypes } from "zod";
import { isType } from "../../../property-bag/src/isType";
import {
  ComponentPropertyValue,
  ComponentPropertyValueDefinition,
} from "../../../ecs-serializable/src/definition/ComponentPropertiesDefinition";
import { PropertyInfo } from "../../../property-bag/src/types/PropertyInfo";
import { propertySupportsDeclarative } from "../../../property-bag/src/propertySupportsDeclarative";
import { isECSScript } from "../../../ecs-serializable/src/functions/isECSScript";
import { ECSScript } from "../../../ecs-serializable/src/definition/ECSScript";
import { ComponentPropertyDeclarationEditor } from "./ComponentPropertyDeclarationEditor";

export type ComponentPropertyValueEditorProps = {
  value: ComponentPropertyValueDefinition;
  info: PropertyInfo<ComponentPropertyValue>;
  onChange: (updated: ComponentPropertyValueDefinition) => void;
};

export const renderComponentPropertyValueEditor = ({
  value,
  info,
  onChange,
}: ComponentPropertyValueEditorProps) => {
  const supportsDeclarative = propertySupportsDeclarative(info);
  const isDeclarative = supportsDeclarative && isECSScript(value);

  if (isDeclarative || isType(info.type, ZodTypes.function)) {
    const declaration = (value ?? emptyFunc) as ECSScript;
    return (
      <ComponentPropertyDeclarationEditor
        value={declaration}
        onChange={onChange}
      />
    );
  }
  if (isType(info.type, ZodTypes.boolean)) {
    return (
      <Switch
        size="small"
        checked={value as boolean}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }
  if (isType(info.type, ZodTypes.number)) {
    return (
      <TextField
        size="small"
        value={value ?? "0"}
        type="number"
        onChange={(e) => onChange(parseFloat(e.currentTarget.value))}
      />
    );
  }
  if (isType(info.type, ZodTypes.string)) {
    return (
      <TextField
        size="small"
        value={value ?? ""}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
    );
  }
};

const emptyFunc: ECSScript = { code: "() => {}" };
