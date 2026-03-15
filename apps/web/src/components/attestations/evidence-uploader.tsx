"use client";

import { useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttestationStore } from "@/store/attestation-store";
import { cn } from "@/lib/utils";

export function EvidenceUploader() {
  const evidenceFiles = useAttestationStore((s) => s.evidenceFiles);
  const setEvidenceFiles = useAttestationStore((s) => s.setEvidenceFiles);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setEvidenceFiles([...evidenceFiles, ...acceptedFiles]);
    },
    [evidenceFiles, setEvidenceFiles],
  );

  const removeFile = useCallback(
    (index: number) => {
      setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
    },
    [evidenceFiles, setEvidenceFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const previews = useMemo(
    () => evidenceFiles.map((file) => URL.createObjectURL(file)),
    [evidenceFiles],
  );

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
          isDragActive
            ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
            : "border-gray-300 hover:border-[#1e3a5f]/50",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 text-[#1e3a5f]" />
        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragActive
              ? "Drop files here"
              : "Drag and drop images, or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, JPEG or WEBP up to 10MB each
          </p>
        </div>
      </div>

      {evidenceFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {evidenceFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="group relative aspect-square rounded-md border overflow-hidden"
            >
              {previews[index] ? (
                <img
                  src={previews[index]}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-2 py-1 text-xs text-white">
                {file.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
