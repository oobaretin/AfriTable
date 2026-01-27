"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import Image from "next/image";

type PhotoUploadDialogProps = {
  reservationId: string;
  restaurantName: string;
  restaurantSlug?: string;
  onUploadComplete?: () => void;
};

export function PhotoUploadDialog({
  reservationId,
  restaurantName,
  restaurantSlug,
  onUploadComplete,
}: PhotoUploadDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [reviewText, setReviewText] = React.useState("");
  const [uploading, setUploading] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // Create FormData
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("reservationId", reservationId);
      formData.append("reviewText", reviewText);

      const res = await fetch("/api/user/stamps", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Upload failed");
      }

      setOpen(false);
      setFile(null);
      setPreview(null);
      setReviewText("");
      onUploadComplete?.();
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <Upload className="h-3 w-3 mr-1" />
          Upload Photo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Stamp</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="photo">Meal Photo</Label>
            <div className="mt-2">
              {preview ? (
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-200">
                  <Image src={preview} alt="Preview" fill className="object-cover" />
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-brand-bronze transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-600">Click to upload photo</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                </div>
              )}
              <Input
                ref={fileInputRef}
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="review">Review (Optional)</Label>
            <Textarea
              id="review"
              placeholder="Share your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full btn-bronze"
          >
            {uploading ? "Uploading..." : "Share Stamp"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
