const w : number = window.innerWidth, h : number = window.innerHeight, nodes : number = 5
class LinkedLineCircStage {

    canvas : HTMLCanvasElement = document.createElement('canvas')

    context : CanvasRenderingContext2D

    lcl : LinkedCircLine = new LinkedCircLine()

    animator : LCAnimator = new LCAnimator()

    constructor() {
        this.initCanvas()
    }

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = '#212121'
        this.context.fillRect(0, 0, w, h)
        this.lcl.draw(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.lcl.startUpdating(() => {
                this.animator.start(() => {
                    this.render()
                    this.lcl.update(() => {
                        this.animator.stop()
                    })
                })
            })
        }
    }

    static init() {
        const stage : LinkedLineCircStage = new LinkedLineCircStage()
        stage.render()
        stage.handleTap()
    }
}

class LCState {

    scales : Array<number> = [0, 0, 0]

    dir : number =  0

    j : number = 0

    prevScale : number = 0

    update(stopcb : Function) {
        this.scales[this.j] += 0.1 * this.dir
        if (Math.abs(this.scales[this.j] - this.prevScale) > 1) {
            this.scales[this.j] = this.prevScale + this.dir
            this.j += this.dir
            if (this.j == -1 || this.j == this.scales.length) {
                this.j -= this.dir
                this.dir = 0
                this.prevScale = this.scales[this.j]
            }
        }
    }

    startUpdating(startcb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            startcb()
        }
    }
}

class LCAnimator {

    animated : boolean = false

    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(() => {
                cb()
            }, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class LCNode {

    next : LCNode

    prev : LCNode

    state : LCState = new LCState()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new LCNode(this.i + 1)
            this.next.prev = this
        }
    }

    update(stopcb : Function) {
        this.state.update(stopcb)
    }

    startUpdating(startcb : Function) {
        this.state.startUpdating(startcb)
    }

    draw(context : CanvasRenderingContext2D) {
        const index : number = this.i % 2
        const gap : number = w / nodes
        const r : number = gap / 5
        context.lineCap = 'round'
        context.lineWidth = gap / 20
        context.strokeStyle = '#673AB7'
        context.fillStyle = '#673AB7'
        context.save()
        context.translate(this.i * gap + gap * this.state.scales[0], h / 2)
        context.beginPath()
        context.arc(0, 0, r * (1 - this.state.scales[1]) + r * this.state.scales[2], 0, 2 * Math.PI)
        context.fill()
        context.beginPath()
        context.moveTo(0, 0)
        context.lineTo(0, h/5 * (1 - 2 * index) * this.state.scales[1] * (1 - this.state.scales[2]))
        context.stroke()
        context.restore()
    }

    getNext(dir : number, cb : Function) : LCNode {
        var curr : LCNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        if (cb) {
            cb()
        }
        return this
    }
}

class LinkedCircLine {

    dir : number = 1

    curr : LCNode = new LCNode(0)

    draw(context) {
        this.curr.draw(context)
    }

    update(stopcb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            stopcb()
        })
    }

    startUpdating(startcb : Function) {
        this.curr.startUpdating(startcb)
    }
}
