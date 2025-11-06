function cleanup () {
    controller.A.onEvent(pressDown, function () {})
    controller.B.onEvent(pressDown, function () {})
    controller.up.onEvent(pressDown, function () {})
    controller.down.onEvent(pressDown, function () {})
    controller.left.onEvent(pressDown, function () {})
    controller.right.onEvent(pressDown, function () {})
}
let current_screen = 1
// keep as-is for now, this should be from 0.5-1.5 (or 0.5-2.0) at max.
let current_diff = 1
game.debug = true
game.stats = true
const pressDown = ControllerButtonEvent.Pressed
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
            game.onPaint(function () {
                if (!(current_screen === 0)) {
                    return
                }
                screen.print(`Main Menu:\n(Dpad: move, A: select)\n\n\n\n\n\n\n\n\npress_data=[${dbg_pressedData[0]}, ${dbg_pressedData[1]}]\n@proj v0.1`, 0, 0)
                // build the menu string & display here
                screen.print("\n\n\n\n\n\n\n\n\n" + selection + " - " + difficulty, 0, 0) // debug
                let builtstr = ""
                lvlList.forEach(function (name, idx) { builtstr += `${selection === idx ? ">" : ""} ${name} ${selection === idx ? (" - " + diff_lv[difficulty]) : ""}\n`})
                screen.print("\n\n\n" + builtstr, 0, 0)
            })
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
            // scaling.scaleToPercent(upg_sld, 125, ScaleDirection.Uniformly, ScaleAnchor.Middle)
            // scaling.scaleToPercent(upg_atk, 125, ScaleDirection.Uniformly, ScaleAnchor.Middle)
            game.onUpdateInterval(50, function() {
                if (sel === null) { return }
                else if (sel === true) { 
                    scaling.scaleToPercent(upg_sld, 150, ScaleDirection.Uniformly, ScaleAnchor.Middle)
                    scaling.scaleToPercent(upg_atk, 100, ScaleDirection.Uniformly, ScaleAnchor.Middle)
                }
                else {
                    scaling.scaleToPercent(upg_sld, 100, ScaleDirection.Uniformly, ScaleAnchor.Middle)
                    scaling.scaleToPercent(upg_atk, 150, ScaleDirection.Uniformly, ScaleAnchor.Middle)
                }
            })
            controller.left.onEvent(pressDown, function () {sel = !sel})
            controller.right.onEvent(pressDown, function () {sel = !sel})
            upg_sld.x -= 35
            upg_atk.x += 35

            pauseUntil(() => current_screen === -516)



        default:
            cleanup()
            game.onPaint(function() {
                screen.print("\n\n\n\n   CRASH:\n   UNKNOWN SCREENID " + current_screen + difficulty, 0, 0)
            })
            pauseUntil(() => current_screen === -517)
    }
}