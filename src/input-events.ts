export class InputEvents {
    rotDelta: [number, number] = [0, 0];

    private activeKeys: Record<string, boolean> = {};
    middleMActive = false;
    private mousePos: [number, number] = [0, 0]; 

    constructor() {
        window.addEventListener('keydown', (event) => this.activeKeys[event.key] = true);
        window.addEventListener('keyup', (event) => this.activeKeys[event.key] = false);
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousemove', this.onMouseMove);
    }

    isKeyActive(key: string) {
        return this.activeKeys[key] === true;
    }

    private onMouseDown = (event: MouseEvent) => {
        if (event.button === 1) {
            this.middleMActive = true;
            this.mousePos = [event.clientX, event.clientY];
        }

        event.preventDefault();
    }

    private onMouseUp = (event: MouseEvent) => {
        if (event.button === 1)
            this.middleMActive = false;

        event.preventDefault();
    }

    private onMouseMove = (event: MouseEvent) => {
        const dx = event.clientX - this.mousePos[0];
        const dy = event.clientY - this.mousePos[1];

        if (this.middleMActive) {
            this.rotDelta[0] += dx;
            this.rotDelta[1] += dy;
        }

        this.mousePos = [event.clientX, event.clientY];
    }

}