/*
 * [v3.18.4] 공용 피드백 뷰 렌더러
 *
 * 변경사항:
 *   - 전투 콜아웃 표시 로직을 main.js에서 분리했다.
 *   - DEV PANEL 및 터치 디버그 패널 렌더링을 공용 피드백 계층으로 이동했다.
 *   - 셸별 DOM은 유지하면서, 표시 상태 계산과 시각 반영만 공용화한다.
 */

export function createBattleCalloutController({ root, titleEl, subtitleEl, audio }) {
  let timer = null;
  let lastSignature = "";
  let lastAt = 0;

  return {
    show(title, subtitle = "", tone = "", voiceTag = "") {
      if (!root || !titleEl || !subtitleEl) return;

      const now = performance.now();
      const signature = `${title}::${subtitle}::${tone}`;
      if (signature === lastSignature && (now - lastAt) < 420) {
        return;
      }
      lastSignature = signature;
      lastAt = now;

      if (tone === "gold" || tone === "warn") {
        audio?.duckBgm?.(tone === "gold" ? 0.74 : 0.8, 0.3);
      }
      if (voiceTag) {
        audio?.playVoiceCue?.(voiceTag, tone === "warn" ? 0.9 : 1);
      }

      titleEl.textContent = title;
      subtitleEl.textContent = subtitle;
      subtitleEl.style.display = subtitle ? "block" : "none";
      root.classList.remove("warn", "gold", "visible");
      if (tone) {
        root.classList.add(tone);
      }

      void root.offsetWidth;
      root.classList.add("visible");

      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        root.classList.remove("visible", "warn", "gold");
      }, 1300);
    },
    reset() {
      if (!root) return;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      root.classList.remove("visible", "warn", "gold");
      lastSignature = "";
      lastAt = 0;
    },
  };
}

export function syncTouchDebugVisibility(panel, visible) {
  if (!panel) return;
  panel.classList.toggle("hidden", !visible);
}

export function renderDevPanelView({
  touchMetrics,
  sessionDiagnostics,
  audioSnapshot,
  gameSnapshot,
  elements,
}) {
  const {
    touchDebugAction,
    touchDebugMeta,
    devFpsMeta,
    devAudioMeta,
    devGameMeta,
    devErrorMeta,
  } = elements;

  if (touchDebugAction) {
    touchDebugAction.textContent = touchMetrics.lastAction;
  }
  if (touchDebugMeta) {
    touchDebugMeta.textContent = `press:${touchMetrics.presses} · repeat:${touchMetrics.repeats} · last:${touchMetrics.lastDeltaMs}ms · shift:${sessionDiagnostics.neonShiftActivations} · resonance:${sessionDiagnostics.resonanceTriggers} · counter:${sessionDiagnostics.layerCounters}`;
  }
  if (devFpsMeta) {
    devFpsMeta.textContent = `fps:${Math.round(sessionDiagnostics.currentFps || 0)} · avg:${Math.round(sessionDiagnostics.avgFps || 0)} · min:${Math.round(sessionDiagnostics.minFps || 0)}`;
  }
  if (devAudioMeta) {
    devAudioMeta.textContent = `audio:${audioSnapshot.ctxState || "idle"} · bgm:${audioSnapshot.bgmState || "normal"} · drive:${audioSnapshot.driveLabel || "-"} · track:${audioSnapshot.trackName || "-"}`;
  }
  if (devGameMeta) {
    devGameMeta.textContent = `boss:${gameSnapshot.bossPhase} · incoming:${gameSnapshot.incomingCount} · shift:${gameSnapshot.shiftActive ? "on" : "off"} · residue:${gameSnapshot.residueCount} · counter:${gameSnapshot.counterLabel}`;
  }
  if (devErrorMeta) {
    devErrorMeta.textContent = `error:${sessionDiagnostics.lastError || "none"}`;
  }
}
