import { TextField } from "@material-ui/core";
import { useEffect, useMemo, useState } from "react";
import {
  deserializeJS,
  serializeJS,
} from "../../ecs-serializable/jsSerializer";
import { useAsRef } from "../../use-as-ref/useAsRef";

export const FunctionEditor = ({
  value,
  onChange,
}: {
  value: Function;
  onChange: (updated: Function) => void;
}) => {
  const defaultText = useMemo(() => serializeJS(value), [value]);
  const [text, setText] = useState<string>(defaultText);
  const textAsFunction = useMemo(() => tryParseFunction(text), [text]);
  const isValid = !!textAsFunction;
  const onChangeRef = useAsRef(onChange);

  // Emit a change every time we get new valid function
  useEffect(() => {
    if (isValid && text !== defaultText) {
      onChangeRef.current(textAsFunction);
    }
  }, [textAsFunction, text, defaultText, isValid, onChangeRef]);

  return (
    <TextField
      multiline
      error={!isValid}
      value={text}
      onChange={(e) => setText(e.currentTarget.value)}
    />
  );
};

const tryParseFunction = (js: string) => {
  try {
    const parsed = deserializeJS(js);
    return typeof parsed === "function" ? parsed : undefined;
  } catch {}
};