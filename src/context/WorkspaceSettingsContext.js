"use client";

import { createContext, useContext, useState, useEffect } from "react";

const WorkspaceSettingsContext = createContext();

export const MODES = {
  FOCUS: "focus",
  LEARNING: "learning",
};

export const WorkspaceSettingsProvider = ({ children, workspaceId }) => {
  const [mode, setModeState] = useState(null); // null = loading/unselected
  const [activeFiles, setActiveFiles] = useState({ focus: null, learning: null });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (!workspaceId) return;

    const loadSettings = () => {
      try {
        const storedSettings = localStorage.getItem(`workspace_settings_${workspaceId}`);
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          setModeState(parsed.mode || null);
          if (parsed.activeFiles) {
            setActiveFiles(parsed.activeFiles);
          }
        }
      } catch (error) {
        console.error("Failed to load workspace settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [workspaceId]);

  // Persist settings when changed
  const saveSettings = (newMode, newActiveFiles) => {
    try {
      localStorage.setItem(
        `workspace_settings_${workspaceId}`,
        JSON.stringify({
          mode: newMode,
          activeFiles: newActiveFiles
        })
      );
    } catch (error) {
      console.error("Failed to save workspace settings:", error);
    }
  };

  const setMode = (newMode) => {
    setModeState(newMode);
    saveSettings(newMode, activeFiles);
  };

  const updateActiveFile = (fileMode, fileName) => {
    const updatedFiles = { ...activeFiles, [fileMode]: fileName };
    setActiveFiles(updatedFiles);
    saveSettings(mode, updatedFiles);
  };

  return (
    <WorkspaceSettingsContext.Provider
      value={{
        mode,
        setMode,
        isLoading,
        activeFiles,
        updateActiveFile,
        isFocusMode: mode === MODES.FOCUS,
        isLearningMode: mode === MODES.LEARNING,
      }}
    >
      {children}
    </WorkspaceSettingsContext.Provider>
  );
};

export const useWorkspaceSettings = () => {
  const context = useContext(WorkspaceSettingsContext);
  if (!context) {
    // Return safe default to avoid crashes in components used outside provider
    return {
      mode: null,
      setMode: () => console.warn("WorkspaceSettingsProvider missing"),
      activeFiles: { focus: null, learning: null },
      updateActiveFile: () => { },
      isLoading: false,
      isFocusMode: false,
      isLearningMode: false,
    };
  }
  return context;
};
