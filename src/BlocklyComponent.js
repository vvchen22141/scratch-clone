import React, { useEffect, useRef } from "react";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import "blockly/blocks";

// --- Custom Blockly Blocks and Generators (define ONCE, outside component) ---
if (!Blockly.Blocks["create_ball"]) {
  Blockly.Blocks["create_ball"] = {
    init: function () {
      this.appendDummyInput().appendField("create ball");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("Create a ball for simulation");
      this.setHelpUrl("");
    },
  };
}
javascriptGenerator["create_ball"] = function (block) {
  return "api.createBall();\n";
};

if (!Blockly.Blocks["set_ball_position"]) {
  Blockly.Blocks["set_ball_position"] = {
    init: function () {
      this.appendValueInput("X")
        .setCheck("Number")
        .appendField("set ball x");
      this.appendValueInput("Y")
        .setCheck("Number")
        .appendField("y");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("Set the ball's position");
      this.setHelpUrl("");
    },
  };
}
javascriptGenerator["set_ball_position"] = function (block) {
  var x = javascriptGenerator.valueToCode(block, "X", javascriptGenerator.ORDER_NONE) || 0;
  var y = javascriptGenerator.valueToCode(block, "Y", javascriptGenerator.ORDER_NONE) || 0;
  return "api.setBallPosition(" + x + ", " + y + ");\n";
};

if (!Blockly.Blocks["set_ball_radius"]) {
  Blockly.Blocks["set_ball_radius"] = {
    init: function () {
      this.appendValueInput("R")
        .setCheck("Number")
        .appendField("set ball radius");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("Set the ball's radius");
      this.setHelpUrl("");
    },
  };
}
javascriptGenerator["set_ball_radius"] = function (block) {
  var r = javascriptGenerator.valueToCode(block, "R", javascriptGenerator.ORDER_NONE) || 20;
  return "api.setBallRadius(" + r + ");\n";
};

// Override text_print to use api.print instead of console.log
javascriptGenerator["text_print"] = function (block) {
  var msg = javascriptGenerator.valueToCode(block, "TEXT", javascriptGenerator.ORDER_NONE) || "''";
  return "api.print(" + msg + ");\n";
};
// --- End custom blocks ---

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
  }, [toolbox]);

  return (
    <div
      ref={blocklyDiv}
      style={{ height: "100vh", width: "100%", background: "#f0f0f0" }}
    />
  );
};

export default BlocklyComponent;
