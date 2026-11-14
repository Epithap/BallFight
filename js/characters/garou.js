(function () {
    const BF = window.BallFighters;
    if (!BF) return;

    function pickNearestEnemy(ball, g) {
        const enemies = BF.getEnemies(ball, g);
        if (!enemies.length) return null;
        return enemies.reduce((best, e) => {
            const d = Math.hypot(e.x - ball.x, e.y - ball.y);
            return !best || d < best.d ? { e, d } : best;
        }, null).e;
    }

    function spawnSpiralMartialWave(ball, angle, isMonster, isCosmic) {
        const speed = isCosmic ? 520 : isMonster ? 460 : 390;
        const life = isCosmic ? 0.56 : isMonster ? 0.48 : 0.42;
        const dmg = isCosmic ? 10 : isMonster ? 8 : 6;
        const color = isCosmic ? "#38bdf8" : isMonster ? "#ef4444" : "#38bdf8";
        return {
            type: "garou_martial_wave",
            ownerId: ball.id,
            x: ball.x + Math.cos(angle) * (ball.radius + 10),
            y: ball.y + Math.sin(angle) * (ball.radius + 10),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            angle,
            life,
            maxLife: life,
            radius: isCosmic ? 26 : isMonster ? 22 : 18,
            dmg,
            color,
            isMonster,
            isCosmic,
            hitIds: new Set(),
            update(dt, g) {
                this.life -= dt;
                this.x += this.vx * dt;
                this.y += this.vy * dt;

                if (g.arena) {
                    const b = g.arena;
                    if (this.x < b.x + 8 || this.x > b.x + b.w - 8 || this.y < b.y + 8 || this.y > b.y + b.h - 8) {
                        this.life = 0;
                        g.spawnParticles(this.x, this.y, this.color, 6, 120);
                        return;
                    }
                }

                const owner = g.balls.find((b) => b.id === this.ownerId);
                if (!owner) return;
                for (const enemy of BF.getEnemies(owner, g)) {
                    if (this.hitIds.has(enemy.id)) continue;
                    if (Math.hypot(enemy.x - this.x, enemy.y - this.y) <= enemy.radius + this.radius) {
                        this.hitIds.add(enemy.id);
                        g.dealDamage(owner, enemy, this.dmg, {
                            source: this.isCosmic ? "Cosmic Martial Wave" : this.isMonster ? "Monster Martial Wave" : "Whirlwind Iron Cutting Fist",
                            color: this.color,
                        });
                        const knock = this.isCosmic ? 190 : this.isMonster ? 155 : 110;
                        enemy.vx += Math.cos(this.angle) * knock;
                        enemy.vy += Math.sin(this.angle) * knock;
                        g.spawnSlashArc(enemy.x, enemy.y, this.angle, 38, this.color);
                        g.spawnParticles(enemy.x, enemy.y, this.color, 10, 160);
                        if (!this.isMonster && !this.isCosmic) {
                            this.life = 0;
                        }
                        break;
                    }
                }
            },
            draw(ctx) {
                const alpha = Math.max(0, this.life / this.maxLife);
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.isCosmic ? 6.5 : this.isMonster ? 5.5 : 4.5;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.arc(-4, 0, this.radius, -1.05, 1.05);
                ctx.stroke();

                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(-6, 0, this.radius * 0.72, -0.8, 0.8);
                ctx.stroke();
                ctx.restore();
            },
        };
    }

    // Monster Form Skill: God Slayer Dash + 4-hit Barrage (replaces projectile)
    function spawnGodSlayerBarrage(owner, target) {
        const dx = target.x - owner.x;
        const dy = target.y - owner.y;
        const dist = Math.hypot(dx, dy) || 1;
        const angle = Math.atan2(dy, dx);
        const startX = owner.x;
        const startY = owner.y;
        const dashDist = Math.max(0, dist - (owner.radius + target.radius + 10));
        const endX = owner.x + (dx / dist) * dashDist;
        const endY = owner.y + (dy / dist) * dashDist;

        return {
            type: "garou_god_slayer_barrage",
            ownerId: owner.id,
            targetId: target.id,
            angle,
            startX,
            startY,
            endX,
            endY,
            elapsed: 0,
            dashDur: 0.16,
            hitsDone: 0,
            hitTimes: [0.17, 0.25, 0.33, 0.41],
            totalDur: 0.48,
            life: 0.48,
            update(dt, g) {
                this.elapsed += dt;
                this.life = Math.max(0, this.totalDur - this.elapsed);

                const ball = g.balls.find((b) => b.id === this.ownerId);
                const enemy = g.balls.find((b) => b.id === this.targetId);
                if (!ball || ball.hp <= 0 || !enemy || enemy.hp <= 0) {
                    this.life = 0;
                    return;
                }

                if (this.elapsed <= this.dashDur) {
                    const t = Math.min(1, this.elapsed / this.dashDur);
                    const ease = 1 - Math.pow(1 - t, 2);
                    ball.x = this.startX + (this.endX - this.startX) * ease;
                    ball.y = this.startY + (this.endY - this.startY) * ease;
                    ball.vx = Math.cos(this.angle) * 320;
                    ball.vy = Math.sin(this.angle) * 320;
                    if (Math.random() < 0.75) {
                        g.spawnParticles(ball.x, ball.y, "#ef4444", 3, 120);
                    }
                } else {
                    const stickAngle = Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
                    const stickDist = ball.radius + enemy.radius + 8;
                    ball.x = enemy.x - Math.cos(stickAngle) * stickDist;
                    ball.y = enemy.y - Math.sin(stickAngle) * stickDist;
                    ball.vx = 0;
                    ball.vy = 0;
                    this.angle = stickAngle;

                    while (this.hitsDone < this.hitTimes.length && this.elapsed >= this.hitTimes[this.hitsDone]) {
                        this.hitsDone += 1;
                        const isFinal = this.hitsDone === this.hitTimes.length;
                        g.dealDamage(ball, enemy, 3, {
                            source: "God Slayer Fist Barrage",
                            color: "#ef4444",
                        });
                        g.spawnSlashArc(
                            enemy.x + (Math.random() - 0.5) * 14,
                            enemy.y + (Math.random() - 0.5) * 14,
                            this.angle + (Math.random() - 0.5) * 0.9,
                            42,
                            isFinal ? "#fca5a5" : "#ef4444"
                        );
                        g.spawnParticles(enemy.x, enemy.y, "#ef4444", isFinal ? 12 : 7, 190);
                        if (isFinal) {
                            g.spawnShockwave(enemy.x, enemy.y, 70, "#ef4444");
                            enemy.vx += Math.cos(this.angle) * 210;
                            enemy.vy += Math.sin(this.angle) * 210;
                            if (g.triggerScreenShake) g.triggerScreenShake(7, 0.16);
                        }
                    }
                }
            },
            draw(ctx) {
                if (this.elapsed < this.dashDur) {
                    ctx.save();
                    ctx.strokeStyle = "rgba(239, 68, 68, 0.65)";
                    ctx.lineWidth = 8;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(this.startX, this.startY);
                    ctx.lineTo(this.endX, this.endY);
                    ctx.stroke();
                    ctx.restore();
                } else {
                    const pulse = (Math.sin(this.elapsed * 55) + 1) * 0.5;
                    ctx.save();
                    ctx.translate(this.endX, this.endY);
                    ctx.rotate(this.angle);
                    ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.45})`;
                    ctx.lineWidth = 4;
                    for (let i = -1; i <= 1; i++) {
                        ctx.beginPath();
                        ctx.moveTo(8, i * 10);
                        ctx.lineTo(44 + pulse * 14, i * 14);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            },
        };
    }

    function spawnWaterStreamStance(ball) {
        ball._garouCounterTimer = 1.45;
        return {
            type: "garou_water_stream_stance",
            ownerId: ball.id,
            life: 1.45,
            maxLife: 1.45,
            update(dt, g) {
                this.life -= dt;
                const owner = g.balls.find((b) => b.id === this.ownerId);
                if (!owner || owner.hp <= 0 || (owner._garouCounterTimer || 0) <= 0) {
                    this.life = 0;
                    return;
                }
                owner._garouCounterTimer = Math.max(0, owner._garouCounterTimer - dt);
            },
            draw(ctx, g) {
                const owner = g.balls.find((b) => b.id === this.ownerId);
                if (!owner) return;
                const t = performance.now() / 180;
                const alpha = Math.max(0, this.life / this.maxLife);
                const isCosmic = Boolean(owner._isCosmicGarou);
                const isMonster = owner.ultTimer > 0 && !isCosmic;
                const col1 = isCosmic ? "#38bdf8" : isMonster ? "#ef4444" : "#38bdf8";
                const col2 = isCosmic ? "#c084fc" : isMonster ? "#fb923c" : "#93c5fd";
                ctx.save();
                ctx.translate(owner.x, owner.y);
                ctx.globalAlpha = 0.8 * alpha;
                ctx.strokeStyle = col1;
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.arc(0, 0, owner.radius + 11, t, t + Math.PI * 1.15);
                ctx.stroke();
                ctx.strokeStyle = col2;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, owner.radius + 16, t + Math.PI, t + Math.PI * 2.15);
                ctx.stroke();
                ctx.restore();
            },
        };
    }

    // Cosmic Awakening Cutscene (HP < 50 once per match, freezes time via g._cosmicCutsceneTimer)
    function spawnCosmicMoonAwakeningCutscene(ball, g) {
        const origX = ball.x;
        const origY = ball.y;
        const arena = g.arena || { x: 40, y: 40, w: 640, h: 420 };
        const moonX = arena.x + arena.w * 0.5;
        const moonY = arena.y + 82;
        const totalDur = 2.4;

        return {
            type: "garou_cosmic_awakening_cutscene",
            ownerId: ball.id,
            origX,
            origY,
            moonX,
            moonY,
            elapsed: 0,
            totalDur,
            life: totalDur,
            blessed: false,
            healed: false,
            update(dt, game) {
                this.elapsed += dt;
                this.life = Math.max(0, this.totalDur - this.elapsed);
                game._cosmicCutsceneTimer = Math.max(0, this.life);

                const owner = game.balls.find((b) => b.id === this.ownerId);
                if (!owner || owner.hp <= 0) {
                    game._cosmicCutsceneTimer = 0;
                    this.life = 0;
                    return;
                }

                // Phase 1 (0 -> 0.8s): Garou is pulled upward toward the Moon
                if (this.elapsed < 0.8) {
                    const t = this.elapsed / 0.8;
                    const ease = t * t * (3 - 2 * t);
                    owner.x = this.origX + (this.moonX - this.origX) * ease;
                    owner.y = this.origY + (this.moonY + 46 - this.origY) * ease;
                    owner.vx = 0;
                    owner.vy = 0;
                }
                // Phase 2 (0.8 -> 1.65s): God bestows Cosmic Fear power on the Moon
                else if (this.elapsed < 1.65) {
                    owner.x = this.moonX;
                    owner.y = this.moonY + 46;
                    owner.vx = 0;
                    owner.vy = 0;
                    if (!this.blessed) {
                        this.blessed = true;
                        owner._isCosmicGarou = true;
                        owner.ultTimer = Math.max(owner.ultTimer || 0, 14);
                        game.spawnShockwave(owner.x, owner.y, 130, "#a855f7");
                        game.spawnParticles(owner.x, owner.y, "#38bdf8", 24, 240);
                        game.spawnParticles(owner.x, owner.y, "#c084fc", 20, 200);
                        game.addFloatingText(owner.x, owner.y - 34, "COSMIC FEAR AWAKENED!", "#c084fc", 17);
                        if (game.triggerScreenShake) game.triggerScreenShake(9, 0.28);
                    }
                }
                // Phase 3 (1.65 -> 2.4s): Descend back to arena in Cosmic Form + Heal 50 HP
                else {
                    const t = Math.min(1, (this.elapsed - 1.65) / 0.75);
                    const ease = 1 - Math.pow(1 - t, 3);
                    owner.x = this.moonX + (this.origX - this.moonX) * ease;
                    owner.y = (this.moonY + 46) + (this.origY - (this.moonY + 46)) * ease;
                    owner.vx = 0;
                    owner.vy = 0;

                    if (t >= 0.95 && !this.healed) {
                        this.healed = true;
                        const oldHp = owner.hp;
                        owner.hp = Math.min(owner.maxHp, owner.hp + 50);
                        const gained = Math.round(owner.hp - oldHp);
                        owner.speedMult = Math.max(owner.speedMult || 1, 1.2);
                        owner.speedBuffTimer = Math.max(owner.speedBuffTimer || 0, 10);
                        game.spawnShockwave(owner.x, owner.y, 95, "#38bdf8");
                        game.spawnParticles(owner.x, owner.y, "#22c55e", 16, 190);
                        game.addFloatingText(owner.x, owner.y - owner.radius - 20, `+${gained} HP`, "#4ade80", 18);
                        game._cosmicCutsceneTimer = 0;
                    }
                }
            },
            draw(ctx, game) {
                const a = game.arena || { x: 40, y: 40, w: 640, h: 420 };
                const fadeIn = Math.min(1, this.elapsed / 0.35);
                const fadeOut = Math.min(1, this.life / 0.35);
                const alpha = Math.min(fadeIn, fadeOut);

                ctx.save();
                // Time-stop dark cosmos backdrop
                ctx.fillStyle = `rgba(4, 7, 22, ${0.72 * alpha})`;
                ctx.fillRect(a.x, a.y, a.w, a.h);

                // Glowing Moon at top
                const moonR = 54;
                const grad = ctx.createRadialGradient(this.moonX, this.moonY, 10, this.moonX, this.moonY, moonR * 1.45);
                grad.addColorStop(0, `rgba(241, 245, 249, ${0.95 * alpha})`);
                grad.addColorStop(0.65, `rgba(148, 163, 184, ${0.65 * alpha})`);
                grad.addColorStop(1, "rgba(56, 189, 248, 0)");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(this.moonX, this.moonY, moonR * 1.45, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `rgba(226, 232, 240, ${0.92 * alpha})`;
                ctx.beginPath();
                ctx.arc(this.moonX, this.moonY, moonR * 0.72, 0, Math.PI * 2);
                ctx.fill();

                // God silhouette / cosmic tendrils on the Moon
                ctx.strokeStyle = `rgba(192, 132, 252, ${0.85 * alpha})`;
                ctx.lineWidth = 3;
                const pulse = Math.sin(this.elapsed * 10) * 6;
                ctx.beginPath();
                ctx.arc(this.moonX, this.moonY, moonR * 0.42 + pulse * 0.3, 0, Math.PI * 2);
                ctx.stroke();

                // Cosmic beam connecting Moon -> Garou during blessing
                if (this.elapsed >= 0.45 && this.elapsed <= 1.85) {
                    const beamGrad = ctx.createLinearGradient(this.moonX, this.moonY, this.moonX, this.moonY + 75);
                    beamGrad.addColorStop(0, `rgba(192, 132, 252, ${0.8 * alpha})`);
                    beamGrad.addColorStop(1, `rgba(56, 189, 248, ${0.2 * alpha})`);
                    ctx.fillStyle = beamGrad;
                    ctx.beginPath();
                    ctx.moveTo(this.moonX - 24, this.moonY + 12);
                    ctx.lineTo(this.moonX + 24, this.moonY + 12);
                    ctx.lineTo(this.moonX + 42, this.moonY + 92);
                    ctx.lineTo(this.moonX - 42, this.moonY + 92);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            },
        };
    }

    // Moon Arena Overlay + Timer Controller
    BF.drawMoonArenaOverlay = function (ctx, game) {
        const a = game.arena;
        if (!a) return;
        const t = Math.min(1, (game._moonArenaTimer || 0) / 0.5);
        ctx.save();
        ctx.fillStyle = `rgba(8, 12, 30, ${0.78 * t})`;
        ctx.fillRect(a.x, a.y, a.w, a.h);

        // Crater floor rings
        ctx.strokeStyle = `rgba(148, 163, 184, ${0.22 * t})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(a.x + a.w * 0.25, a.y + a.h * 0.72, 48, 22, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(a.x + a.w * 0.72, a.y + a.h * 0.32, 62, 28, -0.2, 0, Math.PI * 2);
        ctx.stroke();

        // Distant Earth / Moon horizon glow
        const earthX = a.x + a.w - 64;
        const earthY = a.y + 54;
        const g = ctx.createRadialGradient(earthX, earthY, 6, earthX, earthY, 34);
        g.addColorStop(0, `rgba(56, 189, 248, ${0.8 * t})`);
        g.addColorStop(0.6, `rgba(37, 99, 235, ${0.45 * t})`);
        g.addColorStop(1, "rgba(37, 99, 235, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(earthX, earthY, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    function spawnMoonArenaController(g) {
        const existing = g.entities.find((e) => e.type === "garou_moon_arena_controller");
        if (existing) {
            existing.life = 4.8;
            return existing;
        }
        return {
            type: "garou_moon_arena_controller",
            life: 4.8,
            update(dt, game) {
                game._moonArenaTimer = Math.max(0, (game._moonArenaTimer || 0) - dt);
                this.life = game._moonArenaTimer;
                if (this.life <= 0) {
                    game._moonArenaTimer = 0;
                }
            },
            draw() {},
        };
    }

    // Cosmic Rampage: 5-punch barrage on Moon Arena arrival
    function spawnCosmicRampage(owner, target) {
        return {
            type: "garou_cosmic_rampage",
            ownerId: owner.id,
            targetId: target.id,
            elapsed: 0,
            hitsDone: 0,
            hitTimes: [0.12, 0.24, 0.36, 0.48, 0.62],
            totalDur: 0.72,
            life: 0.72,
            update(dt, g) {
                this.elapsed += dt;
                this.life = Math.max(0, this.totalDur - this.elapsed);

                const ball = g.balls.find((b) => b.id === this.ownerId);
                const enemy = g.balls.find((b) => b.id === this.targetId);
                if (!ball || ball.hp <= 0 || !enemy || enemy.hp <= 0) {
                    this.life = 0;
                    return;
                }

                const ang = Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
                const dist = ball.radius + enemy.radius + 8;
                ball.x = enemy.x - Math.cos(ang) * dist;
                ball.y = enemy.y - Math.sin(ang) * dist;
                ball.vx = 0;
                ball.vy = 0;

                while (this.hitsDone < this.hitTimes.length && this.elapsed >= this.hitTimes[this.hitsDone]) {
                    this.hitsDone += 1;
                    const isFinal = this.hitsDone === this.hitTimes.length;
                    g.dealDamage(ball, enemy, 3, {
                        source: "Cosmic Rampage",
                        color: isFinal ? "#c084fc" : "#38bdf8",
                    });
                    g.spawnSlashArc(
                        enemy.x + (Math.random() - 0.5) * 16,
                        enemy.y + (Math.random() - 0.5) * 16,
                        ang + (Math.random() - 0.5) * 1.1,
                        46,
                        isFinal ? "#c084fc" : "#38bdf8"
                    );
                    g.spawnParticles(enemy.x, enemy.y, isFinal ? "#c084fc" : "#38bdf8", isFinal ? 14 : 8, 210);
                    if (isFinal) {
                        g.spawnShockwave(enemy.x, enemy.y, 92, "#c084fc");
                        enemy.vx += Math.cos(ang) * 240;
                        enemy.vy += Math.sin(ang) * 240;
                        if (g.triggerScreenShake) g.triggerScreenShake(9, 0.2);
                    }
                }
            },
            draw(ctx, g) {
                const enemy = g.balls.find((b) => b.id === this.targetId);
                if (!enemy) return;
                ctx.save();
                ctx.strokeStyle = "rgba(192, 132, 252, 0.55)";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius + 18 + Math.sin(this.elapsed * 40) * 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            },
        };
    }

    // Cosmic Skill 1: Black Hole Circle -> Teleport to Moon Arena + Cosmic Rampage
    function spawnCosmicBlackHole(owner, targetX, targetY) {
        return {
            type: "garou_cosmic_black_hole",
            ownerId: owner.id,
            x: targetX,
            y: targetY,
            radius: 66,
            life: 1.6,
            maxLife: 1.6,
            triggered: false,
            update(dt, g) {
                this.life -= dt;
                const ball = g.balls.find((b) => b.id === this.ownerId);
                if (!ball || ball.hp <= 0) {
                    this.life = 0;
                    return;
                }

                for (const enemy of BF.getEnemies(ball, g)) {
                    const dx = this.x - enemy.x;
                    const dy = this.y - enemy.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    if (dist <= 165) {
                        const pull = 280 * dt;
                        enemy.vx += (dx / dist) * pull;
                        enemy.vy += (dy / dist) * pull;
                    }

                    if (!this.triggered && dist <= 54 + enemy.radius * 0.4) {
                        this.triggered = true;
                        this.life = 0;

                        // Warp both fighters into the Moon Arena
                        const a = g.arena || { x: 40, y: 40, w: 640, h: 420 };
                        const cx = a.x + a.w * 0.5;
                        const cy = a.y + a.h * 0.5;
                        enemy.x = Math.min(a.x + a.w - enemy.radius - 20, Math.max(a.x + enemy.radius + 20, cx + 80));
                        enemy.y = cy;
                        enemy.vx = 0;
                        enemy.vy = 0;
                        ball.x = Math.max(a.x + ball.radius + 20, enemy.x - (ball.radius + enemy.radius + 14));
                        ball.y = cy;
                        ball.vx = 0;
                        ball.vy = 0;

                        g._moonArenaTimer = 4.8;
                        g.entities.push(spawnMoonArenaController(g));
                        g.spawnShockwave(cx, cy, 150, "#c084fc");
                        g.spawnParticles(enemy.x, enemy.y, "#38bdf8", 22, 240);
                        g.addFloatingText(cx, cy - 42, "MOON ARENA: COSMIC RAMPAGE!", "#c084fc", 16);
                        g.entities.push(spawnCosmicRampage(ball, enemy));
                        return;
                    }
                }
            },
            draw(ctx) {
                const alpha = Math.max(0, Math.min(1, this.life / 0.35));
                const t = performance.now() / 160;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.globalAlpha = alpha;

                const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, this.radius);
                grad.addColorStop(0, "#020617");
                grad.addColorStop(0.55, "rgba(88, 28, 135, 0.85)");
                grad.addColorStop(0.85, "rgba(56, 189, 248, 0.45)");
                grad.addColorStop(1, "rgba(56, 189, 248, 0)");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = "#c084fc";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.72, t, t + Math.PI * 1.4);
                ctx.stroke();

                ctx.strokeStyle = "#38bdf8";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.46, -t * 1.3, -t * 1.3 + Math.PI * 1.3);
                ctx.stroke();

                ctx.fillStyle = "#000000";
                ctx.beginPath();
                ctx.arc(0, 0, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            },
        };
    }

    // Moon Arena Skill 2: Gamma Ray Burst
    function spawnGammaRayBurstBeam(owner, angle) {
        return {
            type: "garou_gamma_ray_burst",
            ownerId: owner.id,
            x: owner.x,
            y: owner.y,
            angle,
            life: 0.42,
            maxLife: 0.42,
            length: 760,
            hitIds: new Set(),
            update(dt, g) {
                this.life -= dt;
                const ball = g.balls.find((b) => b.id === this.ownerId);
                if (!ball) return;
                this.x = ball.x;
                this.y = ball.y;

                const cos = Math.cos(this.angle);
                const sin = Math.sin(this.angle);

                for (const enemy of BF.getEnemies(ball, g)) {
                    if (this.hitIds.has(enemy.id)) continue;
                    const rx = enemy.x - this.x;
                    const ry = enemy.y - this.y;
                    const proj = rx * cos + ry * sin;
                    if (proj < -10 || proj > this.length) continue;
                    const perp = Math.abs(rx * -sin + ry * cos);
                    if (perp <= enemy.radius + 32) {
                        this.hitIds.add(enemy.id);
                        g.dealDamage(ball, enemy, 18, {
                            source: "GAMMA RAY BURST",
                            color: "#f0abfc",
                        });
                        g.applyStun(enemy, 0.45);
                        enemy.vx += cos * 280;
                        enemy.vy += sin * 280;
                        g.spawnShockwave(enemy.x, enemy.y, 110, "#f0abfc");
                        g.spawnParticles(enemy.x, enemy.y, "#38bdf8", 20, 260);
                        g.spawnParticles(enemy.x, enemy.y, "#f0abfc", 16, 230);
                        if (g.triggerScreenShake) g.triggerScreenShake(12, 0.25);
                    }
                }
            },
            draw(ctx) {
                const alpha = Math.max(0, this.life / this.maxLife);
                const width = 44 * alpha + 12;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.globalAlpha = alpha;

                const grad = ctx.createLinearGradient(0, -width, 0, width);
                grad.addColorStop(0, "rgba(192, 132, 252, 0)");
                grad.addColorStop(0.25, "rgba(192, 132, 252, 0.85)");
                grad.addColorStop(0.5, "#ffffff");
                grad.addColorStop(0.75, "rgba(56, 189, 248, 0.85)");
                grad.addColorStop(1, "rgba(56, 189, 248, 0)");

                ctx.fillStyle = grad;
                ctx.fillRect(0, -width, this.length, width * 2);

                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(0, 0, width * 0.65, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            },
        };
    }

    BF.triggerGarouMonsterOpener = (ball, g) => {
        if (!ball || !g || ball._garouMonsterIntroDone) return;
        ball._garouMonsterIntroDone = true;
        ball.speedMult = Math.max(ball.speedMult || 1, 1.16);
        ball.speedBuffTimer = Math.max(ball.speedBuffTimer || 0, 12);
        g.spawnShockwave(ball.x, ball.y, 92, "#ef4444");
        g.spawnParticles(ball.x, ball.y, "#ef4444", 16, 200);
        g.addFloatingText(ball.x, ball.y - ball.radius - 16, "MONSTER FORM!", "#ef4444", 16);
    };

    const SKILL_WHIRLWIND_FIST = {
        id: "garou_whirlwind_fist",
        name: "Whirlwind Iron Cutting Fist",
        cooldown: 2.6,
        desc: "Base: spiral wave. Monster Ult: God Slayer Dash & 4-hit Barrage. HP<50: Cosmic Moon Awakening -> Black Hole Moon Rampage.",
        onTick(ball, g, dt) {
            if (ball._garouRuptureTimer > 0) {
                ball._garouRuptureTimer = Math.max(0, ball._garouRuptureTimer - dt);
            }
            if (ball._godSlayerCd > 0) {
                ball._godSlayerCd = Math.max(0, ball._godSlayerCd - dt);
            }

            // Cosmic Fear Awakening when HP < 50 (once per match)
            if (ball.hp > 0 && ball.hp < 50 && !ball._cosmicAwakened) {
                ball._cosmicAwakened = true;
                g._cosmicCutsceneTimer = 2.4;
                g.entities.push(spawnCosmicMoonAwakeningCutscene(ball, g));
                return false;
            }

            // Cosmic Form Skill 1: Black Hole Circle -> Moon Arena + Rampage
            if (ball._isCosmicGarou) {
                const enemy = pickNearestEnemy(ball, g);
                if (!enemy) return false;
                const angle = Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
                const dist = Math.min(185, Math.max(60, Math.hypot(enemy.x - ball.x, enemy.y - ball.y)));
                const tx = ball.x + Math.cos(angle) * dist;
                const ty = ball.y + Math.sin(angle) * dist;
                g.entities.push(spawnCosmicBlackHole(ball, tx, ty));
                g.addFloatingText(ball.x, ball.y - ball.radius - 14, "BLACK HOLE!", "#c084fc", 14);
                return true;
            }

            const enemy = pickNearestEnemy(ball, g);
            if (!enemy) return false;

            const isMonster = ball.ultTimer > 0;
            if (isMonster && (ball._godSlayerCd || 0) <= 0) {
                ball._godSlayerCd = 3.2;
                g.entities.push(spawnGodSlayerBarrage(ball, enemy));
                g.addFloatingText(ball.x, ball.y - ball.radius - 16, "GOD SLAYER BARRAGE!", "#ef4444", 15);
                return true;
            }

            const angle = Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
            g.entities.push(spawnSpiralMartialWave(ball, angle, isMonster, false));
            g.spawnParticles(ball.x, ball.y, isMonster ? "#ef4444" : "#38bdf8", 7, 130);
            g.addFloatingText(ball.x, ball.y - ball.radius - 12, "WHIRLWIND FIST!", isMonster ? "#ef4444" : "#38bdf8", 13);
            return true;
        },
        onHit(ball, target, g) {
            if (ball._isCosmicGarou) {
                g.dealDamage(ball, target, 4, { source: "Nuclear Fission Fist", color: "#c084fc" });
                g.spawnParticles(target.x, target.y, "#c084fc", 8, 170);
                return;
            }
            if (ball.ultTimer > 0) {
                g.dealDamage(ball, target, 4, { source: "Monster Calamity Strike", color: "#ef4444" });
                g.spawnParticles(target.x, target.y, "#ef4444", 6, 150);
                if ((ball._garouRuptureTimer || 0) <= 0) {
                    ball._garouRuptureTimer = 1.8;
                    g.addFloatingText(target.x, target.y - 16, "FA JIN!", "#ef4444", 13);
                }
            }
        },
    };

    const SKILL_WATER_STREAM_COUNTER = {
        id: "garou_water_stream_counter",
        name: "Water Stream Rock Smashing Counter",
        cooldown: 4.5,
        desc: "Deflects incoming melee/strikes with a flowing counter. In Moon Arena: becomes Gamma Ray Burst.",
        onTick(ball, g) {
            if (ball._isCosmicGarou && (g._moonArenaTimer || 0) > 0) {
                const enemy = pickNearestEnemy(ball, g);
                if (!enemy) return false;
                const angle = Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
                g.entities.push(spawnGammaRayBurstBeam(ball, angle));
                g.addFloatingText(ball.x, ball.y - ball.radius - 16, "GAMMA RAY BURST!", "#f0abfc", 16);
                return true;
            }
            g.entities.push(spawnWaterStreamStance(ball));
            g.addFloatingText(
                ball.x,
                ball.y - ball.radius - 14,
                "FLOWING STANCE!",
                ball._isCosmicGarou ? "#c084fc" : ball.ultTimer > 0 ? "#ef4444" : "#38bdf8",
                13
            );
            return true;
        },
    };

    BF.WEAPON_DRAWERS.martial_aura = (ctx, ball, r) => {
        if (ball._isCosmicGarou) {
            const t = performance.now() / 220;
            ctx.save();
            ctx.rotate(t);
            ctx.strokeStyle = "rgba(192, 132, 252, 0.75)";
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.ellipse(0, 0, r + 13, r + 5, 0.4, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.ellipse(0, 0, r + 13, r + 5, -0.4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            return;
        }
        if (ball.ultTimer > 0) {
            const t = performance.now() / 160;
            ctx.save();
            ctx.rotate(t);
            ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, r + 9, 0, Math.PI * 1.15);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, r + 9, Math.PI, Math.PI * 2.15);
            ctx.stroke();
            ctx.restore();
        }
    };

    BF.COSTUME_DRAWERS.garou = (ball, r, c) => {
        const isCosmic = Boolean(ball._isCosmicGarou);
        const isMonster = ball.ultTimer > 0 && !isCosmic;

        if (isCosmic) {
            const t = performance.now() / 420;
            // Deep cosmos body fill
            const grad = c.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r);
            grad.addColorStop(0, "#1e1b4b");
            grad.addColorStop(0.55, "#0f172a");
            grad.addColorStop(1, "#020617");
            c.fillStyle = grad;
            c.beginPath();
            c.arc(0, 0, r, 0, Math.PI * 2);
            c.fill();

            // Galaxy spiral & stars inside face/body
            c.save();
            c.beginPath();
            c.arc(0, 0, r - 1, 0, Math.PI * 2);
            c.clip();

            // Nebula glow
            const neb = c.createRadialGradient(0, 0, 2, 0, 0, r * 0.85);
            neb.addColorStop(0, "rgba(192, 132, 252, 0.65)");
            neb.addColorStop(0.5, "rgba(56, 189, 248, 0.3)");
            neb.addColorStop(1, "rgba(15, 23, 42, 0)");
            c.fillStyle = neb;
            c.beginPath();
            c.arc(0, 0, r * 0.85, 0, Math.PI * 2);
            c.fill();

            // Spiral galaxy arms
            c.strokeStyle = "rgba(224, 242, 254, 0.85)";
            c.lineWidth = 2;
            c.beginPath();
            for (let a = 0; a < Math.PI * 3; a += 0.25) {
                const rr = a * 2.1;
                const px = Math.cos(a + t) * rr;
                const py = Math.sin(a + t) * rr;
                if (a === 0) c.moveTo(px, py);
                else c.lineTo(px, py);
            }
            c.stroke();

            // Twinkling starfield dots
            const stars = [
                [-0.5, -0.45],
                [0.48, -0.38],
                [-0.36, 0.42],
                [0.42, 0.36],
                [0.08, -0.58],
                [-0.15, 0.55],
            ];
            c.fillStyle = "#f8fafc";
            for (const [sx, sy] of stars) {
                c.beginPath();
                c.arc(sx * r, sy * r, 1.5, 0, Math.PI * 2);
                c.fill();
            }
            c.restore();

            // Cosmic horned hair silhouette
            c.fillStyle = "#1e1b4b";
            c.strokeStyle = "#38bdf8";
            c.lineWidth = 1.6;
            c.beginPath();
            c.moveTo(-r * 0.88, -r * 0.15);
            c.lineTo(-r * 1.18, -r * 0.92);
            c.lineTo(-r * 0.34, -r * 0.68);
            c.lineTo(0, -r * 1.02);
            c.lineTo(r * 0.34, -r * 0.68);
            c.lineTo(r * 1.18, -r * 0.92);
            c.lineTo(r * 0.88, -r * 0.15);
            c.closePath();
            c.fill();
            c.stroke();
        } else if (isMonster) {
            // Monster Form: black-crimson cracked carapace
            c.fillStyle = "#111827";
            c.beginPath();
            c.arc(0, 0, r, 0, Math.PI * 2);
            c.fill();

            // Glowing crimson cracks
            c.strokeStyle = "#ef4444";
            c.lineWidth = 2.1;
            c.beginPath();
            c.moveTo(-r * 0.65, -r * 0.1);
            c.lineTo(-r * 0.25, r * 0.12);
            c.lineTo(-r * 0.45, r * 0.52);
            c.moveTo(r * 0.62, -r * 0.18);
            c.lineTo(r * 0.26, r * 0.18);
            c.lineTo(r * 0.44, r * 0.54);
            c.stroke();

            // Monster horned spikes
            c.fillStyle = "#0f172a";
            c.strokeStyle = "#dc2626";
            c.lineWidth = 1.6;
            c.beginPath();
            c.moveTo(-r * 0.86, -r * 0.18);
            c.lineTo(-r * 1.14, -r * 0.88);
            c.lineTo(-r * 0.34, -r * 0.66);
            c.lineTo(0, -r * 0.96);
            c.lineTo(r * 0.34, -r * 0.66);
            c.lineTo(r * 1.14, -r * 0.88);
            c.lineTo(r * 0.86, -r * 0.18);
            c.closePath();
            c.fill();
            c.stroke();

            // Glowing red eyes
            c.fillStyle = "#f87171";
            c.beginPath();
            c.ellipse(-r * 0.28, -r * 0.08, r * 0.15, r * 0.08, 0.22, 0, Math.PI * 2);
            c.ellipse(r * 0.28, -r * 0.08, r * 0.15, r * 0.08, -0.22, 0, Math.PI * 2);
            c.fill();
        } else {
            // Base Form: Red-orange Hair Garou
            c.fillStyle = "#18181b";
            c.beginPath();
            c.arc(0, 0, r, 0, Math.PI * 2);
            c.fill();

            // Face patch
            c.fillStyle = "#f5d0a9";
            c.beginPath();
            c.arc(0, r * 0.06, r * 0.68, 0, Math.PI * 2);
            c.fill();

            // Red-orange swept twin-horn hair
            c.fillStyle = "#ea580c";
            c.strokeStyle = "#9a3412";
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(-r * 0.82, -r * 0.12);
            c.lineTo(-r * 1.08, -r * 0.78);
            c.lineTo(-r * 0.32, -r * 0.56);
            c.lineTo(0, -r * 0.84);
            c.lineTo(r * 0.32, -r * 0.56);
            c.lineTo(r * 1.08, -r * 0.78);
            c.lineTo(r * 0.82, -r * 0.12);
            c.closePath();
            c.fill();
            c.stroke();

            // Sharp determined eyes
            c.fillStyle = "#18181b";
            c.beginPath();
            c.ellipse(-r * 0.24, 0, r * 0.12, r * 0.08, 0.15, 0, Math.PI * 2);
            c.ellipse(r * 0.24, 0, r * 0.12, r * 0.08, -0.15, 0, Math.PI * 2);
            c.fill();

            // Yellow-amber iris glare
            c.fillStyle = "#f59e0b";
            c.beginPath();
            c.arc(-r * 0.22, 0, r * 0.05, 0, Math.PI * 2);
            c.arc(r * 0.22, 0, r * 0.05, 0, Math.PI * 2);
            c.fill();
        }
    };

    BF.CHARACTER_ROSTER.garou = {
        id: "garou",
        name: "Garou",
        role: "Hero Hunter",
        color: "#ea580c",
        accent: "#38bdf8",
        costume: "garou",
        weapon: null,
        ult: "cosmic_fear",
        baseStats: { hp: 100, speed: 308, atk: 5, radius: 22 },
        skills: [SKILL_WHIRLWIND_FIST, SKILL_WATER_STREAM_COUNTER],
    };
})();
