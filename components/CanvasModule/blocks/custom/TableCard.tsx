"use client";
import * as React from "react";
import type { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { useRegisterToolbarExtras } from "../toolbar/toolbarExtrasStore";
import { Toggle } from "@/components/ui/toggle";
import { DatabaseIcon } from "lucide-react";

interface TableCardBlockProps
  extends Omit<ShapeFrameProps, "children" | "shape"> {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
}

export const TableCard: React.FC<TableCardBlockProps> = (props) => {
  const [showDatasource, setShowDatasource] = React.useState(false);
  const { shape, onCommitStyle } = props;

  const { tableCardValues } = shape;

  const addRow = () => {};

  useRegisterToolbarExtras(
    shape.id,
    () => (
      <>
        {/* Cards */}
        {/* <div className="flex items-center gap-1">
          <span className="text-gray-500">Row</span>
          <button
            className="px-2 py-1 rounded bg-gray-200"
            title="Add above"
            onClick={(e) => {
              e.stopPropagation();
              addRow();
            }}
          >
            +
          </button>
        </div> */}

        {/* Show Data Source */}
        <div className="flex items-center gap-1">
          {/* <span className="text-gray-500">Datasource</span> */}
          {/* <button
            className="px-2 py-1 rounded bg-gray-200"
            title="Add above"
            onClick={(e) => {
              e.stopPropagation();
              addRow();
            }}
          >
            +
          </button> */}
          <Toggle
            aria-label="Toggle bookmark"
            size="sm"
            variant="outline"
            pressed={showDatasource}
            onPressedChange={(pressed) => {
              setShowDatasource(pressed);
            }}
            className="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-blue-500 data-[state=on]:*:[svg]:stroke-blue-500"
          >
            <DatabaseIcon />
            Datasource
          </Toggle>
        </div>
      </>
    ),
    [shape.id, showDatasource]
  );

  return (
    <ShapeFrame
      {...props}
      resizable={false}
      //showTagsToolbar={false}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div className="w-full h-full  flex flex-col overflow-visible relative">
        <div className="w-full h-full bg-amber-100 p-3">
          <h1 className="text-4xl font-bold ">
            {tableCardValues?.title || "Card Title Here"}
          </h1>
          <h3 className="text-xl mt-2 mb-2">
            {tableCardValues?.subtitle || "Subtitle Here"}
          </h3>
          <p>
            {tableCardValues?.description || "A nice description goes here"}
          </p>
        </div>

        {showDatasource && (
          <div className=" bg-white rounded-xl shadow flex flex-col overflow-visible absolute top-1/2 -translate-y-1/2 -right-[575px]">
            <div className="flex-1 p-2 overflow-visible">
              <div className="relative w-full h-full">
                <table>
                  <thead>
                    <tr>
                      <th className="border-b p-2 text-left">Title</th>
                      <th className="border-b p-2 text-left">Subtitle</th>
                      <th className="border-b p-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input
                          value={tableCardValues?.title}
                          onChange={(e) => {
                            onCommitStyle?.(shape.id, {
                              tableCardValues: {
                                ...tableCardValues,
                                title: e.target.value,
                              },
                            });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          value={tableCardValues?.subtitle}
                          onChange={(e) => {
                            onCommitStyle?.(shape.id, {
                              tableCardValues: {
                                ...tableCardValues,
                                subtitle: e.target.value,
                              },
                            });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          value={tableCardValues?.description}
                          onChange={(e) => {
                            onCommitStyle?.(shape.id, {
                              tableCardValues: {
                                ...tableCardValues,
                                description: e.target.value,
                              },
                            });
                          }}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShapeFrame>
  );
};
