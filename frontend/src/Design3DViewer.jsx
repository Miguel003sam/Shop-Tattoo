import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";

const CARD_WIDTH = 2.4;
const CARD_HEIGHT = 3.2;
const CARD_DEPTH = 0.08;

// Recorta la imagen al centro para que llene la tarjeta sin deformarse
// (igual que object-fit: cover en CSS)
function fitTextureToCard(texture) {
  const imageAspect = texture.image.width / texture.image.height;
  const cardAspect = CARD_WIDTH / CARD_HEIGHT;

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

function TattooCard({ imageUrl }) {
  const texture = useTexture(imageUrl);
  const front = useMemo(() => fitTextureToCard(texture), [texture]);

  // Caras de la caja: derecha, izquierda, arriba, abajo, frente, reverso
  return (
    <mesh>
      <boxGeometry args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH]} />
      <meshStandardMaterial attach="material-0" color="#d9c5a0" metalness={0.6} roughness={0.3} />
      <meshStandardMaterial attach="material-1" color="#d9c5a0" metalness={0.6} roughness={0.3} />
      <meshStandardMaterial attach="material-2" color="#d9c5a0" metalness={0.6} roughness={0.3} />
      <meshStandardMaterial attach="material-3" color="#d9c5a0" metalness={0.6} roughness={0.3} />
      <meshStandardMaterial attach="material-4" map={front} roughness={0.55} />
      <meshStandardMaterial attach="material-5" color="#1a1a18" metalness={0.2} roughness={0.8} />
    </mesh>
  );
}

function Design3DViewer({ design }) {
  return (
    <div className="viewer-3d">
      <Canvas camera={{ position: [0, 0, 5.2], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <directionalLight position={[-4, -2, -3]} intensity={0.6} color="#d9c5a0" />
        <Suspense fallback={null}>
          {design.image_url && <TattooCard imageUrl={design.image_url} />}
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={2.5}
        />
      </Canvas>
    </div>
  );
}

export default Design3DViewer;
