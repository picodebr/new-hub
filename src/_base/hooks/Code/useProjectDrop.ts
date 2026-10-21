'use client';

import { useState, useCallback } from 'react';
import { useUI } from '../../context/UIContext';

export function useProjectDrop() {
  const [isDragging, setIsDragging] = useState(false);
  const ui = useUI();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the main window
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file && (file.name.endsWith('.json') || file.name.endsWith('.piboard'))) {
        console.log(`[useProjectDrop] O projeto foi soltado para ser aberto: ${file.name}`);

        const fakeEvent = {
          target: {
            files: [file],
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        const contextAdapter = {
          isUploadMode: ui.isUploadMode,
          setIsUploadMode: ui.setIsUploadMode,
          uploadModeBlocks: ui.uploadModeBlocks,
          uploadCode: '',
          setUploadModeBlocks: ui.setUploadModeBlocks,
          setUploadCode: ui.setUploadCode,
          setActiveExtensions: ui.setActiveExtensions,
          backdrops: [],
          activeBackdropId: '',
          activeSpriteId: '',
          activeExtensions: ui.activeExtensions,
          activeStageMLModel: null,
          setActiveStageMLModel: () => {},
          activeUploadMLModel: null,
          setActiveUploadMLModel: () => {},
        };

        //@ts-ignore
        import('../services/SerializationService').then(({ SerializationService }) => {
          SerializationService.handleFileSelect(fakeEvent, contextAdapter as unknown as Parameters<typeof SerializationService.handleFileSelect>[1]);
        });
      }
    },
    [ui],
  );

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
