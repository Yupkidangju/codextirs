/*
 * [v1.0.0] AI 캐릭터 보이스 시스템
 * 
 * 작성일: 2026-02-28
 * 변경사항: AI 난이도별 고유 음성 패턴 구현
 */

/**
 * AI 보이스 성격 설정
 * 각 난이도별 음색, 피치, 멜로디 특성 정의
 */
export const AI_VOICE_PROFILES = {
  // [Easy] 병아리 - Cheerful, encouraging voice
  "병아리": {
    name: "Cheerful",
    baseFreq: 400,        // 높은 피치 (경쾌한 느낌)
    freqRange: 200,       // 넓은 주파수 범위
    noteDuration: 0.15,   // 짧은 노트 (경쾌함)
    attackTime: 0.02,     // 빠른 어택
    releaseTime: 0.1,     // 짧은 릴리스
    vibratoRate: 8,       // 빠른 비브라토
    vibratoDepth: 15,     // 깊은 비브라토
    melodyStyle: "bouncy", // 통통튀는 멜로디
    formant: "high",      // 높은 포먼트
    description: "높은 피치의 경쾌하고 밝은 음성"
  },
  
  // [Normal] 하수인 - Competitive, confident voice
  "하수인": {
    name: "Confident",
    baseFreq: 280,        // 중간 피치
    freqRange: 150,
    noteDuration: 0.18,
    attackTime: 0.03,
    releaseTime: 0.12,
    vibratoRate: 5,
    vibratoDepth: 10,
    melodyStyle: "energetic", // 에너제틱한 멜로디
    formant: "mid",
    description: "중간 피치의 자신감 있는 음성"
  },
  
  // [Hard] 기사 - Arrogant, challenging voice
  "기사": {
    name: "Arrogant",
    baseFreq: 220,        // 낮은 피치 (위압감)
    freqRange: 120,
    noteDuration: 0.22,   // 긴 노트 (여유로움)
    attackTime: 0.04,     // 느린 어택
    releaseTime: 0.15,
    vibratoRate: 3,       // 느린 비브라토
    vibratoDepth: 8,
    melodyStyle: "aggressive", // 공격적인 멜로디
    formant: "low",
    description: "낮은 피치의 거만하고 도전적인 음성"
  },
  
  // [Expert] 마왕군주 - Cold, mechanical voice
  "마왕군주": {
    name: "Cold",
    baseFreq: 180,        // 매우 낮은 피치
    freqRange: 80,
    noteDuration: 0.25,
    attackTime: 0.01,     // 매우 빠른 어택 (기계적)
    releaseTime: 0.08,
    vibratoRate: 0,       // 비브라토 없음 (기계적)
    vibratoDepth: 0,
    melodyStyle: "precise", // 정확한 멜로디
    formant: "robotic",
    description: "낮고 차가운 기계적인 음성"
  },
  
  // [Ultimate] 데몬킹 - Dark, ominous voice
  "데몬킹": {
    name: "Dark",
    baseFreq: 150,        // 극도로 낮은 피치
    freqRange: 100,
    noteDuration: 0.3,
    attackTime: 0.05,     // 느린 어택 (무게감)
    releaseTime: 0.2,
    vibratoRate: 2,       // 매우 느린 비브라토
    vibratoDepth: 20,     // 깊은 비브라토
    melodyStyle: "ominous", // 불길한 멜로디
    formant: "demonic",
    description: "극도로 낮고 어두운 음성"
  }
};

/**
 * 보이스 상황별 멜로디 패턴
 * 각 상황에 맞는 음계 패턴 정의
 */
