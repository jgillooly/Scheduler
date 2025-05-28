import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky } from '@react-three/drei';
import * as THREE from 'three';

interface TimeBlock {
  start: number;
  end: number;
  category: string;
  color: string;
}

interface BuildingProps {
  position: [number, number, number];
  size: number;
  color: string;
  height: number;
}

const Road = ({ start, end }: { start: [number, number, number], end: [number, number, number] }) => {
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array([...start, ...end])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#4a4a4a" linewidth={5} />
    </line>
  );
};

const RoadGrid = ({ buildings }: { buildings: Array<{ position: [number, number, number] }> }) => {
  const roads = [];
  
  // Create roads between adjacent buildings
  for (let i = 0; i < buildings.length; i++) {
    const nextIndex = (i + 1) % buildings.length;
    roads.push(
      <Road
        key={`road-${i}`}
        start={[buildings[i].position[0], 0.1, buildings[i].position[2]]}
        end={[buildings[nextIndex].position[0], 0.1, buildings[nextIndex].position[2]]}
      />
    );
  }
  
  // Create roads to center
  const center: [number, number, number] = [0, 0.1, 0];
  buildings.forEach((building, i) => {
    roads.push(
      <Road
        key={`center-road-${i}`}
        start={[building.position[0], 0.1, building.position[2]]}
        end={center}
      />
    );
  });
  
  return <>{roads}</>;
};

const Skybox = () => {
  return (
    <Sky
      distance={450000}
      sunPosition={[0, 1, 0]}
      inclination={0.5}
      azimuth={0.25}
      mieCoefficient={0.005}
      rayleigh={8}
      turbidity={10}
      exposure={0.5}
    />
  );
};

const Building = ({ position, size, color, height }: BuildingProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[size, height, size]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const Ground = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#2c3e50" />
    </mesh>
  );
};

interface LowPolyCityProps {
  timeBlocks: TimeBlock[];
}

const LowPolyCity: React.FC<LowPolyCityProps> = ({ timeBlocks }) => {
  // Calculate building positions in a circle
  const numBuildings = timeBlocks.length;
  const radius = 10;
  const buildings = timeBlocks.map((block, index) => {
    const angle = (index / numBuildings) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Calculate height based on time allocation
    const duration = block.end - block.start;
    const height = duration * 0.5; // Scale factor to make heights more visible
    
    return {
      position: [x, height / 2, z] as [number, number, number],
      size: 1.5,
      color: block.color,
      height: height
    };
  });

  return (
    <Canvas style={{ background: '#1a1a1a' }}>
      <PerspectiveCamera makeDefault position={[15, 15, 15]} />
      <OrbitControls enableZoom={false} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Skybox />
      <Ground />
      <RoadGrid buildings={buildings} />
      {buildings.map((building, index) => (
        <Building
          key={index}
          position={building.position}
          size={building.size}
          color={building.color}
          height={building.height}
        />
      ))}
    </Canvas>
  );
};

export default LowPolyCity; 