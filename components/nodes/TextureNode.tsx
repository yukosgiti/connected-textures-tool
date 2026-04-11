import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";

import {
    FileUpload,
    FileUploadDropzone,
} from "@/components/ui/file-upload";
import { useNodeData } from "@/hooks/store";
import useStore from "@/store/graph";
import { type NodeDataPatch } from "@/store/types";
import { Image01FreeIcons, X } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import React from "react";
import { normalizeTextureFile, type SerializedTextureData } from "../../lib/texture";
import { EmptyTexture, TexturePreview } from "../EmptyTexture";
import { Button } from "../ui/button";


type Props = {
    id: string;
}


type TextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
}


const useTextureNode = (id: string) => {
    const node = useNodeData(id);
    const setNode = useStore(store => store.setNode);

    const nodeData = (node?.data as TextureNodeData | undefined) ?? {};
    const setData = React.useCallback((newData: NodeDataPatch) => {
        setNode(id, newData);
    }, [id, setNode]);


    return [nodeData, setData] as const;
}


export const TextureNode = memo(({ id }: Props) => {
    const [nodeData, setNodeData] = useTextureNode(id);
    const [files, setFiles] = React.useState<File[]>([]);
    const [isUploading, setIsUploading] = React.useState(false);

    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;

    const clearTexture = React.useCallback((event?: React.MouseEvent<HTMLButtonElement>) => {
        event?.preventDefault();
        event?.stopPropagation();
        setFiles([]);
        setNodeData({ texture: null, error: null });
    }, [setNodeData]);

    const onFileReject = React.useCallback((_file: File, message: string) => {
        setNodeData({ error: message });
    }, [setNodeData]);

    const onUpload = React.useCallback(async (acceptedFiles: File[], options: {
        onProgress: (file: File, progress: number) => void;
        onSuccess: (file: File) => void;
        onError: (file: File, error: Error) => void;
    }) => {
        const [file] = acceptedFiles;

        if (!file) {
            return;
        }

        setIsUploading(true);
        options.onProgress(file, 100);

        try {
            const normalizedTexture = await normalizeTextureFile(file);
            setNodeData({ texture: normalizedTexture, error: null });
            options.onSuccess(file);
        } catch (uploadError) {
            const error = uploadError instanceof Error
                ? uploadError
                : new Error("Could not process the uploaded texture.");

            setNodeData({ texture: null, error: error.message });
            options.onError(file, error);
        } finally {
            setFiles([]);
            setIsUploading(false);
        }
    }, [setNodeData]);

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <FileUpload
                            maxFiles={1}
                            maxSize={5 * 1024 * 1024}
                            className="size-32"
                            value={files}
                            onValueChange={setFiles}
                            onFileReject={onFileReject}
                            onUpload={onUpload}
                            onFileValidate={(file: File) => {
                                if (!file.type.startsWith("image/")) {
                                    return "Only image files are allowed";
                                }

                                return null;
                            }}

                        >
                            <div className="relative">
                                <FileUploadDropzone className="size-32 rounded-none p-0 overflow-hidden">
                                    {texture
                                        ? <TexturePreview texture={texture} />
                                        : <div className="relative size-32">
                                            <EmptyTexture />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/35 text-center text-white">
                                                <p className="font-medium text-xs">Drag & drop texture</p>
                                                <p className="text-[10px] uppercase tracking-[0.2em]">16x16 strips</p>
                                            </div>
                                        </div>}
                                </FileUploadDropzone>
                                {texture && <Button variant="ghost" size="icon" className="absolute top-1 right-1 size-7 rounded-full bg-black/55 text-white hover:bg-black/70" onClick={clearTexture}>
                                    <HugeiconsIcon icon={X} className="size-4" />
                                </Button>}
                            </div>
                        </FileUpload>

                    </div>
                    {isUploading && <p className="text-muted-foreground text-xs">Processing texture…</p>}
                    {texture && !isUploading && <p className="text-muted-foreground text-xs">
                        {texture.name} · repeats every {texture.sourceFrames} frame{texture.sourceFrames === 1 ? "" : "s"}
                    </p>}
                    {error && <p className="text-destructive text-xs">{error}</p>}
                    <div className="flex  nodrag self-center relative isolate  w-full">

                    </div>
                </div>
                <Handle type="source" position={Position.Right} id="outputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

TextureNode.displayName = "TextureNode";