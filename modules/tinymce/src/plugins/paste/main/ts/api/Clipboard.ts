/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { ClipboardContents, registerEventsAndFilters, pasteHtml, pasteText, pasteImageData, getDataTransferItems, hasContentType, hasHtmlOrText } from '../core/Clipboard';
import { PasteBin } from '../core/PasteBin';
import { Cell } from '@ephox/katamari';
import Editor from 'tinymce/core/api/Editor';
import { ClipboardEvent, DragEvent, Range, DataTransfer } from '@ephox/dom-globals';

export interface Clipboard {
  pasteFormat: Cell<string>;
  pasteHtml: (html: string, internalFlag: boolean) => void;
  pasteText: (text: string) => void;
  pasteImageData: (e: ClipboardEvent | DragEvent, rng: Range) => boolean;
  getDataTransferItems: (dataTransfer: DataTransfer) => ClipboardContents;
  hasHtmlOrText: (content: ClipboardContents) => boolean;
  hasContentType: (clipboardContent: ClipboardContents, mimeType: string) => boolean;
}

export const Clipboard = (editor: Editor, pasteFormat: Cell<string>): Clipboard => {
  const pasteBin = PasteBin(editor);

  editor.on('PreInit', () => registerEventsAndFilters(editor, pasteBin, pasteFormat));

  return {
    pasteFormat,
    pasteHtml: (html: string, internalFlag: boolean) => pasteHtml(editor, html, internalFlag, false),
    pasteText: (text: string) => pasteText(editor, text),
    pasteImageData: (e: ClipboardEvent | DragEvent, rng: Range) => pasteImageData(editor, e, rng),
    getDataTransferItems,
    hasHtmlOrText,
    hasContentType
  };
};