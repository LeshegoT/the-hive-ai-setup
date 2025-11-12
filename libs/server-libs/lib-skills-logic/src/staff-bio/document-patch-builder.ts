import { parseIfSetElseDefault } from '@the-hive/lib-core';
import * as docx from 'docx';

import {
    ImageRun,
    IPatch,
    Paragraph,
    patchDocument,
    PatchType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    VerticalPositionAlign,
    VerticalPositionRelativeFrom,
    ITableCellOptions,
    IRunOptions,
    IParagraphOptions,
    AlignmentType,
    BorderStyle,
} from "docx";

const tableWidthSize = parseIfSetElseDefault('TABLE_WIDTH_SIZE', 100);

export class DocumentPatchBuilder {
  private readonly documentBuffer: Buffer;
  private patches: Record<string, IPatch> = {};

  constructor(documentBuffer: Buffer) {
      this.documentBuffer = documentBuffer;
  }

  replaceText = (key: string, text: string): DocumentPatchBuilder => {
      this.patches[key] = {
          type: PatchType.PARAGRAPH,
          children: [new TextRun(text)],
      };
      return this;
  }

  addBulletedList = (key: string, list: string[]): DocumentPatchBuilder => {
    const bulletedParagraphs = list.map(item => {
      return new Paragraph({
        style: "Normal",
        bullet: {
          level: 0
        },
        children: [
          new TextRun({
            style: "Normal",
            text: item
          })
        ]
      });
    });

    this.patches[key] = {
      type: PatchType.DOCUMENT,
      children: bulletedParagraphs,
    };
    return this;
  }

  replaceImageAtPlaceHolder = (key: string, imageBuffer): DocumentPatchBuilder => {
    this.patches[key] = {
      type: PatchType.PARAGRAPH,
      children: [
        new ImageRun(
          {
            type: 'png',
            data: imageBuffer,
            transformation: { width: 100, height: 100 },
            floating: {
              horizontalPosition: {
                  align: VerticalPositionAlign.INSIDE,
                  offset: 100,
              },
              verticalPosition: {
                  align: VerticalPositionAlign.TOP,
                  relative: VerticalPositionRelativeFrom.PARAGRAPH,
              },
          },
          }),
      ],
    }

    return this;
  }

  replaceTableAtPlaceHolder = (key: string, table: Table): DocumentPatchBuilder => {
    this.patches[key] = {
      type: PatchType.DOCUMENT,
      children: [table],
    };

    return this;
  }

  replaceParagraphAtPlaceHolder = (
    key: string,
    children: string
  ): DocumentPatchBuilder => {
    const paragraphLines = children ? children.split('\n') : [''];
    this.patches[key] = {
      type: PatchType.DOCUMENT,
      children: paragraphLines.map((child) => new Paragraph({
        children: [new TextRun(child)],
        alignment: 'both',
        spacing: {
          before: 0,
          after: 0
        }
      }))
    }
    return this;
  }

  replaceSectionAtPlaceHolder = (
    key: string,
    children: (Paragraph | Table)[],
    addNewAfterEveryChild = true
  ): DocumentPatchBuilder => {
    const LAST_INDEX = children.length - 1;
    this.patches[key] = {
      type: PatchType.DOCUMENT,
      children: children.map((child, index) => addNewAfterEveryChild && index !== LAST_INDEX ? [child, new Paragraph("")] : [child]).flat()
    };
    return this;
  }

  public static generateParagraph(options: IParagraphOptions): Paragraph {
    return new Paragraph({
      spacing: {
        before: 0,
        after: 0,
      },
      alignment: AlignmentType.CENTER,
      ...options,
    });
  }

  public static generateTextRun(options: IRunOptions): TextRun {
    return new TextRun({
      ...options,
    });
  }

  public static generateTableWithStyleOptions(
    rows: ITableCellOptions[][],
    columnWidthsInPercentage: number[],
    removeBorders = false
  ): Table {
    const tableRows = rows.map((row) => new TableRow({
      children: row.map((cell, index) => new TableCell({
        ...cell,
        width: {
          size: columnWidthsInPercentage[index],
          type: docx.WidthType.PERCENTAGE
        },
        borders: removeBorders ? {
          bottom: {
            style: BorderStyle.NONE,
            size: 0,
            color: "FFFFFF",
          },
          top: {
            style: BorderStyle.NONE,
            size: 0,
            color: "FFFFFF",
          },
          left: {
            style: BorderStyle.NONE,
            size: 0,
            color: "FFFFFF",
          },
          right: {
            style: BorderStyle.NONE,
            size: 0,
            color: "FFFFFF",
          },
        } : undefined
      }))
    }));

    const table = new Table({
      rows: tableRows,
      width: {
        size: tableWidthSize,
        type: docx.WidthType.PERCENTAGE
      },
      columnWidths: columnWidthsInPercentage,
      layout: docx.TableLayoutType.FIXED,
      style: removeBorders ? "TableNormal" : undefined,
      borders: removeBorders ? {
        bottom: {
          style: BorderStyle.NONE,
          size: 0,
          color: "FFFFFF",
        },
        top: {
          style: BorderStyle.NONE,
          size: 0,
          color: "FFFFFF",
        },
        left: {
          style: BorderStyle.NONE,
          size: 0,
          color: "FFFFFF",
        },
        right: {
          style: BorderStyle.NONE,
          size: 0,
          color: "FFFFFF",
        },
      } : undefined,
    });

    return table;
  }

  public async buildDocumentBuffer(): Promise<Buffer> {
    return patchDocument({
        outputType: "nodebuffer",
        data: this.documentBuffer,
        patches: this.patches,
    });
  }
}
