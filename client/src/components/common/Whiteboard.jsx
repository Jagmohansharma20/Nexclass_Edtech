import { useEffect, useState, useRef } from 'react';
import "./Whiteboard.css";
import { socket } from '../../services/socket';

import { FaPencil } from "react-icons/fa6";
import { BsEraserFill } from "react-icons/bs";
import { SiCcleaner } from "react-icons/si";
import { MdUndo, MdRedo } from "react-icons/md";

function Whiteboard({ roomId }) {
    const [strokes, setStrokes] = useState([]);
    const currentStroke = useRef(null);

    const canvasRef = useRef(null);
    const contextRef = useRef(null);

    const [drawing, setDrawing] = useState(false);
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('white');
    const [size, setSize] = useState(2);

    // ✅ Canvas setup
    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        const resizeCanvas = () => {
            const parent = canvas.parentElement;

            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;

            context.lineCap = "round";
            context.lineJoin = "round";

            contextRef.current = context;
            redrawCanvas();
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        return () => window.removeEventListener("resize", resizeCanvas);
    }, []);

    // ✅ Start
    const startDrawing = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        const canvas = canvasRef.current;
        if (tool === 'eraser') {
            erase(offsetX, offsetY);
            return;
        }

        currentStroke.current = {
            id: Date.now(),
            points: [{ x: offsetX / canvas.width, y: offsetY / canvas.height }],
            color,
            size
        };

        setDrawing(true);
    };

    // ✅ Draw
    const draw = (e) => {
        const canvas = canvasRef.current;
        if (!drawing || !currentStroke.current) return;

        const { offsetX, offsetY } = e.nativeEvent;

        currentStroke.current.points.push({ x: offsetX / canvas.width, y: offsetY / canvas.height });

        redrawCanvas();
    };

    // ✅ Stop
    const stopDrawing = () => {
        if (!currentStroke.current) return;

        const stroke = currentStroke.current;

        setStrokes(prev => [...prev, stroke]);

        socket.emit("add-stroke", { roomId, stroke });

        currentStroke.current = null;
        setDrawing(false);
    };

    // ✅ Redraw
    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;

        if (!ctx || !canvas) return;

        // 🔥 clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ✅ draw all saved strokes
        strokes.forEach((stroke) => {
            if (!stroke || !stroke.points) return;

            ctx.beginPath();
            ctx.strokeStyle = stroke.color || "white";

            // scale line width based on screen
            ctx.lineWidth = stroke.size * (canvas.width / 1000);

            stroke.points.forEach((p, i) => {
                const realX = p.x * canvas.width;
                const realY = p.y * canvas.height;

                if (i === 0) ctx.moveTo(realX, realY);
                else ctx.lineTo(realX, realY);
            });

            ctx.stroke();
            ctx.closePath();
        });

        // ✅ draw current stroke (LIVE while drawing)
        if (currentStroke.current && currentStroke.current.points) {
            ctx.beginPath();
            ctx.strokeStyle = currentStroke.current.color || "white";

            ctx.lineWidth =
                currentStroke.current.size * (canvas.width / 1000);

            currentStroke.current.points.forEach((p, i) => {
                const realX = p.x * canvas.width;
                const realY = p.y * canvas.height;

                if (i === 0) ctx.moveTo(realX, realY);
                else ctx.lineTo(realX, realY);
            });

            ctx.stroke();
            ctx.closePath();
        }
    };

    // ✅ Eraser (ID based)
    const erase = (x, y) => {
        const canvas = canvasRef.current;

        // ✅ convert to normalized coords
        const normX = x / canvas.width;
        const normY = y / canvas.height;

        const threshold = 0.02; // small value for normalized space

        const target = strokes.find(stroke =>
            stroke.points.some(p => {
                const dx = p.x - normX;
                const dy = p.y - normY;
                return Math.sqrt(dx * dx + dy * dy) < threshold;
            })
        );

        if (!target) return;

        // remove locally
        setStrokes(prev => prev.filter(s => s.id !== target.id));

        // sync with others
        socket.emit("erase-stroke", {
            roomId,
            strokeId: target.id
        });
    };

    // ✅ Undo / Redo (server controlled)
    const undo = () => socket.emit("undo", { roomId });
    const redo = () => socket.emit("redo", { roomId });

    const clearBoard = () => {
        setStrokes([]);
        socket.emit("clear-all", { roomId });
    };

    // ✅ Socket listeners
    useEffect(() => {

        socket.on("load-whiteboard", (data) => {
            if (!data) return;
            setStrokes(data);
        });

        socket.on("add-stroke", ({ stroke }) => {
            setStrokes(prev => [...prev, stroke]);
        });

        socket.on("erase-stroke", ({ strokeId }) => {
            setStrokes(prev => prev.filter(s => s.id !== strokeId));
        });

        socket.on("undo", ({ drawings }) => {
            setStrokes(drawings);
        });

        socket.on("redo", ({ drawings }) => {
            setStrokes(drawings);
        });

        socket.on("clear-all", () => {
            setStrokes([]);
        });

        return () => {
            socket.off("add-stroke");
            socket.off("erase-stroke");
            socket.off("undo");
            socket.off("redo");
            socket.off("clear-all");
            socket.off("load-whiteboard");
        };

    }, []);

    useEffect(() => {
        redrawCanvas();
    }, [strokes]);

    return (
        <div className="whiteboard-container">
            <div className="toolbar">
                <button onClick={() => setTool('pen')}><FaPencil /></button>
                <button onClick={() => setTool('eraser')}><BsEraserFill /></button>

                <button onClick={undo}><MdUndo /></button>
                <button onClick={redo}><MdRedo /></button>

                <input
                    type='range'
                    min='2'
                    max='10'
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                />

                <button onClick={() => setColor('white')} style={{ background: "white" }} />
                <button onClick={() => setColor('red')} style={{ background: "red" }} />
                <button onClick={() => setColor('blue')} style={{ background: "blue" }} />

                <button onClick={clearBoard}><SiCcleaner /></button>
            </div>

            <canvas
                ref={canvasRef}
                className="whiteboard"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
            />
        </div>
    );
}

