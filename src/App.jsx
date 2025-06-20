import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
    const videoRef = useRef(null);
    const gazeDotRef = useRef(null);
    const hoverTimer = useRef(null);

    const [tracking, setTracking] = useState(true);
    const [buttonClicked, setButtonClicked] = useState(null);
    const [hoveredButton, setHoveredButton] = useState(null);

    const buttonPositions = [
        { id: "comida", x: 0.3, y: 0.7, label: "Comida" },
        { id: "dolor", x: 0.7, y: 0.7, label: "Dolor" },
        { id: "baño", x: 0.3, y: 0.9, label: "Baño" },
        { id: "emociones", x: 0.7, y: 0.9, label: "Emociones" },
    ];

    const buttonTooltips = {
        comida: "¿Tienes hambre?",
        dolor: "¿Te duele algo?",
        baño: "¿Necesitas ir al baño?",
        emociones: "¿Cómo te sientes hoy?",
    };

    useEffect(() => {
        let gazeListener = null;

        const startWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                alert("No se pudo acceder a la cámara: " + err.message);
            }
        };

        startWebcam();

        // Activar herramientas de predicción (entrenamiento visual)
        if (window.webgazer) {
            window.webgazer.showVideoPreview(true);
            window.webgazer.showPredictionPoints(true);
            window.webgazer.showFaceOverlay(true);
            window.webgazer.showFaceFeedbackBox(true);
        }

        if (tracking && window.webgazer) {
            gazeListener = (data) => {
                if (!data) return;

                const width = window.innerWidth;
                const height = window.innerHeight;
                const x = data.x * width;
                const y = data.y * height;

                // Actualizar punto rojo
                if (gazeDotRef.current) {
                    gazeDotRef.current.style.left = `${x}px`;
                    gazeDotRef.current.style.top = `${y}px`;
                }

                let focused = null;

                buttonPositions.forEach((button) => {
                    const isLooking = Math.abs(data.x - button.x) < 0.1 && Math.abs(data.y - button.y) < 0.1;
                    if (isLooking) focused = button.id;
                });

                if (focused && focused !== hoveredButton) {
                    clearTimeout(hoverTimer.current);
                    hoverTimer.current = setTimeout(() => {
                        setButtonClicked(focused); // Activar como "seleccionado"
                    }, 1500); // Tiempo de hover
                }

                if (!focused) {
                    clearTimeout(hoverTimer.current);
                    setButtonClicked(null);
                }

                setHoveredButton(focused);
            };

            window.webgazer.setGazeListener(gazeListener);
            if (typeof window.webgazer.begin === "function") {
                window.webgazer.begin();
            }
        }

        return () => {
            if (window.webgazer) {
                try {
                    window.webgazer.setGazeListener(null);
                    if (typeof window.webgazer.end === "function") {
                        window.webgazer.end();
                    }
                } catch (err) {
                    console.warn("Error al limpiar WebGazer:", err);
                }
            }
        };
    }, [tracking]);

    const stopTracking = () => setTracking(false);
    const startTracking = () => setTracking(true);

    return (
        <div className="app">
            <div className="panel">
                <div className="header">
                    <h1 className="title">Neurela</h1>
                    <p className="subtitle">Mira un botón durante 1.5 segundos para seleccionarlo</p>
                </div>

                <video ref={videoRef} autoPlay playsInline className="video" />

                <div
                    ref={gazeDotRef}
                    style={{
                        position: "absolute",
                        width: "20px", // Tamaño aumentado
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: "red",
                        pointerEvents: "none",
                        zIndex: 20,
                        transform: "translate(-50%, -50%)",
                    }}
                ></div>

                <div className="button-grid">
                    {buttonPositions.map((button) => (
                        <button
                            key={button.id}
                            id={button.id}
                            className={`btn ${buttonClicked === button.id ? "active" : ""}`}
                            style={{
                                left: `${button.x * 100}%`,
                                top: `${button.y * 100}%`,
                            }}
                            disabled
                        >
                            {button.label}
                        </button>
                    ))}

                    {hoveredButton && (
                        <div
                            className="hover-tooltip"
                            style={{
                                position: "absolute",
                                top: `${buttonPositions.find((b) => b.id === hoveredButton)?.y * 100 - 10}%`,
                                left: `${buttonPositions.find((b) => b.id === hoveredButton)?.x * 100}%`,
                                transform: "translateX(-50%)",
                                backgroundColor: "rgba(0, 0, 0, 0.7)",
                                color: "white",
                                padding: "6px 12px",
                                borderRadius: "4px",
                                fontSize: "14px",
                                pointerEvents: "none",
                                zIndex: 10,
                            }}
                        >
                            {buttonTooltips[hoveredButton]}
                        </div>
                    )}
                </div>

                {!tracking ? (
                    <button onClick={startTracking} className="btn control-btn">
                        Iniciar Seguimiento Ocular
                    </button>
                ) : (
                    <button onClick={stopTracking} className="btn control-btn">
                        Detener Seguimiento
                    </button>
                )}
            </div>
        </div>
    );
}

export default App;
