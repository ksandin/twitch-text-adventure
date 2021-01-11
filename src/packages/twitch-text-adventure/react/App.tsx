import React from "react";
import styled, { DefaultTheme, ThemeProvider } from "styled-components";
import { System } from "../../ecs/System";
import { describeSystem } from "../../ecs-describable/describeSystem";
import { performCommand } from "../../ecs-interactive/performCommand";
import { GlobalStyle } from "./GlobalStyle";
import { Console } from "./Console";

export type AppProps = {
  theme: DefaultTheme;
  system: System;
  timeLeft: number;
};

const App = ({ theme, system, timeLeft }: AppProps) => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <MaximizedConsole
        onCommand={(command) => performCommand(system, command)}
      >
        {`${describeSystem(system)}
Time left: ${Math.round(timeLeft / 1000)}s`}
      </MaximizedConsole>
    </ThemeProvider>
  );
};

const MaximizedConsole = styled(Console)`
  height: 100%;
`;

export default App;