export default Whiteboard;

// import { useEffect, useState, useRef } from 'react';
// import "./Whiteboard.css";
// import { socket } from '../../services/socket';

// import { FaPencil } from "react-icons/fa6";
// import { BsEraserFill } from "react-icons/bs";
// import { SiCcleaner } from "react-icons/si";
// import { MdUndo, MdRedo } from "react-icons/md";


// function Whiteboard({ roomId }) {
//     const [strokes, setStrokes] = useState([]);
//     const [redoStack, setRedoStack] = useState([]);
//     const currentStroke = useRef(null);
//     const canvasRef = useRef(null);
//     const contextRef = useRef(null);

//     const [drawing, setDrawing] = useState(false);
//     const [tool, setTool] = useState('pen');
//     const [color, setColor] = useState('black');
//     const [size, setsize] = useState(2);
//     const initialized = useRef(false);

//     useEffect(() => {
//         const canvas = canvasRef.current;
//         const context = canvas.getContext("2d");

//         const resizeCanvas = () => {
//             const parent = canvas.parentElement;

//             canvas.width = parent.clientWidth;
//             canvas.height = parent.clientHeight;

//             context.lineCap = "round";
//             context.lineJoin = "round";

//             contextRef.current = context;

//             redrawCanvas(); // 🔥 restore drawing
//         };

//         resizeCanvas();
//         window.addEventListener("resize", resizeCanvas);

//         return () => window.removeEventListener("resize", resizeCanvas);
//     }, [strokes]);

//     // useEffect(() => {
//     //     if (initialized.current) return;
//     //     const canvas = canvasRef.current;
//     //     const context = canvas.getContext("2d");
//     //     canvas.width = canvas.parentElement.clientWidth;
//     //     canvas.height = canvas.parentElement.clientHeight;

//     //     context.lineCap = "round";
//     //     context.lineJoin = 'round';
//     //     context.lineWidth = size;

//     //     contextRef.current = context;
//     //     initialized.current = true;


//     // }, []);


//     const startDrawing = (e) => {
//         const { offsetX, offsetY } = e.nativeEvent;
//         if (tool === 'eraser') {
//             erase(offsetX, offsetY);
//             return;
//         }

//         currentStroke.current = {
//             id: Date.now(),
//             points: [{ x: offsetX, y: offsetY }],
//             color,
//             size
//         };
//         setDrawing(true);
//         // contextRef.current.beginPath();
//         // contextRef.current.moveTo(offsetX, offsetY);

//         // socket.emit('draw-start', { roomId, x: offsetX, y: offsetY });




//     }
//     const draw = (e) => {
//         if (!drawing) {
//             return;
//         }
//         const { offsetX, offsetY } = e.nativeEvent;
//         currentStroke.current.points.push({ x: offsetX, y: offsetY });
//         redrawCanvas();

//         //     contextRef.current.strokeStyle = tool === 'eraser' ? 'white' : color;
//         //     contextRef.current.lineTo(offsetX, offsetY);
//         //     contextRef.current.stroke();

//         //     socket.emit('draw', { roomId, x: offsetX, y: offsetY, color, size, tool });
//     }
//     const stopDrawing = () => {
//         // contextRef.current.closePath();

//         // socket.emit('draw-end', { roomId });
//         // if (!currentStroke.current) return;
//         // setStrokes(prev => [...prev, currentStroke.current]);
//         // setRedoStack([]);
//         // socket.emit('add-stroke', { roomId, stroke: currentStroke.current });
//         // currentStroke.current = null;
//         // setDrawing(false);
//         if (!currentStroke.current) return;

//         // ✅ 1. UPDATE YOUR OWN SCREEN
//         setStrokes(prev => [...prev, currentStroke.current]);

//         // ✅ 2. SEND TO OTHERS
//         socket.emit("add-stroke", {
//             roomId,
//             stroke: currentStroke.current
//         });

//         currentStroke.current = null;
//         setDrawing(false);

//     }

//     const redrawCanvas = () => {
//         const canvas = canvasRef.current;
//         const ctx = contextRef.current;
//         if (!ctx) return;

