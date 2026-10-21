import React, { useRef, useState, useEffect } from 'react';
import { DirectionPicker } from '../blockly/DirectionPicker';
import { SpriteData } from '@/_base/domain/entities';

interface SpritePropertiesPanelProps {
  displaySprite: SpriteData;
  updateSprite: (id: string, changes: Partial<SpriteData>) => void;
}

export function SpritePropertiesPanel({ displaySprite, updateSprite }: SpritePropertiesPanelProps) {
  const directionInputRef = useRef<HTMLInputElement>(null);
  const [isDirectionPickerOpen, setIsDirectionPickerOpen] = useState(false);

  const [localValues, setLocalValues] = useState({ x: '', y: '', size: '', angle: '' });
  const focusedField = useRef<string | null>(null);

  const roundedX = Math.round(displaySprite.x);
  const roundedY = Math.round(displaySprite.y);
  const roundedSize = Math.round(displaySprite.size);
  const roundedAngle = Math.round(displaySprite.angle);

  useEffect(() => {
    setLocalValues((prev) => ({
      x: focusedField.current === 'x' ? prev.x : roundedX.toString(),
      y: focusedField.current === 'y' ? prev.y : roundedY.toString(),
      size: focusedField.current === 'size' ? prev.size : roundedSize.toString(),
      angle: focusedField.current === 'angle' ? prev.angle : roundedAngle.toString(),
    }));
  }, [roundedX, roundedY, roundedSize, roundedAngle]);

  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (!displaySprite) return;
    const valStr = e.target.value;

    setLocalValues((prev) => ({ ...prev, [field]: valStr }));

    if (valStr === '-' || valStr === '.') return;

    let val = valStr === '' ? 0 : Number(valStr);
    if (!isNaN(val)) {
      if (field === 'angle') {
        let deg = val % 360;
        if (deg > 180) deg -= 360;
        if (deg <= -180) deg += 360;
        val = deg;
      }
      updateSprite(displaySprite.id, { [field]: val });
    }
  };

  return (
    <div className="properties-panel border-bottom z-1 bg-white">
      <div className="d-flex align-items-center gap-2 mb-2">
        <div className="d-flex align-items-center gap-1 flex-grow-1 overflow-hidden">
          <span className=" text-secondary text-truncate" style={{ minWidth: '35px' }}>
            Ator
          </span>
          <input
            type="text"
            className="form-control form-control-sm"
            value={displaySprite.name}
            onChange={(e) => updateSprite(displaySprite.id, { name: e.target.value })}
            style={{ minWidth: '80px' }}
          />
        </div>

        <div className="d-flex align-items-center gap-1">
          <span className=" text-secondary">x</span>
          <input
            type="number"
            className="form-control form-control-sm text-center px-1"
            style={{ width: '45px' }}
            value={localValues.x}
            onChange={(e) => handleNumChange(e, 'x')}
            onFocus={() => {
              focusedField.current = 'x';
            }}
            onBlur={() => {
              focusedField.current = null;
              setLocalValues((prev) => ({ ...prev, x: Math.round(Number(prev.x) || 0).toString() }));
            }}
          />
          <span className=" text-secondary ms-1">y</span>
          <input
            type="number"
            className="form-control form-control-sm text-center px-1"
            style={{ width: '45px' }}
            value={localValues.y}
            onChange={(e) => handleNumChange(e, 'y')}
            onFocus={() => {
              focusedField.current = 'y';
            }}
            onBlur={() => {
              focusedField.current = null;
              setLocalValues((prev) => ({ ...prev, y: Math.round(Number(prev.y) || 0).toString() }));
            }}
          />
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between gap-1 flex-wrap">
        <div className="d-flex align-items-center gap-1">
          <span className=" text-secondary">Mostrar</span>
          <div className="btn-group btn-group-sm">
            <button
              className={`btn ${displaySprite.visible ? 'btn-primary-subtle border-primary' : 'btn-outline-secondary'}`}
              onClick={() => updateSprite(displaySprite.id, { visible: true })}
              style={{ padding: '0.15rem 0.4rem' }}
            >
              <i className="bi bi-eye-fill"></i>
            </button>
            <button
              className={`btn ${!displaySprite.visible ? 'btn-primary-subtle border-primary' : 'btn-outline-secondary'}`}
              onClick={() => updateSprite(displaySprite.id, { visible: false })}
              style={{ padding: '0.15rem 0.4rem' }}
            >
              <i className="bi bi-eye-slash-fill"></i>
            </button>
          </div>
        </div>

        <div className="d-flex align-items-center gap-1">
          <span className=" text-secondary">Tamanho</span>
          <input
            type="number"
            className="form-control form-control-sm text-center px-1"
            style={{ width: '50px' }}
            value={localValues.size}
            onChange={(e) => handleNumChange(e, 'size')}
            onFocus={() => {
              focusedField.current = 'size';
            }}
            onBlur={() => {
              focusedField.current = null;
              setLocalValues((prev) => ({ ...prev, size: Math.round(Number(prev.size) || 0).toString() }));
            }}
          />
        </div>

        <div className="d-flex align-items-center gap-1 pe-1 position-relative">
          <span className=" text-secondary">Direção</span>
          <input
            ref={directionInputRef}
            type="number"
            className="form-control form-control-sm text-center px-1"
            style={{ width: '50px', cursor: 'text' }}
            value={localValues.angle}
            onChange={(e) => handleNumChange(e, 'angle')}
            onFocus={() => {
              focusedField.current = 'angle';
              setIsDirectionPickerOpen(true);
            }}
            onBlur={() => {
              focusedField.current = null;
              setLocalValues((prev) => ({ ...prev, angle: Math.round(Number(prev.angle) || 0).toString() }));
            }}
          />

          {isDirectionPickerOpen && (
            <DirectionPicker
              angle={displaySprite.angle}
              rotationStyle={displaySprite.rotationStyle || 'all around'}
              onSelectAngle={(newAngle) => updateSprite(displaySprite.id, { angle: newAngle })}
              onSelectRotationStyle={(newStyle) => updateSprite(displaySprite.id, { rotationStyle: newStyle })}
              onClose={() => setIsDirectionPickerOpen(false)}
              targetElementRef={directionInputRef}
            />
          )}
        </div>
      </div>
    </div>
  );
}
