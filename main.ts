namespace SpriteKind {
    export const BossSprite = SpriteKind.create();
    export const BossProjectile = SpriteKind.create();
    export const Goto = SpriteKind.create()
}

function cleanup() {
    controller.A.onEvent(pressDown, function () { })
    controller.B.onEvent(pressDown, function () { })
    controller.up.onEvent(pressDown, function () { })
    controller.down.onEvent(pressDown, function () { })
    controller.left.onEvent(pressDown, function () { })
    controller.right.onEvent(pressDown, function () { })
}
let prt_id = ""
// shit fix
let sel: any = null
let prt_summoned: Array<string> = []
let current_screen = 0
const pressDown = ControllerButtonEvent.Pressed
prt_id = "-1"
// keep as-is for now, this should be from 0.5-1.5 (or 0.5-2.0) at max.
let current_diff = 0
game.stats = true
// game data vars go here
let gameD_Upgrades = [1, 1]
// scores[level(s)]: level[easy, normal, hard]
let gameD_scores: number[][]
if (settings.exists("BDDF_GameData")) {
    gameD_scores = settings.readJSON("BDDF_GameData").scr
} else {
    gameD_scores = [
        [-1, -1, -1],
        [-1, -1, -1],
        [-1, -1, -1],
        [-1, -1, -1],
        [-1, -1, -1]
    ]
}

const enemyDMG: { [key: number]: number } = { // level = dmg for now lol
    1: 1,
    2: 2,
    3: 3
}
const enemyHP: { [key: number]: number } = { // subject to change
    1: 1,
    2: 3,
    3: 5
}
const playerDMG: { [key: number]: number } = {
    1: 2,
    2: 4,
    3: 6
}
const playerHP: { [key: number]: number } = { // what does "scaling" mean smh
    1: 4,
    2: 6,
    3: 10
}

function give_pos() {
    let range_x = [-2.5 * 16, 2.5 * 16]
    let range_y = [4 * 16, 7 * 16]
    let loc_x = randint(0 - range_x[0], 0 - range_x[1]) + scene.cameraProperty(CameraProperty.X)
    let loc_y = Math.max((8 * 16), randint(0 - range_y[0], 0 - range_y[1]) + scene.cameraProperty(CameraProperty.Y))
    return { "x": loc_x, "y": loc_y }
}

const yourLooks: { [key: number]: Image } = { // okay maybe this should be outside here
    1: assets.image`Level1`,
    2: assets.image`Level2`,
    3: assets.image`Level3`
}
const enemyLooks: { [key: number]: Image } = {
    1: assets.image`E1`,
    2: assets.image`E2`,
    3: assets.image`E3`
}
const bullets: { [key: number]: Image } = {
    1: assets.image`B1`,
    2: assets.image`B2`,
    3: assets.image`B3`
}

const effectg = extraEffects.createFullPresetsSpreadEffectData(ExtraEffectPresetColor.Fire, ExtraEffectPresetShape.Spark)
const effectp = extraEffects.createFullPresetsSpreadEffectData(ExtraEffectPresetColor.Smoke, ExtraEffectPresetShape.Spark)
const effecty = extraEffects.createFullPresetsSpreadEffectData(ExtraEffectPresetColor.Smoke, ExtraEffectPresetShape.Cloud)
const effectb = extraEffects.createFullPresetsSpreadEffectData(ExtraEffectPresetColor.Ice, ExtraEffectPresetShape.Spark)

