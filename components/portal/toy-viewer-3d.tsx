"use client";

import React, {Suspense} from "react";
import {Canvas} from "@react-three/fiber";
import {OrbitControls, Stage, useGLTF} from "@react-three/drei";

function Model({url}: { url: string }) {
    const {scene} = useGLTF(url);
    return <primitive object={scene}/>;
}

export function ToyViewer3D({modelUrl}: { modelUrl: string }) {
    return (
        <div className="w-full h-[400px] bg-muted rounded-xl overflow-hidden relative border border-royal-purple/20">
            <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm">
                    <div className="text-center">
                        <div
                            className="h-12 w-12 border-4 border-royal-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
                        <p className="text-sm text-muted-foreground">Loading 3D Model...</p>
                    </div>
                </div>
            }>
                <Canvas shadows camera={{position: [0, 0, 150], fov: 40}}>
                    <Stage environment="city" intensity={0.6} shadows={false}>
                        <Model url={modelUrl}/>
                    </Stage>
                    <OrbitControls makeDefault autoRotate/>
                </Canvas>
            </Suspense>
            <div
                className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] text-white uppercase tracking-widest font-bold">
                Interactive 3D View
            </div>
        </div>
    );
}
