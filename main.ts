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
settings
while (true) {
    switch (current_screen) {
        case 0:
            cleanup()
            // let int_menu = sprites.create(assets.image`nil`, SpriteKind.Player)
            // int_menu.y = 120
            // int_menu.sayText("Menu: (use A to switch, B to select.)\nLevel 1\nLevel 2", 50000000)
            // screen.print("Menu: (use A to switch, B to select.)\nLevel 1\nLevel 2", 0,0)
            let selection = 0
            game.onPaint(function () {
                screen.print("Main Menu:\n(Dpad: move, A: select)\n\n\n\n\n\n\n\n\n\n@proj v0.1", 0, 0)
                // build the menu string & display here
            })
            controller.A.onEvent(ControllerButtonEvent.Pressed, function () { })
    }
}
