export class BattleQueue {
  constructor() {
    this.pending = [];
  }

  sendAttack(from, to, attackEvent, nowMs) {
    if (!attackEvent) return;
    // [v2.0.3] delayMs 기본값 0 적용
    this.pending.push({ from, to, attackEvent, at: nowMs + (attackEvent.delayMs || 0) });
  }

  applyIncomingAttacks(target, nowMs, fnApply) {
    const next = [];
    for (const p of this.pending) {
      if (p.to !== target.id || p.at > nowMs) {
        next.push(p);
        continue;
      }
      fnApply(target, p.attackEvent);
    }
    this.pending = next;
  }

  getPendingFor(targetId, nowMs) {
    return this.pending
      .filter((entry) => entry.to === targetId && entry.at >= nowMs)
      .sort((a, b) => a.at - b.at)
      .map((entry) => ({
        ...entry,
        remainingMs: Math.max(0, entry.at - nowMs),
      }));
  }
}
