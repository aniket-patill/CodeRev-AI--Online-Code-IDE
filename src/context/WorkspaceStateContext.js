"use client";

import { createContext, useState, useCallback, useContext } from "react";

const WorkspaceStateContext = createContext();

export const WorkspaceStateProvider = ({ children }) => {
  const [history, setHistory] = useState([]); // Stack of state snapshots
  const [currentIndex, setCurrentIndex] = useState(-1); // Current position in history

  /**
   * Push a new state snapshot to history
   * Removes any redo history if we're not at the end
   */
  const pushToHistory = useCallback((snapshot) => {
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      newHistory.push(snapshot);
      return newHistory;
    });
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex]);

  /**
   * Undo: move to previous state
   */
  const undo = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  /**
   * Redo: move to next state
   */
  const redo = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < history.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [history.length]);

  /**
   * Get current state from history
   */
  const getCurrentState = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return history[currentIndex];
    }
    return null;
  }, [history, currentIndex]);

  /**
   * Clear history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return (
    <WorkspaceStateContext.Provider
      value={{
        pushToHistory,
        undo,
        redo,
        getCurrentState,
        clearHistory,
        canUndo,
        canRedo,
        history,
        currentIndex,
      }}
    >
      {children}
    </WorkspaceStateContext.Provider>
  );
};

export const useWorkspaceState = () => {
  const context = useContext(WorkspaceStateContext);
  if (!context) {
    throw new Error(
      "useWorkspaceState must be used within WorkspaceStateProvider"
    );
  }
  return context;
};