//         ctx.clearRect(0, 0, canvas.width, canvas.height);

//         strokes.forEach((stroke) => {
//             if (!stroke || !stroke.points) return;
//             ctx.beginPath();
//             ctx.strokeStyle = stroke.color || 'white';
//             ctx.lineWidth = stroke.size || 2;

//             stroke.points.forEach((p, i) => {
//                 if (i == 0) ctx.moveTo(p.x, p.y);
//                 else ctx.lineTo(p.x, p.y);
//             });
//             ctx.stroke();
//             ctx.closePath();
//         });
//     }

//     const erase = (x, y) => {
//         const threshold = 10;
//         const updated = strokes.filter(stroke => {
//             return !stroke.points.some(p => {
//                 const dx = p.x - x;
//                 const dy = p.y - y;
//                 return Math.sqrt(dx * dx + dy * dy) < threshold;
//             })
//         })
//         setStrokes(updated);
//         redrawCanvas();
//         socket.emit("erase-stroke", { roomId, x, y });
//     }

//     const undo = () => {
//         if (strokes.length === 0) return;
//         const last = strokes[strokes.length - 1];

//         setRedoStack(prev => [...prev, last]);
//         setStrokes(prev => prev.slice(0, -1));
//         redrawCanvas();
//         socket.emit('undo', { roomId });
//     }

//     const redo = () => {
//         if (redoStack.length === 0) return;
//         const last = redoStack[redoStack.length - 1];
//         setStrokes(prev => [...prev, last]);
//         setRedoStack(prev => prev.slice(0, -1));
//         redrawCanvas();
//         socket.emit('redo', { roomId, stroke: last });
//     }



//     const clearBoard = () => {
//         setStrokes([]);
//         setRedoStack([]);
//         socket.emit('clear-all', { roomId });

//     }

//     useEffect(() => {

//         socket.on('load-whiteboard', (drawings) => {
//             const ctx = contextRef.current;

//             drawings.forEach(item => {
//                 if (item.type === 'start') {
//                     ctx.beginPath();
//                     ctx.moveTo(item.x, item.y);
//                 }

//                 if (item.type === 'draw') {
//                     ctx.strokeStyle = item.tool === 'eraser' ? 'white' : item.color;
//                     ctx.lineWidth = item.size;
//                     ctx.lineTo(item.x, item.y);
//                     ctx.stroke();
//                 }

//                 if (item.type === 'end') {
//                     ctx.closePath();
//                 }
//             });
//         });




//         // socket.on('draw-start', ({ x, y }) => {
//         //     contextRef.current.beginPath();
//         //     contextRef.current.moveTo(x, y);


//         // })

//         // socket.on('draw', (data) => {
//         //     const { x, y, color, size, tool } = data;
//         //     contextRef.current.strokeStyle = tool === 'eraser' ? 'white' : color;
//         //     contextRef.current.lineWidth = size;
//         //     contextRef.current.lineTo(x, y);
//         //     contextRef.current.stroke();


//         // });

//         // socket.on('draw-end', () => {
//         //     contextRef.current.closePath();

//         // })
//         socket.on("add-stroke", ({ stroke }) => {
//             if (!stroke || !stroke.points) return;

//             setStrokes(prev => [...prev, stroke]);
//         });

//         socket.on("redo", ({ stroke }) => {
//             if (!stroke || !stroke.points) return;

//             setStrokes(prev => [...prev, stroke]);
//         });

//         socket.on("undo", () => {
//             setStrokes(prev => prev.slice(0, -1));
//         });
//         socket.on("clear-all", () => {
//             setStrokes([]);
//             setRedoStack([]);
//         });



//         return () => {
//             socket.off('add-stroke');
//             socket.off('undo');
//             socket.off('redo');
//             socket.off('clear-all');
//             socket.off('load-whiteboard');
//         }
//     }, []);
//     useEffect(() => {
//     redrawCanvas();
// }, [strokes]);

//     return (
//         <div className="whiteboard-container">

//             <div className="toolbar">
//                 <button onClick={() => setTool('pen')}> <FaPencil /></button>
//                 <p>{size}</p>
//                 <input type='range' min='2' max='10' value={size} onChange={(e) => setsize(e.target.value)} ></input>
//                 <button onClick={undo}><MdUndo /></button>
//                 <button onClick={redo}><MdRedo /></button>
//                 <button onClick={() => setTool('eraser')}> <BsEraserFill /></button>
//                 <button onClick={() => setColor('red')} style={{ background: "red" }}></button>
//                 <button onClick={() => setColor('blue')} style={{ background: "blue" }}></button>
//                 <button onClick={() => setColor('green')} style={{ background: "green" }}></button>
//                 <button onClick={clearBoard}> <SiCcleaner /> </button>


//             </div>
//             <canvas
//                 ref={canvasRef}
//                 className="whiteboard"
//                 onMouseDown={startDrawing}
//                 onMouseMove={draw}
//                 onMouseUp={stopDrawing}
//                 onMouseLeave={stopDrawing}
//             ></canvas>
//         </div>
//     )
// }

// export default Whiteboard