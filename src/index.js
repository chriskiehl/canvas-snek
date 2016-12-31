/*
Don't step on snek
 */

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    magnitude() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
    };

    normalize() {
        const magnitude = this.magnitude();
        return new Vector(this.x / magnitude, this.y / magnitude);
    };

    add(other) {
        return new Vector(this.x + other.x, this.y + other.y)
    };

    subtract(other) {
        return new Vector(this.x - other.x, this.y - other.y)
    };

    div(scalar) {
        return new Vector(this.x / scalar, this.y / scalar)
    };

    eq(other) {
        return this.x == other.x && this.y === other.y
    };

    negate() {
        return new Vector(-this.x, -this.y);
    };

    toString() {
        return "<Vector> " + this.x + ", " + this.y
    };
}




const constants = {
    BLOCK_SIZE: 20,

    RIGHT: new Vector(1, 0),
    DOWN: new Vector(0, 1),
    LEFT: new Vector(-1, 0),
    UP: new Vector(0, -1)
};


const makePlayArea = (y, x) => {
    const grid = []
    for (var j = 0; j < y; j++) {
        var row = []
        for (var i = 0; i < x; i++) {
            row.push(0)
        }
        grid.push(row);
    }
    return grid
};

const sameDirection = (current, next) => (
    current.eq(next)
);

const oppositeDirection = (current, next) => (
    current.eq(next.negate())
);

const validDirectionChange = (current, next) => (
    !(sameDirection(current, next) || oppositeDirection(current, next))
)


const run = () => {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");

    const playArea = makePlayArea(
        canvas.width / constants.BLOCK_SIZE,
        canvas.height / constants.BLOCK_SIZE
    )

    var playing = true;

    var keyPressed = false;
    var requestedDirection = null;

    var growBy = 3;

    var lastUpdate = window.performance.now();

    var turning = false;
    var direction = new Vector(0, 1);
    var gridSpeed = 150;

    var needsFruit = true;
    var fruitLoc = null;

    var head = new Vector(10, 4);
    var tail = new Vector(10, 4);

    playArea[head.x][head.y] = head;


    const makeKeyHandler = (bool) => (e) => {
        const keys = {
            37: constants.LEFT,
            38: constants.UP,
            39: constants.RIGHT,
            40: constants.DOWN
        };
        if (keys.hasOwnProperty(e.keyCode)) {
            keyPressed = bool;
            requestedDirection = keys[e.keyCode]
        }
    };

    const keyDownHandler = makeKeyHandler(true);
    const keyUpHandler = makeKeyHandler(false);


    const extendHead = (playArea, head, newPos) => {
        playArea[head.x][head.y] = newPos.subtract(head);
        playArea[newPos.x][newPos.y] = newPos;
    };

    const shrinkTail = (playArea, tail) => {
        const newTail = tail.add(playArea[tail.x][tail.y]);
        playArea[tail.x][tail.y] = 0
        return newTail;
    };

    const outOfBounds = (playArea, pos) => (
        playArea[pos.x] === undefined || playArea[pos.x][pos.y] === undefined
    );

    const generateFruit = (playArea) => {
        var available = [];
        for (var i = 0; i < playArea.length; i++) {
            for (var j = 0; j < playArea[0].length; j++) {
                if (playArea[i][j] == 0) {
                    available.push([i,j])
                }
            }
        }
        const pos = available[Math.floor(Math.random() * available.length)]
        return new Vector(pos[0], pos[1])
    };



    const drawSnekPart = (x, y) => {
        ctx.beginPath();
        ctx.rect(x * 20, y * 20, constants.BLOCK_SIZE, constants.BLOCK_SIZE);
        ctx.fillStyle = "#2f2d32";
        ctx.fill();
        ctx.closePath();
    };

    const horizontalLine = (y) => {
        ctx.beginPath()
        ctx.rect(0, y, canvas.width, 1)
        ctx.fillStyle = "#304c24";
        ctx.fill()
        ctx.closePath()
    };

    const verticalLine = (x) => {
        ctx.beginPath()
        ctx.rect(x, 0, 1, canvas.height)
        ctx.fillStyle = "#304c24";
        ctx.fill()
        ctx.closePath()
    }

    const drawSnek = () => {
        var current = tail;
        while (!current.eq(head)) {
            drawSnekPart(current.x, current.y);
            current = current.add(playArea[current.x][current.y])
        }
        drawSnekPart(head.x, head.y)
    };

    const renderLines = () => {
        for (var i = 0; i < 300; i += 20) {
            horizontalLine(i)
        }
        for (var i = 0; i < 480; i += 20) {
            verticalLine(i)
        }
    };

    const renderFruit = () => {
        if (fruitLoc) {
            ctx.beginPath();
            ctx.arc(fruitLoc.x * 20 + 10, fruitLoc.y * 20 + 10, 8, 0, Math.PI*2);
            ctx.fillStyle = "#0095DD";
            ctx.fill();
            ctx.closePath();
        }
    };

    const renderYouSuck = () => {
        // dim play area
        ctx.beginPath()
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fill()
        ctx.closePath()

        // border
        ctx.beginPath()
        ctx.rect(canvas.width / 2 - 160, canvas.height / 2 - 110,  320, 220);
        ctx.fillStyle = "rgb(47, 45, 50)";
        ctx.fill()
        ctx.closePath()

        // inside
        ctx.beginPath()
        ctx.rect(canvas.width / 2 - 140, canvas.height / 2 - 90,  280, 180);
        ctx.fillStyle = "#a9cb98";
        ctx.fill()
        ctx.closePath()

        // LOSER
        ctx.beginPath()
        ctx.font = "28px impact";
        ctx.fillStyle = "rgb(47, 45, 50)";
        const textInfo = ctx.measureText("YOU LOSE")
        ctx.fillText("YOU LOSE", canvas.width / 2 - textInfo.width/2, 100);
        ctx.fill()
        ctx.closePath()
    }


    function draw() {
        if (!playing) {
            renderYouSuck();
            return
        }

        var now = window.performance.now();
        var timePassed = now - lastUpdate;

        if (!turning && keyPressed) {
            console.log(requestedDirection);
            if (validDirectionChange(direction, requestedDirection)) {
                direction = requestedDirection
                turning = true;
            }
        }

        var nextPos = head.add(direction);

        if (timePassed > gridSpeed) {
            if (outOfBounds(playArea, nextPos) || playArea[nextPos.x][nextPos.y] != 0) {
                playing = false;
            } else {
                extendHead(playArea, head, nextPos);
                head = nextPos;
                lastUpdate = window.performance.now();
                turning = false;
                if (growBy === 0) {
                    tail = shrinkTail(playArea, tail)
                } else {
                    growBy -= 1
                }
            }
        }

        if (fruitLoc == null) {
            fruitLoc = generateFruit(playArea);
            needsFruit = false;
        }

        if (fruitLoc != null && head.eq(fruitLoc)) {
            growBy = 5;
            fruitLoc = null;
            gridSpeed -= gridSpeed * .01
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawSnek();
        renderLines();
        renderFruit();
        requestAnimationFrame(draw);
    }

    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);
    draw();
}