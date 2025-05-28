import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';

interface LowPolyCityProps {
  timeBlocks: Array<{
    start: number;
    end: number;
    category: string;
    color: string;
  }>;
}

const LowPolyCity: React.FC<LowPolyCityProps> = ({ timeBlocks }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const buildingsRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1a1a1a);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    // Position camera to look at the center of the circle, with increased offset for right-aligned viewport
    camera.position.set(25, 15, 15);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 15; // Increased minimum distance
    controls.maxDistance = 40; // Increased maximum distance
    controls.maxPolarAngle = Math.PI / 2; // Prevent going below ground level
    // Set the target to the center of the circle
    controls.target.set(0, 0, 0);
    // Update controls to apply the target
    controls.update();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Sky
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const sun = new THREE.Vector3();
    const phi = THREE.MathUtils.degToRad(88);
    const theta = THREE.MathUtils.degToRad(180);
    sun.setFromSphericalCoords(1, phi, theta);
    skyUniforms['sunPosition'].value.copy(sun);

    // Ground plane
    const groundGeometry = new THREE.CircleGeometry(20, 32);
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x2c3e50,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    scene.add(ground);

    // Buildings group
    const buildings = new THREE.Group();
    buildingsRef.current = buildings;
    scene.add(buildings);

    // Create buildings based on time blocks
    const createBuildings = () => {
      buildings.clear();
      
      const radius = 10; // Radius of the circle
      const numBuildings = timeBlocks.length;
      
      timeBlocks.forEach((block, index) => {
        const height = (block.end - block.start) * 2;
        const width = 1;
        const depth = 1;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(block.color),
          transparent: true,
          opacity: 0.8,
          shininess: 30,
        });
        
        const building = new THREE.Mesh(geometry, material);
        
        // Calculate position in circle
        const angle = (index / numBuildings) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        building.position.set(x, height / 2, z);
        // Rotate building to face center
        building.rotation.y = angle + Math.PI / 2;
        
        buildings.add(building);
      });
    };

    createBuildings();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update buildings when timeBlocks change
  useEffect(() => {
    if (buildingsRef.current) {
      buildingsRef.current.clear();
      
      const radius = 10; // Radius of the circle
      const numBuildings = timeBlocks.length;
      
      // Find the total time range
      const totalTimeRange = timeBlocks.reduce((max, block) => 
        Math.max(max, block.end - block.start), 0);
      
      timeBlocks.forEach((block, index) => {
        // Calculate height based on time range relative to total range
        const timeRange = block.end - block.start;
        const height = (timeRange / totalTimeRange) * 20; // Scale height based on time proportion
        const width = 1;
        const depth = 1;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(block.color),
          transparent: true,
          opacity: 0.8,
          shininess: 30,
        });
        
        const building = new THREE.Mesh(geometry, material);
        
        // Calculate position in circle
        const angle = (index / numBuildings) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        building.position.set(x, height / 2, z);
        // Rotate building to face center
        building.rotation.y = angle + Math.PI / 2;
        
        buildingsRef.current?.add(building);
      });
    }
  }, [timeBlocks]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: 0,
      }}
    />
  );
};

export default LowPolyCity; 