import React, { useState, useCallback, useEffect } from 'react';
import { Group } from '../types';

export function useGallery(g: Group, galleryNeedsApproval: boolean) {
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [callerIsAdmin, setCallerIsAdmin] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<any | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageOrigin, setImageOrigin] = useState({ x: '50%', y: '50%' });

  const fetchGallery = useCallback(async () => {
    if (!g.id || g.id === "newg") return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const tkn = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/groups/${g.id}/gallery`, {
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setGalleryItems(data.data);
        setCallerIsAdmin(data.callerIsAdmin || false);
      }
    } catch (e) { console.error(e); }
  }, [g.id]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setGalleryUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const tkn = localStorage.getItem('token');
      const uploadRes = await fetch(`${apiBase}/api/upload-group-media`, {
        method: 'POST',
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {},
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) { alert(uploadData.message || "Upload failed"); return; }
      const isVideo = file.type.startsWith('video/');
      const saveRes = await fetch(`${apiBase}/api/groups/${g.id}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(tkn ? { 'Authorization': `Bearer ${tkn}` } : {}) },
        body: JSON.stringify({ url: uploadData.imageUrl, type: isVideo ? 'video' : 'image', needsApproval: galleryNeedsApproval })
      });
      const saveData = await saveRes.json();
      if (saveData.success) {
        setGalleryItems(prev => [saveData.data, ...prev]);
      } else {
        alert(saveData.message || "Failed to save to gallery");
      }
    } catch (err) {
      alert("Upload failed");
    } {
      setGalleryUploading(false);
      e.target.value = "";
    }
  };

  const openMediaPreview = (item: any) => {
    setPreviewMedia(item);
    setImageZoom(1);
    setImageOrigin({ x: '50%', y: '50%' });
  };
  const closeMediaPreview = () => {
    setPreviewMedia(null);
    setImageZoom(1);
    setImageOrigin({ x: '50%', y: '50%' });
  };
  const zoomIn = () => {
    setImageOrigin({ x: '50%', y: '50%' });
    setImageZoom(prev => Math.min(prev + 0.25, 3));
  };
  const zoomOut = () => {
    if (imageZoom <= 1.25) {
      setImageOrigin({ x: '50%', y: '50%' });
      setImageZoom(1);
    } else {
      setImageZoom(prev => Math.max(prev - 0.25, 1));
    }
  };
  const toggleImageZoom = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (!previewMedia || previewMedia.type === 'video') return;
    if (imageZoom > 1) {
      setImageZoom(1);
      setImageOrigin({ x: '50%', y: '50%' });
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const xPct = Math.min(100, Math.max(0, (offsetX / rect.width) * 100));
    const yPct = Math.min(100, Math.max(0, (offsetY / rect.height) * 100));
    setImageOrigin({ x: `${xPct}%`, y: `${yPct}%` });
    setImageZoom(2);
  };

  return {
    galleryItems,
    setGalleryItems,
    callerIsAdmin,
    setCallerIsAdmin,
    galleryUploading,
    previewMedia,
    setPreviewMedia,
    imageZoom,
    imageOrigin,
    fetchGallery,
    handleGalleryUpload,
    openMediaPreview,
    closeMediaPreview,
    zoomIn,
    zoomOut,
    toggleImageZoom
  };
}
