/*
 * [v2.0.0/v3.2.0] 배경 효과 렌더러
 * 
 * 작성일: 2026-02-28
 * 변경사항: 
 *   - 비트 리액티브 효과 추가
 *   - 보스 오라 효과 추가
 *   - 성능 최적화
 *   - 저자극/저사양 모드 지원
 */

/**
 * 3D 네트워크 배경 효과
 */
export class BackgroundFx {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.time = 0;
    this.nodes = [];
    this.energy = 0;  // 비트/임팩트 에너지
    this.bossMode = false;  // 보스 오라 모드
    this.bossPulse = 0;  // 보스 펄스 타이머
    this.reducedMotion = false;  // [v3.2.0] 저자극/저사양 모드
    
    this.resize();
    this.initNodes();
    
    // 리사이즈 이벤트
    window.addEventListener("resize", () => this.resize());
  }

  /**
   * 노드 초기화
   */
  initNodes() {
    this.nodes = [];
    const nodeCount = this.reducedMotion ? 24 : 50;
    for (let i = 0; i < nodeCount; i++) {
      this.nodes.push({
        a: Math.random() * Math.PI * 2,
        b: Math.random() * Math.PI * 2,
        r: 100 + Math.random() * 300,
        z: Math.random() * 2 + 0.3,
        speed: 0.15 + Math.random() * 0.6,
        size: 1 + Math.random() * 2,
      });
    }
  }

  /**
   * 리사이즈
   */
  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * 에너지 설정 (비트/임팩트 반응)
   * @param {number} energy - 에너지 레벨 (0-2)
   */
  setEnergy(energy) {
    const clamped = Math.max(0, Math.min(2, energy));
    this.energy = this.reducedMotion ? clamped * 0.55 : clamped;
  }
  
  /**
   * 보스 모드 설정
   * @param {boolean} enabled - 활성화 여부
   */
  setBossMode(enabled) {
    this.bossMode = enabled;
  }

  /**
   * [v3.2.0] 저자극/저사양 모드 전환
   * @param {boolean} enabled - 활성화 여부
   */
  setReducedMotion(enabled) {
    const next = !!enabled;
    if (this.reducedMotion === next) return;
    this.reducedMotion = next;
    this.initNodes();
  }

  /**
   * 업데이트
   * @param {number} dt - 델타 시간
   */
  tick(dt) {
    this.time += dt;
    
    if (this.bossMode) {
      this.bossPulse += dt * 2;  // 2초 주기
    }
  }

  /**
   * 렌더링
   * @param {number} intensity - 추가 강도
   */
  draw(intensity = 0) {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w * 0.5;
    const cy = h * 0.5;
    
    // 클리어
    ctx.clearRect(0, 0, w, h);
    
    // 에너지 + 외부 강도 합산
    const totalIntensity = this.energy + intensity;
    
    // 중심 글로우 (에너지에 반응)
    const glowAlpha = (0.08 + totalIntensity * 0.15) * (this.reducedMotion ? 0.7 : 1);
    const glowRadius = Math.max(w, h) * (0.4 + totalIntensity * (this.reducedMotion ? 0.06 : 0.1));
    
    const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, glowRadius);
    g.addColorStop(0, `rgba(0, 200, 255, ${glowAlpha})`);
    g.addColorStop(0.3, `rgba(100, 100, 255, ${glowAlpha * 0.6})`);
    g.addColorStop(0.7, `rgba(180, 60, 255, ${glowAlpha * 0.3})`);
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    
    // 보스 오라 (마왕군주, 데몬킹)
    if (this.bossMode) {
      const pulseAlpha = 0.1 + Math.sin(this.bossPulse) * 0.05;
      const bossGlow = ctx.createRadialGradient(cx, cy, 50, cx, cy, glowRadius * 0.8);
      bossGlow.addColorStop(0, `rgba(255, 45, 85, ${pulseAlpha})`);
      bossGlow.addColorStop(0.5, `rgba(255, 0, 0, ${pulseAlpha * 0.5})`);
      bossGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bossGlow;
      ctx.fillRect(0, 0, w, h);
    }
    
    // 3D 투영된 노드들
    const pts = [];
    for (const n of this.nodes) {
      const t = this.time * n.speed;
      
      // 3D 회전
      const x3 = Math.cos(n.a + t) * n.r;
      const y3 = Math.sin(n.b + t * 0.7) * n.r * 0.5;
      const z3 = 2 + Math.sin(n.a + t * 0.5) * n.z;
      
      // 투영
      const p = 1 / z3;
      const x = cx + x3 * p;
      const y = cy + y3 * p;
      const z = p;
      const size = n.size * (1 + totalIntensity * (this.reducedMotion ? 0.25 : 0.5)) * p;
      
      pts.push({ x, y, z, size, alpha: p });
    }
    
    // 노드 그리기
    for (const p of pts) {
      ctx.globalAlpha = p.alpha * 0.8;
      ctx.fillStyle = "#64b4ff";
      ctx.beginPath();
      // 크기가 음수가 되지 않도록 보장
      const radius = Math.max(0.5, Math.abs(p.size));
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 연결선 (거리 기반)
    const connectDistance = 12000 + totalIntensity * (this.reducedMotion ? 2500 : 5000);  // 에너지에 따라 거리 증가
    const baseAlpha = (0.15 + totalIntensity * 0.2) * (this.reducedMotion ? 0.75 : 1);
    
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        
        if (d2 > connectDistance) continue;
        
        const alpha = Math.max(0, baseAlpha - d2 / (connectDistance * 3)) * a.alpha * b.alpha;
        
        // 보스 모드시 빨간색 선
        if (this.bossMode) {
          ctx.strokeStyle = `rgba(255, 60, 80, ${alpha * (1 + Math.sin(this.bossPulse) * 0.3)})`;
        } else {
          ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
        }
        
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    
    ctx.globalAlpha = 1;
  }
}
