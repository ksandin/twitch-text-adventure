import { memo } from "react";
import {
  Fade,
  IconButton,
  Slide,
  Toolbar as MuiToolbar,
  Tooltip,
  Typography,
} from "@material-ui/core";
import styled from "styled-components";
import { useDispatch, useSelector } from "../store";
import { core } from "../core";
import { selectThemeType } from "../selectors/selectThemeType";
import { BackIcon, DarkThemeIcon, LightThemeIcon } from "../icons";
import { selectSelectedSystemDefinition } from "../selectors/selectSelectedSystemDefinition";
import { usePrevious } from "../hooks/usePrevious";
import { DevToolsButton } from "./DevToolsButton";
import { UserActions } from "./UserActions";

export const Toolbar = memo(() => {
  const dispatch = useDispatch();
  const themeType = useSelector(selectThemeType);
  const selectedSystem = useSelector(selectSelectedSystemDefinition);
  const previousSystem = usePrevious(selectedSystem);
  const displayedSystem = selectedSystem ?? previousSystem;

  const nextThemeType = themeType === "light" ? "dark" : "light";
  const ThemeToggleIcon = themeToggleIcons[themeType];
  const themeToggleTooltip = themeToggleTooltips[themeType];

  const toggleTheme = () => dispatch(core.actions.setThemeType(nextThemeType));
  const goHome = () => dispatch(core.actions.setSelectedSystemDefinition());

  return (
    <Container>
      <Fade in={!!selectedSystem}>
        <div>
          <Tooltip title="Home">
            <IconButton edge="start" onClick={goHome}>
              <BackIcon />
            </IconButton>
          </Tooltip>
          <Title>{displayedSystem?.name}</Title>
        </div>
      </Fade>
      <Grow />
      <Actions>
        <DevToolsButton />
        <Tooltip title={themeToggleTooltip}>
          <IconButton aria-label={themeToggleTooltip} onClick={toggleTheme}>
            <ThemeToggleIcon />
          </IconButton>
        </Tooltip>
        <UserActions />
      </Actions>
    </Container>
  );
});

const Container = styled(MuiToolbar).attrs({ disableGutters: true })`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Grow = styled.span`
  flex: 1;
`;

const Title = styled(Typography).attrs({
  component: "span",
  noWrap: true,
})`
  margin: 0 ${({ theme }) => theme.spacing(1.5)}px;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const themeToggleIcons = {
  light: DarkThemeIcon,
  dark: LightThemeIcon,
};

const themeToggleTooltips = {
  light: "Use dark theme",
  dark: "Use light theme",
};
