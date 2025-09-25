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

var objInput!: HTMLInputElement;

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

    renderer.setOnSelect(onObjectSelect);

    importBtn.addEventListener('click', () => {
        objInput.showPicker();
    });

    removeBtn.addEventListener('click', () => {
        renderer.deleteSelectedObject();
        hideElements();
    });

    leftPane.append(importBtn, textureBtn, removeBtn);
    rightPane.append(moveBtn, rotBtn, scaleBtn);

    document.body.appendChild(leftPane);
    document.body.appendChild(rightPane);

    hideElements();
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