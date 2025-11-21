import * as monaco from 'monaco-editor';
import html2canvas from 'html2canvas';

self.MonacoEnvironment = {
    getWorker: function(workerId, label) {
        const getWorkerModule = (moduleUrl, label) => {
            return new Worker(self.MonacoEnvironment.getWorkerUrl(moduleUrl), {
                name: label,
                type: 'module'
            });
        };
        switch (label) {
            case 'json':
                return getWorkerModule('/monaco-editor/esm/vs/language/json/json.worker?worker', label);
            case 'css':
            case 'scss':
            case 'less':
                return getWorkerModule('/monaco-editor/esm/vs/language/css/css.worker?worker', label);
            case 'html':
            case 'handlebars':
            case 'razor':
                return getWorkerModule('/monaco-editor/esm/vs/language/html/html.worker?worker', label);
            case 'typescript':
            case 'javascript':
                return getWorkerModule('/monaco-editor/esm/vs/language/typescript/ts.worker?worker', label);
            default:
                return getWorkerModule('/monaco-editor/esm/vs/editor/editor.worker?worker', label);
        }
    }
};

let editorLeft, editorRight;

const sampleCode = {
    plaintext: {
        incorrect: `Write anything here...`,
        correct: `Write anything here...`
    },
    csharp: {
        incorrect: `// Bad Example
public class calculator
{
    public int a(int x, int y)
    {
        var r = x + y;
        return r;
    }
}`,
        correct: `// Good Example
public class Calculator
{
    public int Add(int firstNumber, int secondNumber)
    {
        return firstNumber + secondNumber;
    }
}`
    },
    cpp: {
        incorrect: `// Bad Example
int calc(int a,int b){
int res=a+b;
return res;
}`,
        correct: `// Good Example
int calculateSum(int firstNumber, int secondNumber) {
    return firstNumber + secondNumber;
}`
    },
    c: {
        incorrect: `// Bad Example
int f(int x,int y){
int z=x+y;
return z;
}`,
        correct: `// Good Example
int add_numbers(int first, int second) {
    return first + second;
}`
    },
    java: {
        incorrect: `// Bad Example
public class calc {
    public int a(int x, int y) {
        int r = x + y;
        return r;
    }
}`,
        correct: `// Good Example
public class Calculator {
    public int add(int firstNumber, int secondNumber) {
        return firstNumber + secondNumber;
    }
}`
    },
    python: {
        incorrect: `# Bad Example
def f(x,y):
    r=x+y
    return r`,
        correct: `# Good Example
def add_numbers(first_number, second_number):
    return first_number + second_number`
    },
    javascript: {
        incorrect: `// Bad Example
function f(x,y){
var r=x+y
return r
}`,
        correct: `// Good Example
function addNumbers(firstNumber, secondNumber) {
    return firstNumber + secondNumber;
}`
    },
    typescript: {
        incorrect: `// Bad Example
function f(x:any,y:any){
var r=x+y
return r
}`,
        correct: `// Good Example
function addNumbers(firstNumber: number, secondNumber: number): number {
    return firstNumber + secondNumber;
}`
    },
    go: {
        incorrect: `// Bad Example
func f(x int,y int) int {
r:=x+y
return r
}`,
        correct: `// Good Example
func AddNumbers(firstNumber, secondNumber int) int {
    return firstNumber + secondNumber
}`
    },
    rust: {
        incorrect: `// Bad Example
fn f(x:i32,y:i32)->i32{
let r=x+y;
r
}`,
        correct: `// Good Example
fn add_numbers(first_number: i32, second_number: i32) -> i32 {
    first_number + second_number
}`
    },
    php: {
        incorrect: `// Bad Example
function f($x,$y){
$r=$x+$y;
return $r;
}`,
        correct: `// Good Example
function addNumbers(int $firstNumber, int $secondNumber): int {
    return $firstNumber + $secondNumber;
}`
    },
    ruby: {
        incorrect: `# Bad Example
def f(x,y)
r=x+y
return r
end`,
        correct: `# Good Example
def add_numbers(first_number, second_number)
  first_number + second_number
end`
    },
    swift: {
        incorrect: `// Bad Example
func f(x:Int,y:Int)->Int{
let r=x+y
return r
}`,
        correct: `// Good Example
func addNumbers(firstNumber: Int, secondNumber: Int) -> Int {
    return firstNumber + secondNumber
}`
    },
    kotlin: {
        incorrect: `// Bad Example
fun f(x:Int,y:Int):Int{
val r=x+y
return r
}`,
        correct: `// Good Example
fun addNumbers(firstNumber: Int, secondNumber: Int): Int {
    return firstNumber + secondNumber
}`
    },
    sql: {
        incorrect: `-- Bad Example
select * from users where id=1`,
        correct: `-- Good Example
SELECT id, username, email
FROM users
WHERE id = 1;`
    },
    html: {
        incorrect: `<!-- Bad Example -->
<div><p>hello</p><p>world</p></div>`,
        correct: `<!-- Good Example -->
<div>
    <p>Hello</p>
    <p>World</p>
</div>`
    },
    css: {
        incorrect: `/* Bad Example */
.btn{color:red;margin:10px;padding:5px;}`,
        correct: `/* Good Example */
.btn {
    color: red;
    margin: 10px;
    padding: 5px;
}`
    },
    json: {
        incorrect: `{"name":"john","age":30,"city":"NYC"}`,
        correct: `{
    "name": "John",
    "age": 30,
    "city": "NYC"
}`
    },
    xml: {
        incorrect: `<person><name>john</name><age>30</age></person>`,
        correct: `<person>
    <name>John</name>
    <age>30</age>
</person>`
    },
    yaml: {
        incorrect: `# Bad Example
name: john
age: 30
address: {city: NYC,zip: 10001}`,
        correct: `# Good Example
name: John
age: 30
address:
  city: NYC
  zip: 10001`
    },
    markdown: {
        incorrect: `# title
some text
- item1
- item2`,
        correct: `# Title

Some descriptive text here.

- Item 1
- Item 2`
    },
    shell: {
        incorrect: `# Bad Example
for i in $(ls *.txt);do cat $i;done`,
        correct: `# Good Example
for file in *.txt; do
    cat "$file"
done`
    },
    powershell: {
        incorrect: `# Bad Example
$a=Get-Process|where{$_.CPU -gt 100}`,
        correct: `# Good Example
$highCpuProcesses = Get-Process | Where-Object {
    $_.CPU -gt 100
}`
    }
};

