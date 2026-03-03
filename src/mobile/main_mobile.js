/*
 * [v3.18.1] 모바일 전용 엔트리 포인트
 *
 * 변경사항:
 *   - 별도 mobile.html 페이지에서 모바일 셸 클래스를 강제 적용
 *   - [v3.18.1] 공용 메인 로직이 요구하는 HUD 식별자를 모바일 DOM으로 분리한 뒤 그대로 재사용
 *   - 공용 게임 부트스트랩(src/main.js)은 그대로 재사용
 */

document.documentElement.classList.add("mobile-shell");
document.body.classList.add("mobile-shell", "mobile-layout");
document.body.dataset.shell = "mobile";

await import("../main.js");