export const VOICE_MELODIES = {
  // 게임 시작 - 도전적인 인사
  gameStart: {
    "병아리": [523.25, 659.25, 783.99, 1046.50], // C5-E5-G5-C6 (메이저 화음 - 밝음)
    "하수인": [392.00, 493.88, 587.33, 783.99],  // G4-B4-D5-G5
    "기사": [261.63, 311.13, 392.00, 466.16],    // C4-D#4-G4-A#4 (마이너 화음 - 어두움)
    "마왕군주": [146.83, 146.83, 196.00, 196.00], // D3-D3-G3-G3 (기계적 반복)
    "데몬킹": [110.00, 87.31, 110.00, 65.41]     // A2-F2-A2-C2 (불길한 저음)
  },
  
  // 라인 클리어 - 성취감
  lineClear: {
    "병아리": [659.25, 783.99, 1046.50, 1318.51], // E5-G5-C6-E6 (상승)
    "하수인": [523.25, 659.25, 523.25, 783.99],   // C5-E5-C5-G5
    "기사": [392.00, 329.63, 261.63, 196.00],    // G5-E4-C4-G3 (하강 - 여유)
    "마왕군주": [196.00, 196.00, 196.00, 146.83], // G3-G3-G3-D3 (단조로움)
    "데몬킹": [130.81, 98.00, 130.81, 65.41]     // C3-G2-C3-C2
  },
  
  // 가비지 전송 - 도발
  garbageSend: {
    "병아리": [783.99, 659.25, 783.99, 1046.50],  // G5-E5-G5-C6 (경쾌)
    "하수인": [587.33, 587.33, 783.99, 783.99],   // D5-D5-G5-G5 (자신감)
    "기사": [311.13, 261.63, 207.65, 155.56],    // D#4-C4-A#3-D#3 (위협)
    "마왕군주": [146.83, 98.00, 146.83, 98.00],  // D3-G2-D3-G2 (기계적)
    "데몬킹": [73.42, 61.74, 73.42, 51.91]      // D2-B1-D2-G#1 (불길함)
  },
  
  // 콤보 - 흥분/긴장
  combo: {
    "병아리": [1046.50, 1318.51, 1567.98, 2093.00], // C6-E6-G6-C7 (고음)
    "하수인": [783.99, 987.77, 1174.66, 1567.98],   // G5-B5-D6-G6
    "기사": [466.16, 554.37, 659.25, 783.99],      // A#4-C#5-E5-G5
    "마왕군주": [196.00, 246.94, 293.66, 392.00],  // G3-B3-D4-G4 (상승)
    "데몬킹": [87.31, 110.00, 130.81, 174.61]     // F2-A2-C3-F3
  },
  
  // 승리 - 승리의 함성
  victory: {
    "병아리": [523.25, 659.25, 783.99, 1046.50, 1318.51], // C5-E5-G5-C6-E6
    "하수인": [392.00, 493.88, 587.33, 783.99, 987.77],   // G4-B4-D5-G5-B5
    "기사": [261.63, 329.63, 392.00, 523.25, 659.25],    // C4-E4-G4-C5-E5
    "마왕군주": [98.00, 98.00, 146.83, 196.00, 293.66],  // G2-G2-D3-G3-D4
    "데몬킹": [65.41, 65.41, 98.00, 130.81, 196.00]     // C2-C2-G2-C3-G3
  },
  
  // 패배 - 쓸쓸함
  defeat: {
    "병아리": [783.99, 659.25, 587.33, 523.25],   // G5-E5-D5-C5 (하강)
    "하수인": [587.33, 493.88, 392.00, 329.63],   // D5-B4-G4-E4
    "기사": [392.00, 311.13, 261.63, 196.00],    // G4-D#4-C4-G3
    "마왕군주": [196.00, 146.83, 98.00, 73.42],  // G3-D3-G2-D2
    "데몬킹": [110.00, 82.41, 65.41, 48.99]      // A2-E2-C2-G1
  }
};

/**
 * 텍스트 표시용 보이스 라인
 * 각 상황별 AI가 "말하는" 텍스트
 */
