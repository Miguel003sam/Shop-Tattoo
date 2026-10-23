import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PresentationControls, useTexture } from "@react-three/drei";
import * as THREE from "three";

const NEON_PINK = new THREE.Color("#ff4fd8");
const NEON_CYAN = new THREE.Color("#3ff3e8");
const DEPTH = 0.12;

// Recorta la imagen al centro para que llene la tarjeta sin deformarse
// (igual que object-fit: cover en CSS)
function fitTexture(texture, width, height) {
  const imageAspect = texture.image.width / texture.image.height;
  const cardAspect = width / height;

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);

  if (imageAspect > cardAspect) {
    texture.repeat.x = cardAspect / imageAspect;
    texture.offset.x = (1 - texture.repeat.x) / 2;
  } else {
    texture.repeat.y = imageAspect / cardAspect;
    texture.offset.y = (1 - texture.repeat.y) / 2;
  }

  texture.needsUpdate = true;
  return texture;
}

// Tarjeta con la imagen al frente, cuerpo de cobre y borde de neón
function Medallion({ imageUrl, width, height }) {
  const texture = useTexture(imageUrl);
  const front = useMemo(() => fitTexture(texture, width, height), [texture, width, height]);
  const sway = useRef();
  const rim = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Balanceo suave para que se note el volumen
    sway.current.rotation.y = Math.sin(t * 0.6) * 0.35;
    sway.current.rotation.x = Math.sin(t * 0.4) * 0.08;

    // El borde cambia entre rosa y cian
    const mix = (Math.sin(t * 1.2) + 1) / 2;
    rim.current.color.copy(NEON_PINK).lerp(NEON_CYAN, mix);
  });

  return (
    <group ref={sway}>
      {/* Borde de neón (no le afecta la iluminación, para que brille) */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[width + 0.1, height + 0.1, DEPTH - 0.02]} />
        <meshBasicMaterial ref={rim} toneMapped={false} />
      </mesh>

      {/* Cuerpo de cobre */}
      <mesh>
        <boxGeometry args={[width, height, DEPTH]} />
        <meshStandardMaterial color="#b87333" metalness={0.8} roughness={0.35} />
      </mesh>

      {/* Imagen al frente */}
      <mesh position={[0, 0, DEPTH / 2 + 0.001]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={front} roughness={0.45} metalness={0.1} />
      </mesh>

      {/* Reverso oscuro */}
      <mesh position={[0, 0, -DEPTH / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#1a1a18" roughness={0.8} />
      </mesh>
    </group>
  );
}

// Dos luces de neón que giran alrededor de la tarjeta
function NeonLights() {
  const pink = useRef();
  const cyan = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.8;
    pink.current.position.set(Math.cos(t) * 3, Math.sin(t) * 2, 2.5);
    cyan.current.position.set(Math.cos(t + Math.PI) * 3, Math.sin(t + Math.PI) * 2, 2.5);
  });

  return (
    <>
      <pointLight ref={pink} color={NEON_PINK} intensity={30} />
      <pointLight ref={cyan} color={NEON_CYAN} intensity={30} />
    </>
  );
}

function Viewer3D({ imageUrl, width = 2.4, height = 3.2, className = "" }) {
  return (
    <div className={`viewer-3d ${className}`}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 5]} intensity={1.2} />
        <NeonLights />

        <PresentationControls
          global
          cursor
          snap
          speed={1.5}
          polar={[-0.4, 0.4]}
          azimuth={[-Infinity, Infinity]}
        >
          <Float speed={2} rotationIntensity={0.3} floatIntensity={0.8}>
            <Suspense fallback={null}>
              {imageUrl && <Medallion imageUrl={imageUrl} width={width} height={height} />}
            </Suspense>
          </Float>
        </PresentationControls>
      </Canvas>
    </div>
  );
}

export default Viewer3D;
