"use client";
import { useParams } from "next/navigation";
import { WorkspaceSettingsProvider, useWorkspaceSettings, MODES } from "@/context/WorkspaceSettingsContext";
import ModeSelectionModal from "@/components/modals/ModeSelectionModal";
import FocusWorkspace from "@/components/workspace/FocusWorkspace";
import LearningWorkspace from "@/components/workspace/LearningWorkspace";

/**
 * WorkspaceRouter - Routes to appropriate workspace based on selected mode.
 */
const WorkspaceRouter = () => {
  const { mode, setMode, isLoading } = useWorkspaceSettings();

  // Show loading state while checking for stored mode preference
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  // If mode is not selected yet, show the modal
  if (!mode) {
    return <ModeSelectionModal onSelect={setMode} />;
  }

  // Route to appropriate workspace based on mode
  if (mode === MODES.FOCUS) {
    return <FocusWorkspace />;
  }

  return <LearningWorkspace />;
};

/**
 * Workspace - Main entry point wrapped with settings provider.
 */
const Workspace = () => {
  const { workspaceId } = useParams();

  return (
    <WorkspaceSettingsProvider workspaceId={workspaceId}>
      <WorkspaceRouter />
    </WorkspaceSettingsProvider>
  );
};

export default Workspace;
