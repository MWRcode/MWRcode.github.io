let pyodide;
async function setup() {
    pyodide = await loadPyodide();

    pyodide.setStdout({ batched: (str) => insert(str) })
}
setup();

function insert(text) {
    var lastLine = terminal.lastLine();
    var lineContent = terminal.getLine(lastLine);

    terminal.replaceRange(
        `>>> ${text}\n`,
        { line: lastLine, ch: lineContent.length }
    );
}

const input = document.getElementById("codeInput");
const output = document.getElementById("codeOutput");

let editor = CodeMirror.fromTextArea(input, {
    lineNumbers: true,
    mode: "python",
});

let terminal = CodeMirror.fromTextArea(output, {
    lineWrapping: true,
    mode: "none",
    readOnly: "nocursor",
});

terminal.setSize(null, 200);

document.getElementById("runCode").addEventListener("click", event => {
    try {
        pyodide.runPython(editor.getValue());
    } catch (e) {
        const lines = e.message.split("\n")
        insert(lines[lines.length - 2])
    }
    terminal.scrollTo(0, Infinity);
});

for (const element of document.getElementsByClassName("code")) {
    const codeBlock = CodeMirror.fromTextArea(element, {
        lineNumbers: true,
        mode: "python",
    });
    codeBlock.setSize(null, "100%")
}