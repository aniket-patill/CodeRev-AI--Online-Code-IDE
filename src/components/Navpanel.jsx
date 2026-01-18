"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import {
  Folder,
  File,
  Trash,
  ChevronDown,
  ChevronRight,
  Menu,
  RotateCcw,
  RotateCw,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspaceState } from "@/context/WorkspaceStateContext";
import { MODES } from "@/context/WorkspaceSettingsContext";

/**
 * Get collection names based on mode.
 * Focus mode uses existing collections, Learning mode uses separate collections.
 */
const getCollectionNames = (workspaceId, mode) => {
  if (mode === MODES.LEARNING) {
    return {
      files: `workspaces/${workspaceId}/learningFiles`,
      folders: `workspaces/${workspaceId}/learningFolders`,
    };
  }
  // Default to Focus mode collections (existing data)
  return {
    files: `workspaces/${workspaceId}/files`,
    folders: `workspaces/${workspaceId}/folders`,
  };
};

const NavPanel = ({ workspaceId, mode, openFile, onFileCreated, hasFiles }) => {
  const collectionPaths = getCollectionNames(workspaceId, mode);
  const router = useRouter();
  const { canUndo, canRedo, undo, redo } = useWorkspaceState();

  // State management
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [folderStates, setFolderStates] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [creatingType, setCreatingType] = useState(null);
  const [creatingParentFolderId, setCreatingParentFolderId] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [renamingItem, setRenamingItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const fileInputRef = useRef(null);
  const isCreatingRef = useRef(false);
  const enterPressedRef = useRef(false);

  const ALLOWED_EXTENSIONS = [
    ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp",
    ".html", ".css", ".json", ".md", ".txt", ".xml", ".yml", ".yaml"
  ];

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);

    for (const file of uploadedFiles) {
      const extension = "." + file.name.split(".").pop().toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        alert(`File type ${extension} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target.result;
        try {
          const fileRef = await addDoc(collection(db, collectionPaths.files), {
            name: file.name,
            content: content,
            workspaceId: workspaceId,
            folderId: null, // Uploads to root for now
          });

          // If this is the first file and onFileCreated callback exists, notify parent
          if (!hasFiles && onFileCreated) {
            const newFile = {
              id: fileRef.id,
              name: file.name,
              content: content,
              workspaceId: workspaceId,
              folderId: null,
            };
            // Auto-open the first file
            openFile(newFile);
            onFileCreated(newFile);
          }
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Utility function
  const truncateName = (name) => {
    return name.length > 20 ? `${name.substring(0, 20)}...` : name;
  };

  // Fetch data
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    const membersRef = collection(db, `workspaces/${workspaceId}/members`);
    const unsubscribeMembers = onSnapshot(membersRef, (snapshot) => {
      const membersData = snapshot.docs.map((doc) => doc.data());
      const member = membersData.find((m) => m.userId === user.uid);
      if (member) setUserRole(member.role);
    });

    const foldersRef = collection(db, collectionPaths.folders);
    const unsubscribeFolders = onSnapshot(foldersRef, (snapshot) => {
      const foldersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFolders(foldersData);

      const initialFolderStates = {};
      foldersData.forEach((folder) => {
        initialFolderStates[folder.id] = false;
      });
      setFolderStates(initialFolderStates);
    });

    const filesRef = collection(db, collectionPaths.files);
    const unsubscribeFiles = onSnapshot(filesRef, (snapshot) => {
      setFiles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeMembers();
      unsubscribeFolders();
      unsubscribeFiles();
    };
  }, [workspaceId, router]);

  // Handlers
  const toggleFolder = (folderId) => {
    setFolderStates((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleDragStart = (e, item, type) => {
    e.stopPropagation();
    setDraggedItem({ id: item.id, type });
  };

  const handleDragOver = (e, targetFolderId) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem || draggedItem.id === targetFolderId) return;

    try {
      const isFolder = draggedItem.type === "folder";
      const collectionName = isFolder ? "folders" : "files";
      const fieldName = isFolder ? "parentFolderId" : "folderId";

      await updateDoc(
        doc(db, `workspaces/${workspaceId}/${collectionName}/${draggedItem.id}`),
        { [fieldName]: targetFolderId || null }
      );
    } catch (error) {
      console.error("Error moving item:", error);
    }
    setDraggedItem(null);
  };

  const createItem = async (folderId) => {
    if (!newItemName || isCreatingRef.current) return;

    // Prevent duplicate creation
    isCreatingRef.current = true;

    try {
      if (creatingType === "folder") {
        await addDoc(collection(db, collectionPaths.folders), {
          name: newItemName,
          parentFolderId: creatingParentFolderId,
        });
      } else {
        const fileRef = await addDoc(collection(db, collectionPaths.files), {
          name: newItemName,
          folderId: creatingParentFolderId,
          workspaceId,
          content: "", // Initialize with empty content
        });

        // If this is the first file and onFileCreated callback exists, notify parent
        if (!hasFiles && onFileCreated) {
          const newFile = {
            id: fileRef.id,
            name: newItemName,
            folderId: creatingParentFolderId,
            workspaceId,
            content: "",
          };
          // Auto-open the first file
          openFile(newFile);
          onFileCreated(newFile);
        }
      }
      setNewItemName("");
      setCreatingType(null);
      setCreatingParentFolderId(null);

      // Open the folder where item was created
      if (folderId) {
        setFolderStates((prev) => ({ ...prev, [folderId]: true }));
      }
    } catch (error) {
      console.error("Error creating item:", error);
    } finally {
      isCreatingRef.current = false;
    }
  };

  const renameItem = async () => {
    if (!renamingItem?.name) return;

    try {
      const collectionPath =
        renamingItem.type === "folder" ? collectionPaths.folders : collectionPaths.files;
      await updateDoc(
        doc(db, `${collectionPath}/${renamingItem.id}`),
        { name: renamingItem.name }
      );
      setRenamingItem(null);
    } catch (error) {
      console.error("Error renaming item:", error);
    }
  };

  const deleteItem = async (type, id) => {
    if (type === "folders") {
      await deleteDoc(doc(db, `${collectionPaths.folders}/${id}`));

      const nestedFolders = folders.filter(
        (folder) => folder.parentFolderId === id
      );
      for (const nestedFolder of nestedFolders) {
        await deleteItem("folders", nestedFolder.id);
      }

      const folderFiles = files.filter((file) => file.folderId === id);
      for (const file of folderFiles) {
        await deleteDoc(doc(db, `${collectionPaths.files}/${file.id}`));
      }
    } else {
      await deleteDoc(doc(db, `${collectionPaths.files}/${id}`));
    }
  };

  // Render folder
  const renderFolder = (folder) => {
    const nestedFolders = folders.filter((f) => f.parentFolderId === folder.id);
    const folderFiles = files.filter((file) => file.folderId === folder.id);

    return (
      <div
        key={folder.id}
        className="ml-3 border-l border-white/5"
        draggable
        onDragStart={(e) => handleDragStart(e, folder, "folder")}
        onDragOver={(e) => handleDragOver(e, folder.id)}
        onDrop={(e) => handleDrop(e, folder.id)}
      >
        <div className="flex items-center justify-between group hover:bg-zinc-800/50 px-2 py-1.5 rounded transition-colors">
          <div
            className="flex items-center flex-1 cursor-pointer"
            onClick={() => toggleFolder(folder.id)}
          >
            {folderStates[folder.id] ? (
              <ChevronDown size={14} className="mr-1 text-zinc-400 flex-shrink-0" />
            ) : (
              <ChevronRight size={14} className="mr-1 text-zinc-400 flex-shrink-0" />
            )}
            <Folder size={14} className="mr-2 text-zinc-400 flex-shrink-0" />            {renamingItem?.id === folder.id ? (
              <input
                className="text-xs bg-zinc-800 text-white px-2 py-1 rounded border border-white/10 focus:border-white/30 outline-none"
                value={renamingItem.name}
                onChange={(e) =>
                  setRenamingItem({ ...renamingItem, name: e.target.value })
                }
                onBlur={renameItem}
                onKeyPress={(e) => e.key === "Enter" && renameItem()}
                autoFocus
              />
            ) : (
              <span
                className="text-xs text-zinc-300"
                onDoubleClick={() =>
                  setRenamingItem({
                    id: folder.id,
                    name: folder.name,
                    type: "folder",
                  })
                }
              >
                {truncateName(folder.name)}
              </span>
            )}
          </div>

          {(userRole === "contributor" || userRole === "owner") && (
            <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Folder
                size={12}
                className="text-zinc-400 hover:text-white cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingType((prev) =>
                    prev === "folder" ? null : "folder"
                  );
                  setCreatingParentFolderId(folder.id);
                  setNewItemName("");
                  setFolderStates((prev) => ({ ...prev, [folder.id]: true }));
                }}
              />
              <File
                size={12}
                className="text-zinc-400 hover:text-white cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingType((prev) => (prev === "file" ? null : "file"));
                  setCreatingParentFolderId(folder.id);
                  setNewItemName("");
                  setFolderStates((prev) => ({ ...prev, [folder.id]: true }));
                }}
              />
              <Trash
                size={12}
                className="text-zinc-400 hover:text-red-400 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem("folders", folder.id);
                }}
              />
            </div>
          )}
        </div>

        {folderStates[folder.id] && (
          <div className="ml-1">
            {creatingType && creatingParentFolderId === folder.id && (
              <div className="ml-4 flex items-center px-2 py-1">
                <input
                  className="text-xs bg-zinc-800 text-white px-2 py-1 rounded border border-white/10 focus:border-white/30 outline-none flex-1"
                  placeholder={`New ${creatingType} name`}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onBlur={() => {
                    if (!enterPressedRef.current) {
                      createItem(folder.id);
                    }
                    enterPressedRef.current = false;
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      enterPressedRef.current = true;
                      createItem(folder.id);
                    }
                  }}
                  autoFocus
                />
              </div>
            )}
            {nestedFolders.map((nestedFolder) => renderFolder(nestedFolder))}
            {folderFiles.map((file) => (
              <div
                key={file.id}
                className="ml-6 flex items-center justify-between group hover:bg-zinc-800/50 px-2 py-1.5 rounded transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, file, "file")}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                <div
                  className="flex items-center cursor-pointer flex-1"
                  onClick={() => openFile(file)}
                >
                  <File size={14} className="mr-2 text-zinc-400" />
                  {renamingItem?.id === file.id ? (
                    <input
                      className="text-xs bg-zinc-800 text-white px-2 py-1 rounded border border-white/10 focus:border-white/30 outline-none"
                      value={renamingItem.name}
                      onChange={(e) =>
                        setRenamingItem({
                          ...renamingItem,
                          name: e.target.value,
                        })
                      }
                      onBlur={renameItem}
                      onKeyPress={(e) => e.key === "Enter" && renameItem()}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-xs text-zinc-300"
                      onDoubleClick={() =>
                        setRenamingItem({
                          id: file.id,
                          name: file.name,
                          type: "file",
                        })
                      }
                    >
                      {truncateName(file.name)}
                    </span>
                  )}
                </div>
                {(userRole === "contributor" || userRole === "owner") && (
                  <Trash
                    size={12}
                    className="text-zinc-400 hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem("files", file.id);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-transparent text-zinc-300 h-full w-full flex flex-col">
      <div className="p-4 border-b border-white/10 relative z-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-zinc-400 tracking-wider">
            FILE EXPLORER
          </h2>
          <div className="flex items-center gap-1.5 relative z-50">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-zinc-800/50 rounded transition-colors relative z-50"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu size={14} className="text-zinc-400" />
            </button>
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 hover:bg-zinc-800/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-50"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw size={14} className="text-zinc-400" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 hover:bg-zinc-800/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-50"
              title="Redo (Ctrl+Y)"
            >
              <RotateCw size={14} className="text-zinc-400" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:bg-zinc-800/50 rounded transition-colors relative z-50"
              title="Upload File"
            >
              <Upload size={14} className="text-zinc-400" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
          </div>
        </div>
        {sidebarOpen && (
          <div className="flex gap-2">
            {(userRole === "contributor" || userRole === "owner") && (
              <>
                <button
                  id="create-folder-btn"
                  onClick={() => {
                    setCreatingParentFolderId(null);
                    setNewItemName("");
                    setCreatingType((prev) =>
                      prev === "folder" ? null : "folder"
                    );
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 border border-white/10 hover:bg-zinc-800 hover:border-white/20 rounded-lg text-xs font-medium transition-all"
                >
                  <Folder size={14} className="text-zinc-400" />
                  Folder
                </button>
                <button
                  id="create-file-btn"
                  onClick={() => {
                    setCreatingParentFolderId(null);
                    setNewItemName("");
                    setCreatingType((prev) => (prev === "file" ? null : "file"));
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 border border-white/10 hover:bg-zinc-800 hover:border-white/20 rounded-lg text-xs font-medium transition-all"
                >
                  <File size={14} className="text-zinc-400" />
                  File
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {sidebarOpen && (
        <div
          className="flex-1 overflow-y-auto py-2 px-2 relative z-40"
          onDragOver={(e) => handleDragOver(e, null)}
          onDrop={(e) => handleDrop(e, null)}
        >
          {creatingType && !creatingParentFolderId && (
            <div className="flex items-center px-2 py-1 mb-2">
              <input
                className="text-xs bg-zinc-800 text-white px-2 py-1 rounded border border-white/10 focus:border-white/30 outline-none flex-1"
                placeholder={`New ${creatingType} name`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onBlur={() => {
                  if (!enterPressedRef.current) {
                    createItem();
                  }
                  enterPressedRef.current = false;
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    enterPressedRef.current = true;
                    createItem();
                  }
                }}
                autoFocus
              />
            </div>
          )}

          {folders
            .filter((folder) => !folder.parentFolderId)
            .map((folder) => renderFolder(folder))}

          {files
            .filter((file) => !file.folderId)
            .map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between group hover:bg-zinc-800/50 px-2 py-1.5 rounded transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, file, "file")}
                onDragOver={(e) => handleDragOver(e, null)}
                onDrop={(e) => handleDrop(e, null)}
              >
                <div
                  className="flex items-center cursor-pointer flex-1 border-l border-white/5 ml-1 px-2 py-1"
                  onClick={() => openFile(file)}
                >
                  <File size={14} className="mr-2 text-zinc-400" />
                  {renamingItem?.id === file.id ? (
                    <input
                      className="text-xs bg-zinc-800 text-white px-2 py-1 rounded border border-white/10 focus:border-white/30 outline-none"
                      value={renamingItem.name}
                      onChange={(e) =>
                        setRenamingItem({ ...renamingItem, name: e.target.value })
                      }
                      onBlur={renameItem}
                      onKeyPress={(e) => e.key === "Enter" && renameItem()}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-xs text-zinc-300"
                      onDoubleClick={() =>
                        setRenamingItem({
                          id: file.id,
                          name: file.name,
                          type: "file",
                        })
                      }
                    >
                      {truncateName(file.name)}
                    </span>
                  )}
                </div>
                {(userRole === "contributor" || userRole === "owner") && (
                  <Trash
                    size={12}
                    className="text-zinc-400 hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem("files", file.id);
                    }}
                  />
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default NavPanel;
