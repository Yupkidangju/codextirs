/*
 * [v3.18.5] 공용 오버레이 뷰 렌더러
 *
 * 변경사항:
 *   - 브리핑/설정/결과 오버레이의 표시 토글을 공용 함수로 분리했다.
 *   - 브리핑 단계 렌더링과 결과 오버레이 내용 채우기를 main.js에서 분리했다.
 *   - 최근 전투 카드 렌더링도 공용 오버레이/카드 계층으로 옮겼다.
 */

export function setOverlayVisibility(overlay, bodyClass, visible) {
  if (!overlay) return;
  overlay.classList.toggle("visible", visible);
  overlay.setAttribute("aria-hidden", visible ? "false" : "true");
  if (bodyClass) {
    document.body.classList.toggle(bodyClass, visible);
  }
}

export function renderBriefingStepView({
  step,
  stepIndex,
  totalSteps,
  elements,
}) {
  if (!step) return;
  const {
    briefingStepValue,
    briefingTitle,
    briefingText,
    briefingHighlights,
    briefingDots,
    briefingNextBtn,
  } = elements;

  if (briefingStepValue) {
    briefingStepValue.textContent = `${stepIndex + 1} / ${totalSteps}`;
  }
  if (briefingTitle) {
    briefingTitle.textContent = step.title;
  }
  if (briefingText) {
    briefingText.textContent = step.text;
  }
  if (briefingHighlights) {
    briefingHighlights.innerHTML = (step.highlights || [])
      .map((item) => `<div class="briefing-chip">${item}</div>`)
      .join("");
  }
  if (briefingDots) {
    briefingDots.innerHTML = Array.from({ length: totalSteps }, (_, index) => (
      `<span class="briefing-dot ${index === stepIndex ? "active" : ""}"></span>`
    )).join("");
  }
  if (briefingNextBtn) {
    briefingNextBtn.textContent = stepIndex === totalSteps - 1 ? "START NOW" : "NEXT";
  }
}

export function renderResultOverlayView(summary, elements) {
  const {
    resultEyebrow,
    resultTitle,
    resultSummary,
    resultFeedbackList,
    resultScore,
    resultLines,
    resultMaxCombo,
    resultTSpins,
    resultTetrises,
    resultPerfects,
    resultOverlay,
  } = elements;

  if (resultOverlay) {
    resultOverlay.classList.remove("victory", "defeat");
    resultOverlay.classList.add(summary.winner === "player" ? "victory" : "defeat");
  }
  if (resultEyebrow) {
    resultEyebrow.textContent = summary.winner === "player" ? "BATTLE WON" : "BATTLE LOST";
  }
  if (resultTitle) {
    resultTitle.textContent = summary.winner === "player" ? "VICTORY" : "DEFEAT";
  }
  if (resultSummary) {
    const bossSuffix = summary.bossHp !== null ? ` · 보스 HP ${summary.bossHp}%` : "";
    resultSummary.textContent = `${summary.difficulty} 전투 종료 · ${summary.duration.toFixed(1)}초${bossSuffix}`;
  }
  if (resultFeedbackList) {
    resultFeedbackList.innerHTML = (summary.feedback || [])
      .map((item) => `
        <div class="result-feedback-card">
          <strong>${item.title}</strong>
          <span>${item.text}</span>
        </div>
      `)
      .join("");
  }
  if (resultScore) {
    resultScore.textContent = Number(summary.score).toLocaleString();
  }
  if (resultLines) {
    resultLines.textContent = String(summary.lines);
  }
  if (resultMaxCombo) {
    resultMaxCombo.textContent = `x${summary.maxCombo}`;
  }
  if (resultTSpins) {
    resultTSpins.textContent = String(summary.tSpins);
  }
  if (resultTetrises) {
    resultTetrises.textContent = String(summary.tetrises);
  }
  if (resultPerfects) {
    resultPerfects.textContent = String(summary.perfects);
  }
}

export function syncRecentBattleCardView({
  summary,
  hasStarted,
  startScreen,
  elements,
}) {
  const { recentBattleCard, recentBattleResult, recentBattleMeta } = elements;
  if (!recentBattleCard || !recentBattleResult || !recentBattleMeta) return;

  const shouldShow = !!summary && !hasStarted && !!startScreen && !startScreen.classList.contains("hidden");
  recentBattleCard.classList.toggle("hidden", !shouldShow);
  if (!shouldShow) return;

  recentBattleResult.textContent = summary.winner === "player"
    ? `VICTORY · ${summary.difficulty}`
    : `DEFEAT · ${summary.difficulty}`;
  recentBattleMeta.textContent = `점수 ${Number(summary.score || 0).toLocaleString()} · 최대 콤보 x${summary.maxCombo || 0} · ${(summary.duration || 0).toFixed(1)}초`;
}
