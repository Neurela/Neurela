import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
    const videoRef = useRef(null);
    const gazeDotRef = useRef(null);
    const [tracking, setTracking] = useState(true); // Inicialmente activo
    const [buttonClicked, setButtonClicked] = useState(null);
    const [hoveredButton, setHoveredButton] = useState(null); // Para mostrar tooltips

    // Coordenadas de los botones
    const buttonPositions = [
        { id: "comida", x: 0.3, y: 0.7, label: "Comida" },
        { id: "dolor", x: 0.7, y: 0.7, label: "Dolor" },
        { id: "baño", x: 0.3, y: 0.9, label: "Baño" },
        { id: "emociones", x: 0.7, y: 0.9, label: "Emociones" },
    ];

    // Mensajes específicos por botón
    const buttonTooltips = {
        comida: "¿Tienes hambre?",
        dolor: "¿Te duele algo?",
        baño: "¿Necesitas ir al baño?",
        emociones: "¿Cómo te sientes hoy?",
    };

    // Efecto para iniciar/detener seguimiento ocular
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

        if (tracking && window.webgazer) {
            gazeListener = (data) => {
                if (!data) return;

                // Actualizar posición del punto rojo
                if (gazeDotRef.current) {
                    const { width, height } = window;
                    const x = data.x * width;
                    const y = data.y * height;
                    gazeDotRef.current.style.left = `${x}px`;
                    gazeDotRef.current.style.top = `${y}px`;
                }

                let focusedButton = null;

                buttonPositions.forEach((button) => {
                    const isLookingAtButton = Math.abs(data.x - button.x) < 0.1 && Math.abs(data.y - button.y) < 0.1;

                    if (isLookingAtButton) {
                        focusedButton = button.id;
                    }
                });

                setButtonClicked(focusedButton);
                setHoveredButton(focusedButton); // Muestra tooltip inmediatamente
            };

            window.webgazer.setGazeListener(gazeListener).begin();
        } else if (!tracking && window.webgazer) {
            window.webgazer.setGazeListener(null);
            window.webgazer.end();
            setButtonClicked(null);
            setHoveredButton(null);
        }

        return () => {
            if (window.webgazer) {
                window.webgazer.setGazeListener(null);
                window.webgazer.end();
            }
        };
    }, [tracking]);

    const stopTracking = () => {
        console.log("Botón 'Detener Seguimiento' clickeado");
        setTracking(false);
    };

    const startTracking = () => {
        console.log("Botón 'Iniciar Seguimiento' clickeado");
        setTracking(true);
    };

    return (
        <div className="app">
            <div className="panel">
                <div className="header">
                    <h1 className="title">Neurela</h1>
                    <p className="subtitle">Mira un botón para seleccionarlo</p>
                </div>

                {/* Video en tiempo real */}
                <video ref={videoRef} autoPlay playsInline className="video" />

                {/* Panel de botones */}
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

                    {/* Tooltip sobre botón actual */}
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

                {/* Botones de control */}
                {!tracking && (
                    <button onClick={startTracking} className="btn control-btn">
                        Iniciar Seguimiento Ocular
                    </button>
                )}
                {tracking && (
                    <button onClick={stopTracking} className="btn control-btn">
                        Detener Seguimiento
                    </button>
                )}
            </div>
        </div>
    );
}

export default App;
