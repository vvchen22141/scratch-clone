import React, { useRef, useState, useMemo } from "react";
import BlocklyComponent from "./BlocklyComponent";

function App() {
  const simCanvasRef = useRef(null);
  const [output, setOutput] = useState("");
  const [simBall, setSimBall] = useState(null);
  const [ballRadius, setBallRadius] = useState(20);
  const [setupBall, setSetupBall] = useState(null);
  const [ballAtRest, setBallAtRest] = useState(false);
  const simWidth = 500;
  const simHeight = 400;

  // Memoize the toolbox to avoid recreating it on every render
  const toolbox = useMemo(() => ({
    kind: "categoryToolbox",
    contents: [
      {
        kind: "category",
        name: "Custom Blocks",
        colour: "#2196f3",
        contents: [
          { kind: "block", type: "create_ball" },
          { kind: "block", type: "set_ball_position" },
          { kind: "block", type: "set_acceleration" },
          { kind: "block", type: "set_velocity" },
          { kind: "block", type: "create_angled_ramp" },
        ],
      },
      {
        kind: "category",
        name: "Logic",
        colour: "#5C81A6",
        contents: [ { kind: "block", type: "controls_if" } ],
      },
      {
        kind: "category",
        name: "Loops",
        colour: "#5CA65C",
        contents: [
          { kind: "block", type: "controls_repeat_ext" },
          { kind: "block", type: "controls_whileUntil" },
          { kind: "block", type: "controls_for" },
          { kind: "block", type: "controls_forEach" },
          { kind: "block", type: "controls_flow_statements" },
        ],
      },
      {
        kind: "category",
        name: "Math",
        colour: "#5C68A6",
        contents: [
          { kind: "block", type: "math_number" },
          { kind: "block", type: "math_arithmetic" },
          { kind: "block", type: "math_single" },
          { kind: "block", type: "math_trig" },
          { kind: "block", type: "math_constant" },
          { kind: "block", type: "math_number_property" },
          { kind: "block", type: "math_round" },
          { kind: "block", type: "math_on_list" },
          { kind: "block", type: "math_modulo" },
          { kind: "block", type: "math_constrain" },
          { kind: "block", type: "math_random_int" },
          { kind: "block", type: "math_random_float" },
        ],
      },
      {
        kind: "category",
        name: "Text",
        colour: "#5CA68D",
        contents: [
          { kind: "block", type: "text" },
          { kind: "block", type: "text_join" },
          { kind: "block", type: "text_append" },
          { kind: "block", type: "text_length" },
          { kind: "block", type: "text_isEmpty" },
          { kind: "block", type: "text_indexOf" },
          { kind: "block", type: "text_charAt" },
          { kind: "block", type: "text_getSubstring" },
          { kind: "block", type: "text_changeCase" },
          { kind: "block", type: "text_trim" },
          { kind: "block", type: "text_print" },
        ],
      },
      {
        kind: "category",
        name: "Lists",
        colour: "#745CA6",
        contents: [
          { kind: "block", type: "lists_create_with" },
          { kind: "block", type: "lists_repeat" },
          { kind: "block", type: "lists_length" },
          { kind: "block", type: "lists_isEmpty" },
          { kind: "block", type: "lists_indexOf" },
          { kind: "block", type: "lists_getIndex" },
          { kind: "block", type: "lists_setIndex" },
          { kind: "block", type: "lists_getSublist" },
          { kind: "block", type: "lists_split" },
          { kind: "block", type: "lists_sort" },
        ],
      },
      {
        kind: "category",
        name: "Colour",
        colour: "#A6745C",
        contents: [
          { kind: "block", type: "colour_picker" },
          { kind: "block", type: "colour_random" },
          { kind: "block", type: "colour_rgb" },
          { kind: "block", type: "colour_blend" },
          { kind: "block", type: "colour_isColour" },
        ],
      },
      {
        kind: "category",
        name: "Variables",
        custom: "VARIABLE",
        colour: "#A65C81"
      },
      {
        kind: "category",
        name: "Functions",
        custom: "PROCEDURE",
        colour: "#9A5CA6"
      }
    ]
  }), []);

  // Track if simulation is running
  const isSimRunning = simBall && !ballAtRest;

  const runCode = (code, setupMode = false, returnState = false) => {
    if (isSimRunning && !setupMode && !returnState) {
      setOutput("Please wait for the simulation to finish.");
      return;
    }
    if (!returnState) setOutput("");
    let ballCreated = false;
    let error = null;
    let lastBall = null;
    let lastRadius = ballRadius;
    let dropBallCalled = false;
    let createBallCalled = false;
    let anyBlockCalled = false;
    const api = {
      print: (msg) => { anyBlockCalled = true; setOutput((prev) => prev + msg + "\n"); },
      createBall: (radius) => {
        anyBlockCalled = true;
        if (createBallCalled) {
          setOutput("Error: Only one ball can be created per run.");
          throw new Error("Error: Only one ball can be created per run.");
        }
        createBallCalled = true;
        const numR = Number(radius);
        const maxRadius = 180; // Prevent ball from being too large for the simulation area
        if (radius === undefined || radius === null || radius === "") {
          setOutput("Error: ball radius is missing.");
          throw new Error("Error: ball radius is missing.");
        }
        if (isNaN(numR)) {
          setOutput("Error: ball radius must be a number.");
          throw new Error("Error: ball radius must be a number.");
        }
        if (numR <= 0) {
          setOutput("Error: ball radius must be greater than 0.");
          throw new Error("Error: ball radius must be greater than 0.");
        }
        if (numR > maxRadius) {
          setOutput("Error: ball radius is too big for the simulation area.");
          throw new Error("Error: ball radius is too big for the simulation area.");
        }
        ballCreated = true;
        lastRadius = numR;
        lastBall = { x: 0, y: numR, vx: 0, vy: 0, color: "#2196f3" };
        setBallRadius(numR); // Always update radius for simulation
        if (setupMode && !returnState) setSetupBall(lastBall);
      },
      setBallPosition: (x, y) => {
        anyBlockCalled = true;
        if (!ballCreated) {
          error = "Error: set_ball_position called before create_ball.";
          setOutput(error);
          throw new Error(error);
        }
        if (x === undefined || y === undefined || x === null || y === null || x === "" || y === "") {
          error = "Error: ball x and y values are missing.";
          setOutput(error);
          throw new Error(error);
        }
        const numX = Number(x);
        const numY = Number(y);
        if (isNaN(numX) || isNaN(numY)) {
          error = "Error: ball x and y values must be numbers.";
          setOutput(error);
          throw new Error(error);
        }
        if (numX === 0 || numY === 0) {
          error = "Error: ball x and y values should not be 0.";
          setOutput(error);
          throw new Error(error);
        }
        if (numX < -250 || numX > 250 || numY < 0 || numY > 400) {
          error = "Error: ball x must be between -250 and 250, y must be between 0 and 400.";
          setOutput(error);
          throw new Error(error);
        }
        lastBall = { ...lastBall, x: numX, y: numY };
        if (setupMode && !returnState) setSetupBall(lastBall);
        if (setupMode && !returnState) setSimBall({ ...lastBall, x: numX, y: numY, vx: 0, vy: 0 });
      },
      setBallRadius: (r) => {
        anyBlockCalled = true;
        if (!ballCreated) {
          setOutput("Error: set_ball_radius called before create_ball.");
          throw new Error("Error: set_ball_radius called before create_ball.");
        }
        if (r === undefined || r === null || r === "") {
          setOutput("Error: ball radius is missing.");
          throw new Error("Error: ball radius is missing.");
        }
        const numR = Number(r);
        if (isNaN(numR)) {
          setOutput("Error: ball radius must be a number.");
          throw new Error("Error: ball radius must be a number.");
        }
        if (numR <= 0) {
          setOutput("Error: ball radius must be greater than 0.");
          throw new Error("Error: ball radius must be greater than 0.");
        }
        lastRadius = numR;
        setBallRadius(numR); // Always update radius for simulation
      },
      dropBall: () => {
        anyBlockCalled = true;
        dropBallCalled = true;
        if (!ballCreated) {
          setOutput("Error: drop_ball called before create_ball.");
          throw new Error("Error: drop_ball called before create_ball.");
        }
        if (setupBall && setupBall.x != null && setupBall.y != null) {
          setSimBall({ ...setupBall, vx: 0, vy: 0 });
          setBallAtRest(false);
        } else if (lastBall && lastBall.x != null && lastBall.y != null) {
          setSimBall({ ...lastBall, vx: 0, vy: 0 });
          setBallAtRest(false);
        } else {
          setOutput("Error: ball has no x and y values.");
        }
      },
    };
    try {
      const func = new Function("api", code);
      func(api);
      if (!anyBlockCalled && !isSimRunning) {
        setOutput("Error: No blocks were run. Please add blocks to the workspace.");
        return;
      }
      // If dropBall was not called, but a ball was created, show it at rest at default position
      if (!dropBallCalled && lastBall && lastBall.x != null && lastBall.y != null && !setupMode && !returnState) {
        setSimBall({ ...lastBall, vx: 0, vy: 0 });
        setBallAtRest(true);
      }
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

  React.useEffect(() => {
    // Reset all simulation state on mount (page refresh)
    setOutput("");
    setSimBall(null);
    setBallRadius(20);
    setSetupBall(null);
    setBallAtRest(false);
  }, []);

  // Animation effect: only animate if ball is not at rest
  React.useEffect(() => {
    let isMounted = true;
    let animationId;
    if (!simBall) {
      setBallAtRest(false);
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
    // If ball is at rest, just draw it once and do not animate
    if (ballAtRest) {
      if (simCanvasRef.current) {
        const ctx = simCanvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, simWidth, simHeight);
        ctx.fillStyle = "#eee";
        ctx.fillRect(0, 0, simWidth, simHeight);
        ctx.fillStyle = simBall.color || "#2196f3";
        ctx.beginPath();
        ctx.arc(250 + (simBall.x || 0), simBall.y, ballRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#444";
        ctx.fillRect(0, simHeight - 10, simWidth, 10);
      }
      return;
    }
    const gravity = 0.35; // restored to normal
    const restitution = 0.65;
    const minBounceV = 0.8;
    let localBall = { ...simBall };
    function draw() {
      if (!isMounted || !simCanvasRef.current) return;
      let { x = 0, y, vx = 0, vy = 0, color = "#2196f3" } = localBall;
      vy += gravity;
      y += vy;
      const canvasX = 250 + x;
      let canvasY = y;
      const floor = simHeight - ballRadius;
      let atRest = false;
      if (canvasY > floor) {
        canvasY = floor;
        if (Math.abs(vy) > minBounceV) {
          vy = -vy * restitution;
          y = floor + vy;
        } else {
          vy = 0;
          atRest = true;
          y = floor;
        }
      }
      localBall = { x, y, vx, vy, color };
      // Draw directly to canvas without waiting for state update
      const ctx = simCanvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, simWidth, simHeight);
      ctx.fillStyle = "#eee";
      ctx.fillRect(0, 0, simWidth, simHeight);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, ballRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = "#444";
      ctx.fillRect(0, simHeight - 10, simWidth, 10);
      if (!atRest && isMounted) {
        animationId = requestAnimationFrame(draw);
      } else {
        setBallAtRest(true);
        setSimBall((prev) => prev ? { ...prev, x, y: floor, vx: 0, vy: 0 } : { x, y: floor, vx: 0, vy: 0 });
      }
    }
    cancelAnimationFrame(animationId);
    draw();
    return () => {
      isMounted = false;
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [simBall, ballAtRest, ballRadius, simWidth, simHeight]);

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
        <div style={{ width: "70%", borderRight: "1px solid #ccc", height: "100vh", minHeight: 0 }}>
          <BlocklyComponent toolbox={toolbox} />
        </div>
        <div style={{ width: "30%", padding: "10px", height: "100vh", boxSizing: "border-box", overflow: "auto" }}>
          <h3>Simulation</h3>
          <canvas
            ref={simCanvasRef}
            width={simWidth}
            height={simHeight}
            style={{ border: "2px solid #333", background: "#eee", maxWidth: "100%", height: "auto" }}
          />
          <h3>Output</h3>
          <pre style={{ background: "#eee", padding: "5px", maxHeight: 200, overflow: "auto" }}>{output}</pre>
          <h3>Actions</h3>
          <button
            onClick={() => {
              setOutput("");
              if (
                window.Blockly &&
                window.Blockly.getMainWorkspace &&
                window.BlocklyJS &&
                typeof window.BlocklyJS.workspaceToCode === "function"
              ) {
                const workspace = window.Blockly.getMainWorkspace();
                const code = window.BlocklyJS.workspaceToCode(workspace);
                runCode(code, false, false); // always run latest code from workspace
              } else {
                setOutput("Blockly or code generator not loaded.");
              }
            }}
            style={{ marginRight: 10, background: '#2196f3', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = '#1769aa'}
            onMouseOut={e => e.currentTarget.style.background = '#2196f3'}
          >
            Run Code
          </button>
          <button
            onClick={() => {
              setOutput("");
              setBallAtRest(false);
              setSimBall(null);
              setSetupBall(null);
              // Do NOT clear or touch the workspace or code here
            }}
            style={{ background: '#2196f3', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = '#1769aa'}
            onMouseOut={e => e.currentTarget.style.background = '#2196f3'}
          >
            Restart Simulation
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