export const VOICE_LINES = {
  gameStart: {
    "병아리": ["잘 부탁해!", "화이팅!", "시작해 볼까?", "재밌겠다!"],
    "하수인": ["상대가 되어주지!", "내 차례다!", "준비됐나?", "간다!"],
    "기사": ["크흠, 애송이군.", "상대가 안 되겠는데?", "빨리 끝내주지.", "각오는 됐나?"],
    "마왕군주": ["분석 시작.", "최적화 완료.", "대상 포착.", "계산 중..."],
    "데몬킹": ["절망필라...", "넌 이미 졌다.", "영원한 어둠으로...", "소멸필라..."]
  },
  
  lineClear: {
    "병아리": ["좋았어!", "잘하고 있어!", "나이스!", "계속 가자!"],
    "하수인": ["괜찮은데?", "나쁘지 않아!", "이 정도쯤이야!", "간다!"],
    "기사": ["흥, 우연이군.", "그 정도쯤이야.", "실망이야.", "더 핫 보여줘."],
    "마왕군주": ["라인 제거.", "클리어 확인.", "효율 73%.", "패턴 매칭."],
    "데몬킹": ["허무필라...", "의미없는 저항...", "소용없다...", "멸망뿐이다..."]
  },
  
  garbageSend: {
    "병아리": ["받아라~", "특별 선물!", "이거야!", "놀랐지?"],
    "하수인": ["이거 어때?", "버텨봐!", "공격이다!", "빈틈 발견!"],
    "기사": ["겁먹었나?", "감당할 수 있겠나?", "묵사발 내주지!", "겁쟁이!"],
    "마왕군주": ["가비지 전송.", "공격 개시.", "방해 공작.", "쓰레기 투하."],
    "데몬킹": ["절망이 찾아온다...", "고통을 맛봐필라...", "파멸을 선사하지...", "심연으로 빠져라..."]
  },
  
  combo: {
    "병아리": ["우와! 대박!", "계속 간다!","최고야!", "멈출 수 없어!"],
    "하수인": ["분위기 좋은데!", "플로우 타는 중!", "느낌 왔어!", "간다간다!"],
    "기사": ["재미있군...", "제법인데?", "각성했나?", "진심 모드다!"],
    "마왕군주": ["연쇄 반응.", "콤보 카운트 상승.", "높은 위협 수준.", "대응 필요."],
    "데몬킹": ["반항하다니...", "순간적인 반짝임...", "결국 꺼지리라...", "울부짖어라..."]
  },
  
  victory: {
    "병아리": ["고마워! 재밌었어!", "다음에 또 하자!", "즐거웠어!", "모두 수고했어!"],
    "하수인": ["좋은 승부였다!", "인정해줘!", "내 승리다!", "수고했어!"],
    "기사": ["예상된 결과야.", "시시하군.", "내가 최강이다!", "다음엔 좀 더 핫 보여줘."],
    "마왕군주": ["미션 완료.", "승리 확정.", "최적해 도출.", "대상 제압."],
    "데몬킹": ["영원히 잠들어라...", "넌 끝났다...", "절망이 너의 것...", "모두가 사라지리라..."]
  },
  
  defeat: {
    "병아리": ["아쉽다... 다음엔 이길게!", "수고했어!", "배울 점이 많았어!", "다시 도전할게!"],
    "하수인": ["인정한다! 잘했어!", "너 강하구나!", "복수전 기다려!", "다음엔 내가 이긴다!"],
    "기사": ["불가능해...", "설마 졌다고?", "다시는 안 진다!", "기억해... 복수하겠다!"],
    "마왕군주": ["오류 발생.", "패배 확인.", "시스템 재부팅.", "재분석 필요."],
    "데몬킹": ["이건... 예외다...", "재수정하겠다...", "넌 특별하구나...", "다시 돌아오리라..."]
  }
};

/**
 * 현재 AI 보이스 설정
 */
let currentVoiceProfile = null;
let currentDifficulty = "병아리";

/**
 * Web Audio API 컨텍스트
 */
let audioContext = null;

/**
 * AudioContext 초기화
 */
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

/**
 * AI 보이스 설정
 * @param {string} difficulty - AI 난이도 이름
 */
export function setAIVoice(difficulty) {
  currentDifficulty = difficulty;
  currentVoiceProfile = AI_VOICE_PROFILES[difficulty] || AI_VOICE_PROFILES["병아리"];
  initAudioContext();
}

/**
 * 현재 설정된 AI 보이스 프로필 반환
 * @returns {Object} 보이스 프로필
 */
