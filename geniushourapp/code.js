// Initillize Python
let pyodide;
async function setup() {
    pyodide = await loadPyodide();
}
setup();

// Run Python
function insert(text = "") {
    programTerminalOutput.push(text);

    const lastLine = terminal.lastLine();
    const lineContent = terminal.getLine(lastLine);

    terminal.replaceRange(
        `>>> ${text}\n`,
        { line: lastLine, ch: lineContent.length }
    );
}

let userInputLine = null;
let userInput = null;
function disableConsoleTyping(i, change) {
    if (change.origin) {
        if (userInputLine !== null) {
            if (!(change.from.line == userInputLine && change.to.line == userInputLine && change.from.ch >= 4 && change.to.ch >= 3) || (change.origin == "paste" && change.text.length > 1)) {
                change.cancel();
            } else if (change.text[0] === "" && change.text[1] === "") {
                userInput = terminal.getLine(userInputLine).slice(4);
                userInputLine = null;
                change.cancel();
            }
        } else {
            change.cancel();
        }
    }
}

async function pythonInput(question) {
    if (question) insert(`${question}`);
    insert();

    userInputLine = terminal.lastLine() - 1;

    terminal.focus();
    terminal.setCursor({ line: userInputLine, ch: 4 });

    await new Promise(resolve => {
        const checkInputLoop = setInterval(() => {
            if (userInput !== null) {
                clearInterval(checkInputLoop);
                resolve();
            }
        })
    });

    const text = userInput;

    userInput = null;

    return text;
}

let verifyTask;
let programTerminalOutput = [];

document.getElementById("runCode").addEventListener("click", async () => {
    programTerminalOutput = [];

    const pythonCode = editor.getValue().replace("input(", "await input(");

    const globalNamespace = pyodide.globals.get("dict")();
    globalNamespace.set("input", pythonInput);

    pyodide.setStdout({ batched: (str) => insert(str) });

    let finalExpression;

    try {
        finalExpression = await pyodide.runPythonAsync(pythonCode, { globals: globalNamespace });

        if (verifyTask) {
            let variables = globalNamespace.toJs();
            delete variables["__builtins__"];
            delete variables["input"];

            if (verifyTask(variables, programTerminalOutput, finalExpression ? finalExpression.toJs() : undefined)) completeTask();
        }
    } catch (e) {
        const lines = e.message.split("\n");
        insert(lines[lines.length - 2]);
        console.error(e.message);
    }
    terminal.scrollTo(0, Infinity);
});

// Python editor setup
const input = document.getElementById("codeInput");
const output = document.getElementById("codeOutput");

let editor, terminal;

function completeTask() {
    const taskElement = document.getElementById("task");

    taskElement.style.background = "#aaffaa";
    taskElement.style.borderColor = "#88dd88";

    document.getElementById("taskStatus").innerText = "Complete";
}

export function setupPython() {
    editor = CodeMirror.fromTextArea(input, {
        lineNumbers: true,
        mode: "python",
        indentUnit: 4,
        indentWithTabs: true,
    });

    terminal = CodeMirror.fromTextArea(output, {
        lineWrapping: true,
        mode: "none",
    });

    terminal.on("beforeChange", disableConsoleTyping);
    terminal.setSize(null, 200);

    for (const element of document.getElementsByClassName("code")) {
        const codeBlock = CodeMirror.fromTextArea(element, {
            lineNumbers: true,
            mode: "python",
            readOnly: "nocursor",
        });
        codeBlock.setSize(null, "100%")
    }
}

// Create lessons
const lesson = document.getElementsByClassName("lesson")[0];
const insertBeforeElement = document.getElementById("task");

export function setTitle(text, number) {
    document.title = `Lesson ${number}: ${text}`;
    document.getElementById("title").innerText = text;

    document.addEventListener("DOMContentLoaded", () => {
        if (number <= 1) {
            document.getElementById("previousLesson").remove();
        } else {
            document.getElementById("previousLesson").parentElement.setAttribute("href", `lessons?lesson=${number - 1}`);
        }
        if (number >= 12) {
            document.getElementById("nextLesson").remove();
        } else {
            document.getElementById("nextLesson").parentElement.setAttribute("href", `lessons?lesson=${number + 1}`);
        }
    });
}

export function setTask(text, callback) {
    document.getElementById("taskContent").innerText = text;

    verifyTask = callback;
}

export function runProgram({ vars, inputs }) {
    let newProgram = "";
    if (vars) {
        for (let line of editor.getValue().split("\n")) {
            for (const variable of Object.entries(vars)) {
                if (line.slice(0, variable[0].length) == variable[0] && (line[variable[0].length] === " " || line[variable[0].length] === "=")) {
                    line = `${variable[0]} = ${JSON.stringify(variable[1])}`;
                }
            }
            newProgram = newProgram + line + "\n";
        }
    } else {
        newProgram = editor.getValue();
    }

    const globalNamespace = pyodide.globals.get("dict")();

    let terminalOut = [];
    pyodide.setStdout({ batched: (str) => terminalOut.push(str) });

    pyodide.setStdin({ stdin: () => null }); // Throw error if input function used

    let inputIndex = 0;
    if (inputs) globalNamespace.set("input", () => {
        const i = inputIndex;
        if (inputIndex + 1 >= inputs.length) {
            inputIndex = 0;
        } else {
            inputIndex++;
        }

        return `${inputs[i]}`;
    });

    pyodide.runPython(newProgram, { globals: globalNamespace });

    let variables = globalNamespace.toJs();
    delete variables["__builtins__"];
    if (inputs) delete variables["input"];

    return { variables, terminalOut };
}

export function newParagraph(text) {
    const p = document.createElement("p");
    p.innerText = text;
    lesson.insertBefore(p, insertBeforeElement);
}

export function newList(items, type = "bullet") {
    const list = document.createElement(type == "bullet" ? "ul" : "ol");
    for (const text of items) {
        const li = document.createElement("li");
        li.innerText = text;
        list.appendChild(li);
    }
    lesson.insertBefore(list, insertBeforeElement);
}

export function newTable(headers, rows) {
    const table = document.createElement("table");
    const headerRow = document.createElement("tr");

    for (const text of headers) {
        const th = document.createElement("th");
        th.innerText = text;
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    for (const row of rows) {
        const rowElement = document.createElement("tr");

        for (const text of row) {
            const td = document.createElement("td");
            td.innerText = text;
            rowElement.appendChild(td);
        }
        table.appendChild(rowElement);
    }

    lesson.insertBefore(table, insertBeforeElement);
}

export function newCodeBlock(text) {
    const template = document.createElement('template');
    template.innerHTML = `<div class="codeBlock"><textarea class="code">${text}</textarea></div>`;
    lesson.insertBefore(template.content.firstElementChild, insertBeforeElement);
}