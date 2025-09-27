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
const expandIFile = 'res/icons/expand.svg';
const contractIFile = 'res/icons/contract.svg';

enum TransformationState {
    IDLE,
    MOVE,
    ROTATION,
    SCALE
};

var objInput!: HTMLInputElement;
var texInput!: HTMLInputElement;
var bottomPane: HTMLDivElement;
var gizmo!: HTMLDivElement;
var scaleCont: HTMLDivElement;
var transLbl: HTMLLabelElement;
let gState = TransformationState.IDLE;
var intervalID: number;

const movDelta = 0.15;
const rotDelta = 0.85;
const scaleDelta = 0.05;

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

    bottomPane = document.createElement('div');
    bottomPane.classList.add('bottom-pane');

    const importBtn = await createSvgButton(cubeIFile);
    const textureBtn = await createSvgButton(brushIFile);
    const removeBtn = await createSvgButton(removeIFile);

    const moveBtn = await createSvgButton(moveIFile);
    const rotBtn = await createSvgButton(rotIFile);
    const scaleBtn = await createSvgButton(scaleIFile);

    const expandBtn = await createSvgButton(expandIFile);
    expandBtn.classList.add('scale-btn');
    const contractBtn = await createSvgButton(contractIFile);
    contractBtn.classList.add('scale-btn');

    scaleCont = document.createElement('div');
    scaleCont.classList.add('scale-cont');
    scaleCont.append(expandBtn, contractBtn);

    createGizmo(renderer);

    transLbl = document.createElement('label');
    transLbl.classList.add('trans-lbl');

    leftPane.append(importBtn, textureBtn, removeBtn);
    rightPane.append(moveBtn, rotBtn, scaleBtn);
    bottomPane.append(transLbl, gizmo, scaleCont);

    const hideElements = () => {
        hideElement(textureBtn);
        hideElement(removeBtn);
        hideElement(rightPane);
        hideElement(bottomPane);
        hideElement(scaleCont);
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
            resetState(rightPane);
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

    expandBtn.addEventListener('click', () => {
        renderer.getSelectedRenderable()?.scaleX(scaleDelta);
        renderer.getSelectedRenderable()?.scaleY(scaleDelta);
        renderer.getSelectedRenderable()?.scaleZ(scaleDelta);
    });

    contractBtn.addEventListener('click', () => {
        renderer.getSelectedRenderable()?.scaleX(-scaleDelta);
        renderer.getSelectedRenderable()?.scaleY(-scaleDelta);
        renderer.getSelectedRenderable()?.scaleZ(-scaleDelta);
    });

    document.body.appendChild(leftPane);
    document.body.appendChild(rightPane);
    document.body.appendChild(bottomPane);

    hideElements();
}

function createGizmo(renderer: Renderer) {
    gizmo = document.createElement('div');
    gizmo.classList.add('gizmo');

    const y = createAxis('y-wrapper', 'y');
    const my = createAxis('my-wrapper', 'my');
    const x = createAxis('x-wrapper', 'x');
    const mx = createAxis('mx-wrapper', 'mx');
    const z = createAxis('z-wrapper', 'z');
    const mz = createAxis('mz-wrapper', 'mz');

    gizmo.append(y, my, x, mx, z, mz);

    const methodMap = createMethodMap();

    for (const node of gizmo.children) {
        node.addEventListener('mousedown', 
            () => gizmoMouseDown(renderer, methodMap, node as HTMLDivElement));
        node.addEventListener('mouseup', gizmoMouseUp);
    }
}

function gizmoMouseDown(renderer: Renderer, 
    methodMap: Record<string, (r: Renderable) => void>,
    axis: HTMLDivElement
    ) {
    intervalID = window.setInterval(() => {
        const axId = axis.className.split(' ')[1]?.split('-')[0];
        const selectedObj = renderer.getSelectedRenderable()!;
        const key = gState + axId!;

        if (key in methodMap) {
            methodMap[key]!(selectedObj);
        }

    }, 50);
}

function gizmoMouseUp() {
    window.clearInterval(intervalID);
}

function createMethodMap() {
    return {
        [TransformationState.MOVE + "x"]: (r: Renderable) => r.moveX(movDelta),
        [TransformationState.MOVE + "mx"]: (r: Renderable) => r.moveX(-movDelta),
        [TransformationState.MOVE + "y"]: (r: Renderable) => r.moveY(movDelta),
        [TransformationState.MOVE + "my"]: (r: Renderable) => r.moveY(-movDelta),
        [TransformationState.MOVE + "z"]: (r: Renderable) => r.moveZ(movDelta),
        [TransformationState.MOVE + "mz"]: (r: Renderable) => r.moveZ(-movDelta),

        [TransformationState.ROTATION + "x"]: (r: Renderable) => r.rotX(rotDelta),
        [TransformationState.ROTATION + "mx"]: (r: Renderable) => r.rotX(-rotDelta),
        [TransformationState.ROTATION + "y"] : (r: Renderable) => r.rotY(rotDelta),
        [TransformationState.ROTATION + "my"] : (r: Renderable) => r.rotY(-rotDelta),
        [TransformationState.ROTATION + "z"] : (r: Renderable) => r.rotZ(rotDelta),
        [TransformationState.ROTATION + "mz"] : (r: Renderable) => r.rotZ(-rotDelta),

        [TransformationState.SCALE + "x"]: (r: Renderable) => r.scaleX(scaleDelta),
        [TransformationState.SCALE + "mx"]: (r: Renderable) => r.scaleX(-scaleDelta),
        [TransformationState.SCALE + "y"]: (r: Renderable) => r.scaleY(scaleDelta),
        [TransformationState.SCALE + "my"]: (r: Renderable) => r.scaleY(-scaleDelta),
        [TransformationState.SCALE + "z"]: (r: Renderable) => r.scaleZ(scaleDelta),
        [TransformationState.SCALE + "mz"]: (r: Renderable) => r.scaleZ(-scaleDelta),
    };
}

function createAxis(wrapClass: string, axisClass: string) {
    const axisWrap = document.createElement('div');
    axisWrap.classList.add('axis-wrapper', wrapClass);
    const axis = document.createElement('div');
    axis.classList.add('axis', axisClass);
    axisWrap.appendChild(axis);

    return axisWrap;
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
        hideElement(bottomPane);

        return;
    }

    switch (state) {
        case TransformationState.MOVE:
            transLbl.textContent = "Move";
            break;
        case TransformationState.ROTATION:
            transLbl.textContent = "Rotate";
            break;
        case TransformationState.SCALE: 
            transLbl.textContent = "Scale";
            break;
    };

    const pane = btn.parentElement!;
    for (const b of pane.children)
        b.classList.remove('active');

    gState = state;
    btn.classList.add('active');
    showElement(bottomPane);
    if (gState === TransformationState.SCALE)
        showElement(scaleCont);
    else
        hideElement(scaleCont);
}

function resetState(pane: HTMLDivElement) {
    for (const btn of pane.children)
        btn.classList.remove('active');

    gState = TransformationState.IDLE;
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