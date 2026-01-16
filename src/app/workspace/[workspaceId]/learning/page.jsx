"use client";
import LearningMode from "@/components/workspace/LearningMode";
import { WorkspaceSettingsProvider } from "@/context/WorkspaceSettingsContext";
import { WorkspaceStateProvider } from "@/context/WorkspaceStateContext";
import { useParams } from "next/navigation";

const LearningPage = () => {
    const { workspaceId } = useParams();

    return (
        <WorkspaceSettingsProvider workspaceId={workspaceId}>
            <WorkspaceStateProvider>
                <LearningMode />
            </WorkspaceStateProvider>
        </WorkspaceSettingsProvider>
    );
};

export default LearningPage;
