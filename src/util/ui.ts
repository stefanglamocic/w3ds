import type { Renderable } from "../object/renderable.js";
import type { Renderer } from "../rendering/renderer.js";
import { Utility } from "./util.js";

const cubeIFile = 'res/icons/cube.svg';
const boxIFile = 'res/icons/box-unpacking.svg';
const brushIFile = 'res/icons/large-paint-brush.svg';
const moveIFile = 'res/icons/move.svg';
const rotIFile = 'res/icons/perpendicular-rings.svg';
const scaleIFile = 'res/icons/resize.svg';
const removeIFile = 'res/icons/trash-can.svg';

enum TransformationState {
    IDLE,
    MOVE,
    ROTATION,
    SCALE
};

var objInput!: HTMLInputElement;
var texInput!: HTMLInputElement;
let gState = TransformationState.IDLE;

async function createSvgButton(file: string) {
    return Utility.readFile(file)
        .then(svgSource => {
            const btn = document.createElement('button');
            btn.innerHTML = svgSource;

            btn.classList.add('svg-btn');

            const path = btn.querySelector('path')!;

            btn.addEventListener('mousedown', () => btn.style.border = 'solid 1px #444444ff');

            btn.addEventListener('mouseup', () => btn.style.border = '0');

            return btn;
        });
}

export async function addUiElements(renderer: Renderer) {
    const leftPane = document.createElement('div');
    leftPane.classList.add('left-pane');

    const rightPane = document.createElement('div');
    rightPane.classList.add('right-pane');

    const importBtn = await createSvgButton(cubeIFile);
    const textureBtn = await createSvgButton(brushIFile);
    const removeBtn = await createSvgButton(removeIFile);

    const moveBtn = await createSvgButton(moveIFile);
    const rotBtn = await createSvgButton(rotIFile);
    const scaleBtn = await createSvgButton(scaleIFile);

    leftPane.append(importBtn, textureBtn, removeBtn);
    rightPane.append(moveBtn, rotBtn, scaleBtn);

    const hideElements = () => {
        hideElement(textureBtn);
        hideElement(removeBtn);
        hideElement(rightPane);
    };

    const showElements = (r: Renderable) => {
        showElement(rightPane);
        showElement(textureBtn);
        showElement(removeBtn);
        enableButton(textureBtn);

        if (!r.isTexturable())
            disableButton(textureBtn);
    };

    const onObjectSelect = (r: Renderable | null) => {
        if (!r) {
            hideElements();
            return;
        }

        showElements(r);
    };

    initObjInput(renderer, showElements);
    initTexInput(renderer);

    renderer.setOnSelect(onObjectSelect);

    importBtn.addEventListener('click', () => {
        objInput.showPicker();
    });

    textureBtn.addEventListener('click', () => texInput.showPicker());

    removeBtn.addEventListener('click', () => {
        renderer.deleteSelectedObject();
        hideElements();
    });


    moveBtn.addEventListener('click', 
        () => onStateChange(TransformationState.MOVE, moveBtn)
    );

    rotBtn.addEventListener('click', 
        () => onStateChange(TransformationState.ROTATION, rotBtn)
    );

    scaleBtn.addEventListener('click',
        () => onStateChange(TransformationState.SCALE, scaleBtn)
    );

    document.body.appendChild(leftPane);
    document.body.appendChild(rightPane);

    hideElements();
}

function initObjInput(renderer: Renderer, showElements: (r: Renderable) => void) {
    objInput = document.createElement('input');
    objInput.hidden = true;
    objInput.setAttribute('type', 'file');
    objInput.setAttribute('accept', '.obj');
    objInput.addEventListener('change', () => {
        const file = objInput.files?.[0];
        if (!file)
            return;

        renderer.loadRegularModel(file)
            .then(r => {
                renderer.selectRenderable(r);
                showElements(r);
            });
    });
}

function initTexInput(renderer: Renderer) {
    texInput = document.createElement('input');
    texInput.hidden = true;
    texInput.setAttribute('type', 'file');
    texInput.setAttribute('accept', '.jpg,.png');
    texInput.addEventListener('change', () => {
        const file = texInput.files?.[0];
        if (!file)
            return;

        const r = renderer.getSelectedRenderable()!;
        renderer.loadTexture(file, r.getProgram())
            .then(tex => r.setTexture(tex));
    });
}

function onStateChange(state: TransformationState, btn: HTMLButtonElement) {
    if (gState === state) {
        gState = TransformationState.IDLE;
        btn.classList.remove('active');

        return;
    }

    const pane = btn.parentElement!;
    for (const b of pane.children)
        b.classList.remove('active');

    gState = state;
    btn.classList.add('active');
}

export function getObjectInput() {
    return objInput;
}

function hideElement(el: HTMLElement) {
    el.style.display = 'none';
}

function showElement(el: HTMLElement) {
    el.style.display = '';
}

function disableButton(btn: HTMLButtonElement) {
    btn.disabled = true;
    btn.classList.add('disabled');
}

function enableButton(btn: HTMLButtonElement) {
    btn.disabled = false;
    btn.classList.remove('disabled');
}