import React, { useEffect, useRef } from "react";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
// Import all default Blockly blocks to ensure toolbox blocks are registered
import 'blockly/blocks';

// --- Custom Blockly Blocks and Generators (define ONCE, outside component) ---
if (!Blockly.Blocks["create_ball"]) {
  Blockly.Blocks["create_ball"] = {
    init: function () {
      this.appendValueInput("RADIUS")
        .setCheck("Number")
        .appendField("create ball with radius");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("Create a blue ball with a given radius");
      this.setHelpUrl("");
    },
  };
}
javascriptGenerator.forBlock = javascriptGenerator.forBlock || {};
javascriptGenerator.forBlock["create_ball"] = function (block, generator) {
  var radius = generator.valueToCode(block, "RADIUS", generator.ORDER_NONE) || 20;
  console.log('api.createBall called with radius:', radius);
  return `api.createBall(${radius});\n`;
};

if (!Blockly.Blocks["set_ball_position"]) {
  Blockly.Blocks["set_ball_position"] = {
    init: function () {
      this.appendValueInput("X")
        .setCheck("Number")
        .appendField("set x");
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
javascriptGenerator.forBlock["set_ball_position"] = function (block, generator) {
  var x = generator.valueToCode(block, "X", generator.ORDER_NONE) || 0;
  var y = generator.valueToCode(block, "Y", generator.ORDER_NONE) || 0;
  console.log('api.setBallPosition called with:', x, y);
  return `api.setBallPosition(${x}, ${y});\n`;
};

// Remove any lingering set_ball_radius block definition and generator if present
// Instead of deleting or setting to undefined, fully unregister by deleting and removing from toolbox XML
try {
  delete Blockly.Blocks["set_ball_radius"];
} catch (e) {}
try {
  delete javascriptGenerator.forBlock["set_ball_radius"];
} catch (e) {}

// Register a dummy set_ball_radius block to prevent runtime errors if it is referenced in the toolbox or saved workspace
if (!Blockly.Blocks["set_ball_radius"]) {
  Blockly.Blocks["set_ball_radius"] = {
    init: function () {
      this.appendDummyInput().appendField("set ball radius (deprecated)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("This block is deprecated and does nothing.");
      this.setHelpUrl("");
    },
  };
}
javascriptGenerator.forBlock["set_ball_radius"] = function (block, generator) {
  // Deprecated: do nothing
  return '// set_ball_radius (deprecated)\n';
};

// Add set_acceleration block
if (!Blockly.Blocks["set_acceleration"]) {
  Blockly.Blocks["set_acceleration"] = {
    init: function () {
      this.appendValueInput("ACCEL")
        .setCheck("Number")
        .appendField("set acceleration to");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("Set the acceleration for the simulation");
      this.setHelpUrl("");
    },
  };
}
// Update set_acceleration block to have a placeholder effect
javascriptGenerator.forBlock["set_acceleration"] = function (block, generator) {
  var accel = generator.valueToCode(block, "ACCEL", generator.ORDER_NONE) || 0.35;
  // Placeholder: set gravity (acceleration) for the simulation
  return `api.setGravity(${accel});\n`;
};

// Add set_velocity block
if (!Blockly.Blocks["set_velocity"]) {
  Blockly.Blocks["set_velocity"] = {
    init: function () {
      this.appendValueInput("VEL")
        .setCheck("Number")
        .appendField("set velocity to");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(60);
      this.setTooltip("Set the velocity for the simulation");
      this.setHelpUrl("");
    },
  };
}
// Update set_velocity block to have a placeholder effect
javascriptGenerator.forBlock["set_velocity"] = function (block, generator) {
  var vel = generator.valueToCode(block, "VEL", generator.ORDER_NONE) || 0;
  // Placeholder: set initial velocity for the ball
  return `api.setVelocity(${vel});\n`;
};

// Add create_angled_ramp block
if (!Blockly.Blocks["create_angled_ramp"]) {
  Blockly.Blocks["create_angled_ramp"] = {
    init: function () {
      this.appendValueInput("ANGLE")
        .setCheck("Number")
        .appendField("create angled ramp with angle");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(30);
      this.setTooltip("Create an angled ramp in the simulation");
      this.setHelpUrl("");
    },
  };
}
// Update create_angled_ramp block to have a placeholder effect
javascriptGenerator.forBlock["create_angled_ramp"] = function (block, generator) {
  var angle = generator.valueToCode(block, "ANGLE", generator.ORDER_NONE) || 0;
  // Placeholder: print ramp creation
  return `api.print('Created ramp with angle: ' + (${angle}));\n`;
};

// Override text_print to use api.print instead of console.log
javascriptGenerator.forBlock["text_print"] = function (block, generator) {
  var msg = generator.valueToCode(block, "TEXT", generator.ORDER_NONE) || "''";
  return `api.print(${msg});\n`;
};
// --- End custom blocks ---

const CUSTOM_BLOCKS = [
  'create_ball',
  'set_ball_position',
  'drop_ball',
  'set_acceleration',
  'set_velocity',
  'create_angled_ramp',
];


// --- Error handling for browser permission errors ---
// (No direct fix in Blockly, but add a try/catch for workspace injection)
const BlocklyComponent = ({ toolbox }) => {
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);

  useEffect(() => {
    // Dispose previous workspace if it exists to prevent block persistence and runtime errors
    if (workspaceRef.current) {
      workspaceRef.current.dispose();
    }
    try {
      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox,
        trashcan: true,
      });
    } catch (e) {
      // Handle browser permission or injection errors gracefully
      // Optionally, display a user-friendly message or log
      // eslint-disable-next-line no-console
      console.error('Blockly injection failed:', e);
      return;
    }
    // Removed addChangeListener that disposed custom blocks on toolbox switch
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
      style={{ height: "100vh", width: "100%", background: "#f0f0f0", minHeight: 0 }}
    />
  );
};

// Patch: Only disable audio for custom blocks to prevent permission errors
const CUSTOM_BLOCKS_SET = new Set([
  'create_ball',
  'set_ball_position',
  'drop_ball',
  'set_acceleration',
  'set_velocity',
  'create_angled_ramp',
]);

if (typeof Blockly !== 'undefined' && Blockly && Blockly.Workspace) {
  const origDisposeUiEffect = Blockly.BlockSvg && Blockly.BlockSvg.prototype.disposeUiEffect;
  if (origDisposeUiEffect) {
    Blockly.BlockSvg.prototype.disposeUiEffect = function() {
      if (CUSTOM_BLOCKS_SET.has(this.type)) {
        // Skip audio for custom blocks
        return;
      }
      return origDisposeUiEffect.apply(this, arguments);
    };
  }
}

export default BlocklyComponent;
