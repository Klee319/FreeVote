'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Check, Move, ZoomIn, ZoomOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

interface ImageUploadWithCropProps {
  value?: string;
  onChange: (url: string) => void;
  aspectRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export function ImageUploadWithCrop({
  value,
  onChange,
  aspectRatio = 16 / 9, // デフォルトは16:9（カードサムネイル用）
  maxWidth = 800,
  maxHeight = 450,
}: ImageUploadWithCropProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setIsCropDialogOpen(true);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = async () => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = imageRef.current;
    const container = containerRef.current;

    // Set canvas size to desired output
    canvas.width = maxWidth;
    canvas.height = maxHeight;

    // Calculate the crop area
    const containerRect = container.getBoundingClientRect();
    const scale = zoom;

    // Calculate source dimensions
    const sourceWidth = containerRect.width / scale;
    const sourceHeight = containerRect.height / scale;

    // Calculate source position (considering pan)
    const sourceX = -position.x / scale;
    const sourceY = -position.y / scale;

    // Clear canvas and draw the cropped image
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image with calculated crop
    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    const scaleX = imageWidth / image.width;
    const scaleY = imageHeight / image.height;

    ctx.drawImage(
      image,
      sourceX * scaleX,
      sourceY * scaleY,
      sourceWidth * scaleX,
      sourceHeight * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Convert to blob and upload
    canvas.toBlob(async (blob) => {
      if (blob) {
        // Here you would typically upload the blob to your server
        // For now, we'll use a data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          onChange(dataUrl);
          setPreview(dataUrl);
          setIsCropDialogOpen(false);
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleRemove = () => {
    setPreview(null);
    setSelectedFile(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="space-y-4">
        {preview ? (
          <Card className="relative group p-0 overflow-hidden">
            <div className="aspect-video w-full">
              <img
                src={preview}
                alt="サムネイル"
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </Card>
        ) : (
          <Card
            className="aspect-video flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                クリックして画像をアップロード
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                推奨: 1600×900px (16:9)
              </p>
            </div>
          </Card>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>画像のトリミング</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Crop Area */}
            <div
              ref={containerRef}
              className="relative mx-auto overflow-hidden rounded-lg border-2 border-primary"
              style={{
                width: '100%',
                maxWidth: '600px',
                aspectRatio: `${aspectRatio}`,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {preview && (
                <img
                  ref={imageRef}
                  src={preview}
                  alt="Crop preview"
                  className="absolute"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transformOrigin: 'top left',
                    userSelect: 'none',
                  }}
                  draggable={false}
                />
              )}

              {/* Crop Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-2 border-white/30" />
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>
              </div>
            </div>

            {/* Zoom Control */}
            <div className="flex items-center gap-4">
              <ZoomOut className="h-5 w-5 text-muted-foreground" />
              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={0.5}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium w-12">{Math.round(zoom * 100)}%</span>
            </div>

            {/* Instructions */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Move className="h-4 w-4" />
              <span>画像をドラッグして位置を調整できます</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCropDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="button" onClick={handleCrop}>
              <Check className="h-4 w-4 mr-2" />
              トリミングを適用
            </Button>
          </DialogFooter>

          {/* Hidden canvas for cropping */}
          <canvas
            ref={canvasRef}
            className="hidden"
            width={maxWidth}
            height={maxHeight}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}