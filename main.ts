function doExitScene () {
    screenTransitions.setZ(5, 200)
    prt_id = "NoneType"
    pause(200)
    screenTransitions.startTransition(screenTransitions.Dissolve, 1000, false)
}
function cleanup () {
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
let current_screen = 2
const pressDown = ControllerButtonEvent.Pressed
prt_id = "-1"
// keep as-is for now, this should be from 0.5-1.5 (or 0.5-2.0) at max.
let current_diff = 1
game.stats = true
// game data vars go here
let gameD_Upgrades = [1, 1]
// scores[level(s)]: level[easy, normal, hard]
let gameD_scores = [
[-1, -1, -1],
[-1, -1, -1],
[-1, -1, -1],
[-1, -1, -1],
[-1, -1, -1]
]
settings.writeJSON("BDDF_GameData", { upg: gameD_Upgrades, scr: gameD_scores })
const savedData = settings.readJSON("BDDF_GameData")
gameD_Upgrades = savedData.upg
gameD_scores = savedData.scr

const enemyHP: { [key: number]: number } = { // subject to change
    1: 1,
    2: 3,
    3: 5
}
const playerDMG: { [key: number]: number} = {
    1: 2,
    2: 4,
    3: 6
}

// 0 = menu, 1 = upgrades screen, 2-6 = levels 1-5
while (true) {
    switch (current_screen) {
        case 0:
            cleanup()
            let selection = 0 // bump this up by 2 when using this var to modify current_screen
            let difficulty = 1 // 0 = ez 1 = normal, 2 = hard (optional code, ez = 0.5x spawn/hp?, normal = 1x, hard = 1.5x)
            let dbg_isPressedA = false
            let dbg_pressedData = [0, 0]
            const lvlList = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"]
            const diff_lv = ["Easy", "Normal", "Hard"]
            prt_id = "0-1"
            if (prt_summoned.find(function (v, i) { return v === "0-1" }) === undefined) {
                game.onPaint(function () {
                    if (!(prt_id === "0-1")) { return }

                    screen.print(`Main Menu:\n(Dpad: move, A: select)\n\n\n\n\n\n\n\n\npress_data=[${dbg_pressedData[0]}, ${dbg_pressedData[1]}]\n@proj v0.1`, 0, 0)
                    // build the menu string & display here
                    screen.print("\n\n\n\n\n\n\n\n\n" + selection + " - " + difficulty, 0, 0) // debug
                    let builtstr = ""
                    lvlList.forEach(function (name, idx) { builtstr += `${selection === idx ? ">" : ""} ${name} ${selection === idx ? (" - " + diff_lv[difficulty]) : ""}${(selection === idx && gameD_scores[selection][difficulty] != -1) ? " > " + gameD_scores[selection][difficulty] : ""}\n` })
                    screen.print("\n\n\n" + builtstr, 0, 0)
                })
                prt_summoned.push("0-1")
            }
            controller.up.onEvent(pressDown, function () { selection -= 1; selection < 0 ? selection = 4 : false })
            controller.down.onEvent(pressDown, function () { selection += 1; selection > 4 ? selection = 0 : false })
            controller.left.onEvent(pressDown, function () { difficulty -= 1; difficulty < 0 ? difficulty = 2 : false })
            controller.right.onEvent(pressDown, function () { difficulty += 1; difficulty > 2 ? difficulty = 0 : false })
            controller.A.onEvent(pressDown, function () { dbg_isPressedA = true; dbg_pressedData = [selection, difficulty] })
            pauseUntil(() => dbg_isPressedA)
            current_screen = selection + 2
            
            doExitScene()
            break

        case 1:
            cleanup()
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
            if (prt_summoned.find(function (v, i) { return v === "1-1" }) === undefined) {
                game.onPaint(function () {
                    if (!(prt_id === "1-1")) { return }

                    screen.print("\n    Choose an upgrade:\n     +DEF   or   +ATK", 2, 0)
                    console.log(sel)
                    if (sel === null) { return }
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
                prt_summoned.push("1-1")
            }
            // function updateText()
            controller.left.onEvent(pressDown, function () { sel = !sel; console.log("Left") })
            controller.right.onEvent(pressDown, function () { sel = !sel; console.log("right") })
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

            
            doExitScene()
            break

        case 2:
            // function enemy_logic(enemy: Sprite, player2: Sprite) {
            //     let placement = [
            //         randint(0 - sRange_x[0], 0 - sRange_x[1]) + scene.cameraProperty(CameraProperty.X),
            //         Math.max((8 * 16), randint(0 - sRange_y[0], 0 - sRange_y[1]) + scene.cameraProperty(CameraProperty.Y))
            //     ]
            // }
            function give_pos() {
                let range_x = [-2.5 * 16, 2.5 * 16]
                let range_y = [3 * 16, 7 * 16]
                let loc_x = randint(0 - range_x[0], 0 - range_x[1]) + scene.cameraProperty(CameraProperty.X)
                let loc_y = Math.max((8 * 16), randint(0 - range_y[0], 0 - range_y[1]) + scene.cameraProperty(CameraProperty.Y))
                return { "x": loc_x, "y": loc_y }
            }
            let v = 0
            let nloc: number[] = []
            let tick = 0
            let range_y2: number[] = []
            let range_x2: number[] = []
            let placement: number[] = []
            let sRange_y: number[] = []
            let sRange_x: number[] = []
            let enemies: [Sprite, Sprite, number, number][] = []
            const yourLooks: { [key: number]: Image } = {
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
            let loc_x2 = 0
            let loc_y2 = 0
            console.log(give_pos())
            let camera = sprites.create(assets.image`nil`, SpriteKind.Player)
            let player = sprites.create(yourLooks[gameD_Upgrades[0]], SpriteKind.Player)
            game.stats = true
            // game.consoleOverlay.setVisible(true)
            player.setStayInScreen(true)
            scene.cameraFollowSprite(camera)
            tiles.setCurrentTilemap(tilemap`level01_map`)
            // controller.moveSprite(mySprite, 200, 200)
            camera.y = 60 * 16
            camera.vy = -15
            controller.moveSprite(player, 40, 40)
            sRange_x = [-2.5 * 16, 2.5 * 16]
            const effectg = extraEffects.createFullPresetsSpreadEffectData(ExtraEffectPresetColor.Fire, ExtraEffectPresetShape.Spark)
            sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Projectile, function (oan, teo) {
                let d = sprites.readDataNumber(teo, "spawner")
                if (d == -6) {
                    let curHP = sprites.readDataNumber(oan, "curHP")
                    if (curHP - gameD_Upgrades[1] <= 0) {
                        sprites.setDataNumber(oan, "curHP", -1515)
                        extraEffects.createSpreadEffectAt(effectg, oan.x, oan.y, 100)
                        oan.destroy()
                    } else {
                        sprites.setDataNumber(oan, "curHP", curHP - gameD_Upgrades[1])
                    }
                    teo.destroy()
                    return
                }
                if ((enemies[d] as Sprite[])[0] == oan) {return}
            })
            sprites.onOverlap(SpriteKind.Player, SpriteKind.Projectile, function (oan, teo) {
                let d = sprites.readDataNumber(teo, "spawner")
                if (d == -6) { return }
                
            })
            const enemyLevels = [1, 1] // change per level!!
            game.onUpdate(function () {
                // console.log(mySprite.tilemapLocation().x)
                tick += 1
                if (tick % 250 == 0 && camera.y > 120) {
                    console.log(player.y)
                    let nloc2 = give_pos()
                    let newTarget = sprites.create(assets.image`nil`, SpriteKind.Food)
                    newTarget.x = nloc2["x"]
                    newTarget.y = nloc2["y"]
                    let enemyLevel = randint(enemyLevels[0], enemyLevels[1])
                    let newEnemy = sprites.create(enemyLooks[enemyLevel], SpriteKind.Enemy)
                    v = scene.cameraProperty(CameraProperty.X)
                    newEnemy.x = randint(0, 1) == 1 ? v - (16 * 5) : v + (16 * 5)
                    newEnemy.y = nloc2["y"]
                    newEnemy.setFlag(SpriteFlag.GhostThroughWalls, true)
                    newEnemy.follow(newTarget, 18)
                    sprites.setDataNumber(newEnemy, "curHP", enemyHP[enemyLevel])
                    // controller.moveSprite(newEnemy, 40, 40)
                    enemies.push([newEnemy, newTarget, tick, enemyLevel])
                }
                if (tick % 25 == 0) {
                    enemies.forEach(function (i, idx) {
                        let s = (i as Sprite[])
                        if (sprites.readDataNumber(s[0], "curHP") === -1515) { return }
                        let t = (i as number[])[2]
                        let l = (i as number[])[3]
                        if ((tick - t) > (100 / 1)) { // change the 1 here to make things harder later on
                            let p = sprites.createProjectileFromSprite(bullets[l], s[0], 0, 50)
                            sprites.setDataNumber(p, "spawner", idx)
                        }
                    })
                }
                if (tick % (25 * 2) == 0) { // player fire rate
                    let p = sprites.createProjectileFromSprite(bullets[gameD_Upgrades[1]], player, 0, -75)
                    sprites.setDataNumber(p, "spawner", -6)
                }
                enemies.forEach(function (i, idx) {
                    let w = (i as Sprite[]) // dude wtf
                    if (w[0] === null) { return }
                    if (w[1] && w[0].x == w[1].x && w[0].y == w[1].y) {
                        w[1].destroy()
                    }
                })
                if (player.isHittingTile(CollisionDirection.Top)) {
                    camera.vy = 0
                } else {
                    camera.vy = -25
                }
            })
            pauseUntil(() => current_screen == -517)

        default:
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