const editorOptions = {
    theme: 'vs-dark',
    language: 'csharp',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    renderWhitespace: 'selection',
    tabSize: 4
};

function initEditors() {
    editorLeft = monaco.editor.create(document.getElementById('editor-left'), {
        ...editorOptions,
        value: sampleCode.csharp.incorrect
    });

    editorRight = monaco.editor.create(document.getElementById('editor-right'), {
        ...editorOptions,
        value: sampleCode.csharp.correct
    });

    // Language selector
    document.getElementById('language-select').addEventListener('change', (e) => {
        const lang = e.target.value;
        monaco.editor.setModelLanguage(editorLeft.getModel(), lang);
        monaco.editor.setModelLanguage(editorRight.getModel(), lang);
        if (sampleCode[lang]) {
            editorLeft.setValue(sampleCode[lang].incorrect);
            editorRight.setValue(sampleCode[lang].correct);
        }
        clearCompare();
    });

    // Font size control
    let fontSize = 14;
    const updateFontSize = () => {
        document.getElementById('font-size-value').textContent = fontSize;
        editorLeft.updateOptions({ fontSize: fontSize });
        editorRight.updateOptions({ fontSize: fontSize });
    };
    document.getElementById('font-decrease').addEventListener('click', () => {
        if (fontSize > 10) { fontSize--; updateFontSize(); }
    });
    document.getElementById('font-increase').addEventListener('click', () => {
        if (fontSize < 24) { fontSize++; updateFontSize(); }
    });

    // Snapshot button
    document.getElementById('snapshot-btn').addEventListener('click', takeSnapshot);

    // Compare button (VS circle)
    document.getElementById('compare-btn').addEventListener('click', () => {
        compareCode();
        document.getElementById('compare-btn').classList.toggle('active', compareActive);
    });

    // Auto-compare on content change (only if compare is active)
    editorLeft.onDidChangeModelContent(() => {
        if (compareActive) runCompare();
    });
    editorRight.onDidChangeModelContent(() => {
        if (compareActive) runCompare();
    });
}

