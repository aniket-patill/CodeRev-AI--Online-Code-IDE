"use client";
import FocusMode from "@/components/workspace/FocusMode";
import { WorkspaceSettingsProvider } from "@/context/WorkspaceSettingsContext";
import { WorkspaceStateProvider } from "@/context/WorkspaceStateContext";
import { useParams } from "next/navigation";

const FocusPage = () => {
    const { workspaceId } = useParams();

    return (
        <WorkspaceSettingsProvider workspaceId={workspaceId}>
            <WorkspaceStateProvider>
                <FocusMode />
            </WorkspaceStateProvider>
        </WorkspaceSettingsProvider>
    );
};

export default FocusPage;
