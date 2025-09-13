import React, { useRef, useState } from "react";
import BlocklyComponent from "./BlocklyComponent";

function App() {
  const simCanvasRef = useRef(null);
  const [output, setOutput] = useState("");
  const [simBall, setSimBall] = useState(null); // {x, y, vx, vy}
  const [ballRadius, setBallRadius] = useState(20);
  const [latestCode, setLatestCode] = useState("");
  const [setupBall, setSetupBall] = useState(null); // Ball state after setup
  const simWidth = 500;
  const simHeight = 400;

  // Toolbox: available blocks (added set_ball_radius)
  const toolbox = {
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "create_ball" },
      { kind: "block", type: "set_ball_position" },
      { kind: "block", type: "set_ball_radius" },
      { kind: "block", type: "controls_repeat_ext" },
      { kind: "block", type: "math_number" },
      { kind: "block", type: "text" },
      { kind: "block", type: "text_print" },
    ],
  };

  // Run generated code safely (setupMode: true disables animation)
  const runCode = (code, setupMode = false, returnState = false) => {
    let ballCreated = false;
    let error = null;
    let lastBall = null;
    let lastRadius = ballRadius;
    const api = {
      print: (msg) => setOutput((prev) => prev + msg + "\n"),
      createBall: () => {
        ballCreated = true;
        lastBall = { x: 0, y: lastRadius, vx: 0, vy: 0 };
        if (setupMode && !returnState) setSetupBall(lastBall);
      },
      setBallPosition: (x, y) => {
        if (!ballCreated) {
          error = "Error: ball has no x and y values.";
          setOutput(error);
          throw new Error(error);
        }
        // Coerce x and y to numbers
        const numX = Number(x);
        const numY = Number(y);
        if (isNaN(numX) || isNaN(numY) || numX === 0 || numY === 0) {
          error = "Error: ball x and y values should not be 0.";
          setOutput(error);
          throw new Error(error);
        }
        // Out-of-bounds check
        if (numX < -250 || numX > 250 || numY < 0 || numY > 400) {
          error = "Error: ball x must be between -250 and 250, y must be between 0 and 400.";
          setOutput(error);
          throw new Error(error);
        }
        lastBall = { ...lastBall, x: numX, y: numY };
        if (setupMode && !returnState) setSetupBall(lastBall);
      },
      setBallRadius: (r) => {
        const numR = Number(r);
        if (isNaN(numR) || numR <= 0) {
          setOutput("Error: ball radius should not be 0.");
          throw new Error("Error: ball radius should not be 0.");
        }
        lastRadius = numR;
        if (setupMode && !returnState) setBallRadius(numR);
      },
    };
    // eslint-disable-next-line no-new-func
    try {
      const func = new Function("api", code);
      func(api);
    } catch (err) {
      if (!returnState) setSetupBall(null);
      return returnState ? { ball: null, radius: lastRadius } : undefined;
    }
    if (!ballCreated) {
      setOutput("Error: ball has no x and y values.");
      if (!returnState) setSetupBall(null);
      return returnState ? { ball: null, radius: lastRadius } : undefined;
    } else if (lastBall && lastBall.x != null && lastBall.y != null) {
      if (!returnState) setSetupBall(lastBall);
      return returnState ? { ball: lastBall, radius: lastRadius } : undefined;
    } else {
      if (!returnState) setSetupBall(null);
      return returnState ? { ball: null, radius: lastRadius } : undefined;
    }
  };

  // Gravity simulation logic
  React.useEffect(() => {
    let isMounted = true;
    if (!simBall) {
      if (simCanvasRef.current) {
        const ctx = simCanvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, simWidth, simHeight);
        ctx.fillStyle = "#eee";
        ctx.fillRect(0, 0, simWidth, simHeight);
        ctx.fillStyle = "#444";
        ctx.fillRect(0, simHeight - 10, simWidth, 10);
      }
      return;
    }
    let animationId;
    const gravity = 0.5; // px/frame^2
    const draw = () => {
      if (!isMounted || !simCanvasRef.current) return;
      let { x = 0, y, vx = 0, vy = 0 } = simBall;
      vy += gravity;
      y += vy;
      // Map logical x (-250 to 250) to canvas x (0 to 500)
      const canvasX = 250 + x;
      let canvasY = y;
      const floor = simHeight - ballRadius;
      if (canvasY > floor) {
        canvasY = floor;
        vy = 0;
      }
      if (isMounted) setSimBall((prev) => prev ? { ...prev, x, y, vx, vy } : { x, y, vx, vy });
      const ctx = simCanvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, simWidth, simHeight);
      ctx.fillStyle = "#eee";
      ctx.fillRect(0, 0, simWidth, simHeight);
      ctx.fillStyle = "#2196f3";
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, ballRadius, 0, 2 * Math.PI);
      ctx.fill();
      // Draw floor
      ctx.fillStyle = "#444";
      ctx.fillRect(0, simHeight - 10, simWidth, 10);
      if (canvasY < floor && isMounted) {
        animationId = requestAnimationFrame(draw);
      }
    };
    draw();
    return () => {
      isMounted = false;
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [simBall, ballRadius]);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <div style={{ display: "flex", height: "100vh" }}>
        {/* Blockly editor */}
        <div style={{ width: "70%", borderRight: "1px solid #ccc" }}>
          <BlocklyComponent toolbox={toolbox} />
        </div>

        {/* Simulation + Output */}
        <div style={{ width: "30%", padding: "10px" }}>
          <h3>Simulation</h3>
          <canvas
            ref={simCanvasRef}
            width={simWidth}
            height={simHeight}
            style={{ border: "2px solid #333", background: "#eee" }}
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
                setLatestCode(code);
                runCode(code, true); // setup only, no animation
              } else {
                setOutput("Blockly or code generator not loaded.");
              }
            }}
          >
            Run Code
          </button>
          <button
            onClick={() => {
              setOutput("");
              if (
                window.Blockly &&
                window.Blockly.getMainWorkspace &&
                window.BlocklyJS &&
                typeof window.BlocklyJS.workspaceToCode === "function"
              ) {
                // Always use latest code from workspace
                const workspace = window.Blockly.getMainWorkspace();
                const code = window.BlocklyJS.workspaceToCode(workspace);
                setLatestCode(code);
                // Run in setup mode and get state synchronously
                const result = runCode(code, true, true);
                if (result.ball && result.ball.x != null && result.ball.y != null) {
                  setBallRadius(result.radius);
                  setSimBall({ ...result.ball, vx: 0, vy: 0 });
                } else {
                  setOutput("Error: ball has no x and y values.");
                }
              } else {
                setOutput("Blockly or code generator not loaded.");
              }
            }}
            style={{ marginLeft: 10 }}
          >
            Drop Ball
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
