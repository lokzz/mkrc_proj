function cleanup () {
    game.onPaint(function() {})
controller.A.onEvent(ControllerButtonEvent.Pressed, function() {})
controller.B.onEvent(ControllerButtonEvent.Pressed, function() {})
controller.up.onEvent(ControllerButtonEvent.Pressed, function() {})
controller.down.onEvent(ControllerButtonEvent.Pressed, function() {})
controller.left.onEvent(ControllerButtonEvent.Pressed, function() {})
controller.right.onEvent(ControllerButtonEvent.Pressed, function() {})
}
let current_screen = 0
// 0 = menu, 1 = upgrades screen, 2-6 = levels 1-5
while (true) {
    switch (current_screen) {
        case 0:
            cleanup()
            // let int_menu = sprites.create(assets.image`nil`, SpriteKind.Player)
            // int_menu.y = 120
            // int_menu.sayText("Menu: (use A to switch, B to select.)\nLevel 1\nLevel 2", 50000000)
            // screen.print("Menu: (use A to switch, B to select.)\nLevel 1\nLevel 2", 0,0)
            let selection = 0 // bump this up by 2 when using this var to modify current_screen
            let difficulty = 1 // 0 = ez 1 = normal, 2 = hard (optional code, ez = 0.5x spawn/hp?, normal = 1x, hard = 1.5x)
            let dbg_isPressedA = false
            let dbg_pressedData = [0, 0]
            const lvlList = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"]
            const diff_lv = ["Easy", "Normal", "Hard"]
            game.onPaint(function () {
                screen.print(`Main Menu:\n(Dpad: move, A: select)\n\n\n\n\n\n\n\n\npress_data=[${dbg_pressedData[0]}, ${dbg_pressedData[1]}]\n@proj v0.1`, 0, 0)
                // build the menu string & display here
                screen.print("\n\n\n"+selection + " - " + difficulty, 0, 0)
                let builtstr = ""
                lvlList.forEach(function(name, idx) {builtstr += selection === idx ? ">" : ""; builtstr += name; builtstr += selection === idx ? (" - " + diff_lv[difficulty]) : ""; builtstr += "\n"})
                screen.print("\n\n\n\n" + builtstr, 0, 0)
            })
            controller.up.onEvent(ControllerButtonEvent.Pressed, function () { selection -= 1; selection < 0 ? selection = 4 : false})
            controller.down.onEvent(ControllerButtonEvent.Pressed, function () { selection += 1; selection > 4 ? selection = 0 : false})
            controller.left.onEvent(ControllerButtonEvent.Pressed, function () { difficulty -= 1; difficulty < 0 ? difficulty = 2 : false})
            controller.right.onEvent(ControllerButtonEvent.Pressed, function () { difficulty += 1; difficulty > 2 ? difficulty = 0 : false})
            controller.A.onEvent(ControllerButtonEvent.Pressed, function () { dbg_isPressedA = true; dbg_pressedData = [selection, difficulty]})
            pauseUntil(() => selection === -1)
    }
}
