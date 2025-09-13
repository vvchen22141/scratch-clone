import React, { useRef, useState } from "react";
import BlocklyComponent from "./BlocklyComponent";

function App() {
  const stageRef = useRef(null);
  const [output, setOutput] = useState("");

  // Toolbox: available blocks
  const toolbox = {
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "controls_repeat_ext" },
      { kind: "block", type: "math_number" },
      { kind: "block", type: "text" },
      { kind: "block", type: "text_print" },
    ],
  };

  // Run generated code safely
  const runCode = (code) => {
    try {
      // Expose helper function for Blockly's "print" block
      const api = {
        print: (msg) => setOutput((prev) => prev + msg + "\n"),
        move: (x, y) => {
          const ctx = stageRef.current.getContext("2d");
          ctx.clearRect(0, 0, 300, 300);
          ctx.fillStyle = "blue";
          ctx.fillRect(x, y, 40, 40); // Draw a square as a "sprite"
        },
      };

      // eslint-disable-next-line no-new-func
      const func = new Function("api", code);
      func(api);
    } catch (err) {
      setOutput("Error: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Blockly editor */}
      <div style={{ width: "70%", borderRight: "1px solid #ccc" }}>
        <BlocklyComponent toolbox={toolbox} />
      </div>

      {/* Stage + Output */}
      <div style={{ width: "30%", padding: "10px" }}>
        <h3>Stage</h3>
        <canvas
          ref={stageRef}
          width={300}
          height={300}
          style={{ border: "1px solid black" }}
        />

        <h3>Output</h3>
        <pre style={{ background: "#eee", padding: "5px" }}>{output}</pre>

        <h3>Actions</h3>
        <button
          onClick={() => {
            setOutput(""); // Clear previous output
            if (
              window.Blockly &&
              window.Blockly.getMainWorkspace &&
              window.BlocklyJS &&
              typeof window.BlocklyJS.workspaceToCode === "function"
            ) {
              const workspace = window.Blockly.getMainWorkspace();
              const code = window.BlocklyJS.workspaceToCode(workspace);
              runCode(code);
            } else {
              setOutput("Blockly or code generator not loaded.");
            }
          }}
        >
          Run Code
        </button>
      </div>
    </div>
  );
}

export default App;