export function getCurrentVoiceProfile() {
  return currentVoiceProfile || AI_VOICE_PROFILES["병아리"];
}

/**
 * 특정 난이도의 보이스 라인 목록 반환
 * @param {string} difficulty - AI 난이도
 * @param {string} situation - 상황 (gameStart, lineClear, garbageSend, combo, victory, defeat)
 * @returns {string[]} 보이스 라인 배열
 */
export function getVoiceLines(difficulty, situation) {
  const lines = VOICE_LINES[situation];
  if (!lines) return ["..."];
  return lines[difficulty] || lines["병아리"];
}

/**
 * 랜덤 보이스 라인 가져오기
 * @param {string} situation - 상황
 * @returns {string} 랜덤 선택된 라인
 */
export function getRandomVoiceLine(situation) {
  const lines = getVoiceLines(currentDifficulty, situation);
  return lines[Math.floor(Math.random() * lines.length)];
}

/**
 * 포먼트 필터 생성 (음성 특성 강화)
 * @param {AudioContext} ctx - 오디오 컨텍스트
 * @param {string} formantType - 포먼트 타입 (high, mid, low, robotic, demonic)
 * @returns {BiquadFilterNode} 필터 노드
 */
function createFormantFilter(ctx, formantType) {
  const filter = ctx.createBiquadFilter();
  
  switch (formantType) {
    case "high": // 높은 음성 (병아리)
      filter.type = "bandpass";
      filter.frequency.value = 2500;
      filter.Q.value = 1.5;
      break;
    case "mid": // 중간 음성 (하수인)
      filter.type = "bandpass";
      filter.frequency.value = 1800;
      filter.Q.value = 1.2;
      break;
    case "low": // 낮은 음성 (기사)
      filter.type = "lowpass";
      filter.frequency.value = 1200;
      filter.Q.value = 0.8;
      break;
    case "robotic": // 기계적 음성 (마왕군주)
      filter.type = "bandpass";
      filter.frequency.value = 1500;
      filter.Q.value = 10; // 높은 Q = 메탈릭한 소리
      break;
    case "demonic": // 어두운 음성 (데몬킹)
      filter.type = "lowpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      break;
    default:
      filter.type = "allpass";
  }
  
  return filter;
}

/**
 * 비브라토 효과 생성
 * @param {AudioContext} ctx - 오디오 컨텍스트
 * @param {OscillatorNode} oscillator - 오실레이터
 * @param {number} rate - 비브라토 속도 (Hz)
 * @param {number} depth - 비브라토 깊이 (cents)
 */
function addVibrato(ctx, oscillator, rate, depth) {
  if (rate === 0 || depth === 0) return;
  
  const vibratoOsc = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  
  vibratoOsc.frequency.value = rate;
  vibratoGain.gain.value = depth;
  
  // 주파수 변조 연결
  vibratoOsc.connect(vibratoGain);
  vibratoGain.connect(oscillator.frequency);
  
  vibratoOsc.start();
  vibratoOsc.stop(ctx.currentTime + 2); // 2초 후 정지
}

/**
 * 음성 합성
 * @param {string} text - 표시할 텍스트 (실제 음성에는 사용되지 않음, 참조용)
 * @param {Object} personality - 보이스 성격 설정
 * @param {number[]} melody - 멜로디 주파수 배열
 * @param {number} masterVolume - 마스터 볼륨 (0-1)
 */
