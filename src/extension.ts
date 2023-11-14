'use strict';

import * as vscode from 'vscode';

function getLabel(text: string): string {
    let comment = text.indexOf("#");
    let label = text.indexOf(":");
    if (comment !== -1 && label > comment) label = -1;
    return label !== -1 ? text.substring(0, label + 1).trim() : "";
}

function getCommand(text: string): string {
    let comment = text.indexOf("#");
    let label = text.indexOf(":");
    if (comment !== -1 && label > comment) label = -1;
    return text.substring(label !== -1 ? label + 1 : 0, comment !== -1 ? comment : undefined).trim();
}

function getInstruction(text: string): string {
    let command = getCommand(text);
    return command.split(' ')[0].trim();
}

function getArguments(text: string): string {
    let command = getCommand(text);
    let args = command.split(' ')
    args.shift();
    return args.join(' ').trim();
}

function getComment(text: string): string {
    let comment = text.indexOf("#");
    return comment !== -1 ? text.substring(comment).trim() : "";
}

export function activate(context: vscode.ExtensionContext) {
    const output = vscode.window.createOutputChannel("RISC-V Formatter");
    vscode.languages.registerDocumentFormattingEditProvider('riscv', {
        provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions): vscode.TextEdit[] {
            const labelsOnSeparateLine: boolean = vscode.workspace.getConfiguration('riscv-formatter.labels').get("separateLine");
            const indentCharacters = options.insertSpaces ? options.tabSize : 1;
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

                let newText = "";
                if (labelsOnSeparateLine) {
                    if (options.insertSpaces) {
                        newText = "".padEnd(options.tabSize, ' ');
                    } else {
                        newText = "\t";
                    }
                }

                if (label !== "") {
                    if (labelsOnSeparateLine) {
                        let labelLine = label;
                        if (instruction !== "") {
                            labelLine += "\n";
                        } else if (comment !== "") {
                            labelLine += " ";
                        }
                        edits.push(vscode.TextEdit.insert(line.range.start, labelLine));
                    } else {
                        newText += label;
                        newText = newText.padEnd(maxLabelLength + 1, ' ');
                    }
                } else if (!labelsOnSeparateLine) {
                    if (l > 0) {
                        let prevLine = document.lineAt(l - 1);
                        let prevText = prevLine.text;
                        // ensure : is followed by a space
                        prevText = prevText.replace(/:/g, ': ');
                        // replace tabs with spaces
                        prevText = prevText.replace(/\t/g, ' ');
                        // remove excess spaces from the line
                        prevText = prevText.replace(/ +(?= )/g, '').trim();

                        let prevLabel = getLabel(prevText);
                        let prevComment = getComment(prevText);
                        let prevInstruction = getInstruction(prevText);
                        let prevArgs = getArguments(prevText);

                        if (prevLabel !== "" && prevComment === "" && prevInstruction === "" && prevArgs === "") {
                            newText += prevLabel;
                            edits.push(vscode.TextEdit.delete(prevLine.rangeIncludingLineBreak));
                        }
                    }
                    newText = newText.padEnd(maxLabelLength + 1, ' ');
                }

                if (instruction !== "") {
                    newText += instruction;
                }

                if (args !== "") {
                    newText = newText.padEnd(maxInstructionLength + indentCharacters + (!labelsOnSeparateLine ? 2 + maxLabelLength : 1), ' ');
                    newText += args;
                }

                if (comment !== "") {
                    newText = newText.padEnd(maxInstructionLength + maxArgumentsLength + indentCharacters + (!labelsOnSeparateLine ? 3 + maxLabelLength : 2), ' ');
                    newText += comment;
                }

                if (instruction === "" && args === "") newText = newText.trim();

                edits.push(vscode.TextEdit.replace(line.range, newText));
            }

            return edits;
        }
    });
}


