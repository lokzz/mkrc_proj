function cleanup () {
    controller.A.onEvent(pressDown, function () { })
    controller.B.onEvent(pressDown, function () { })
    controller.up.onEvent(pressDown, function () { })
    controller.down.onEvent(pressDown, function () { })
    controller.left.onEvent(pressDown, function () { })
    controller.right.onEvent(pressDown, function () { })
}
const pressDown = ControllerButtonEvent.Pressed

let current_screen = 113
let prt_summoned: Array<string> = []
let prt_id = "-1"

// keep as-is for now, this should be from 0.5-1.5 (or 0.5-2.0) at max.
let current_diff = 1

game.debug = true
game.stats = true


// game data vars go here
let gameD_Upgrades = [0, 0]
const savedData = settings.readJSON("BD8f_GameData")


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
                    lvlList.forEach(function (name, idx) { builtstr += `${selection === idx ? ">" : ""} ${name} ${selection === idx ? (" - " + diff_lv[difficulty]) : ""}\n` })
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

        case 1:
            cleanup()
            let sel: any = null // literally a 0 and a 1, true = sld, false = atk, null = unselected
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
                        let upgrade_str: string
                        if (gameD_Upgrades[1] >= 3) {
                            upgrade_str = "Max"
                        } else {
                            upgrade_str = "" + gameD_Upgrades[1] + "->" + (gameD_Upgrades[1] + 1)
                        }
                        screen.print("\n\n\n\n+Attack  " + upgrade_str, 0, 12, 0, image.scaledFont(image.font8, 2))
                        screen.print("\n\n\n\n\n\n\n\n\n\n   Upgrades  your tank's\n   bullets", 0, 0)
                    }
                })
                prt_summoned.push("1-1")
            }
            // function updateText()
            controller.left.onEvent(pressDown, function () { sel = !sel })
            controller.right.onEvent(pressDown, function () { sel = !sel })
            upg_sld.x -= 35
            upg_atk.x += 35

            controller.A.onEvent(pressDown, function () {
                if (sel === true && gameD_Upgrades[0] < 3) { // again: true = sld, false = atk, null = unselected
                    gameD_Upgrades[0] += 1
                }
                else if (sel === false && gameD_Upgrades[1] < 3) {
                    gameD_Upgrades[1] += 1
                } // wtf?
                console.log(gameD_Upgrades)
                return
            })
            pauseUntil(() => current_screen === -516)



        default:
            cleanup()
            game.onPaint(function () {
                screen.print("\n\n\n\n   CRASH:\n   UNKNOWN SCREENID " + current_screen, 0, 0)
            })
            pause(5000)
            game.gameOver(
                false
            )
            
    }
}
