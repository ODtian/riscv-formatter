'use strict';

import * as vscode from 'vscode';

function getLabel(text: String): String {
    let comment = text.indexOf("#");
    let label = text.indexOf(":");
    if (comment !== -1 && label > comment) label = -1;
    return label !== -1 ? text.substring(0, label + 1).trim() : "";
}

function getCommand(text: String): String {
    let comment = text.indexOf("#");
    let label = text.indexOf(":");
    if (comment !== -1 && label > comment) label = -1;
    return text.substring(label !== -1 ? label + 1 : 0, comment !== -1 ? comment : undefined).trim();
}

function getInstruction(text: String): String {
    let command = getCommand(text);
    return command.split(' ')[0].trim();
}

function getArguments(text: String): String {
    let command = getCommand(text);
    let args = command.split(' ')
    args.shift();
    return args.join(' ').trim();
}

function getComment(text: String): String {
    let comment = text.indexOf("#");
    return comment !== -1 ? text.substring(comment).trim() : "";
}

export function activate(context: vscode.ExtensionContext) {
    const output = vscode.window.createOutputChannel("RISC-V Formatter");
    vscode.languages.registerDocumentFormattingEditProvider('riscv', {
        provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions): vscode.TextEdit[] {
            // declare counters
            let maxLabelLength = 0;
            let maxInstructionLength = 0;
            let maxArgumentsLength = 0;
            let maxCommentLength = 0;
            // declare edits array
            let edits = [];

            // iterate over each line to calculate maximums
            for (let l = 0; l < document.lineCount; l++) {
                // get line and text
                let line = document.lineAt(l);
                let text = line.text;

                // ensure : is followed by a space
                text = text.replace(/:/g, ': ');
                // replace tabs with spaces
                text = text.replace(/\t/g, ' ');
                // remove excess spaces from the line
                text = text.replace(/ +(?= )/g, '').trim();

                let label = getLabel(text);
                let comment = getComment(text);
                let instruction = getInstruction(text);
                let args = getArguments(text);

                // is this the longest label?
                if (label.length > maxLabelLength) {
                    maxLabelLength = label.length;
                }
                // is this the longest comment?
                if (comment.length > maxCommentLength) {
                    maxCommentLength = comment.length;
                }
                // is this the longest instruction?
                if (instruction.length > maxInstructionLength) {
                    maxInstructionLength = instruction.length;
                }
                // is this the longest argument set?
                if (args.length > maxArgumentsLength) {
                    maxArgumentsLength = args.length;
                }
            }

            output.appendLine(`Max Label Length: ${maxLabelLength} characters`);
            output.appendLine(`Max Comment Length: ${maxCommentLength} characters`);
            output.appendLine(`Max Instruction Length: ${maxInstructionLength} characters`);
            output.appendLine(`Max Arguments Length: ${maxArgumentsLength} characters`);

            // iterate over each line again
            for (let l = 0; l < document.lineCount; l++) {
                // get line and text
                let line = document.lineAt(l);
                let text = line.text;

                // ensure : is followed by a space
                text = text.replace(/:/g, ': ');
                // replace tabs with spaces
                text = text.replace(/\t/g, ' ');
                // remove excess spaces from the line
                text = text.replace(/ +(?= )/g, '').trim();

                let label = getLabel(text);
                let comment = getComment(text);
                let instruction = getInstruction(text);
                let args = getArguments(text);

                if (label !== "") {
                    edits.push(vscode.TextEdit.insert(line.range.start, `${label}\n`));
                }

                let newText = options.insertSpaces ? "".padEnd(options.tabSize, ' ') : "\t";
                if (instruction !== "") {
                    newText += instruction;
                }
                if (args !== "") {
                    newText = newText.padEnd(maxInstructionLength + (options.insertSpaces ? options.tabSize : 1) + 1, ' ');
                    newText += args;
                }
                if (comment !== "") {
                    newText = newText.padEnd(maxInstructionLength + maxArgumentsLength + (options.insertSpaces ? options.tabSize : 1) + 2, ' ');
                    newText += comment;
                }

                if (instruction === "" && args === "") newText = newText.trim();

                edits.push(vscode.TextEdit.replace(line.range, newText));
            }

            return edits;
        }
    });
}


