import { useRef, useCallback, useState } from 'react'
import { useLoader, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls, useGLTF, MeshRefractionMaterial, Environment, CubeCamera } from '@react-three/drei'
import { useControls } from 'leva'
import { Beam } from './Beam'
// import { RGBELoader } from 'three-stdlib'
import { Flare } from './Flare'


// export default function App() {
//     const cube = useGLTF('./Cube.glb')

//     const config = useControls({
//         bounces: { value: 4, min: 0, max: 8, step: 1 },
//         aberrationStrength: { value: 0.01, min: 0, max: 0.1, step: 0.01 },
//         ior: { value: 2.4, min: 0, max: 10 },
//         fresnel: { value: 1, min: 0, max: 1 },
//         color: 'white',
//         fastChroma: true
//     })

//     return (
//         <>
//             <Environment preset='city' background />
//             <pointLight color='red' />
//             <OrbitControls />
//             <mesh geometry={cube.nodes.Cube.geometry} >
//                 <MeshRefractionMaterial {...config} />
//             </mesh>
//         </>
//     )
// }


function lerp(object, prop, goal, speed = 0.1) {
    object[prop] = THREE.MathUtils.lerp(object[prop], goal, speed)
}

const color = new THREE.Color()
function lerpC(value, goal, speed = 0.1) {
    value.lerp(color.set(goal), speed)
}

const vector = new THREE.Vector3()
export function lerpV3(value, goal, speed = 0.1) {
    value.lerp(vector.set(...goal), speed)
}

function calculateRefractionAngle(incidentAngle, glassIor = 2.5, airIor = 1.000293) {
    const theta = Math.asin((airIor * Math.sin(incidentAngle)) / glassIor) || 0
    return theta
}


export default function App(props) {
    const ref = useRef()
    const { nodes } = useGLTF('/Cube.glb')

    // const texture = useLoader(RGBELoader, 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/satara_night_1k.hdr')
    const envRef = useRef()

    const [isPrismHit, hitPrism] = useState(false)
    const flare = useRef(null)
    const ambient = useRef(null)
    const spot = useRef(null)
    const boxreflect = useRef(null)
    const rainbow = useRef(null)


    const rayOut = useCallback(() => hitPrism(false), [])
    const rayOver = useCallback((e) => {
        // Break raycast so the ray stops when it touches the prism
        e.stopPropagation()
        hitPrism(true)
        // Set the intensity really high on first contact
        // rainbow.current.material.speed = 1
        // rainbow.current.material.emissiveIntensity = 20
    }, [])

    const vec = new THREE.Vector3()
    const rayMove = useCallback(({ api, position, direction, normal }) => {
        if (!normal) return
        // Extend the line to the prisms center
        vec.toArray(api.positions, api.number++ * 3)
        // Set flare
        flare.current.position.set(position.x, position.y, -0.5)
        flare.current.rotation.set(0, 0, -Math.atan2(direction.x, direction.y))
        // Calculate refraction angles
        let angleScreenCenter = Math.atan2(-position.y, -position.x)
        const normalAngle = Math.atan2(normal.y, normal.x)
        // The angle between the ray and the normal
        const incidentAngle = angleScreenCenter - normalAngle
        // Calculate the refraction for the incident angle
        const refractionAngle = calculateRefractionAngle(incidentAngle) * 6
        // Apply the refraction
        angleScreenCenter += refractionAngle
        // rainbow.current.rotation.z = angleScreenCenter
        // Set spot light
        // lerpV3(spot.current.target.position, [Math.cos(angleScreenCenter), Math.sin(angleScreenCenter), 0], 0.05)
        // spot.current.target.updateMatrixWorld()
    }, [])

    const config = useControls({
        bounces: { value: 4, min: 0, max: 8, step: 1 },
        aberrationStrength: { value: 0.01, min: 0, max: 0.1, step: 0.01 },
        ior: { value: 10, min: 0, max: 10 },
        fresnel: { value: 10, min: 0, max: 1 },
        color: 'white',
        fastChroma: true
    })

    // clearcoat={1} clearcoatRoughness={0} transmission={1} thickness={0.9} roughness={0} toneMapped={false}
    // const config2 = useControls({
    //     clearcoat: { value: 0.01, min: 0, max: 10, step: 0.01 },
    //     clearcoatRoughness: { value: 0.01, min: 0, max: 10, step: 0.01 },
    //     transmission: { value: 1, min: 0, max: 1, step: 0.01 },
    //     thickness: { value: 0.01, min: 0, max: 10, step: 0.01 },
    //     roughness: { value: 0.01, min: 0, max: 10, step: 0.01 },
    //     toneMapped: false,
    // })

    useFrame((state, delta) => {
        // Tie beam to the mouse
        boxreflect.current.setRay([(state.pointer.x * state.viewport.width) / 2, (state.pointer.y * state.viewport.height) / 2, 0], [0, 0, 0])
        // Animate rainbow intensity
        // lerp(rainbow.current.material, 'emissiveIntensity', isPrismHit ? 2.5 : 0, 0.1)
        // spot.current.intensity = rainbow.current.material.emissiveIntensity
        // Animate ambience
        // lerp(ambient.current, 'intensity', 0, 0.025)


        ref.current.rotation.y += delta / 3
        ref.current.rotation.z += delta / 9
        ref.current.rotation.x += delta / 9
        console.log(delta)
        // ref.current.rotation.y += state.delta
    })


    return (
        <>
            <OrbitControls />
            <Environment
                ref={envRef}
                background
            >
                <color args={['#000000']} attach="background" />
                <mesh position={[2, 0, - 5]} scale={2}>
                    <boxGeometry />
                    <meshBasicMaterial color={[1, 1, 1]} />
                </mesh>
                {/* <mesh position-z={5} scale={2}>
                    <boxGeometry />
                    <meshBasicMaterial color={[0, 1, 0]} />
                </mesh>
                <mesh position-x={- 5} scale={2}>
                    <boxGeometry />
                    <meshBasicMaterial color={[0, 0, 1]} />
                </mesh> */}
            </Environment>

            <Beam ref={boxreflect} bounce={10} far={20}>

                <CubeCamera resolution={256} frames={1} >
                    {(envRef) => (
                        <mesh castShadow ref={ref} geometry={nodes.Cube.geometry} {...props} onRayOver={rayOver} onRayOut={rayOut} onRayMove={rayMove} >
                            <MeshRefractionMaterial envMap={envRef} {...config} toneMapped={false} />
                        </mesh>
                    )}
                </CubeCamera>


                {/* <mesh castShadow ref={ref} geometry={nodes.Cube.geometry} {...props} onRayOver={rayOver} onRayOut={rayOut} onRayMove={rayMove} >
                    <meshPhysicalMaterial  {...config2} />
                </mesh> */}

            </Beam>
            <Flare ref={flare} visible={isPrismHit} renderOrder={10} scale={0.15} streak={[12.5, 20, 1]} />
        </>
    )
}
