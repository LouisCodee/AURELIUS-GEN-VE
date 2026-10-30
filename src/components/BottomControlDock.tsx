import React, { useEffect } from 'react';
import {
  CaseFinishId,
  CameraPresetId,
  CASE_FINISHES,
} from '../utils/horology';
import { ChevronDown, ChevronUp, Layers, RotateCcw, Eye, Gauge } from 'lucide-react';

interface BottomControlDockProps {
  finishId: CaseFinishId;
  onSelectFinish: (id: CaseFinishId) => void;
  cameraPreset: CameraPresetId;
  onSelectCameraPreset: (preset: CameraPresetId) => void;
  explodeValue: number;
  isManualExplode: boolean;
  onChangeExplode: (val: number | null) => void;
  speedMultiplier: number;
  onChangeSpeed: (speed: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const CAMERA_PRESETS: { id: CameraPresetId; label: string }[] = [
  { id: 'scroll-sync', label: 'Scroll Sync' },
  { id: 'dial-front', label: 'Front Dial' },
  { id: 'calibre-exploded', label: 'Side Calibre' },
  { id: 'tourbillon-macro', label: 'Tourbillon' },
  { id: 'crown-profile', label: 'Crown' },
];

const SPEED_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Pause' },
  { value: 1, label: '1× Live' },
  { value: 6, label: '6× Beat' },
];

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  finishId,
  onSelectFinish,
  cameraPreset,
  onSelectCameraPreset,
  explodeValue,
  isManualExplode,
  onChangeExplode,
  speedMultiplier,
  onChangeSpeed,
  isCollapsed,
  onToggleCollapse,
}) => {
  // Support keyboard shortcut 'H' to toggle Zen / Cinema mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'h' || e.key === 'H') {
        onToggleCollapse();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onToggleCollapse]);

  const explodePercent = Math.round(explodeValue * 100);

  return (
    <aside
      aria-label="3D Horological Viewport Controls"
      style={{
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 'min(960px, 94vw)',
      }}
      className="fixed z-30 w-full pointer-events-none flex flex-col items-center"
    >
      {/* Collapse / Expand Zen Mode Toggle Tab */}
      <div className="pointer-events-auto mb-1 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium tracking-wide text-[#F4F1EA] bg-[#111216] border border-[#2A2B32] rounded-t-lg hover:border-[#C89D66]/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-[#C89D66]" />
              <span>Show 3D Controls (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-[#C89D66]" />
              <span>Hide Controls · Zen Mode (H)</span>
            </>
          )}
        </button>
      </div>

      {/* Unified Horizontal Control Dock (Solid dark surface — zero backdrop-filter over WebGL) */}
      <div
        className={`pointer-events-auto w-full bg-[#111216] border border-[#2A2B32] rounded-xl px-4 py-2.5 shadow-2xl transition-all duration-200 ${
          isCollapsed
            ? 'opacity-0 translate-y-8 pointer-events-none h-0 py-0 overflow-hidden border-0'
            : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* 1. Exploded Calibre Slider (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-1.5 lg:border-r lg:border-[#24252C] lg:pr-3">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="exploded-calibre-slider"
                className="flex items-center gap-1.5 text-[#A6A49E] font-medium whitespace-nowrap shrink-0"
              >
                <Layers className="w-3.5 h-3.5 text-[#C89D66]" />
                <span>Exploded Calibre</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono-tabular text-[#F4F1EA] text-xs">{explodePercent}%</span>
                {isManualExplode && (
                  <button
                    type="button"
                    onClick={() => onChangeExplode(null)}
                    title="Re-sync exploded view with page scroll"
                    className="text-[11px] text-[#C89D66] hover:underline flex items-center gap-0.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Auto</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="exploded-calibre-slider"
                type="range"
                min={0}
                max={100}
                value={explodePercent}
                onChange={(e) => onChangeExplode(Number(e.target.value) / 100)}
                className="horology-slider w-full"
              />
              <button
                type="button"
                onClick={() => onChangeExplode(explodePercent > 40 ? 0 : 0.95)}
                className="px-2 py-1 text-xs font-medium bg-[#1B1C22] hover:bg-[#252730] text-[#F4F1EA] border border-[#2E303A] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {explodePercent > 40 ? 'Assemble' : 'Explode'}
              </button>
            </div>
          </div>

          {/* 2. Precious Metal Finish Swatches (2.5 -> 2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-1.5 lg:border-r lg:border-[#24252C] lg:pr-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A6A49E] font-medium whitespace-nowrap shrink-0">Alloy</span>
              <span className="text-[#F4F1EA] text-[11px] truncate">
                {CASE_FINISHES.find((f) => f.id === finishId)?.shortName}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {CASE_FINISHES.map((finish) => {
                const active = finish.id === finishId;
                return (
                  <button
                    key={finish.id}
                    type="button"
                    onClick={() => onSelectFinish(finish.id)}
                    aria-label={`Select ${finish.name}`}
                    className={`group flex items-center justify-center p-1.5 rounded text-xs transition-all cursor-pointer shrink-0 ${
                      active
                        ? 'bg-[#22242C] text-[#F4F1EA] border border-[#C89D66]'
                        : 'bg-[#17181E] text-[#A6A49E] border border-transparent hover:border-[#2E303A]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shrink-0"
                      style={{ backgroundColor: finish.colorHex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Camera Angle Presets (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-1.5 lg:border-r lg:border-[#24252C] lg:pr-3">
            <span className="flex items-center gap-1 text-xs text-[#A6A49E] font-medium whitespace-nowrap shrink-0">
              <Eye className="w-3.5 h-3.5 text-[#C89D66]" />
              <span>Camera Angle</span>
            </span>
            <div className="flex items-center gap-1">
              {CAMERA_PRESETS.map((preset) => {
                const active = cameraPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectCameraPreset(preset.id)}
                    className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#C89D66] text-[#0A0A0C] font-semibold'
                        : 'bg-[#181920] text-[#A6A49E] hover:text-[#F4F1EA]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Escapement Speed Multiplier (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-1.5">
            <span className="flex items-center gap-1 text-xs text-[#A6A49E] font-medium whitespace-nowrap shrink-0">
              <Gauge className="w-3.5 h-3.5 text-[#C89D66]" />
              <span>Escapement</span>
            </span>
            <div className="flex items-center gap-1">
              {SPEED_OPTIONS.map((opt) => {
                const active = speedMultiplier === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChangeSpeed(opt.value)}
                    className={`px-1.5 py-1 text-[11px] font-mono-tabular rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#262832] text-[#C89D66] border border-[#C89D66]/60'
                        : 'bg-[#181920] text-[#A6A49E] hover:text-[#F4F1EA]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