initEditors();

const presets = {
    default: { name: 'Default', width: null, height: null },
    linkedin: { name: 'LinkedIn', width: 1200, height: 627 }
};

let selectedPreset = 'default';

async function takeSnapshot() {
    const leftCode = editorLeft.getValue();
    const rightCode = editorRight.getValue();

    // Create preview modal
    const modal = document.createElement('div');
    modal.id = 'snapshot-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Preview</h2>
                    <div class="preset-buttons">
                        <button class="preset-btn active" data-preset="default">Default</button>
                        <button class="preset-btn" data-preset="linkedin">LinkedIn</button>
                    </div>
                    <div class="modal-buttons">
                        <button id="save-snapshot">Save Image</button>
                        <button id="close-modal">Close</button>
                    </div>
                </div>
                <div id="snapshot-preview">
                    <div class="preview-pane incorrect">
                        <div class="preview-header incorrect-header">Incorrect</div>
                        <pre>${escapeHtml(leftCode)}</pre>
                    </div>
                    <div class="preview-pane correct">
                        <div class="preview-header correct-header">Correct</div>
                        <pre>${escapeHtml(rightCode)}</pre>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Preset button handlers
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPreset = btn.dataset.preset;
            updatePreviewSize();
        };
    });

    document.getElementById('close-modal').onclick = () => modal.remove();
    document.getElementById('save-snapshot').onclick = () => saveSnapshot();
}

function updatePreviewSize() {
    const preview = document.getElementById('snapshot-preview');
    const preset = presets[selectedPreset];

    if (preset.width && preset.height) {
        preview.style.width = preset.width + 'px';
        preview.style.height = preset.height + 'px';
    } else {
        preview.style.width = '';
        preview.style.height = '';
    }
}

async function saveSnapshot() {
    const preview = document.getElementById('snapshot-preview');
    const canvas = await html2canvas(preview, { backgroundColor: '#1e1e1e' });
    const link = document.createElement('a');
    link.download = `code-compare-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

let decorationsLeft = [];
let decorationsRight = [];
let compareActive = false;

function clearCompare() {
    decorationsLeft = editorLeft.deltaDecorations(decorationsLeft, []);
    decorationsRight = editorRight.deltaDecorations(decorationsRight, []);
    compareActive = false;
}

function runCompare() {
    // Clear previous decorations first
    decorationsLeft = editorLeft.deltaDecorations(decorationsLeft, []);
    decorationsRight = editorRight.deltaDecorations(decorationsRight, []);

    const leftLines = editorLeft.getValue().split('\n');
    const rightLines = editorRight.getValue().split('\n');
    const maxLines = Math.max(leftLines.length, rightLines.length);

    const leftDecorations = [];
    const rightDecorations = [];

    for (let i = 0; i < maxLines; i++) {
        const leftLine = leftLines[i] !== undefined ? leftLines[i] : null;
        const rightLine = rightLines[i] !== undefined ? rightLines[i] : null;

        if (leftLine !== rightLine) {
            if (leftLine !== null) {
                leftDecorations.push({
                    range: new monaco.Range(i + 1, 1, i + 1, 1),
                    options: {
                        isWholeLine: true,
                        className: 'line-different',
                        glyphMarginClassName: 'glyph-different'
                    }
                });
            }
            if (rightLine !== null) {
                rightDecorations.push({
                    range: new monaco.Range(i + 1, 1, i + 1, 1),
                    options: {
                        isWholeLine: true,
                        className: 'line-different',
                        glyphMarginClassName: 'glyph-different'
                    }
                });
            }
        }
    }

    decorationsLeft = editorLeft.deltaDecorations([], leftDecorations);
    decorationsRight = editorRight.deltaDecorations([], rightDecorations);
}

function compareCode() {
    if (compareActive) {
        clearCompare();
        return;
    }
    compareActive = true;
    runCompare();
}
