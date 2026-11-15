(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { WORLD_SIZE, COLORS, FONT, easeOut } = BF;
  const rt = () => BF._rt;

  function triggerGokuApeTransform(b) {
    if (!b || !b.alive || b.apeMode) return;
    b.apeMode = true;
    b.ultTimer = Math.max(b.ultTimer, 9.0);
    b.radius = Math.round(b.baseRadius * 1.48);
    b.apeErraticTimer = 0;
    b.apeRushTimer = 0;
    b.apeRushHitCooldown = 0;
    if (b.skills && b.skills[0]) {
      b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.15);
    }
    rt().addEffect(b, "shield", b.ultTimer, { reduction: 0.35 });
    rt().entities.push(rt().spawnBanner("GREAT APE: OOZARU!", "#b45309"));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#f59e0b", 155, 0.52));
    rt().spawnDamageText(b.x, b.y - b.radius - 16, 0, "#ef4444", true, "OOZARU RAMPAGE!");
    rt().sound.playCritHit();
    rt().shakeTime = Math.max(rt().shakeTime, 0.4);
    rt().shakeIntensity = Math.max(rt().shakeIntensity, 9);
  }

  function triggerNarutoKyuubiTransform(b) {
    if (!b || !b.alive || b.kyuubiMode) return;
    b.kyuubiMode = true;
    b.radius = Math.round(b.baseRadius * 1.08);
    b.baseSpeed = Math.round(b.baseSpeed * 1.24);
    if (b.skills && b.skills[0]) {
      b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.15);
    }
    const isBoneSkin = b.skin === "naruto_six_tails_bone";
    rt().entities.push(rt().spawnBanner(isBoneSkin ? "SIX-TAILS SKELETAL KYUUBI!" : "FOUR-TAILS KYUUBI CLOAK!", "#dc2626"));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#ef4444", 160, 0.52));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#140407", 115, 0.38));
    rt().spawnSparks(b.x, b.y, "#ef4444", "#140407");
    rt().spawnDamageText(b.x, b.y - b.radius - 16, 0, "#ef4444", true, isBoneSkin ? "SIX-TAILS BONE CLOAK!" : "NINE-TAILS AWAKENED!");
    rt().sound.playCritHit();
    rt().shakeTime = Math.max(rt().shakeTime, 0.42);
    rt().shakeIntensity = Math.max(rt().shakeIntensity, 10);
  }

  function triggerSukunaHeianTransform(b) {
    if (!b || !b.alive || b.heianEraMode) return;
    b.heianEraMode = true;
    b.ultCharge = 0;
    b.ultTimer = 10.0;
    b.domainUsedInUlt = true;
    b.radius = Math.round(b.baseRadius * 1.1);
    b.baseSpeed = Math.round(b.baseSpeed * 1.15);
    const dr = Array.isArray(b.damageRange) ? b.damageRange : [10, 15];
    b.damageRange = [dr[0] + 3, dr[1] + 3];
    b.hp = Math.min(b.maxHp, b.hp + 60);
    if (b.skills && b.skills[0]) {
      b.skills[0]._cd = 0;
    }
    rt().addEffect(b, "haste", 10.0, { factor: 1.24 });
    rt().entities.push(rt().spawnBanner("TRUE FORM: HEIAN ERA!", "#dc2626"));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#dc2626", 190, 0.58));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#fef08a", 140, 0.44));
    rt().spawnSparks(b.x, b.y, "#dc2626", "#fef08a");
    rt().spawnDamageText(b.x, b.y - b.radius - 16, 0, "#ef4444", true, "HEIAN ERA (+60 HP)!");
    rt().sound.playCritHit();
    rt().shakeTime = Math.max(rt().shakeTime, 0.52);
    rt().shakeIntensity = Math.max(rt().shakeIntensity, 13);
    if (BF.spawnIncompleteShrineCinematic) {
      const g = rt().makeGameProxy();
      g.entities.push(BF.spawnIncompleteShrineCinematic(b, g));
    }
  }

  function triggerSasukeCurseMarkTransform(b) {
    if (!b || !b.alive || b.curseMarkMode) return;
    b.curseMarkMode = true;
    b.radius = Math.round(b.baseRadius * 1.07);
    b.baseSpeed = Math.round(b.baseSpeed * 1.2);
    const dr = Array.isArray(b.damageRange) ? b.damageRange : [6, 9];
    b.damageRange = [dr[0] + 3, dr[1] + 4];
    b.hp = Math.min(b.maxHp, b.hp + 45);
    if (b.skills && b.skills[0]) {
      b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.15);
    }
    rt().entities.push(rt().spawnBanner("CURSE MARK STAGE 2!", "#a855f7"));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#a855f7", 165, 0.52));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#09090b", 120, 0.38));
    rt().spawnSparks(b.x, b.y, "#a855f7", "#09090b");
    rt().spawnDamageText(b.x, b.y - b.radius - 16, 0, "#c084fc", true, "CURSED FORM (+45 HP)!");
    rt().sound.playCritHit();
    rt().shakeTime = Math.max(rt().shakeTime, 0.42);
    rt().shakeIntensity = Math.max(rt().shakeIntensity, 10);
  }

  function triggerSukunaHeianTransform(b) {
    if (!b || !b.alive || b.heianEraMode) return;
    b.heianEraMode = true;
    b.ultCharge = 0;
    b.ultTimer = 10.0;
    b.domainUsedInUlt = true;
    b.radius = Math.round(b.baseRadius * 1.1);
    b.baseSpeed = Math.round(b.baseSpeed * 1.15);
    const dr = Array.isArray(b.damageRange) ? b.damageRange : [10, 15];
    b.damageRange = [dr[0] + 3, dr[1] + 3];
    b.hp = Math.min(b.maxHp, b.hp + 60);
    if (b.skills && b.skills[0]) {
      b.skills[0]._cd = 0;
    }
    rt().addEffect(b, "haste", 10.0, { factor: 1.24 });
    rt().entities.push(rt().spawnBanner("TRUE FORM: HEIAN ERA!", "#dc2626"));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#dc2626", 190, 0.58));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#fef08a", 140, 0.44));
    rt().spawnSparks(b.x, b.y, "#dc2626", "#fef08a");
    rt().spawnDamageText(b.x, b.y - b.radius - 16, 0, "#ef4444", true, "HEIAN ERA (+60 HP)!");
    rt().sound.playCritHit();
    rt().shakeTime = Math.max(rt().shakeTime, 0.52);
    rt().shakeIntensity = Math.max(rt().shakeIntensity, 13);
    if (BF.spawnIncompleteShrineCinematic) {
      const g = rt().makeGameProxy();
      g.entities.push(BF.spawnIncompleteShrineCinematic(b, g));
    }
  }

  function triggerSasukeSusanooArmorTransform(b) {
    if (!b || !b.alive || b.susanooArmorMode) return;
    b.susanooArmorMode = true;
    b.radius = Math.round(b.baseRadius * 1.1);
    b.baseSpeed = Math.round(b.baseSpeed * 1.14);
    const dr = Array.isArray(b.damageRange) ? b.damageRange : [6, 9];
    b.damageRange = [dr[0] + 2, dr[1] + 2];
    b.hp = Math.min(b.maxHp, b.hp + 30);
    rt().addEffect(b, "shield", 99, { reduction: 0.15 });
    if (b.skills && b.skills[0]) b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.15);
    if (b.skills && b.skills[1]) b.skills[1]._cd = Math.min(b.skills[1]._cd, 0.25);
    rt().entities.push(rt().spawnBanner("SUSANOO ARMOR: RINNEGAN!", "#a855f7"));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#a855f7", 175, 0.55));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#38bdf8", 130, 0.42));
    rt().spawnSparks(b.x, b.y, "#c084fc", "#38bdf8");
    rt().spawnDamageText(b.x, b.y - b.radius - 16, 0, "#c084fc", true, "SUSANOO ARMORED (+30 HP)!");
    rt().sound.playCritHit();
    rt().shakeTime = Math.max(rt().shakeTime, 0.46);
    rt().shakeIntensity = Math.max(rt().shakeIntensity, 12);
  }

  function triggerIchigoInnerDemonTransform(b) {
    if (!b || !b.alive || b.innerDemonMode || b.vastoLordeMode) return;
    b.innerDemonMode = true;
    b.radius = Math.round(b.baseRadius * 1.05);
    b.baseSpeed = Math.round(b.baseSpeed * 1.22);
    if (b.skills && b.skills[0]) {
      b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.15);
    }
    rt().entities.push(rt().spawnBanner("INNER HOLLOW TAKEOVER!", "#dc2626"));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#ef4444", 150, 0.48));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#f8fafc", 110, 0.35));
    rt().spawnSparks(b.x, b.y, "#ef4444", "#f8fafc");
    rt().spawnDamageText(b.x, b.y - b.radius - 16, 0, "#ef4444", true, "INNER DEMON AWAKENED!");
    rt().sound.playCritHit();
    rt().shakeTime = Math.max(rt().shakeTime, 0.4);
    rt().shakeIntensity = Math.max(rt().shakeIntensity, 9);
  }

  function triggerIchigoVastoTransform(b) {
    if (!b || !b.alive || b.vastoLordeMode) return;
    b.vastoLordeMode = true;
    b.radius = Math.round(b.baseRadius * 1.08);
    b.baseSpeed = Math.round(b.baseSpeed * 1.26);
    rt().addEffect(b, "shield", 99, { reduction: 0.25 });
    if (b.skills && b.skills[0]) {
      b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.15);
    }
    const isHalfVasto = b.skin === "ichigo_vasto_half_mask" || (Array.isArray(b.skins) && b.skins.includes("ichigo_vasto_half_mask"));
    rt().entities.push(rt().spawnBanner(isHalfVasto ? "AWAKENED VASTO LORDE!" : "FULL HOLLOW: VASTO LORDE!", "#dc2626"));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#ef4444", 160, 0.52));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#090205", 118, 0.38));
    rt().spawnSparks(b.x, b.y, "#ef4444", "#090205");
    rt().spawnDamageText(b.x, b.y - b.radius - 16, 0, "#ef4444", true, "VASTO LORDE AWAKENED!");
    rt().sound.playCritHit();
    rt().shakeTime = Math.max(rt().shakeTime, 0.42);
    rt().shakeIntensity = Math.max(rt().shakeIntensity, 10);
  }

  function triggerSukunaHeianTransform(b) {
    if (!b || !b.alive || b.heianEraMode) return;
    b.heianEraMode = true;
    b.ultCharge = 0;
    b.ultTimer = 10.0;
    b.domainUsedInUlt = true;
    b.radius = Math.round(b.baseRadius * 1.1);
    b.baseSpeed = Math.round(b.baseSpeed * 1.15);
    const dr = Array.isArray(b.damageRange) ? b.damageRange : [10, 15];
    b.damageRange = [dr[0] + 3, dr[1] + 3];
    b.hp = Math.min(b.maxHp, b.hp + 60);
    if (b.skills && b.skills[0]) {
      b.skills[0]._cd = 0;
    }
    rt().addEffect(b, "haste", 10.0, { factor: 1.24 });
    rt().entities.push(rt().spawnBanner("TRUE FORM: HEIAN ERA!", "#dc2626"));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#dc2626", 190, 0.58));
    rt().entities.push(rt().spawnShockRing(b.x, b.y, "#fef08a", 140, 0.44));
    rt().spawnSparks(b.x, b.y, "#dc2626", "#fef08a");
    rt().spawnDamageText(b.x, b.y - b.radius - 16, 0, "#ef4444", true, "HEIAN ERA (+60 HP)!");
    rt().sound.playCritHit();
    rt().shakeTime = Math.max(rt().shakeTime, 0.52);
    rt().shakeIntensity = Math.max(rt().shakeIntensity, 13);
    if (BF.spawnIncompleteShrineCinematic) {
      const g = rt().makeGameProxy();
      g.entities.push(BF.spawnIncompleteShrineCinematic(b, g));
    }
  }

  function activateUltimate(ball) {
    if (!ball.alive) return;
    ball.ultCharge = 0;
    rt().sound.playCritHit();
    rt().sound.playUlt(ball.ult);
    rt().spawnCritBurst(ball.x, ball.y);
    const fx = {
      gear_4: ["GEAR 4!", COLORS.red],
      kaioken: ["KAIOKEN!", COLORS.orange],
      rasenshuriken: ball.kyuubiMode ? ["BIJUUDAMA!", "#dc2626"] : ["RASENSHURIKEN!", COLORS.blue],
      hollow_mask: ball.vastoLordeMode
        ? ["GRAN REY CERO!", "#dc2626"]
        : (ball.evolved ? ["HOLLOW MASK!", COLORS.red] : ["BANKAI: TENSA ZANGETSU!", "#dc2626"]),
      time_stop: ["ZA WARUDO!", COLORS.gold],
      star_time_stop: ["STAR PLATINUM: THE WORLD!", "#9b59b6"],
      berserker_armor: ["BERSERKER ARMOR!", COLORS.red],
      hollow_purple: ["HOLLOW PURPLE!", "#b84dff"],
      fuga: ball.heianEraMode
        ? ["WORLD SLASH & FUGA!", "#dc2626"]
        : ball.evolved
        ? ["SUMMON: MAHORAGA!", "#facc15"]
        : ["OPEN: FUGA!", "#f97316"],
      godspeed: ["GODSPEED: KANMURU!", "#38bdf8"],
      arise: ["ARISE: SHADOW ARMY!", "#a855f7"],
      hero_of_hell: ["HERO OF HELL!", "#ea580c"],
      cosmic_fear: ball._isCosmicGarou
        ? ["GAMMA RAY BURST!", "#c084fc"]
        : ["MONSTER CALAMITY!", "#ef4444"],
      adult_gon: ["RESTRICTION & PLEDGE!", "#09090b"],
      kirin: ball.susanooArmorMode ? ["INDRA'S ARROW!!", "#38bdf8"] : ball.evolved ? ["ARMORED SUSANOO!", "#a855f7"] : ["KIRIN: THUNDER DRAGON!", "#38bdf8"],
    }[ball.ult];
    if (fx) {
      if (ball.ult !== "time_stop" && ball.ult !== "star_time_stop") {
        rt().entities.push(rt().spawnShockRing(ball.x, ball.y, fx[1], 120, 0.55));
      }
      if (ball.ult !== "gear_4") {
        rt().entities.push(rt().spawnBanner(fx[0], fx[1]));
      }
      rt().shakeTime = 0.3; rt().shakeIntensity = 7; rt().hitStop = 0.09;
    }

    if (ball.ult === "gear_4") {
      const isOddHp = Math.round(ball.hp) % 2 !== 0;
      ball.gear4Mode = isOddHp ? "bounceman" : "snakeman";
      rt().entities.push(rt().spawnBanner(isOddHp ? "GEAR 4: BOUNCEMAN!" : "GEAR 4: SNAKEMAN!", isOddHp ? COLORS.red : "#a855f7"));
      rt().beginCast(ball, {
        kind: "inflate", duration: 0.65, color: isOddHp ? COLORS.red : "#a855f7",
        fire(b) {
          b.ultTimer = 8.0;
          if (b.gear4Mode === "bounceman") {
            b.radius = Math.round(b.baseRadius * 1.22);
            rt().addEffect(b, "shield", 8.0, { reduction: 0.35 });
          } else {
            b.radius = Math.round(b.baseRadius * 1.06);
            rt().addEffect(b, "haste", 8.0, { factor: 1.32 });
          }
          if (b.skills[0]) b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.35);
          rt().entities.push(rt().spawnShockRing(b.x, b.y, b.gear4Mode === "bounceman" ? COLORS.white : "#c084fc", 110, 0.42));
        },
      });
    } else if (ball.ult === "kaioken") {
      rt().beginCast(ball, {
        kind: "powerup", duration: 0.45, color: COLORS.orange,
        fire(b) {
          b.ultTimer = 8.0;
          rt().addEffect(b, "haste", 8.0, { factor: 1.25 });
          if (b.skills[0]) b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.3);
          rt().entities.push(rt().spawnShockRing(b.x, b.y, COLORS.red, 100, 0.4));
          if (b.hp < 50 && !b.apeMode) {
            triggerGokuApeTransform(b);
          }
        },
      });
    } else if (ball.ult === "rasenshuriken") {
      if (!rt().balls.find((x) => x !== ball && x.alive)) return;
      if (ball.kyuubiMode) {
        rt().beginCast(ball, {
          kind: "bijuudama", duration: 1.05, color: "#dc2626", maxR: 34,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            const ang = Math.atan2(t.y - b.y, t.x - b.x);
            const m = rt().castMuzzle(b, ang, 24);
            g.entities.push(rt().spawnShockRing(m.x, m.y, "#ef4444", 130, 0.45));
            rt().shakeTime = Math.max(rt().shakeTime, 0.35);
            rt().shakeIntensity = Math.max(rt().shakeIntensity, 8);
            g.entities.push(rt().spawnProjectile({
              owner: b,
              target: t,
              x: m.x,
              y: m.y,
              speed: 550,
              radius: 34,
              damage: 34,
              color: "#dc2626",
              label: "BIJUUDAMA!",
              shape: "bijuudama",
              onImpact(tt, gg, proj) {
                if (BF.triggerBijuudamaExplosion) {
                  BF.triggerBijuudamaExplosion(proj.x, proj.y, b, gg, tt);
                }
              },
              onOutOfBounds(gg, proj) {
                if (BF.triggerBijuudamaExplosion) {
                  BF.triggerBijuudamaExplosion(proj.x, proj.y, b, gg, null);
                }
              },
            }));
          },
        });
      } else {
        rt().beginCast(ball, {
          kind: "orb", blades: true, duration: 1.15, color: COLORS.blue, maxR: 30,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            const m = rt().castMuzzle(b, Math.atan2(t.y - b.y, t.x - b.x), 20);
            g.entities.push(rt().spawnShockRing(m.x, m.y, COLORS.blue, 90, 0.4));
            rt().shakeTime = 0.2; rt().shakeIntensity = 5;
            g.entities.push(rt().spawnProjectile({
              owner: b, target: t, x: m.x, y: m.y, speed: 520, radius: 28, damage: 28,
              color: COLORS.blue, label: "RASENSHURIKEN!", shape: "rasenshuriken",
              onImpact(tt, gg, proj) {
                gg.addEffect(tt, "stun", 0.9);
                gg.entities.push(BF.spawnRasenganVisual(proj.x, proj.y, 82));
                if (BF.spawnRasenshurikenVortex) {
                  gg.entities.push(BF.spawnRasenshurikenVortex({ x: proj.x, y: proj.y, owner: b, duration: 2.2, radius: 155 }));
                }
                gg.entities.push(rt().spawnShockRing(proj.x, proj.y, COLORS.white, 125, 0.5));
                gg.spawnSparks(proj.x, proj.y, COLORS.white, COLORS.blue);
                rt().shakeTime = 0.35; rt().shakeIntensity = 8;
              },
              onOutOfBounds(gg, proj) {
                if (BF.spawnRasenshurikenVortex) {
                  gg.entities.push(BF.spawnRasenshurikenVortex({ x: proj.x, y: proj.y, owner: b, duration: 2.0, radius: 145 }));
                }
              },
            }));
          },
        });
      }
    } else if (ball.ult === "hollow_mask") {
      if (ball.vastoLordeMode) {
        if (!rt().balls.find((x) => x !== ball && x.alive)) return;
        rt().beginCast(ball, {
          kind: "gran_rey_cero", duration: 0.98, color: "#dc2626", maxR: 35,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            const ang = Math.atan2(t.y - b.y, t.x - b.x);
            const m = rt().castMuzzle(b, ang, 24);
            g.entities.push(rt().spawnShockRing(m.x, m.y, "#ef4444", 130, 0.45));
            rt().shakeTime = Math.max(rt().shakeTime, 0.35);
            rt().shakeIntensity = Math.max(rt().shakeIntensity, 8);
            g.entities.push(rt().spawnProjectile({
              owner: b,
              target: t,
              x: m.x,
              y: m.y,
              speed: 575,
              radius: 35,
              damage: 35,
              color: "#dc2626",
              label: "GRAN REY CERO!",
              shape: "gran_rey_cero",
              onImpact(tt, gg, proj) {
                if (BF.triggerGranReyCeroExplosion) {
                  BF.triggerGranReyCeroExplosion(proj.x, proj.y, b, gg, tt);
                }
              },
              onOutOfBounds(gg, proj) {
                if (BF.triggerGranReyCeroExplosion) {
                  BF.triggerGranReyCeroExplosion(proj.x, proj.y, b, gg, null);
                }
              },
            }));
          },
        });
      } else {
        rt().beginCast(ball, {
          kind: "powerup", duration: 0.45, color: COLORS.red,
          fire(b) {
            b.ultTimer = 8.5;
            rt().addEffect(b, "haste", 8.5, { factor: 1.28 });
            if (b.skills[0]) b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.25);
            rt().entities.push(rt().spawnShockRing(b.x, b.y, "#ef4444", 115, 0.42));
            rt().entities.push(rt().spawnShockRing(b.x, b.y, "#090205", 85, 0.32));
          },
        });
      }
    } else if (ball.ult === "time_stop") {
      rt().beginCast(ball, {
        kind: "time_stop", duration: 0.45, color: COLORS.gold,
        fire(b, g) {
          b.ultTimer = 5.0;
          rt().timeStopTimer = 5.0;
          rt().timeStopOwner = b;
          b.knifeWavesLeft = 4;
          b.knifeWaveTimer = 0.35;
          if (BF.spawnTimeStopDome) rt().entities.push(BF.spawnTimeStopDome(b, 5.0, true));
          if (BF.spawnRoadRollerDrop) rt().entities.push(BF.spawnRoadRollerDrop(b));
          rt().sound.playTimeStop();
          rt().shakeTime = 0.4; rt().shakeIntensity = 8;
        },
      });
    } else if (ball.ult === "star_time_stop") {
      rt().beginCast(ball, {
        kind: "time_stop", duration: 0.42, color: "#9b59b6",
        fire(b) {
          b.ultTimer = 4.0;
          rt().timeStopTimer = 4.0;
          rt().timeStopOwner = b;
          if (b.skills[0]) b.skills[0]._cd = 0;
          if (BF.spawnTimeStopDome) rt().entities.push(BF.spawnTimeStopDome(b, 4.0, false));
          // Time-Step Blink onto the arena-interior side of the frozen enemy so Jotaro never wedges them against a wall!
          const enemy = rt().balls.find((x) => x !== b && x.alive);
          if (enemy) {
            enemy.stoppedTimeHits = 0;
            const toCenterAng = Math.atan2(WORLD_SIZE * 0.5 - enemy.y, WORLD_SIZE * 0.5 - enemy.x);
            const standOff = enemy.radius + b.radius + 54;
            b.x = Math.max(b.radius + 14, Math.min(WORLD_SIZE - b.radius - 14, enemy.x + Math.cos(toCenterAng) * standOff));
            b.y = Math.max(b.radius + 14, Math.min(WORLD_SIZE - b.radius - 14, enemy.y + Math.sin(toCenterAng) * standOff));
            const moveAng = Math.atan2(enemy.y - b.y, enemy.x - b.x) + 0.38;
            b.vx = Math.cos(moveAng) * b.baseSpeed;
            b.vy = Math.sin(moveAng) * b.baseSpeed;
            rt().entities.push(rt().spawnShockRing(b.x, b.y, "#00f0ff", 110, 0.35));
            rt().spawnDamageText(b.x, b.y - b.radius - 12, 0, "#00f0ff", false, "TIME-STEP BLINK!");
          }
          rt().sound.playTimeStop();
          rt().shakeTime = 0.25; rt().shakeIntensity = 5;
        },
      });
    } else if (ball.ult === "berserker_armor") {
      rt().beginCast(ball, {
        kind: "powerup", duration: 0.45, color: COLORS.red,
        fire(b) {
          b.ultTimer = 8.5;
          rt().addEffect(b, "haste", 8.5, { factor: 1.32 });
          rt().addEffect(b, "shield", 8.5, { reduction: 0.22 });
          if (b.skills[0]) b.skills[0]._cd = 0;
          if (BF.spawnBerserkerEclipseCinematic) rt().entities.push(BF.spawnBerserkerEclipseCinematic(b));
          const enemy = rt().balls.find((x) => x !== b && x.alive);
          if (enemy) {
            const ang = Math.atan2(enemy.y - b.y, enemy.x - b.x);
            b.vx = Math.cos(ang) * b.baseSpeed * 1.4;
            b.vy = Math.sin(ang) * b.baseSpeed * 1.4;
            const dist = Math.hypot(enemy.x - b.x, enemy.y - b.y);
            if (dist <= 165 + enemy.radius) {
              const burst = rt().applyDamage(enemy, Math.round(18 + rt().rng() * 6));
              enemy.vx += Math.cos(ang) * 320;
              enemy.vy += Math.sin(ang) * 320;
              enemy.flashTimer = 0.14;
              rt().spawnSparks(enemy.x, enemy.y, COLORS.red, "#1c1d24");
              rt().spawnDamageText(enemy.x, enemy.y - enemy.radius - 14, burst, COLORS.red, true, "BERSERKER ERUPTION!!");
            }
          }
          rt().entities.push(rt().spawnShockRing(b.x, b.y, COLORS.red, 175, 0.45));
          rt().entities.push(rt().spawnShockRing(b.x, b.y, "#09090b", 125, 0.32));
          rt().spawnSparks(b.x, b.y, "#dc2626", "#09090b");
          rt().spawnDamageText(b.x, b.y - b.radius - 18, 0, "#ef4444", true, "BEAST OF DARKNESS!");
          rt().shakeTime = Math.max(rt().shakeTime, 0.32);
          rt().shakeIntensity = Math.max(rt().shakeIntensity, 8);
        },
      });
    } else if (ball.ult === "hollow_purple") {
      if (!rt().balls.find((x) => x !== ball && x.alive)) return;
      rt().beginCast(ball, {
        kind: "hollow_purple",
        duration: 0.92,
        color: "#b84dff",
        fire(b, g) {
          b.ultTimer = 13.0;
          b.domainUsedInUlt = false;
          rt().addEffect(b, "haste", 13.0, { factor: b.evolved ? 1.22 : 1.15 });
          if (b.evolved && BF.spawnShinjukuPurpleCinematic) {
            g.entities.push(BF.spawnShinjukuPurpleCinematic(b, g));
            return;
          }
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const ang = Math.atan2(t.y - b.y, t.x - b.x);
          const m = rt().castMuzzle(b, ang, 24);
          g.entities.push(rt().spawnShockRing(m.x, m.y, "#e5b8ff", 135, 0.45));
          rt().shakeTime = Math.max(rt().shakeTime, 0.35);
          rt().shakeIntensity = Math.max(rt().shakeIntensity, 8);
          g.entities.push(rt().spawnProjectile({
            owner: b,
            target: t,
            x: m.x,
            y: m.y,
            speed: 510,
            radius: 44,
            damage: Math.round(26 + rt().rng() * 6),
            color: "#b84dff",
            label: "HOLLOW PURPLE!",
            shape: "hollow_purple",
            onImpact(tt, gg, proj) {
              BF.triggerHollowPurpleExplosion(proj.x, proj.y, b, gg, tt);
            },
            onOutOfBounds(gg, proj) {
              BF.triggerHollowPurpleExplosion(proj.x, proj.y, b, gg, null);
            },
          }));
        },
      });
    } else if (ball.ult === "fuga") {
      if (!rt().balls.find((x) => x !== ball && x.alive)) return;

      // Meguna (Evolved Base): Summon Mahoraga with screen-freeze Ten Shadows Ritual!
      if (ball.evolved && !ball.heianEraMode) {
        rt().beginCast(ball, {
          kind: "powerup",
          duration: 0.45,
          color: "#facc15",
          fire(b, g) {
            b.ultTimer = 10.0;
            rt().addEffect(b, "haste", 10.0, { factor: 1.15 });
            if (BF.spawnMahoragaRitualCinematic) {
              g.entities.push(BF.spawnMahoragaRitualCinematic(b, g));
            } else if (BF.spawnMahoragaSummon) {
              g.entities.push(BF.spawnMahoragaSummon(b, g));
            }
          },
        });
        return;
      }

      // Heian Era: Domain Expansion: Incomplete Malevolent Shrine (strobe flicker + Shrine emerges)!
      if (ball.heianEraMode) {
        rt().beginCast(ball, {
          kind: "powerup",
          duration: 0.4,
          color: "#dc2626",
          fire(b, g) {
            b.ultTimer = 7.0;
            b.domainUsedInUlt = true;
            rt().addEffect(b, "haste", 7.0, { factor: 1.24 });
            if (BF.spawnIncompleteShrineCinematic) {
              g.entities.push(BF.spawnIncompleteShrineCinematic(b, g));
            }
          },
        });
        return;
      }

      rt().beginCast(ball, {
        kind: "fuga_arrow",
        duration: 0.85,
        color: "#f97316",
        fire(b, g) {
          b.ultTimer = 13.0;
          b.domainUsedInUlt = false;
          rt().addEffect(b, "haste", b.ultTimer, { factor: 1.15 });
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const ang = Math.atan2(t.y - b.y, t.x - b.x);
          const m = rt().castMuzzle(b, ang, 24);
          g.entities.push(rt().spawnShockRing(m.x, m.y, "#fb923c", 145, 0.45));
          rt().shakeTime = Math.max(rt().shakeTime, 0.35);
          rt().shakeIntensity = Math.max(rt().shakeIntensity, 9);

          g.entities.push(rt().spawnProjectile({
            owner: b,
            target: t,
            x: m.x,
            y: m.y,
            speed: 560,
            radius: 36,
            damage: Math.round(26 + rt().rng() * 6),
            color: "#f97316",
            label: "FUGA!",
            shape: "fuga_arrow",
            onImpact(tt, gg, proj) {
              BF.triggerFugaExplosion(proj.x, proj.y, b, gg, tt, 225);
            },
            onOutOfBounds(gg, proj) {
              BF.triggerFugaExplosion(proj.x, proj.y, b, gg, null, 225);
            },
          }));
        },
      });
    } else if (ball.ult === "godspeed") {
      rt().beginCast(ball, {
        kind: "powerup",
        duration: 0.4,
        color: "#38bdf8",
        fire(b, g) {
          b.ultTimer = 7.5;
          b._whirlwindCd = 0;
          b._denkoTimer = 0.5;
          rt().addEffect(b, "haste", 7.5, { factor: 1.35 });
          rt().addEffect(b, "shield", 7.5, { reduction: 0.2 });
          if (b.skills[0]) b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.25);
          if (BF.triggerGodspeedOpener) BF.triggerGodspeedOpener(b, g);
          rt().entities.push(rt().spawnShockRing(b.x, b.y, "#38bdf8", 125, 0.42));
          rt().entities.push(rt().spawnShockRing(b.x, b.y, "#e0f2fe", 90, 0.3));
        },
      });
    } else if (ball.ult === "arise") {
      rt().beginCast(ball, {
        kind: "powerup",
        duration: 0.45,
        color: "#a855f7",
        fire(b, g) {
          b.ultTimer = 7.5;
          rt().addEffect(b, "haste", 7.5, { factor: 1.22 });
          rt().addEffect(b, "shield", 7.5, { reduction: 0.18 });
          if (b.skills[0]) b.skills[0]._cd = 0;
          if (BF.triggerAriseDomain) {
            BF.triggerAriseDomain(b, g);
          }
          rt().entities.push(rt().spawnShockRing(b.x, b.y, "#a855f7", 135, 0.48));
          rt().entities.push(rt().spawnShockRing(b.x, b.y, "#38bdf8", 96, 0.36));
        },
      });
    } else if (ball.ult === "hero_of_hell") {
      rt().beginCast(ball, {
        kind: "powerup",
        duration: 0.42,
        color: "#ea580c",
        fire(b, g) {
          b.ultTimer = 8.0;
          rt().addEffect(b, "haste", 8.0, { factor: 1.28 });
          rt().addEffect(b, "shield", 8.0, { reduction: 0.22 });
          if (b.skills[0]) b.skills[0]._cd = 0;
          if (BF.triggerHeroOfHellOpener) BF.triggerHeroOfHellOpener(b, g);
          rt().entities.push(rt().spawnShockRing(b.x, b.y, "#ef4444", 130, 0.44));
          rt().entities.push(rt().spawnShockRing(b.x, b.y, "#fbbf24", 94, 0.32));
        },
      });
    } else if (ball.ult === "cosmic_fear") {
      if (ball._isCosmicGarou && BF.triggerCosmicGammaRayBurstUlt) {
        BF.triggerCosmicGammaRayBurstUlt(ball, rt().makeGameProxy());
      } else {
        rt().beginCast(ball, {
          kind: "powerup",
          duration: 0.48,
          color: "#ef4444",
          fire(b, g) {
            b.ultTimer = 8.0;
            rt().addEffect(b, "haste", 8.0, { factor: 1.28 });
            rt().addEffect(b, "shield", 8.0, { reduction: 0.22 });
            if (b.skills[0]) b.skills[0]._cd = 0;
            if (BF.triggerGarouMonsterOpener) BF.triggerGarouMonsterOpener(b, g);
            rt().entities.push(rt().spawnShockRing(b.x, b.y, "#ef4444", 135, 0.45));
            rt().entities.push(rt().spawnShockRing(b.x, b.y, "#fb923c", 96, 0.34));
          },
        });
      }
    } else if (ball.ult === "adult_gon") {
      rt().beginCast(ball, {
        kind: "powerup",
        duration: 0.45,
        color: "#09090b",
        fire(b, g) {
          b.ultTimer = 9.0;
          rt().addEffect(b, "haste", 9.0, { factor: 1.24 });
          rt().addEffect(b, "shield", 9.0, { reduction: 0.25 });
          if (b.skills[0]) b.skills[0]._cd = 0;
          if (BF.triggerAdultGonOpener) BF.triggerAdultGonOpener(b, g);
          rt().entities.push(rt().spawnShockRing(b.x, b.y, "#09090b", 130, 0.44));
          rt().entities.push(rt().spawnShockRing(b.x, b.y, "#ffffff", 95, 0.32));
        },
      });
    } else if (ball.ult === "kirin") {
      rt().beginCast(ball, {
        kind: "powerup",
        duration: 0.4,
        color: ball.susanooArmorMode ? "#38bdf8" : ball.evolved ? "#a855f7" : "#38bdf8",
        fire(b, g) {
          b.ultTimer = 7.0;
          rt().addEffect(b, "haste", 7.0, { factor: 1.18 });
          if (b.susanooArmorMode && BF.spawnIndraArrowUltimate) {
            BF.spawnIndraArrowUltimate(b, g);
          } else if (b.evolved && BF.spawnArmoredSusanooUltimate) {
            BF.spawnArmoredSusanooUltimate(b, g);
          } else if (BF.spawnKirinUltimate) {
            BF.spawnKirinUltimate(b, g);
          }
        },
      });
    }
  }


  BF.Transforms = {
    triggerGokuApeTransform,
    triggerNarutoKyuubiTransform,
    triggerSasukeCurseMarkTransform,
    triggerSasukeSusanooArmorTransform,
    triggerIchigoInnerDemonTransform,
    triggerIchigoVastoTransform,
    triggerSukunaHeianTransform,
    activateUltimate,
  };
})();