// 0 = menu, 1 = upgrades screen, 2-6 = levels 1-5
while (true) {
    if (current_screen === 0) {
        game.pushScene()
        let selection = 0 // bump this up by 2 when using this var to modify current_screen
        let difficulty = 1 // 0 = ez 1 = normal, 2 = hard (optional code, ez = 0.5x spawn/hp?, normal = 1x, hard = 1.5x)
        let dbg_isPressedA = false
        let dbg_pressedData = [0, 0]
        const lvlList = ["Trespass", "Disperse", "Reverse", "Pressure", "Breakthrough"]
        const diff_lv = ["Easy", "Normal", "Hard"]
        settings.writeJSON("BDDF_GameData", { "scr": gameD_scores })
        prt_id = "0-1"
        game.onPaint(function () {
            if (!(prt_id === "0-1")) { return }

            screen.print(`Beat Down Desert Fox\n(Up/Down: move, A: select)\n(Left/Right: difficulty)\n\n\n> [${diff_lv[difficulty]}]${gameD_scores[selection][difficulty] != -1 ? " / score: [" + gameD_scores[selection][difficulty] + "]" : " / unplayed"}`, 0, 0)
            // build the menu string & display here
            // screen.print("\n\n\n\n\n\n\n\n\n" + selection + " - " + difficulty, 0, 0) // debug
            let builtstr = ""
            lvlList.forEach(function (name, idx) { builtstr += `${selection === idx ? ">" : ""} ${name}\n` })
            screen.print("\n\n\n\n\n\n\n" + builtstr, 0, 0)
        })
        controller.up.onEvent(pressDown, function () { selection -= 1; selection < 0 ? selection = 4 : false })
        controller.down.onEvent(pressDown, function () { selection += 1; selection > 4 ? selection = 0 : false })
        controller.left.onEvent(pressDown, function () { difficulty -= 1; difficulty < 0 ? difficulty = 2 : false })
        controller.right.onEvent(pressDown, function () { difficulty += 1; difficulty > 2 ? difficulty = 0 : false })
        controller.A.onEvent(pressDown, function () { dbg_isPressedA = true; dbg_pressedData = [selection, difficulty] })
        pauseUntil(() => dbg_isPressedA)
        current_screen = selection + 2
        current_diff = [0.5, 1, 2][difficulty]
        game.popScene()
    } else if (current_screen === 1) {
        game.pushScene()
        if (JSON.stringify(gameD_Upgrades) == JSON.stringify([3, 3])) { current_screen = 0; game.popScene(); continue }

        sel = null // literally a 0 and a 1, true = sld, false = atk, null = unselected
        let upg_sld = sprites.create(assets.image`upg_sld`, SpriteKind.Player)
        let upg_atk = sprites.create(assets.image`upg_atk`, SpriteKind.Player)
        // if (gameD_Upgrades[0] > 2) {
        //     var nimg = assets.image`upg_sld`

        //     upg_sld.setImage()
        // }
        // scaling.scaleToPercent(upg_sld, 125, ScaleDirection.Uniformly, ScaleAnchor.Middle)
        // scaling.scaleToPercent(upg_atk, 125, ScaleDirection.Uniformly, ScaleAnchor.Middle)
        game.onUpdateInterval(50, function () {
            if (sel === null) { return }
            else if (sel === true) { // again: true = sld, false = atk, null = unselected
                scaling.scaleToPercent(upg_sld, 150, ScaleDirection.Uniformly, ScaleAnchor.Middle)
                scaling.scaleToPercent(upg_atk, 100, ScaleDirection.Uniformly, ScaleAnchor.Middle)
            }
            else {
                scaling.scaleToPercent(upg_sld, 100, ScaleDirection.Uniformly, ScaleAnchor.Middle)
                scaling.scaleToPercent(upg_atk, 150, ScaleDirection.Uniformly, ScaleAnchor.Middle)
            }
        })
        prt_id = "1-1"
        game.onPaint(function () {
            if (!(prt_id === "1-1")) { return }

            screen.print("\n    Choose an upgrade:\n     +DEF   or   +ATK", 2, 0)
            if (sel === null) { screen.print("\n\n\n\n\n\n\n\n\n\n     Left <-  -> Right", 2, 0) }
            else if (sel === true) { // again: true = sld, false = atk, null = unselected
                let upgrade_str: string
                if (gameD_Upgrades[0] >= 3) {
                    upgrade_str = "Max"
                } else {
                    upgrade_str = "" + gameD_Upgrades[0] + "->" + (gameD_Upgrades[0] + 1)
                }
                screen.print("\n\n\n\n+Defense " + upgrade_str, 0, 12, 0, image.scaledFont(image.font8, 2))
                screen.print("\n\n\n\n\n\n\n\n\n\n   Increases your tank's\n   health", 0, 0)
            }
            else {
                let upgrade_str2: string
                if (gameD_Upgrades[1] >= 3) {
                    upgrade_str2 = "Max"
                } else {
                    upgrade_str2 = "" + gameD_Upgrades[1] + "->" + (gameD_Upgrades[1] + 1)
                }
                screen.print("\n\n\n\n+Attack  " + upgrade_str2, 0, 12, 0, image.scaledFont(image.font8, 2))
                screen.print("\n\n\n\n\n\n\n\n\n\n   Upgrades  your tank's\n   bullets", 0, 0)
            }
        })

        // function updateText()
        controller.left.onEvent(pressDown, function () { if (sel === null) { sel = false }; sel = !sel })
        controller.right.onEvent(pressDown, function () { if (sel === null) { sel = true }; sel = !sel })
        upg_sld.x -= 35
        upg_atk.x += 35

        let selected = -1
        controller.A.onEvent(pressDown, function () {
            if (sel === true && gameD_Upgrades[0] < 3) { // again: true = sld, false = atk, null = unselected
                selected = 0
                //gameD_Upgrades[0] += 1
            }
            else if (sel === false && gameD_Upgrades[1] < 3) {
                selected = 1
                //gameD_Upgrades[1] += 1
            } // wtf?
            return
        })
        pauseUntil(() => selected != -1) // should use sel instead but meh
        sprites.destroy(upg_sld)
        sprites.destroy(upg_atk)

        gameD_Upgrades[selected] += 1 // no way it breaks right

        current_screen = 0 // testing
        game.popScene()
    } else if (current_screen === 2) {
        game.pushScene()

        info.setScore(0)
        let v = 0
        let tick = 0
        let bossvx = 30
        let gameIsOver = false
        let gameInBoss: number = 0 // 0 = not yet!, 1 = running cutscene*, 2 = done cutscene!!! start your horses!!!!
        let gameInBossSlowdown: boolean = false // dude how
        let gameBossLastMove: number = 0 // use tick
        let enemies: [Sprite, Sprite, number, number][] = [] // thing itself, walkTo, lastFireTick, level

        tiles.setCurrentTilemap(tilemap`level01_map`)

        let camera = sprites.create(assets.image`nil`, SpriteKind.Player)
        let player = sprites.create(yourLooks[gameD_Upgrades[0]], SpriteKind.Player)

        controller.moveSprite(player, 40, 40)
        player.setStayInScreen(true)
        player.y = 58 * 16
        
        let energyBar = statusbars.create(4, 20, StatusBarKind.Energy)
        energyBar.setBarBorder(1, 12)
        energyBar.attachToSprite(player, 2)
        energyBar.setColor(9, 15)
        energyBar.max = 500
        energyBar.value = 0

        scene.cameraFollowSprite(camera)
        camera.y = 60 * 16
        let cameravy = -25

        let boss = sprites.create(assets.image`Boss1`, SpriteKind.BossSprite)
        boss.y = -1 * 16
        enemies.push([boss, sprites.create(assets.image`nil`, SpriteKind.Goto), 99999999, 99999901])

        pause(100)
        game.showLongText("Stage 1: Trespass\n \nUse Up, Down, Left and Right to move.\nStage 1: Trespass\nYour goal is simple.\nGet to the end, and kill the target.\nStage 1: Trespass\n \nWe've equipped your tank with an\nStage 1: Trespass\nexperimental weapon which kills all enemies nearby,\nStage 1: Trespass\n \nbut it takes a while to charge up.\nStage 1: Trespass\nHit \"B\" to fire, weapon charge is on your left.\nStage 1: Trespass\nAnd also, our targets have protection against it.", DialogLayout.Top)

        sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) {
                let curHP = sprites.readDataNumber(oan, "curHP")
                if (curHP - gameD_Upgrades[1] <= 0) {
                    sprites.setDataNumber(oan, "curHP", -1515)
                    extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 100)
                    oan.destroy()
                    info.setScore(info.score() + (100 * sprites.readDataNumber(oan, "level")))
                    music.play(music.tonePlayable(Note.E, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                } else {
                    let newHP = curHP - gameD_Upgrades[1]
                    let statusbar
                    statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.EnemyHealth, oan)
                    if (statusbar === undefined) {
                        statusbar = statusbars.create(20, 4, StatusBarKind.EnemyHealth)
                        statusbar.attachToSprite(oan, 2)
                        statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                        statusbar.max = sprites.readDataNumber(oan, "maxHP")
                    }
                    statusbar.value = newHP
                    sprites.setDataNumber(oan, "curHP", newHP)
                    extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100, 10)
                }
                teo.destroy()
                return
            }
            if ((enemies[d] as Sprite[])[0] == oan) { return }
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) { return }
            let dmg = enemyDMG[(enemies[d] as number[])[3]]
            if (sprites.readDataNumber((enemies[d] as Sprite[])[0], "curHP") == -1515) {
                dmg = dmg / 2
            }
            info.setScore(info.score() - (dmg * 50))
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100)
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                camera.vy = 0
                controller.moveSprite(player, 0, 0)
                scene.cameraFollowSprite(oan)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                })
                extraEffects.createSpreadEffectAt(effecty, oan.x, oan.y, 1250, 25)
                scene.cameraShake(2, 600)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100, 10, 10)
                    theTarget.destroy()
                })
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                pause(1000)
                current_screen = 0
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (oan, teo) {
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            let dmg = Math.round(sprites.readDataNumber(teo, "curHP") * 2 / 3) / 2
            sprites.setDataNumber(teo, "curHP", -1515)
            extraEffects.createSpreadEffectAt(effectg, teo.x, teo.y, 100, 10)
            teo.destroy()
            if (statusbar.value - dmg < 0.15) { dmg = 0 } // um
            statusbar.value = statusbar.value - dmg
        })

        sprites.onOverlap(SpriteKind.BossSprite, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d != -6) { return } // how???
            let dmg = gameD_Upgrades[1]
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.EnemyHealth, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.EnemyHealth)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = 3 * (current_diff > 1.5 ? 1.5 : current_diff) // 3 hp for first boss i suppose
            }
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                gameInBoss = 3
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                sprites.destroyAllSpritesOfKind(SpriteKind.BossProjectile)
                controller.moveSprite(player, 0, 0)
                oan.vx = 0
                pause(500)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1100, 25)
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                info.setScore(info.score() + 1000) // boss score?
                pause(1000)
                player.setStayInScreen(false)
                player.setFlag(SpriteFlag.Ghost, true)
                player.vy = -40
                pauseUntil(() => player.y < -16)
                current_screen = 1
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.BossProjectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) { return }
            let dmg = 1 // boss dmg
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100)
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                sprites.destroyAllSpritesOfKind(SpriteKind.BossProjectile)
                camera.vy = 0
                controller.moveSprite(player, 0, 0)
                scene.cameraFollowSprite(oan)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                })
                extraEffects.createSpreadEffectAt(effecty, oan.x, oan.y, 1250, 25)
                scene.cameraShake(2, 600)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100, 10, 10)
                    theTarget.destroy()
                })
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                pause(1000)
                current_screen = 0
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.BossSprite, function (oan, teo) {
            extraEffects.createSpreadEffectAt(effecty, ((oan.x + teo.x) / 2), ((oan.y + teo.y) / 2), 250, 25)
            controller.moveSprite(player, 40, 0)
            oan.vy = 250
            pause(250)
            oan.vy = 0
            controller.moveSprite(player, 40, 40)
        })
        
        controller.B.onEvent(pressDown, function () {
            if (energyBar.value == energyBar.max && gameInBoss == 0) {
                extraEffects.createSpreadEffectAt(effectb, player.x, player.y, 500, 200, 1000)
                enemies.forEach(function (i, idx) {
                    if (idx == 0) { return }
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100)
                    theTarget.destroy()
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                    info.setScore(info.score() + 50)
                })
                energyBar.value = 0
            } else if (gameInBoss == 0) {
                for (let index = 0; index < 3; index++) {
                    energyBar.setColor(9, 2)
                    pause(100)
                    energyBar.setColor(9, 15)
                    pause(100)
                }
            }
        })

        let enemyLevels = [1] // change per level!!
        game.onUpdate(function () {
            // console.log(mySprite.tilemapLocation().x)
            tick += 1
            if (tick % (250 / Math.min(1, current_diff)) == 0 && gameInBoss == 0) { // spawn rate here!!!
                let nloc2 = give_pos()
                let newTarget = sprites.create(assets.image`nil`, SpriteKind.Goto)
                newTarget.x = nloc2["x"]
                newTarget.y = nloc2["y"]
                let enemyLevel = enemyLevels[randint(0, enemyLevels.length - 1)]
                let newEnemy = sprites.create(enemyLooks[enemyLevel], SpriteKind.Enemy)
                v = scene.cameraProperty(CameraProperty.X)
                newEnemy.x = randint(0, 1) == 1 ? v - (16 * 5) : v + (16 * 5)
                newEnemy.y = nloc2["y"]
                newEnemy.follow(newTarget, 18)
                sprites.setDataNumber(newEnemy, "maxHP", enemyHP[enemyLevel])
                sprites.setDataNumber(newEnemy, "curHP", enemyHP[enemyLevel])
                sprites.setDataNumber(newEnemy, "level", enemyLevel)
                // controller.moveSprite(newEnemy, 40, 40)
                enemies.push([newEnemy, newTarget, tick, enemyLevel])
            }
            if (tick % 25 == 0 && gameInBoss == 0) { // enemy firing
                enemies.forEach(function (i, idx) {
                    let s = (i as Sprite[])
                    if (sprites.readDataNumber(s[0], "curHP") === -1515) { return }
                    let t = (i as number[])[2]
                    let l = (i as number[])[3]
                    switch (l) {
                        case 1: // only enemy level present here...
                            if (tick - t > 75) { // enemy fire rate!!! (1 tick = 0.033 seconds)
                                (enemies[idx] as number[])[2] = tick
                                let p = sprites.createProjectileFromSprite(bullets[l].clone(), s[0], 0, 50)
                                sprites.setDataNumber(p, "spawner", idx)
                                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                            }
                    }
                })
            }
            if (tick % (current_diff == 0.5 ? 35 : 50) == 0 && !(gameInBoss == 1) && !(gameInBoss == 3)) { // player fire rate
                let p = sprites.createProjectileFromSprite(bullets[gameD_Upgrades[1]], player, 0, -75)
                sprites.setDataNumber(p, "spawner", -6)
                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
            }
            enemies.forEach(function (i, idx) { // enemy initial movement
                let w = (i as Sprite[]) // dude why
                if (w[0] === null) { return }
                if (sprites.readDataNumber(w[0], "curHP") === -1515) { return }
                if (w[1] && w[0].x == w[1].x && w[0].y == w[1].y) {
                    w[1].destroy()
                }
            })
            if (player.isHittingTile(CollisionDirection.Top)) {
                camera.vy = 0
            } else {
                camera.vy = cameravy
            }
            if (player.y < (8 * 16) && camera.y > (10 * 16) && gameInBoss == 0 && !gameInBossSlowdown) {
                controller.moveSprite(player, 40, 20)
                gameInBossSlowdown = true
            } else if (gameInBossSlowdown && camera.y < (8 * 16) && gameInBoss == 0) {
                controller.moveSprite(player, 40, 40)
                gameInBossSlowdown = false
            } else if (player.y < (8 * 16) && camera.y < (8 * 16) && gameInBoss == 0 && !gameInBossSlowdown) {
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
                gameInBoss = 1
                boss.vy = 28
            }
            if (gameInBoss == 1 && boss.y > 16) {
                boss.vy = 0
                gameInBoss = 2
                boss.vx = bossvx
                gameBossLastMove = tick
            }
            if (gameInBoss == 2) {
                if (gameBossLastMove + 20 < tick && Math.abs(player.x - boss.x) > (2 * 16)) {
                    boss.vx = boss.x < player.x ? Math.abs(bossvx) : -Math.abs(bossvx)
                    gameBossLastMove = tick
                } else if (gameBossLastMove + 80 < tick) {
                    boss.vx = -boss.vx
                    gameBossLastMove = tick
                }
                if (tick % 60 == 0) {
                    let p = sprites.createProjectileFromSprite(bullets[1].clone(), boss, 0, 65)
                    p.setKind(SpriteKind.BossProjectile)
                    p.setFlag(SpriteFlag.GhostThroughWalls, true)
                    music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                    p.image.flipY()
                }
            }
            if (gameInBoss == 0) {
                energyBar.value += 1
            } else {
                energyBar.setBarSize(1, 20)
            }
        })

        pauseUntil(() => gameIsOver == true)
        let diff: { [key: number]: number } = {
            0.5: 0,
            1: 1,
            2: 2
        }
        gameD_scores[current_screen-1][diff[current_diff]] = info.score()
        info.showScore(false)
        // current_screen should be set in their separate death logic handlers

        game.popScene()
    } else if (current_screen === 3) {
        game.pushScene()

        info.setScore(0)
        let v = 0
        let tick = 0
        let bossvx = 30
        let gameIsOver = false
        let gameInBoss: number = 0 // 0 = not yet!, 1 = running cutscene*, 2 = done cutscene!!! start your horses!!!!
        let gameInBossSlowdown: boolean = false // dude how
        let gameBossLastMove: number = 0 // use tick
        let enemies: [Sprite, Sprite, number, number][] = [] // thing itself, walkTo, lastFireTick, level

        tiles.setCurrentTilemap(tilemap`level01_map`)

        let camera = sprites.create(assets.image`nil`, SpriteKind.Player)
        let player = sprites.create(yourLooks[gameD_Upgrades[0]], SpriteKind.Player)

        controller.moveSprite(player, 40, 40)
        player.setStayInScreen(true)
        player.y = 58 * 16

        let energyBar = statusbars.create(4, 20, StatusBarKind.Energy)
        energyBar.setBarBorder(1, 12)
        energyBar.attachToSprite(player, 2)
        energyBar.setColor(9, 15)
        energyBar.max = 500
        energyBar.value = 0

        scene.cameraFollowSprite(camera)
        camera.y = 60 * 16
        let cameravy = -25

        let boss = sprites.create(assets.image`Boss2`, SpriteKind.BossSprite)
        boss.y = -1 * 16
        enemies.push([boss, sprites.create(assets.image`nil`, SpriteKind.Goto), 99999999, 99999901])

        pause(100)
        game.showLongText("Stage 2: Disperse\n \nUse Up, Down, Left and Right to move.\nStage 2: Disperse\n \nGet to the end, and kill the target.", DialogLayout.Top)

        sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) {
                let curHP = sprites.readDataNumber(oan, "curHP")
                if (curHP - gameD_Upgrades[1] <= 0) {
                    sprites.setDataNumber(oan, "curHP", -1515)
                    extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 100)
                    oan.destroy()
                    info.setScore(info.score() + (100 * sprites.readDataNumber(oan, "level")))
                    music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                } else {
                    let newHP = curHP - gameD_Upgrades[1]
                    let statusbar
                    statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.EnemyHealth, oan)
                    if (statusbar === undefined) {
                        statusbar = statusbars.create(20, 4, StatusBarKind.EnemyHealth)
                        statusbar.attachToSprite(oan, 2)
                        statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                        statusbar.max = sprites.readDataNumber(oan, "maxHP")
                    }
                    statusbar.value = newHP
                    sprites.setDataNumber(oan, "curHP", newHP)
                    extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100, 10)
                }
                teo.destroy()
                return
            }
            if ((enemies[d] as Sprite[])[0] == oan) { return }
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) { return }
            let dmg = enemyDMG[(enemies[d] as number[])[3]]
            if (sprites.readDataNumber((enemies[d] as Sprite[])[0], "curHP") == -1515) {
                dmg = dmg / 2
            }
            info.setScore(info.score() - (dmg * 50))
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100)
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                camera.vy = 0
                controller.moveSprite(player, 0, 0)
                scene.cameraFollowSprite(oan)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                })
                extraEffects.createSpreadEffectAt(effecty, oan.x, oan.y, 1250, 25)
                scene.cameraShake(2, 600)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100, 10, 10)
                    theTarget.destroy()
                })
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                pause(1000)
                current_screen = 0
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (oan, teo) {
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            let dmg = Math.round(sprites.readDataNumber(teo, "curHP") * 2 / 3) / 2
            sprites.setDataNumber(teo, "curHP", -1515)
            extraEffects.createSpreadEffectAt(effectg, teo.x, teo.y, 100, 10)
            teo.destroy()
            if (statusbar.value - dmg < 0.15) { dmg = 0 } // um
            statusbar.value = statusbar.value - dmg
        })

        sprites.onOverlap(SpriteKind.BossSprite, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d != -6) { return } // how???
            let dmg = gameD_Upgrades[1]
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.EnemyHealth, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.EnemyHealth)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = 5 * (current_diff > 1.5 ? 1.5 : current_diff) // 3 hp for first boss i suppose
            }
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                gameInBoss = 3
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                sprites.destroyAllSpritesOfKind(SpriteKind.BossProjectile)
                controller.moveSprite(player, 0, 0)
                oan.vx = 0
                pause(500)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1100, 25)
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                info.setScore(info.score() + 2000) // boss score?
                pause(1000)
                player.setStayInScreen(false)
                player.setFlag(SpriteFlag.Ghost, true)
                player.vy = -40
                pauseUntil(() => player.y < -16)
                current_screen = 1
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.BossProjectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) { return }
            let dmg = 1.5 // boss dmg
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100)
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                sprites.destroyAllSpritesOfKind(SpriteKind.BossProjectile)
                camera.vy = 0
                controller.moveSprite(player, 0, 0)
                scene.cameraFollowSprite(oan)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                })
                extraEffects.createSpreadEffectAt(effecty, oan.x, oan.y, 1250, 25)
                scene.cameraShake(2, 600)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100, 10, 10)
                    theTarget.destroy()
                })
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                pause(1000)
                current_screen = 0
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.BossSprite, function (oan, teo) {
            extraEffects.createSpreadEffectAt(effecty, ((oan.x + teo.x) / 2), ((oan.y + teo.y) / 2), 250, 25)
            controller.moveSprite(player, 40, 0)
            oan.vy = 250
            pause(250)
            oan.vy = 0
            controller.moveSprite(player, 40, 40)
        })

        controller.B.onEvent(pressDown, function () {
            if (energyBar.value == energyBar.max && gameInBoss == 0) {
                extraEffects.createSpreadEffectAt(effectb, player.x, player.y, 500, 200, 1000)
                enemies.forEach(function (i, idx) {
                    if (idx == 0) { return }
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100)
                    theTarget.destroy()
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                    info.setScore(info.score() + 50)
                })
                energyBar.value = 0
            } else if (gameInBoss == 0) {
                for (let index = 0; index < 3; index++) {
                    energyBar.setColor(9, 2)
                    pause(100)
                    energyBar.setColor(9, 15)
                    pause(100)
                }
            }
        })

        let enemyLevels = [1, 1, 2] // change per level!!
        game.onUpdate(function () {
            // console.log(mySprite.tilemapLocation().x)
            tick += 1
            if (tick % (250 / Math.min(1, current_diff)) == 0 && gameInBoss == 0) { // spawn rate here!!!
                let nloc2 = give_pos()
                let newTarget = sprites.create(assets.image`nil`, SpriteKind.Goto)
                newTarget.x = nloc2["x"]
                newTarget.y = nloc2["y"]
                let enemyLevel = enemyLevels[randint(0, enemyLevels.length - 1)]
                let newEnemy = sprites.create(enemyLooks[enemyLevel], SpriteKind.Enemy)
                v = scene.cameraProperty(CameraProperty.X)
                newEnemy.x = randint(0, 1) == 1 ? v - (16 * 5) : v + (16 * 5)
                newEnemy.y = nloc2["y"]
                newEnemy.follow(newTarget, 18)
                sprites.setDataNumber(newEnemy, "maxHP", enemyHP[enemyLevel])
                sprites.setDataNumber(newEnemy, "curHP", enemyHP[enemyLevel])
                sprites.setDataNumber(newEnemy, "level", enemyLevel)
                // controller.moveSprite(newEnemy, 40, 40)
                enemies.push([newEnemy, newTarget, tick, enemyLevel])
            }
            if (tick % 25 == 0 && gameInBoss == 0) { // enemy firing
                enemies.forEach(function (i, idx) {
                    let s = (i as Sprite[])
                    if (sprites.readDataNumber(s[0], "curHP") === -1515) { return }
                    let t = (i as number[])[2]
                    let l = (i as number[])[3]
                    switch (l) {
                        case 1: // only enemy level present here...
                            if (tick - t > 75) { // enemy fire rate!!! (1 tick = 0.033 seconds)
                                (enemies[idx] as number[])[2] = tick
                                let p = sprites.createProjectileFromSprite(bullets[l].clone(), s[0], 0, 50)
                                p.image.flipY()
                                sprites.setDataNumber(p, "spawner", idx)
                                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                            }
                        case 2:
                            if (tick - t > 100) { // enemy fire rate!!! (1 tick = 0.033 seconds)
                                (enemies[idx] as number[])[2] = tick
                                let p = sprites.createProjectileFromSprite(bullets[l].clone(), s[0], 0, 50)
                                p.image.flipY()
                                sprites.setDataNumber(p, "spawner", idx)
                                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                            }
                    }
                })
            }
            if (tick % (current_diff == 0.5 ? 35 : 50) == 0 && !(gameInBoss == 1) && !(gameInBoss == 3)) { // player fire rate
                let p = sprites.createProjectileFromSprite(bullets[gameD_Upgrades[1]], player, 0, -75)
                sprites.setDataNumber(p, "spawner", -6)
                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
            }
            enemies.forEach(function (i, idx) { // enemy initial movement
                let w = (i as Sprite[]) // dude why
                if (w[0] === null) { return }
                if (sprites.readDataNumber(w[0], "curHP") === -1515) { return }
                if (w[1] && w[0].x == w[1].x && w[0].y == w[1].y) {
                    w[1].destroy()
                }
            })
            if (player.isHittingTile(CollisionDirection.Top)) {
                camera.vy = 0
            } else {
                camera.vy = cameravy
            }
            if (player.y < (8 * 16) && camera.y > (10 * 16) && gameInBoss == 0 && !gameInBossSlowdown) {
                controller.moveSprite(player, 40, 20)
                gameInBossSlowdown = true
            } else if (gameInBossSlowdown && camera.y < (8 * 16) && gameInBoss == 0) {
                controller.moveSprite(player, 40, 40)
                gameInBossSlowdown = false
            } else if (player.y < (8 * 16) && camera.y < (8 * 16) && gameInBoss == 0 && !gameInBossSlowdown) {
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
                gameInBoss = 1
                boss.vy = 28
            }
            if (gameInBoss == 1 && boss.y > 16) {
                boss.vy = 0
                gameInBoss = 2
                boss.vx = bossvx
                gameBossLastMove = tick
            }
            if (gameInBoss == 2) {
                if (gameBossLastMove + 20 < tick && Math.abs(player.x - boss.x) > (2 * 16)) {
                    boss.vx = boss.x < player.x ? Math.abs(bossvx) : -Math.abs(bossvx)
                    gameBossLastMove = tick
                } else if (gameBossLastMove + 80 < tick) {
                    boss.vx = -boss.vx
                    gameBossLastMove = tick
                }
                if (tick % 60 == 0) {
                    let p = sprites.createProjectileFromSprite(bullets[1].clone(), boss, 0, 65)
                    p.setKind(SpriteKind.BossProjectile)
                    p.setFlag(SpriteFlag.GhostThroughWalls, true)
                    music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                    p.image.flipY()
                }
            }
            if (gameInBoss == 0) {
                energyBar.value += 1
            } else {
                energyBar.setBarSize(1, 20)
            }
        })

        pauseUntil(() => gameIsOver == true)
        let diff: { [key: number]: number } = {
            0.5: 0,
            1: 1,
            2: 2
        }
        gameD_scores[current_screen-1][diff[current_diff]] = info.score()
        info.showScore(false)
        // current_screen should be set in their separate death logic handlers

        game.popScene()
    } else if (current_screen === 4) {
        game.pushScene()

        info.setScore(0)
        let v = 0
        let tick = 0
        let bossvx = 35
        let gameIsOver = false
        let gameInBoss: number = 0 // 0 = not yet!, 1 = running cutscene*, 2 = done cutscene!!! start your horses!!!!
        let gameInBossSlowdown: boolean = false // dude how
        let gameBossLastMove: number = 0 // use tick
        let enemies: [Sprite, Sprite, number, number][] = [] // thing itself, walkTo, lastFireTick, level

        tiles.setCurrentTilemap(tilemap`level02_map`)

        let camera = sprites.create(assets.image`nil`, SpriteKind.Player)
        let player = sprites.create(yourLooks[gameD_Upgrades[0]], SpriteKind.Player)

        controller.moveSprite(player, 40, 40)
        player.setStayInScreen(true)
        player.y = 58 * 16

        let energyBar = statusbars.create(4, 20, StatusBarKind.Energy)
        energyBar.setBarBorder(1, 12)
        energyBar.attachToSprite(player, 2)
        energyBar.setColor(9, 15)
        energyBar.max = 500
        energyBar.value = 0

        scene.cameraFollowSprite(camera)
        camera.y = 60 * 16
        let cameravy = -25

        let boss = sprites.create(assets.image`Boss3`, SpriteKind.BossSprite)
        boss.y = -1 * 16
        enemies.push([boss, sprites.create(assets.image`nil`, SpriteKind.Goto), 99999999, 99999901])

        pause(100)
        game.showLongText("Stage 3: Reverse\n \nUse Up, Down, Left and Right to move.\nStage 3: Reverse\n \nGet to the end, and you know what to do.", DialogLayout.Top)

        sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) {
                let curHP = sprites.readDataNumber(oan, "curHP")
                if (curHP - gameD_Upgrades[1] <= 0) {
                    sprites.setDataNumber(oan, "curHP", -1515)
                    extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 100)
                    oan.destroy()
                    info.setScore(info.score() + (100 * sprites.readDataNumber(oan, "level")))
                    music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                } else {
                    let newHP = curHP - gameD_Upgrades[1]
                    let statusbar
                    statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.EnemyHealth, oan)
                    if (statusbar === undefined) {
                        statusbar = statusbars.create(20, 4, StatusBarKind.EnemyHealth)
                        statusbar.attachToSprite(oan, 2)
                        statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                        statusbar.max = sprites.readDataNumber(oan, "maxHP")
                    }
                    statusbar.value = newHP
                    sprites.setDataNumber(oan, "curHP", newHP)
                    extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100, 10)
                }
                teo.destroy()
                return
            }
            if ((enemies[d] as Sprite[])[0] == oan) { return }
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) { return }
            let dmg = enemyDMG[(enemies[d] as number[])[3]]
            if (sprites.readDataNumber((enemies[d] as Sprite[])[0], "curHP") == -1515) {
                dmg = dmg / 2
            }
            info.setScore(info.score() - (dmg * 50))
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100)
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                camera.vy = 0
                controller.moveSprite(player, 0, 0)
                scene.cameraFollowSprite(oan)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                })
                extraEffects.createSpreadEffectAt(effecty, oan.x, oan.y, 1250, 25)
                scene.cameraShake(2, 600)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100, 10, 10)
                    theTarget.destroy()
                })
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                pause(1000)
                current_screen = 0
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (oan, teo) {
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            let dmg = Math.round(sprites.readDataNumber(teo, "curHP") * 2 / 3) / 2
            sprites.setDataNumber(teo, "curHP", -1515)
            extraEffects.createSpreadEffectAt(effectg, teo.x, teo.y, 100, 10)
            teo.destroy()
            if (statusbar.value - dmg < 0.15) { dmg = 0 } // um
            statusbar.value = statusbar.value - dmg
        })

        sprites.onOverlap(SpriteKind.BossSprite, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d != -6) { return } // how???
            let dmg = gameD_Upgrades[1]
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.EnemyHealth, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.EnemyHealth)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = 8 * (current_diff > 1.5 ? 1.5 : current_diff) // 3 hp for first boss i suppose
            }
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                gameInBoss = 3
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                sprites.destroyAllSpritesOfKind(SpriteKind.BossProjectile)
                controller.moveSprite(player, 0, 0)
                oan.vx = 0
                pause(500)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1100, 25)
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                info.setScore(info.score() + 3000) // boss score?
                pause(1000)
                player.setStayInScreen(false)
                player.setFlag(SpriteFlag.Ghost, true)
                player.vy = -40
                pauseUntil(() => player.y < -16)
                current_screen = 1
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.BossProjectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) { return }
            let dmg = 2.5 // boss dmg
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100)
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                sprites.destroyAllSpritesOfKind(SpriteKind.BossProjectile)
                camera.vy = 0
                controller.moveSprite(player, 0, 0)
                scene.cameraFollowSprite(oan)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                })
                extraEffects.createSpreadEffectAt(effecty, oan.x, oan.y, 1250, 25)
                scene.cameraShake(2, 600)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100, 10, 10)
                    theTarget.destroy()
                })
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                pause(1000)
                current_screen = 0
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.BossSprite, function (oan, teo) {
            extraEffects.createSpreadEffectAt(effecty, ((oan.x + teo.x) / 2), ((oan.y + teo.y) / 2), 250, 25)
            controller.moveSprite(player, 40, 0)
            oan.vy = 250
            pause(250)
            oan.vy = 0
            controller.moveSprite(player, 40, 40)
        })

        controller.B.onEvent(pressDown, function () {
            if (energyBar.value == energyBar.max && gameInBoss == 0) {
                extraEffects.createSpreadEffectAt(effectb, player.x, player.y, 500, 200, 1000)
                enemies.forEach(function (i, idx) {
                    if (idx == 0) { return }
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100)
                    theTarget.destroy()
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                    info.setScore(info.score() + 50)
                })
                energyBar.value = 0
            } else if (gameInBoss == 0) {
                for (let index = 0; index < 3; index++) {
                    energyBar.setColor(9, 2)
                    pause(100)
                    energyBar.setColor(9, 15)
                    pause(100)
                }
            }
        })

        let enemyLevels = [1, 2, 2, 2] // change per level!!
        game.onUpdate(function () {
            // console.log(mySprite.tilemapLocation().x)
            tick += 1
            if (tick % (250 / Math.min(1, current_diff)) == 0 && gameInBoss == 0) { // spawn rate here!!!
                let nloc2 = give_pos()
                let newTarget = sprites.create(assets.image`nil`, SpriteKind.Goto)
                newTarget.x = nloc2["x"]
                newTarget.y = nloc2["y"]
                let enemyLevel = enemyLevels[randint(0, enemyLevels.length - 1)]
                let newEnemy = sprites.create(enemyLooks[enemyLevel], SpriteKind.Enemy)
                v = scene.cameraProperty(CameraProperty.X)
                newEnemy.x = randint(0, 1) == 1 ? v - (16 * 5) : v + (16 * 5)
                newEnemy.y = nloc2["y"]
                newEnemy.follow(newTarget, 18)
                sprites.setDataNumber(newEnemy, "maxHP", enemyHP[enemyLevel])
                sprites.setDataNumber(newEnemy, "curHP", enemyHP[enemyLevel])
                sprites.setDataNumber(newEnemy, "level", enemyLevel)
                // controller.moveSprite(newEnemy, 40, 40)
                enemies.push([newEnemy, newTarget, tick, enemyLevel])
            }
            if (tick % 25 == 0 && gameInBoss == 0) { // enemy firing
                enemies.forEach(function (i, idx) {
                    let s = (i as Sprite[])
                    if (sprites.readDataNumber(s[0], "curHP") === -1515) { return }
                    let t = (i as number[])[2]
                    let l = (i as number[])[3]
                    switch (l) {
                        case 1: // only enemy level present here...
                            if (tick - t > 75) { // enemy fire rate!!! (1 tick = 0.033 seconds)
                                (enemies[idx] as number[])[2] = tick
                                let p = sprites.createProjectileFromSprite(bullets[l].clone(), s[0], 0, 50)
                                p.image.flipY()
                                sprites.setDataNumber(p, "spawner", idx)
                                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                            }
                        case 2:
                            if (tick - t > 100) { // enemy fire rate!!! (1 tick = 0.033 seconds)
                                (enemies[idx] as number[])[2] = tick
                                let p = sprites.createProjectileFromSprite(bullets[l].clone(), s[0], 0, 50)
                                p.image.flipY()
                                sprites.setDataNumber(p, "spawner", idx)
                                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                            }
                    }
                })
            }
            if (tick % (current_diff == 0.5 ? 35 : 50) == 0 && !(gameInBoss == 1) && !(gameInBoss == 3)) { // player fire rate
                let p = sprites.createProjectileFromSprite(bullets[gameD_Upgrades[1]], player, 0, -75)
                sprites.setDataNumber(p, "spawner", -6)
                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
            }
            enemies.forEach(function (i, idx) { // enemy initial movement
                let w = (i as Sprite[]) // dude why
                if (w[0] === null) { return }
                if (sprites.readDataNumber(w[0], "curHP") === -1515) { return }
                if (w[1] && w[0].x == w[1].x && w[0].y == w[1].y) {
                    w[1].destroy()
                }
            })
            if (player.isHittingTile(CollisionDirection.Top)) {
                camera.vy = 0
            } else {
                camera.vy = cameravy
            }
            if (player.y < (8 * 16) && camera.y > (10 * 16) && gameInBoss == 0 && !gameInBossSlowdown) {
                controller.moveSprite(player, 40, 20)
                gameInBossSlowdown = true
            } else if (gameInBossSlowdown && camera.y < (8 * 16) && gameInBoss == 0) {
                controller.moveSprite(player, 40, 40)
                gameInBossSlowdown = false
            } else if (player.y < (8 * 16) && camera.y < (8 * 16) && gameInBoss == 0 && !gameInBossSlowdown) {
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
                gameInBoss = 1
                boss.vy = 28
            }
            if (gameInBoss == 1 && boss.y > 16) {
                boss.vy = 0
                gameInBoss = 2
                boss.vx = bossvx
                gameBossLastMove = tick
            }
            if (gameInBoss == 2) {
                if (gameBossLastMove + 15 < tick && Math.abs(player.x - boss.x) > (2 * 16)) {
                    boss.vx = boss.x < player.x ? Math.abs(bossvx) : -Math.abs(bossvx)
                    gameBossLastMove = tick
                } else if (gameBossLastMove + 80 < tick) {
                    boss.vx = -boss.vx
                    gameBossLastMove = tick
                }
                if (tick % 50 == 0) {
                    let p = sprites.createProjectileFromSprite(bullets[2].clone(), boss, 0, 65)
                    p.setKind(SpriteKind.BossProjectile)
                    p.setFlag(SpriteFlag.GhostThroughWalls, true)
                    music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                    p.image.flipY()
                }
            }
            if (gameInBoss == 0) {
                energyBar.value += 1
            } else {
                energyBar.setBarSize(1, 20)
            }
        })

        pauseUntil(() => gameIsOver == true)
        let diff: { [key: number]: number } = {
            0.5: 0,
            1: 1,
            2: 2
        }
        gameD_scores[current_screen-1][diff[current_diff]] = info.score()
        info.showScore(false)
        // current_screen should be set in their separate death logic handlers

        game.popScene()
    } else if (current_screen === 5) {
        game.pushScene()

        info.setScore(0)
        let v = 0
        let tick = 0
        let bossvx = 35
        let gameIsOver = false
        let gameInBoss: number = 0 // 0 = not yet!, 1 = running cutscene*, 2 = done cutscene!!! start your horses!!!!
        let gameInBossSlowdown: boolean = false // dude how
        let gameBossLastMove: number = 0 // use tick
        let enemies: [Sprite, Sprite, number, number][] = [] // thing itself, walkTo, lastFireTick, level

        tiles.setCurrentTilemap(tilemap`level02_map`)

        let camera = sprites.create(assets.image`nil`, SpriteKind.Player)
        let player = sprites.create(yourLooks[gameD_Upgrades[0]], SpriteKind.Player)

        controller.moveSprite(player, 40, 40)
        player.setStayInScreen(true)
        player.y = 58 * 16

        let energyBar = statusbars.create(4, 20, StatusBarKind.Energy)
        energyBar.setBarBorder(1, 12)
        energyBar.attachToSprite(player, 2)
        energyBar.setColor(9, 15)
        energyBar.max = 500
        energyBar.value = 0

        scene.cameraFollowSprite(camera)
        camera.y = 60 * 16
        let cameravy = -25

        let boss = sprites.create(assets.image`Boss4`, SpriteKind.BossSprite)
        boss.y = -1 * 16
        enemies.push([boss, sprites.create(assets.image`nil`, SpriteKind.Goto), 99999999, 99999901])

        pause(100)
        game.showLongText("Stage 4: Pressure\n \nUse Up, Down, Left and Right to move.\nStage 4: Pressure\n \nGood job. You're almost there.\nStage 4: Pressure\nThey're bringing in the stronger tanks, so be careful.", DialogLayout.Top)

        sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) {
                let curHP = sprites.readDataNumber(oan, "curHP")
                if (curHP - gameD_Upgrades[1] <= 0) {
                    sprites.setDataNumber(oan, "curHP", -1515)
                    extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 100)
                    oan.destroy()
                    info.setScore(info.score() + (100 * sprites.readDataNumber(oan, "level")))
                    music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                } else {
                    let newHP = curHP - gameD_Upgrades[1]
                    let statusbar
                    statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.EnemyHealth, oan)
                    if (statusbar === undefined) {
                        statusbar = statusbars.create(20, 4, StatusBarKind.EnemyHealth)
                        statusbar.attachToSprite(oan, 2)
                        statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                        statusbar.max = sprites.readDataNumber(oan, "maxHP")
                    }
                    statusbar.value = newHP
                    sprites.setDataNumber(oan, "curHP", newHP)
                    extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100, 10)
                }
                teo.destroy()
                return
            }
            if ((enemies[d] as Sprite[])[0] == oan) { return }
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) { return }
            let dmg = enemyDMG[(enemies[d] as number[])[3]]
            if (sprites.readDataNumber((enemies[d] as Sprite[])[0], "curHP") == -1515) {
                dmg = dmg / 2
            }
            info.setScore(info.score() - (dmg * 50))
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100)
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                camera.vy = 0
                controller.moveSprite(player, 0, 0)
                scene.cameraFollowSprite(oan)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                })
                extraEffects.createSpreadEffectAt(effecty, oan.x, oan.y, 1250, 25)
                scene.cameraShake(2, 600)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100, 10, 10)
                    theTarget.destroy()
                })
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                pause(1000)
                current_screen = 0
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (oan, teo) {
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            let dmg = Math.round(sprites.readDataNumber(teo, "curHP") * 2 / 3) / 2
            sprites.setDataNumber(teo, "curHP", -1515)
            extraEffects.createSpreadEffectAt(effectg, teo.x, teo.y, 100, 10)
            teo.destroy()
            if (statusbar.value - dmg < 0.15) { dmg = 0 } // um
            statusbar.value = statusbar.value - dmg
        })

        sprites.onOverlap(SpriteKind.BossSprite, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d != -6) { return } // how???
            let dmg = gameD_Upgrades[1]
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.EnemyHealth, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.EnemyHealth)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = 11 * (current_diff > 1.5 ? 1.5 : current_diff) // 3 hp for first boss i suppose
            }
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                gameInBoss = 3
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                sprites.destroyAllSpritesOfKind(SpriteKind.BossProjectile)
                controller.moveSprite(player, 0, 0)
                oan.vx = 0
                pause(500)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1100, 25)
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                info.setScore(info.score() + 4000) // boss score?
                pause(1000)
                player.setStayInScreen(false)
                player.setFlag(SpriteFlag.Ghost, true)
                player.vy = -40
                pauseUntil(() => player.y < -16)
                current_screen = 1
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.BossProjectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) { return }
            let dmg = 2.5 // boss dmg
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100)
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                sprites.destroyAllSpritesOfKind(SpriteKind.BossProjectile)
                camera.vy = 0
                controller.moveSprite(player, 0, 0)
                scene.cameraFollowSprite(oan)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                })
                extraEffects.createSpreadEffectAt(effecty, oan.x, oan.y, 1250, 25)
                scene.cameraShake(2, 600)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100, 10, 10)
                    theTarget.destroy()
                })
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                pause(1000)
                current_screen = 0
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.BossSprite, function (oan, teo) {
            extraEffects.createSpreadEffectAt(effecty, ((oan.x + teo.x) / 2), ((oan.y + teo.y) / 2), 250, 25)
            controller.moveSprite(player, 40, 0)
            oan.vy = 250
            pause(250)
            oan.vy = 0
            controller.moveSprite(player, 40, 40)
        })

        controller.B.onEvent(pressDown, function () {
            if (energyBar.value == energyBar.max && gameInBoss == 0) {
                extraEffects.createSpreadEffectAt(effectb, player.x, player.y, 500, 200, 1000)
                enemies.forEach(function (i, idx) {
                    if (idx == 0) { return }
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100)
                    theTarget.destroy()
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                    info.setScore(info.score() + 50)
                })
                energyBar.value = 0
            } else if (gameInBoss == 0) {
                for (let index = 0; index < 3; index++) {
                    energyBar.setColor(9, 2)
                    pause(100)
                    energyBar.setColor(9, 15)
                    pause(100)
                }
            }
        })

        let enemyLevels = [2, 3] // change per level!!
        game.onUpdate(function () {
            // console.log(mySprite.tilemapLocation().x)
            tick += 1
            if (tick % (250 / Math.min(1, current_diff)) == 0 && gameInBoss == 0) { // spawn rate here!!!
                let nloc2 = give_pos()
                let newTarget = sprites.create(assets.image`nil`, SpriteKind.Goto)
                newTarget.x = nloc2["x"]
                newTarget.y = nloc2["y"]
                let enemyLevel = enemyLevels[randint(0, enemyLevels.length - 1)]
                let newEnemy = sprites.create(enemyLooks[enemyLevel], SpriteKind.Enemy)
                v = scene.cameraProperty(CameraProperty.X)
                newEnemy.x = randint(0, 1) == 1 ? v - (16 * 5) : v + (16 * 5)
                newEnemy.y = nloc2["y"]
                newEnemy.follow(newTarget, 18)
                sprites.setDataNumber(newEnemy, "maxHP", enemyHP[enemyLevel])
                sprites.setDataNumber(newEnemy, "curHP", enemyHP[enemyLevel])
                sprites.setDataNumber(newEnemy, "level", enemyLevel)
                // controller.moveSprite(newEnemy, 40, 40)
                enemies.push([newEnemy, newTarget, tick, enemyLevel])
            }
            if (tick % 25 == 0 && gameInBoss == 0) { // enemy firing
                enemies.forEach(function (i, idx) {
                    let s = (i as Sprite[])
                    if (sprites.readDataNumber(s[0], "curHP") === -1515) { return }
                    let t = (i as number[])[2]
                    let l = (i as number[])[3]
                    switch (l) {
                        case 1: // only enemy level present here...
                            if (tick - t > 75) { // enemy fire rate!!! (1 tick = 0.033 seconds)
                                (enemies[idx] as number[])[2] = tick
                                let p = sprites.createProjectileFromSprite(bullets[l].clone(), s[0], 0, 50)
                                p.image.flipY()
                                sprites.setDataNumber(p, "spawner", idx)
                                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                            }
                        case 2:
                            if (tick - t > 100) { // enemy fire rate!!! (1 tick = 0.033 seconds)
                                (enemies[idx] as number[])[2] = tick
                                let p = sprites.createProjectileFromSprite(bullets[l].clone(), s[0], 0, 50)
                                p.image.flipY()
                                sprites.setDataNumber(p, "spawner", idx)
                                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                            }
                        case 3:
                            if (tick - t > 120) { // enemy fire rate!!! (1 tick = 0.033 seconds)
                                (enemies[idx] as number[])[2] = tick
                                let p = sprites.createProjectileFromSprite(bullets[l].clone(), s[0], 0, 50)
                                p.image.flipY()
                                sprites.setDataNumber(p, "spawner", idx)
                                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                            }
                    }
                })
            }
            if (tick % (current_diff == 0.5 ? 35 : 50) == 0 && !(gameInBoss == 1) && !(gameInBoss == 3)) { // player fire rate
                let p = sprites.createProjectileFromSprite(bullets[gameD_Upgrades[1]], player, 0, -75)
                sprites.setDataNumber(p, "spawner", -6)
                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
            }
            enemies.forEach(function (i, idx) { // enemy initial movement
                let w = (i as Sprite[]) // dude why
                if (w[0] === null) { return }
                if (sprites.readDataNumber(w[0], "curHP") === -1515) { return }
                if (w[1] && w[0].x == w[1].x && w[0].y == w[1].y) {
                    w[1].destroy()
                }
            })
            if (player.isHittingTile(CollisionDirection.Top)) {
                camera.vy = 0
            } else {
                camera.vy = cameravy
            }
            if (player.y < (8 * 16) && camera.y > (10 * 16) && gameInBoss == 0 && !gameInBossSlowdown) {
                controller.moveSprite(player, 40, 20)
                gameInBossSlowdown = true
            } else if (gameInBossSlowdown && camera.y < (8 * 16) && gameInBoss == 0) {
                controller.moveSprite(player, 40, 40)
                gameInBossSlowdown = false
            } else if (player.y < (8 * 16) && camera.y < (8 * 16) && gameInBoss == 0 && !gameInBossSlowdown) {
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
                gameInBoss = 1
                boss.vy = 28
            }
            if (gameInBoss == 1 && boss.y > 16) {
                boss.vy = 0
                gameInBoss = 2
                boss.vx = bossvx
                gameBossLastMove = tick
            }
            if (gameInBoss == 2) {
                if (gameBossLastMove + 15 < tick && Math.abs(player.x - boss.x) > (2 * 16)) {
                    boss.vx = boss.x < player.x ? Math.abs(bossvx) : -Math.abs(bossvx)
                    gameBossLastMove = tick
                } else if (gameBossLastMove + 80 < tick) {
                    boss.vx = -boss.vx
                    gameBossLastMove = tick
                }
                if (tick % 50 == 0) {
                    let p = sprites.createProjectileFromSprite(bullets[2].clone(), boss, 0, 65)
                    p.setKind(SpriteKind.BossProjectile)
                    p.setFlag(SpriteFlag.GhostThroughWalls, true)
                    music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                    p.image.flipY()
                }
            }
            if (gameInBoss == 0) {
                energyBar.value += 1
            } else {
                energyBar.setBarSize(1, 20)
            }
        })

        pauseUntil(() => gameIsOver == true)
        let diff: { [key: number]: number } = {
            0.5: 0,
            1: 1,
            2: 2
        }
        gameD_scores[current_screen-1][diff[current_diff]] = info.score()
        info.showScore(false)
        // current_screen should be set in their separate death logic handlers

        game.popScene()
    } else if (current_screen === 6) {
        game.pushScene()

        info.setScore(0)
        let v = 0
        let tick = 0
        let bossvx = 37
        let gameIsOver = false
        let gameInBoss: number = 0 // 0 = not yet!, 1 = running cutscene*, 2 = done cutscene!!! start your horses!!!!
        let gameInBossSlowdown: boolean = false // dude how
        let gameBossLastMove: number = 0 // use tick
        let enemies: [Sprite, Sprite, number, number][] = [] // thing itself, walkTo, lastFireTick, level

        if (current_diff == 2) { tiles.setCurrentTilemap(tilemap`level04_map`) }
        else { tiles.setCurrentTilemap(tilemap`level03_map`) }

        let camera = sprites.create(assets.image`nil`, SpriteKind.Player)
        let player = sprites.create(yourLooks[gameD_Upgrades[0]], SpriteKind.Player)

        controller.moveSprite(player, 40, 40)
        player.setStayInScreen(true)
        player.y = 58 * 16

        let energyBar = statusbars.create(4, 20, StatusBarKind.Energy)
        energyBar.setBarBorder(1, 12)
        energyBar.attachToSprite(player, 2)
        energyBar.setColor(9, 15)
        energyBar.max = 500
        energyBar.value = 0

        scene.cameraFollowSprite(camera)
        camera.setFlag(SpriteFlag.Ghost, true)
        camera.y = 60 * 16
        let cameravy = -20

        let boss = sprites.create(assets.image`Boss4`, SpriteKind.BossSprite)
        boss.y = -1 * 16
        enemies.push([boss, sprites.create(assets.image`nil`, SpriteKind.Goto), 99999999, 99999901])

        pause(100)
        game.showLongText("Stage 5: Breakthrough\n \nUse Up, Down, Left and Right to move.\nStage 5: Breakthrough\nYou've done well.\nThe last target's in a city area,\nStage 5: Breakthrough\n \nso avoid the civilian houses and buildings.", DialogLayout.Top)

        sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) {
                let curHP = sprites.readDataNumber(oan, "curHP")
                if (curHP - gameD_Upgrades[1] <= 0) {
                    sprites.setDataNumber(oan, "curHP", -1515)
                    extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 100)
                    oan.destroy()
                    info.setScore(info.score() + (100 * sprites.readDataNumber(oan, "level")))
                    music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                } else {
                    let newHP = curHP - gameD_Upgrades[1]
                    let statusbar
                    statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.EnemyHealth, oan)
                    if (statusbar === undefined) {
                        statusbar = statusbars.create(20, 4, StatusBarKind.EnemyHealth)
                        statusbar.attachToSprite(oan, 2)
                        statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                        statusbar.max = sprites.readDataNumber(oan, "maxHP")
                    }
                    statusbar.value = newHP
                    sprites.setDataNumber(oan, "curHP", newHP)
                    extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100, 10)
                }
                teo.destroy()
                return
            }
            if ((enemies[d] as Sprite[])[0] == oan) { return }
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) { return }
            let dmg = enemyDMG[(enemies[d] as number[])[3]]
            if (sprites.readDataNumber((enemies[d] as Sprite[])[0], "curHP") == -1515) {
                dmg = dmg / 2
            }
            info.setScore(info.score() - (dmg * 50))
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100)
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                camera.vy = 0
                controller.moveSprite(player, 0, 0)
                scene.cameraFollowSprite(oan)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                })
                extraEffects.createSpreadEffectAt(effecty, oan.x, oan.y, 1250, 25)
                scene.cameraShake(2, 600)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100, 10, 10)
                    theTarget.destroy()
                })
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                pause(1000)
                current_screen = 0
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (oan, teo) {
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            let dmg = Math.round(sprites.readDataNumber(teo, "curHP") * 2 / 3) / 2
            sprites.setDataNumber(teo, "curHP", -1515)
            extraEffects.createSpreadEffectAt(effectg, teo.x, teo.y, 100, 10)
            teo.destroy()
            if (statusbar.value - dmg < 0.15) { dmg = 0 } // um
            statusbar.value = statusbar.value - dmg
        })

        sprites.onOverlap(SpriteKind.BossSprite, SpriteKind.Projectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d != -6) { return } // how???
            let dmg = gameD_Upgrades[1]
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.EnemyHealth, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.EnemyHealth)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = 14 * (current_diff > 1.5 ? 1.5 : current_diff) // 3 hp for first boss i suppose
            }
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                gameInBoss = 3
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                sprites.destroyAllSpritesOfKind(SpriteKind.BossProjectile)
                controller.moveSprite(player, 0, 0)
                oan.vx = 0
                pause(500)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1100, 25)
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                info.setScore(info.score() + 5000) // boss score?
                pause(1000)
                player.setStayInScreen(false)
                player.setFlag(SpriteFlag.Ghost, true)
                player.vy = -40
                pauseUntil(() => player.y < -16)
                current_screen = 1
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.BossProjectile, function (oan, teo) {
            let d = sprites.readDataNumber(teo, "spawner")
            if (d == -6) { return }
            let dmg = 3 // boss dmg
            let statusbar
            statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, oan)
            if (statusbar === undefined) {
                statusbar = statusbars.create(20, 4, StatusBarKind.Health)
                statusbar.attachToSprite(oan, 2)
                statusbar.positionDirection(CollisionDirection.Bottom)
                statusbar.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
                statusbar.max = playerHP[gameD_Upgrades[0]]
            }
            extraEffects.createSpreadEffectAt(effectp, teo.x, teo.y, 100)
            statusbar.value = statusbar.value - dmg
            if (statusbar.value <= 0) {
                game.onUpdate(function () { }) // stop it
                sprites.destroyAllSpritesOfKind(SpriteKind.BossProjectile)
                camera.vy = 0
                controller.moveSprite(player, 0, 0)
                scene.cameraFollowSprite(oan)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                })
                extraEffects.createSpreadEffectAt(effecty, oan.x, oan.y, 1250, 25)
                scene.cameraShake(2, 600)
                pause(500)
                enemies.forEach(function (i, idx) {
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100, 10, 10)
                    theTarget.destroy()
                })
                scene.cameraShake(4, 1100)
                pause(1000)
                scene.cameraShake(3, 750)
                extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 1000, 100, 100)
                oan.destroy()
                pause(1000)
                current_screen = 0
                gameIsOver = true
            }
            teo.destroy()
        })
        sprites.onOverlap(SpriteKind.Player, SpriteKind.BossSprite, function (oan, teo) {
            extraEffects.createSpreadEffectAt(effecty, ((oan.x + teo.x) / 2), ((oan.y + teo.y) / 2), 250, 25)
            controller.moveSprite(player, 40, 0)
            oan.vy = 250
            pause(250)
            oan.vy = 0
            controller.moveSprite(player, 40, 40)
        })

        controller.B.onEvent(pressDown, function () {
            if (energyBar.value == energyBar.max && gameInBoss == 0) {
                extraEffects.createSpreadEffectAt(effectb, player.x, player.y, 500, 200, 1000)
                enemies.forEach(function (i, idx) {
                    if (idx == 0) { return }
                    let theTarget = (i as Sprite[])[0]
                    extraEffects.createSpreadEffectAt(effectg, theTarget.x, theTarget.y, 100)
                    theTarget.destroy()
                    sprites.setDataNumber(theTarget, "curHP", -1515)
                    info.setScore(info.score() + 50)
                })
                energyBar.value = 0
            } else if (gameInBoss == 0) {
                for (let index = 0; index < 3; index++) {
                    energyBar.setColor(9, 2)
                    pause(100)
                    energyBar.setColor(9, 15)
                    pause(100)
                }
            }
        })

        let enemyLevels = [3] // change per level!!
        game.onUpdate(function () {
            // console.log(mySprite.tilemapLocation().x)
            tick += 1
            if (tick % (250 / Math.min(1, current_diff)) == 0 && gameInBoss == 0) { // spawn rate here!!!
                let nloc2 = give_pos()
                let newTarget = sprites.create(assets.image`nil`, SpriteKind.Goto)
                newTarget.x = nloc2["x"]
                newTarget.y = nloc2["y"]
                let enemyLevel = enemyLevels[randint(0, enemyLevels.length - 1)]
                let newEnemy = sprites.create(enemyLooks[enemyLevel], SpriteKind.Enemy)
                v = scene.cameraProperty(CameraProperty.X)
                newEnemy.x = randint(0, 1) == 1 ? v - (16 * 5) : v + (16 * 5)
                newEnemy.y = nloc2["y"]
                newEnemy.follow(newTarget, 18)
                sprites.setDataNumber(newEnemy, "maxHP", enemyHP[enemyLevel])
                sprites.setDataNumber(newEnemy, "curHP", enemyHP[enemyLevel])
                sprites.setDataNumber(newEnemy, "level", enemyLevel)
                // controller.moveSprite(newEnemy, 40, 40)
                enemies.push([newEnemy, newTarget, tick, enemyLevel])
            }
            if (tick % 25 == 0 && gameInBoss == 0) { // enemy firing
                enemies.forEach(function (i, idx) {
                    let s = (i as Sprite[])
                    if (sprites.readDataNumber(s[0], "curHP") === -1515) { return }
                    let t = (i as number[])[2]
                    let l = (i as number[])[3]
                    switch (l) {
                        case 2:
                            if (tick - t > 100) { // enemy fire rate!!! (1 tick = 0.033 seconds)
                                (enemies[idx] as number[])[2] = tick
                                let p = sprites.createProjectileFromSprite(bullets[l].clone(), s[0], 0, 50)
                                p.image.flipY()
                                sprites.setDataNumber(p, "spawner", idx)
                                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                            }
                        case 3:
                            if (tick - t > 120) { // enemy fire rate!!! (1 tick = 0.033 seconds)
                                (enemies[idx] as number[])[2] = tick
                                let p = sprites.createProjectileFromSprite(bullets[l].clone(), s[0], 0, 50)
                                p.image.flipY()
                                sprites.setDataNumber(p, "spawner", idx)
                                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                            }
                    }
                })
            }
            if (tick % (current_diff == 0.5 ? 35 : 50) == 0 && !(gameInBoss == 1) && !(gameInBoss == 3)) { // player fire rate
                let p = sprites.createProjectileFromSprite(bullets[gameD_Upgrades[1]], player, 0, -75)
                sprites.setDataNumber(p, "spawner", -6)
                p.setFlag(SpriteFlag.GhostThroughWalls, true)
                music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
            }
            enemies.forEach(function (i, idx) { // enemy initial movement
                let w = (i as Sprite[]) // dude why
                if (w[0] === null) { return }
                if (sprites.readDataNumber(w[0], "curHP") === -1515) { return }
                if (w[1] && w[0].x == w[1].x && w[0].y == w[1].y) {
                    w[1].destroy()
                }
            })
            if (player.isHittingTile(CollisionDirection.Top)) {
                camera.vy = 0
            } else {
                camera.vy = cameravy
            }
            if (player.y < (8 * 16) && camera.y > (10 * 16) && gameInBoss == 0 && !gameInBossSlowdown) {
                controller.moveSprite(player, 40, 20)
                gameInBossSlowdown = true
            } else if (gameInBossSlowdown && camera.y < (8 * 16) && gameInBoss == 0) {
                controller.moveSprite(player, 40, 40)
                gameInBossSlowdown = false
            } else if (player.y < (8 * 16) && camera.y < (8 * 16) && gameInBoss == 0 && !gameInBossSlowdown) {
                sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
                sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
                gameInBoss = 1
                boss.vy = 28
            }
            if (gameInBoss == 1 && boss.y > 16) {
                boss.vy = 0
                gameInBoss = 2
                boss.vx = bossvx
                gameBossLastMove = tick
            }
            if (gameInBoss == 2) {
                if (gameBossLastMove + 15 < tick && Math.abs(player.x - boss.x) > (2 * 16)) {
                    boss.vx = boss.x < player.x ? Math.abs(bossvx) : -Math.abs(bossvx)
                    gameBossLastMove = tick
                } else if (gameBossLastMove + 80 < tick) {
                    boss.vx = -boss.vx
                    gameBossLastMove = tick
                }
                if (tick % 45 == 0) {
                    let p = sprites.createProjectileFromSprite(bullets[3].clone(), boss, 0, 65)
                    p.setKind(SpriteKind.BossProjectile)
                    p.setFlag(SpriteFlag.GhostThroughWalls, true)
                    music.play(music.tonePlayable(Note.D, music.beat(BeatFraction.Quarter)), music.PlaybackMode.InBackground)
                    p.image.flipY()
                }
            }
            if (gameInBoss == 0) {
                energyBar.value += 1
            } else {
                energyBar.setBarSize(1, 20)
            }
        })

        pauseUntil(() => gameIsOver == true)
        let diff: { [key: number]: number } = {
            0.5: 0,
            1: 1,
            2: 2
        }
        gameD_scores[current_screen-1][diff[current_diff]] = info.score()
        info.showScore(false)
        // current_screen should be set in their separate death logic handlers

        game.popScene()
    } else {
        cleanup()
        screen.fill(15)
        prt_id = "NoneType"
        console.logValue("ScreenID", current_screen)
        game.onPaint(function () {
            screen.print("\n\n\n\n   CRASH:\n   UNKNOWN SCREENID " + current_screen, 0, 0)
        })
        pause(5000)
        game.gameOver(
            false
        )
    }
}
