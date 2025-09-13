import React, { useEffect, useRef } from "react";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import "blockly/blocks";

const BlocklyComponent = ({ toolbox }) => {
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);

  useEffect(() => {
    workspaceRef.current = Blockly.inject(blocklyDiv.current, {
      toolbox,
      trashcan: true,
    });
    window.Blockly = Blockly; // expose globally for App.js
    window.BlocklyJS = {
      workspaceToCode: function (workspace) {
        return javascriptGenerator.workspaceToCode(workspace);
      },
    }; // expose the generator object for correct context

    // Override text_print to use api.print instead of console.log
    javascriptGenerator["text_print"] = function (block) {
      var msg =
        javascriptGenerator.valueToCode(block, "TEXT", javascriptGenerator.ORDER_NONE) ||
        "''";
      return "api.print(" + msg + ");\n";
    };
  }, [toolbox]);

  return (
    <div
      ref={blocklyDiv}
      style={{ height: "100vh", width: "100%", background: "#f0f0f0" }}
    />
  );
};

export default BlocklyComponent;