export function synthesizeVoice(text, personality, melody, masterVolume = 0.3) {
  const ctx = initAudioContext();
  if (!ctx) return;
  
  // AudioContext가 suspended 상태면 resume
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  
  const now = ctx.currentTime;
  const profile = personality || getCurrentVoiceProfile();
  
  // 각 노트 재생
  melody.forEach((freq, index) => {
    const noteTime = now + (index * profile.noteDuration);
    
    // 오실레이터 생성 (sawtooth = 더 음성같은 느낌)
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = createFormantFilter(ctx, profile.formant);
    
    // 오실레이터 설정
    osc.type = profile.formant === "robotic" ? "square" : "sawtooth";
    osc.frequency.value = freq;
    
    // ADSR 엔벨로프 설정
    const attack = profile.attackTime;
    const release = profile.releaseTime;
    const duration = profile.noteDuration;
    
    gainNode.gain.setValueAtTime(0, noteTime);
    gainNode.gain.linearRampToValueAtTime(masterVolume, noteTime + attack);
    gainNode.gain.setValueAtTime(masterVolume, noteTime + duration - release);
    gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);
    
    // 비브라토 추가
    addVibrato(ctx, osc, profile.vibratoRate, profile.vibratoDepth);
    
    // 연결: osc -> filter -> gain -> destination
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // 재생
    osc.start(noteTime);
    osc.stop(noteTime + duration + 0.1);
  });
  
  // 콘솔에 텍스트 출력 (디버깅용)
  console.log(`[AI Voice - ${currentDifficulty}]: "${text}"`);
}

/**
 * 보이스 라인 재생
 * @param {string} situation - 상황 (gameStart, lineClear, garbageSend, combo, victory, defeat)
 * @param {Object} options - 옵션
 * @param {number} options.volume - 볼륨 (0-1)
 * @param {string} options.customText - 커스텀 텍스트 (선택적)
 */
export function playVoiceLine(situation, options = {}) {
  const { volume = 0.3, customText } = options;
  
  // 현재 프로필 설정
  if (!currentVoiceProfile) {
    setAIVoice(currentDifficulty);
  }
  
  // 해당 상황의 멜로디 가져오기
  const melodyData = VOICE_MELODIES[situation];
  if (!melodyData) {
    console.warn(`Unknown voice situation: ${situation}`);
    return;
  }
  
  const melody = melodyData[currentDifficulty] || melodyData["병아리"];
  
  // 텍스트 가져오기
  const text = customText || getRandomVoiceLine(situation);
  
  // 음성 합성 재생
  synthesizeVoice(text, currentVoiceProfile, melody, volume);
  
  // 이벤트 발생 (UI에서 텍스트 표시용)
  window.dispatchEvent(new CustomEvent("aiVoice", {
    detail: {
      difficulty: currentDifficulty,
      situation: situation,
      text: text,
      timestamp: Date.now()
    }
  }));
}

/**
 * 연속 재생 방지용 디바운스
 */
const debounceTimers = {};

/**
 * 디바운스된 보이스 라인 재생
 * @param {string} situation - 상황
 * @param {number} delayMs - 디바운스 지연 (ms)
 * @param {Object} options - 옵션
 */
export function playVoiceLineDebounced(situation, delayMs = 500, options = {}) {
  // 이전 타이머 클리어
  if (debounceTimers[situation]) {
    clearTimeout(debounceTimers[situation]);
  }
  
  // 새 타이머 설정
  debounceTimers[situation] = setTimeout(() => {
    playVoiceLine(situation, options);
    delete debounceTimers[situation];
  }, delayMs);
}

/**
 * 보이스 시스템 초기화
 * @param {string} difficulty - 초기 AI 난이도
 */
export function initVoiceSystem(difficulty = "병아리") {
  setAIVoice(difficulty);
  console.log(`[v1.0.0] AI Voice System initialized for: ${difficulty}`);
}

/**
 * 보이스 음소거 설정
 * @param {boolean} muted - 음소거 여부
 */
let isMuted = false;
export function setVoiceMute(muted) {
  isMuted = muted;
}

/**
 * 보이스 음소거 상태 확인
 * @returns {boolean} 음소거 상태
 */
export function isVoiceMuted() {
  return isMuted;
}

/**
 * 기본 export
 */
export default {
  setAIVoice,
  getCurrentVoiceProfile,
  getVoiceLines,
  getRandomVoiceLine,
  synthesizeVoice,
  playVoiceLine,
  playVoiceLineDebounced,
  initVoiceSystem,
  setVoiceMute,
  isVoiceMuted,
  AI_VOICE_PROFILES,
  VOICE_MELODIES,
  VOICE_LINES
};