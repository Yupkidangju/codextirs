export function detectMobile() {
  return window.matchMedia("(max-width: 960px)").matches;
}

export function applyLayout() {
  const stage = document.getElementById("stage");
  const mobileControls = document.getElementById("mobileControls");

  if (detectMobile()) {
    stage.classList.remove("desktop");
    stage.classList.add("mobile");
    mobileControls.classList.remove("hidden");
  } else {
    stage.classList.add("desktop");
    stage.classList.remove("mobile");
    mobileControls.classList.add("hidden");
  }
}
