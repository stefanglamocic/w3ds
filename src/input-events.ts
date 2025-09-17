export class InputEvents {
    rotDelta: [number, number] = [0, 0];
    movDelta: [number, number] = [0, 0];
    zoomDelta = 0;

    private activeKeys: Record<string, boolean> = {};
    middleMActive = false;
    rightMActive = false;
    private mousePos: [number, number] = [0, 0]; 

    constructor() {
        window.addEventListener('keydown', (event) => this.activeKeys[event.key] = true);
        window.addEventListener('keyup', (event) => this.activeKeys[event.key] = false);
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('contextmenu', event => event.preventDefault());
        window.addEventListener('wheel', event => this.zoomDelta += event.deltaY);
    }

    isKeyActive(key: string) {
        return this.activeKeys[key] === true;
    }

    private onMouseDown = (event: MouseEvent) => {
        this.mousePos = [event.clientX, event.clientY];
        
        if (event.button === 1) {
            this.middleMActive = true;
        }

        if (event.button === 2) {
            this.rightMActive = true;
        }

        event.preventDefault();
    }

    private onMouseUp = (event: MouseEvent) => {
        if (event.button === 1)
            this.middleMActive = false;

        if (event.button === 2)
            this.rightMActive = false;

        event.preventDefault();
    }

    private onMouseMove = (event: MouseEvent) => {
        const dx = event.clientX - this.mousePos[0];
        const dy = event.clientY - this.mousePos[1];

        if (this.middleMActive) {
            this.rotDelta[0] += dx;
            this.rotDelta[1] += dy;
        }
        else if (this.rightMActive) {
            this.movDelta[0] += dx;
            this.movDelta[1] += dy;
        }

        this.mousePos = [event.clientX, event.clientY];
    }

}