// Turbo Granny: shop mascot (Dandadan), animated lucky-cat ball
(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const INK = "#2b1b3d";
  const SIDES = [-1, 1];

  BF.drawTurboGranny = function drawTurboGranny(cv, t) {
    const c = cv.getContext("2d");
    const k = cv.width / 100;
    c.clearRect(0, 0, cv.width, cv.height);
    const talking = performance.now() < (BF.grannyTalkUntil || 0);
    const bob = Math.sin(t * 2.2) * 1.4 + (talking ? Math.sin(t * 22) * 0.7 : 0);

    c.save();
    c.scale(k, k);
    c.lineJoin = c.lineCap = "round";
    c.strokeStyle = INK;

    c.fillStyle = "rgba(43,27,61,0.22)";
    c.beginPath(); c.ellipse(50, 95, 27, 4.5, 0, 0, Math.PI * 2); c.fill();
    c.translate(0, bob);

    // speed streaks while she shouts
    if (talking) {
      c.lineWidth = 2.5; c.strokeStyle = "rgba(43,27,61,0.45)";
      for (const [y, l] of [[44, 12], [58, 16], [72, 10]]) {
        c.beginPath(); c.moveTo(4, y); c.lineTo(4 + l, y); c.stroke();
      }
      c.strokeStyle = INK;
    }

    // ears
    for (const s of SIDES) {
      const X = (x) => (s < 0 ? x : 100 - x);
      c.fillStyle = "#fff"; c.lineWidth = 3;
      c.beginPath(); c.moveTo(X(24), 36); c.lineTo(X(25), 5); c.lineTo(X(45), 22); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "#e8472b"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(X(28), 30); c.lineTo(X(28.5), 13); c.lineTo(X(38), 23); c.closePath(); c.fill(); c.stroke();
    }

    // body
    c.fillStyle = "#fff"; c.lineWidth = 3.5;
    c.beginPath(); c.arc(50, 58, 36, 0, Math.PI * 2); c.fill(); c.stroke();

    // forehead patch
    c.fillStyle = "#d92b2b"; c.lineWidth = 2.5;
    c.beginPath(); c.ellipse(50, 29, 7, 5.5, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(47.5, 27.5, 1.3, 0, Math.PI * 2); c.fill();

    // cheeks
    c.fillStyle = "#ffb3b8";
    for (const s of SIDES) { c.beginPath(); c.ellipse(50 + s * 20, 66, 6, 3.5, 0, 0, Math.PI * 2); c.fill(); }

    // brows (furrowed glare)
    c.lineWidth = 3.8;
    for (const s of SIDES) { c.beginPath(); c.moveTo(50 + s * 18, 43.5); c.lineTo(50 + s * 4, 49); c.stroke(); }

    // eyes: almond, gold iris, slit pupil, upper lashes
    const blink = t % 3.4 < 0.12;
    for (const s of SIDES) {
      const ex = 50 + s * 11;
      c.save();
      c.beginPath();
      c.moveTo(ex - 7, 54); c.quadraticCurveTo(ex, 45.5, ex + 7, 54); c.quadraticCurveTo(ex, 60, ex - 7, 54);
      c.closePath();
      if (blink) {
        c.restore();
        c.lineWidth = 3;
        c.beginPath(); c.moveTo(ex - 7, 54); c.quadraticCurveTo(ex, 58, ex + 7, 54); c.stroke();
        continue;
      }
      c.fillStyle = "#fff"; c.fill();
      c.clip();
      c.fillStyle = "#f5b81c"; c.beginPath(); c.arc(ex, 53.5, 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = INK; c.beginPath(); c.ellipse(ex, 53.5, 1.3, 3.4, 0, 0, Math.PI * 2); c.fill();
      c.restore();
      c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(ex - 7, 54); c.quadraticCurveTo(ex, 45.5, ex + 7, 54); c.quadraticCurveTo(ex, 60, ex - 7, 54); c.stroke();
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(ex - s * 7, 54); c.lineTo(ex - s * 10, 51);
      c.moveTo(ex - s * 5, 50.5); c.lineTo(ex - s * 7.5, 47.5);
      c.stroke();
    }

    // nose + mouth
    c.fillStyle = "#ff6b81"; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(47.6, 60); c.lineTo(52.4, 60); c.lineTo(50, 63.2); c.closePath(); c.fill(); c.stroke();
    if (talking) {
      const open = 2 + Math.abs(Math.sin(t * 18)) * 3.5;
      c.fillStyle = "#7a1f2b"; c.lineWidth = 2;
      c.beginPath(); c.ellipse(50, 68.5, 4.2, open, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    } else {
      c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(42, 66); c.quadraticCurveTo(46, 70, 50, 65); c.quadraticCurveTo(54, 70, 58, 66); c.stroke();
    }

    // whiskers
    c.lineWidth = 1.8;
    for (const s of SIDES) {
      c.beginPath();
      c.moveTo(50 + s * 26, 60); c.lineTo(50 + s * 40, 57);
      c.moveTo(50 + s * 26, 64); c.lineTo(50 + s * 40, 66);
      c.moveTo(50 + s * 25, 68); c.lineTo(50 + s * 38, 74);
      c.stroke();
    }

    // red collar
    c.beginPath(); c.arc(50, 58, 36, Math.PI * 0.2, Math.PI * 0.8);
    c.lineWidth = 9.5; c.strokeStyle = INK; c.stroke();
    c.lineWidth = 5.5; c.strokeStyle = "#e0262c"; c.stroke();
    c.strokeStyle = INK;

    // green scalloped bib
    c.fillStyle = "#2fbf71"; c.lineWidth = 2;
    for (const x of [36.5, 43.2, 50, 56.8, 63.5]) {
      const y = 58 + Math.sqrt(36 * 36 - (x - 50) * (x - 50)) - 2.5;
      c.beginPath(); c.arc(x, y, 3.8, 0, Math.PI); c.closePath(); c.fill(); c.stroke();
    }

    // jingle bell
    c.save();
    c.translate(50, 89);
    c.rotate(Math.sin(t * 3) * 0.25);
    c.fillStyle = "#ffc93c"; c.lineWidth = 2;
    c.beginPath(); c.arc(0, 4.5, 4.6, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-3.6, 5.2); c.lineTo(3.6, 5.2); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(0, 7.4, 1, 0, Math.PI * 2); c.fill();
    c.restore();

    // koban medallion (千万 ryo)
    c.save();
    c.translate(70, 83);
    c.rotate(Math.sin(t * 3 + 1) * 0.3);
    c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 5); c.stroke();
    c.fillStyle = "#ffc93c"; c.lineWidth = 2.2;
    c.beginPath(); c.ellipse(0, 12.5, 5.6, 7.6, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = INK; c.font = "bold 5.6px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("千", 0, 10); c.fillText("万", 0, 15.5);
    c.restore();

    c.restore();
  };
})();
